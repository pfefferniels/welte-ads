// The hummer in JavaScript: from an espressivo performance to the vocal map and its
// VocalTractLab gestural scores. A port of hummer.py and voicemodel.py (traeumerei-humming),
// for the live page: runs in a worker and in Node. Differences from the Python version: the
// random wobble and falls come from a seeded generator of its own, and the mouth opening is
// carried as two scores (lips closed, lips open at OPEN_MAX) whose tubes the synthesizer blends.
(function (root) {
  'use strict';
  const PAD = 600, TRANSPOSE = -12, LAT = 15;                     // ms, semitones, ms
  const LEGATO_WITHIN = 15, STOP_FROM = 110, SLUR_FROM = 30;       // articulation thresholds, ms
  const OPEN_MAX = 0.3;
  const AIR = { teeth: 8000, lips: 12000 };                       // dPa at depth 1 for the voiceless air: ~10 dB under the hum
  const TC = { posture: 30, glottis: 30, pitch: 30, pressure: 12 };
  const EFFORT = { vRef: 45, pRef: 7000, expo: 1.5, breathyAt: 33, modalAt: 48, stepMs: 30 };
  const HUMS = ['hum1', 'hum2', 'hum3'], ORDER = ['open2', 'open4', 'open1'];

  // ------------------------------------------------------------------ small tools
  function rng(seed) {                                              // mulberry32
    let a = seed >>> 0;
    const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { uniform: (lo, hi) => lo + (hi - lo) * u(),
      normal: (m, s) => m + s * Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u()) };
  }
  function interp(x, xs, ys) {                                      // numpy.interp: clamped
    const n = xs.length;
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
    return ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / (xs[hi] - xs[lo]);
  }
  const clip = (x, a, b) => Math.min(b, Math.max(a, x));
  const baseId = id => id.replace(/-rend\d+$/, '');
  const velToDb = v => 40 * Math.log10(Math.max(v, 1) / 127);

  // ------------------------------------------------------------------ the performance
  // espressivo 0.11, strongly exaggerated, can leave an arpeggio's note at its tick value as its onset
  // (or tens of seconds past the end), or let a spread chord note end before it starts: put such a note
  // back at the head of its chord and give it a length. Changes the notes in place.
  function repair(data) {
    const notes = data.parts.flatMap(p => p.notes), by = new Map();
    for (const n of notes) { if (!by.has(n.date)) by.set(n.date, []); by.get(n.date).push(n); }
    let fixed = 0;
    for (const g of by.values()) {
      const ms = g.map(n => n.milliseconds.date).sort((a, b) => a - b), med = ms[ms.length >> 1];
      const stray = n => { const d = Math.abs(n.milliseconds.date - med); return d > 10000 || (d > 1000 && Math.abs(n.milliseconds.date - n.date) < 1e-6); };
      const sane = g.filter(n => !stray(n)).map(n => n.milliseconds.date).sort((a, b) => a - b);
      if (sane.length === g.length || !sane.length) continue;
      const gap = sane.length > 1 ? Math.max(20, sane[1] - sane[0]) : 50;
      for (const n of g) if (stray(n)) { n.milliseconds.date = Math.max(0, sane[0] - gap); fixed++; }
    }
    for (const n of notes) if (n.milliseconds.end <= n.milliseconds.date) { n.milliseconds.end = n.milliseconds.date + 1793; fixed++; }
    return fixed;
  }

  function perform(data, st) {
    const notes = data.parts.flatMap(p => p.notes);
    repair(data);
    const sus = data.parts[0].controlChanges.find(c => c.controller === 'sustain' || c.kind === 'sustain').points;
    const byId = new Map(notes.map(n => [n.id, n]));
    // the hummed line: the reduction's notes, each timed and voiced by the piano note it points to
    const clock = new Clock(notes, sus), red = st.reduction, melody = [];
    red.forEach((e, i) => {
      if (e.k !== 'n') return;
      const n = byId.get(e.id), prev = i > 0 ? red[i - 1] : null, on = n.milliseconds.date;
      // the sung end: the piano's own release where the sung note is the whole written note;
      // otherwise (a pedal, or cut for a breath or by the next choice) the score position, performed
      const whole = !e.pedal && Math.abs(n.date + n.duration - e.e) < 1;
      const off = Math.max(on + 40, whole ? n.milliseconds.end : clock.ms(e.e));
      melody.push({ id: n.id, pitch: e.p, date: n.date, duration: e.e - e.s, onset_ms: on, key_off_ms: off, sounding_off_ms: off,
        velocity: n.velocity, ornamented: n.ornamented, pedal: !!e.pedal,
        breath_before: !prev || (prev.k === 'r' && prev.b) || prev.k === 'a' });
    });
    const air = red.filter(e => e.k === 'a').map(e => ({ s: e.s, e: e.e, through: e.t }));
    const cv = data.curve;                                           // channel volume points (sub-note dynamics)
    let pts = cv.map(p => [p.milliseconds / 1000, p.value]).filter(p => p[1] !== 100 || p[0] === 0);
    pts = pts.filter((p, i) => i === pts.length - 1 || p[0] !== pts[i + 1][0]);
    return { notes, sus, melody, air, clock, ct: pts.map(p => p[0]), cv: pts.map(p => p[1]) };
  }

  class Clock {                                                      // ticks <-> performance ms
    constructor(notes, sus) {
      const seen = new Set(), pts = [];
      const r4 = x => Math.round(x * 1e4) / 1e4;
      for (const n of notes) if (!n.ornamented) { const k = r4(n.date) + ':' + r4(n.milliseconds.date); if (!seen.has(k)) { seen.add(k); pts.push([r4(n.date), r4(n.milliseconds.date)]); } }
      for (const p of sus) { const k = r4(p.date) + ':' + r4(p.milliseconds); if (!seen.has(k)) { seen.add(k); pts.push([r4(p.date), r4(p.milliseconds)]); } }
      // through the last chord to its written end, so a note or air there keeps its length
      let last = -Infinity, lastMs = 0;
      for (const n of notes) { const e = r4(n.date + n.duration); if (e > last) { last = e; lastMs = 0; } if (e === last) lastMs = Math.max(lastMs, n.milliseconds.end); }
      if (isFinite(last)) pts.push([last, r4(lastMs)]);
      pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const d = [], m = [];
      pts.forEach((p, i) => { if (i === 0 || (p[0] > pts[i - 1][0] && p[1] > pts[i - 1][1])) { d.push(p[0]); m.push(p[1]); } });
      for (let i = 1; i < m.length; i++) m[i] = Math.max(m[i], m[i - 1]);
      this.d = d; this.m = m;
    }
    ms(date) { return interp(date, this.d, this.m); }
    date(ms) { return interp(ms, this.m, this.d); }
  }

  // the voice notes: a breath where the reduction rests (or after air), legato elsewhere
  function buildNotes(mel) {
    const notes = mel.map((n, k) => ({ index: k, pitch: n.pitch, on: n.onset_ms / 1000, off: n.sounding_off_ms / 1000,
      key_off: n.key_off_ms / 1000, velocity: n.velocity, legato_in: false, repeated_in: false, breath_before: k === 0 || n.breath_before, phrase_start: false }));
    notes.forEach((n, k) => {
      if (k === 0) return;
      const prev = notes[k - 1];
      if (n.breath_before) prev.off = Math.min(prev.off, prev.key_off, n.on - 0.12);
      else { prev.off = n.on; n.legato_in = true; n.repeated_in = Math.abs(n.pitch - prev.pitch) < 0.01; }
    });
    return notes;
  }

  // ------------------------------------------------------------------ the generator (hummer.build_vocal_map)
  function vocalMap(P, st) {
    const { notes, sus, melody: src, ct, cv } = P;
    const clock = new Clock(notes, sus);
    const vn = buildNotes(src);
    const byDate = new Map();
    for (const n of notes) { if (!byDate.has(n.date)) byDate.set(n.date, []); byDate.get(n.date).push(n); }
    const presses = [];
    for (let i = 1; i < sus.length; i++) if (sus[i].value >= 64 && sus[i - 1].value < 64) presses.push(sus[i].date);
    const ev = [];
    const add = (tag, date, a) => ev.push([date, tag, a]);
    const R = rng(7), scoops = st.scoops;
    // macro dynamics smoothed over +-1.5 s
    const tg = []; for (let t = 0; t < ct[ct.length - 1] + 0.05; t += 0.05) tg.push(t);
    const raw = tg.map(t => interp(t, ct, cv)), kk = 30, cs = tg.map((_, i) => {
      let s = 0; for (let j = i - kk; j <= i + kk; j++) s += raw[clip(j, 0, raw.length - 1)]; return s / (2 * kk + 1); });
    const peakOf = []; { let k0 = 0; const groups = new Map();
      vn.forEach((v, k) => { if (v.breath_before && k > 0) k0 = k; if (!groups.has(k0)) groups.set(k0, []); groups.get(k0).push(k); });
      for (const ks of groups.values()) {
        const top = ks.reduce((b, k) => (src[k].pitch > src[b].pitch || (src[k].pitch === src[b].pitch && vn[k].off - vn[k].on > vn[b].off - vn[b].on)) ? k : b, ks[0]);
        for (const k of ks) peakOf[k] = top;
      } }
    let cur = 0, humI = 0, base = HUMS[0], toward = ORDER[0];
    const rampMs = d => Math.round(clip(Math.abs(d) * 6000, 1000, 2000));
    const moves = (want, c) => want - c >= 0.08 || c - want >= 0.12;
    vn.forEach((v, k) => {
      const n = src[k], onMs = v.on * 1000, offMs = v.off * 1000, date = n.date, prev = k ? vn[k - 1] : null;
      if (v.breath_before) {
        const gapStart = prev ? prev.off * 1000 : Math.max(0, onMs - 900);
        if (onMs - gapStart > 100) {
          const bs = clock.date(gapStart + 0.35 * (onMs - gapStart));
          // a deeper, longer-sounding breath before a louder stretch
          const depth = clip((interp(v.on, tg, cs) - 30) / 15, 0.5, 1.3);
          add('breath', bs, { duration: Math.round((clock.date(onMs - 25) - bs) * 100) / 100, through: 'nose', depth: depth.toFixed(2) });
        }
        add('inflection', date, { type: 'scoop', depthSt: Math.round(scoops[k % scoops.length] * 0.8 * 100) / 100, durationMs: 220 });
      }
      const long_ = v.off - v.on >= 0.8, L = interp(v.on, tg, cs), x = clip((L - 37.5) / 9.5, 0, 1);
      let want = OPEN_MAX * x * x * (3 - 2 * x);
      if (peakOf[k] === k && long_ && L >= 37) want += 0.08;
      let pAhead = -Infinity; for (let j = k; j < src.length; j++) if (vn[j].on <= v.on + 2.5) pAhead = Math.max(pAhead, src[j].pitch);
      want *= clip(1 - (pAhead - 74) * 0.1, 0.25, 1);
      want = Math.round(Math.min(OPEN_MAX, want) * 100) / 100;
      if (want < 0.06) want = 0;
      const lo = k ? src[k - 1].date : -1, press = presses.some(p => p > lo && p <= date);
      if (v.breath_before || k === 0) {
        const pk = src[peakOf[k]].pitch;
        toward = ORDER[Math.floor(clip((pk - 60) / 22, 0, 0.999) * ORDER.length)];
        humI = (humI + 1) % HUMS.length; base = HUMS[humI];
        add('posture', date, { value: base, toward, amount: '0.00', transitionMs: 200 }); cur = 0;
        if (want > 0) { add('posture', clock.date(onMs + 300), { value: base, toward, amount: want.toFixed(2), transitionMs: rampMs(want) + 400 }); cur = want; }
      } else if (press || moves(want, cur)) {
        if (press) { humI = (humI + 1) % HUMS.length; base = HUMS[humI]; }
        const amt = moves(want, cur) ? want : cur;
        add('posture', date, { value: base, toward, amount: amt.toFixed(2), transitionMs: amt !== cur ? rampMs(amt - cur) : 400 });
        cur = amt;
      }
      if (k === 0) add('velum', date, { value: 0.30 });
      if (v.off - v.on >= 1.0) {
        humI = (humI + 1) % HUMS.length; base = HUMS[humI];
        add('posture', clock.date(onMs + 0.55 * (offMs - onMs)), { value: base, toward, amount: cur.toFixed(2), transitionMs: 600 });
      }
      const a = { 'note.ref': '#' + baseId(n.id), pitch: n.pitch };
      const chord = byDate.get(date) || [];
      if (n.ornamented && chord.length > 1 && k > 0 && !v.breath_before) {
        const first = Math.min(...chord.map(c => c.milliseconds.date));
        if (n.onset_ms - first > 25 && st.ornaments[String(Math.trunc(date))]) a['portamento.ref'] = '#' + st.ornaments[String(Math.trunc(date))];
      }
      if (k > 0 && !v.breath_before) {
        const gap = n.onset_ms - src[k - 1].key_off_ms, same = n.pitch === src[k - 1].pitch;
        if (gap >= STOP_FROM) {
          add('articulation', clock.date(src[k - 1].key_off_ms), { type: 'stop', durationMs: Math.round(gap) });
          if (cur > 0.05) add('lips', clock.date(onMs - Math.min(gap, 120)), { value: 'closure', durationMs: Math.round(Math.min(gap, 120)) });
        } else if (gap > LEGATO_WITHIN || same) {
          const dur = Math.max(70, gap), xx = Math.max(0, gap - LEGATO_WITHIN) / (STOP_FROM - LEGATO_WITHIN);
          let depth = 0.55 - 0.4 * xx; if (same) depth = Math.min(depth, 0.35);
          add('articulation', clock.date(onMs - dur), { type: 'pulse', depth: depth.toFixed(2), durationMs: Math.round(dur) });
        } else if (gap < -SLUR_FROM && !a['portamento.ref']) a.glideMs = Math.round(clip(-gap * 0.5, 30, 120));
      }
      add('pitch', date, a);
      if (v.breath_before || k === 0)
        add('pressure', clock.date(onMs), { factor: '1.00', from: '0.50', transitionMs: Math.round(Math.min(400, 0.6 * (offMs - onMs))) });
      const nxt = k + 1 < vn.length ? vn[k + 1] : null;
      if (!nxt || nxt.breath_before) {
        const rel = Math.max(onMs + 0.5 * (offMs - onMs), offMs - st.release_s * 1000);
        add('pressure', clock.date(rel), { factor: '0.45', transitionMs: Math.round(offMs - rel) });
        if (cur > 0) {
          const cl = Math.max(onMs, Math.min(rel, offMs - 600));
          add('posture', clock.date(cl), { value: base, toward, amount: '0.00', transitionMs: Math.round(Math.max(300, offMs - cl)) });
          cur = 0;
        }
        add('inflection', clock.date(rel), { type: 'fall', depthSt: -Math.round(R.uniform(1.5, 3.5) * 100) / 100, durationMs: Math.round(offMs - rel) });
        add('pressure', clock.date(offMs), { factor: '0.00', transitionMs: 40 });
      }
    });
    for (const x of P.air) {                         // voiceless air, as loud as the dynamics there
      const depth = clip((interp(clock.ms(x.s) / 1000, tg, cs) - 30) / 15, 0.4, 1.2);
      add('air', x.s, { durationTicks: x.e - x.s, through: x.through, depth: depth.toFixed(2) });
    }
    ev.forEach((e, i) => e.push(i));
    ev.sort((a, b) => a[0] - b[0] || a[3] - b[3]);
    return { ev: ev.map(e => e.slice(0, 3)), clock, vn };
  }

  // ------------------------------------------------------------------ the converter (hummer.to_gestures)
  function gestures(P, st, M) {
    const { notes, melody, ct, cv } = P, { ev, clock } = M;
    const T = d => clock.ms(d) + PAD - LAT;
    let endMs = 0; for (const n of notes) endMs = Math.max(endMs, n.milliseconds.end, n.milliseconds.date);
    endMs += PAD + 1500;
    const byDate = new Map();
    for (const n of notes) { if (!byDate.has(n.date)) byDate.set(n.date, []); byDate.get(n.date).push(n); }
    const ornDate = {}; for (const [d, id] of Object.entries(st.ornaments)) ornDate[id] = Number(d);
    // pitches
    const pitchEv = [];
    for (const [date, tag, a] of ev) {
      if (tag !== 'pitch') continue;
      const nid = a['note.ref'].slice(1);
      const n = notes.find(x => baseId(x.id) === nid && Math.abs(x.date - date) < 1);
      const st_ = 12 * Math.log2(440 * Math.pow(2, ((a.pitch !== undefined ? a.pitch : n.pitch + TRANSPOSE) - 69) / 12));
      const on = n.milliseconds.date + PAD - LAT;
      let glide = null;
      if (a['portamento.ref']) {
        const od = ornDate[a['portamento.ref'].slice(1)];
        glide = [Math.min(...byDate.get(od).map(c => c.milliseconds.date)) + PAD - LAT, on];
      } else if (a.glideMs) glide = [on - a.glideMs / 2, on + a.glideMs / 2];
      pitchEv.push({ on, st: st_, glide, n });
    }
    const infl = ev.filter(e => e[1] === 'inflection').map(e => [T(e[0]), e[2]]);
    const R = rng(1), step = 125, amp = st.wobble_cents / 100 * Math.SQRT2;
    let f0 = [];
    pitchEv.forEach((p, i) => {
      const nxtOn = i + 1 < pitchEv.length ? pitchEv[i + 1].on : endMs;
      let glide = p.glide;
      if (glide && i > 0) {
        const prevSt = pitchEv[i - 1].st, need = Math.abs(p.st - prevSt) / 80 * 1000;
        if (glide[1] - glide[0] < need) glide = [glide[1] - need, glide[1]];
        f0 = f0.filter(g => g[0] < glide[0]).map(g => [g[0], Math.min(g[1], glide[0]), g[2], g[3]]);
        f0.push([glide[0], glide[1], prevSt, (p.st - prevSt) / Math.max(1e-3, (glide[1] - glide[0]) / 1000)]);
      }
      let t0 = glide && i > 0 ? Math.max(p.on, glide[1]) : p.on;
      const sc = infl.find(([t, a]) => a.type === 'scoop' && p.on - 300 <= t && t <= p.on + 50);
      if (sc) { const dms = sc[1].durationMs, dep = sc[1].depthSt; f0.push([t0, t0 + dms, p.st + dep, -dep / (dms / 1000)]); t0 += dms; }
      const fl = infl.find(([t, a]) => a.type === 'fall' && p.on < t && t < nxtOn);
      const stop = fl ? fl[0] : nxtOn;
      while (t0 < stop - 1) { const t1 = Math.min(stop, t0 + step * R.uniform(0.7, 1.3)); f0.push([t0, t1, p.st + R.normal(0, amp / 2), 0]); t0 = t1; }
      if (fl) { const d = Math.max(30, fl[1].durationMs); f0.push([fl[0], fl[0] + d, p.st, fl[1].depthSt / (d / 1000)]); f0.push([fl[0] + d, nxtOn, p.st + fl[1].depthSt, 0]); }
    });
    const tiers = { f0, lip: [] };
    Object.assign(tiers, postures(ev.filter(e => e[1] === 'posture').map(e => [T(e[0]), e[2]]), endMs));
    const vel = ev.filter(e => e[1] === 'velum').map(e => [T(e[0]), e[2].value]);
    tiers.velic = vel.map((p, i) => [p[0], i + 1 < vel.length ? vel[i + 1][0] : endMs, p[1], 0]);
    Object.assign(tiers, effort(ev.filter(e => e[1] === 'pressure').map(e => [T(e[0]), e[2]]), pitchEv, endMs, ct, cv, st.calibration,
      ev.filter(e => e[1] === 'articulation').map(e => [T(e[0]), e[2]])));
    for (const [d, tag, a] of ev) if (tag === 'breath') {
      const s = T(d), e = T(d + a.duration);
      tiers.glottal = splice(tiers.glottal, s, e, 'h');
      tiers.pressure = splice(tiers.pressure, s + 0.3 * (e - s), e - 40, Math.round(1400 * Number(a.depth || 1)));
    }
    tiers.tt = [];
    for (const [d, tag, a] of ev) if (tag === 'air') {
      // the glottis open, the velum closed, the air through the teeth (s) or lips on teeth (f),
      // with the lips parted: the open tube, fully, for the length of it
      const s = T(d), e = T(d + a.durationTicks), W = tiers.weight;
      tiers.glottal = splice(tiers.glottal, s, e, 'voiceless-fricative');
      tiers.velic = splice(tiers.velic, s - 30, e, 0.0);
      tiers.pressure = splice(tiers.pressure, s + 30, e - 40, Math.round(AIR[a.through] * Number(a.depth)));
      if (a.through === 'lips') tiers.lip.push([s, e, 'll-dental-fricative', 0]);
      else tiers.tt.push([s, e, 'tt-alveolar-fricative', 0]);
      for (let i = Math.max(0, Math.floor(s - 80)); i < Math.min(W.length, Math.ceil(e + 80)); i++)
        W[i] = Math.max(W[i], Math.min(1, (i - (s - 80)) / 80, (e + 80 - i) / 80));
    }
    for (const [d, tag, a] of ev) if (tag === 'lips') { const s = T(d); tiers.lip.push([s, s + a.durationMs, 'll-labial-closure', 0]); }
    return { tiers, endMs, pitchEv };
  }

  // the mouth: base shapes (mixes of the three hums, 10 % steps) and the open shape of the phrase
  // as two vowel tiers; the opening amount, lagged like VTL's gestures, says how to blend their tubes
  function postures(pev, endMs) {
    const at = (pts, t) => {
      let i = 0; while (i + 1 < pts.length && pts[i + 1][0] <= t) i++;
      if (i + 1 < pts.length) { const [t0, v0] = pts[i], [t1, v1] = pts[i + 1], f = (t - t0) / Math.max(1e-9, t1 - t0);
        return Array.isArray(v0) ? v0.map((x, j) => x + (v1[j] - x) * f) : v0 + (v1 - v0) * f; }
      return pts[i][1];
    };
    let A = [[0, 0]], W = [[0, [1, 0, 0]]]; const tow = [[0, null]];
    pev.sort((a, b) => a[0] - b[0]);
    for (const [t, a] of pev) {
      const D = a.transitionMs ?? 200, amt = Number(a.amount ?? 0), w = HUMS.map(h => (h === a.value ? 1 : 0));
      const a0 = at(A, t), w0 = at(W, t);
      A = A.filter(p => p[0] < t).concat([[t, a0], [t + D, amt]]);
      W = W.filter(p => p[0] < t).concat([[t, w0], [t + D, w]]);
      tow.push([t, a.toward]);
    }
    tow[0] = [0, tow.length > 1 ? tow[1][1] : ORDER[0]];
    const step = 60, closed = [], open = [], stair = [];
    let ti = 0;
    for (let t = 0; t < endMs; t += step) {
      const w = at(W, t), q = w.map(x => Math.round(x * 10));
      const s = q[0] + q[1] + q[2]; q[q.indexOf(Math.max(...q))] += 10 - s;
      while (ti + 1 < tow.length && tow[ti + 1][0] <= t) ti++;
      closed.push(`c${q[0]}_${q[1]}`); open.push(`${tow[ti][1] || ORDER[0]}_${q[0]}_${q[1]}`);
      stair.push(Math.round(at(A, t) * 100) / 100);
    }
    const runs = names => { const out = []; let s0 = 0;
      for (let i = 1; i <= names.length; i++) if (i === names.length || names[i] !== names[s0]) { out.push([s0 * step, i < names.length ? i * step : endMs, names[s0], 0]); s0 = i; }
      return out; };
    const n = Math.ceil(endMs), weight = new Float32Array(n), alpha = 1 / TC.posture;
    const y = [0, 0, 0, 0, 0];
    for (let i = 0; i < n; i++) {
      let x = stair[Math.min(Math.floor(i / step), stair.length - 1)];
      for (let k = 0; k < 5; k++) { y[k] += alpha * (x - y[k]); x = y[k]; }
      weight[i] = clip(x / OPEN_MAX, 0, 1);
    }
    return { vowelClosed: runs(closed), vowelOpen: runs(open), weight };
  }

  // the voice's effort from the dynamics (hummer.effort_tracks)
  function effort(pev, pitchEv, endMs, ct, cv, calibration, articulations) {
    const n = Math.ceil(endMs);
    const off = new Float64Array(n), hz = new Float64Array(n).fill(130), cal = new Float64Array(n);
    const ons = pitchEv.map(p => p.on);
    pitchEv.forEach((p, k) => {
      const i0 = k === 0 ? 0 : Math.max(0, Math.floor(p.on)), i1 = k + 1 < ons.length ? Math.floor(ons[k + 1]) : n;
      const o = p.n.velocity - interp(p.n.milliseconds.date / 1000, ct, cv), h = Math.pow(2, p.st / 12), c = calibration[k] || 0;
      for (let i = i0; i < Math.min(i1, n); i++) { off[i] = o; hz[i] = h; cal[i] = c; }
    });
    const smooth = x => {                                           // 60 ms centred mean, edges held
      const out = new Float64Array(n), pre = new Float64Array(n + 61);
      for (let i = 0; i < n + 60; i++) pre[i + 1] = pre[i] + x[clip(i - 30, 0, n - 1)];
      for (let i = 0; i < n; i++) out[i] = (pre[i + 60] - pre[i]) / 60;
      return out;
    };
    const offS = smooth(off), calS = smooth(cal);
    const v = new Float64Array(n), pressure = new Float64Array(n), add = new Float64Array(n);
    const F = [[0, 0]];
    const at = t => { let i = 0; while (i + 1 < F.length && F[i + 1][0] <= t) i++;
      if (i + 1 < F.length) { const [t0, f0] = F[i], [t1, f1] = F[i + 1]; return f0 + (f1 - f0) * (t - t0) / Math.max(1e-9, t1 - t0); } return F[i][1]; };
    pev.sort((a, b) => a[0] - b[0]);
    for (const [t, a] of pev) {
      const before = at(t - 0.5), start = a.from !== undefined ? Number(a.from) : at(t);
      const keep = F.filter(p => p[0] < t - 0.5);
      F.length = 0; F.push(...keep, [t - 0.5, before], [t, start], [t + Math.max(1, a.transitionMs || 0), Number(a.factor)]);
    }
    const fx = F.map(p => p[0]), fy = F.map(p => p[1]);
    const dip = new Float64Array(n).fill(1), fine = [];
    for (const [s0, a] of articulations) {
      const d = a.durationMs, depth = a.type === 'stop' ? 0 : Number(a.depth);
      const down = Math.min(25, d / 3), up = Math.min(depth > 0 ? 35 : 25, d / 3);
      const xs = [s0, s0 + down, s0 + d - up, s0 + d], ys = [1, depth, depth, 1];
      for (let i = Math.max(0, Math.floor(s0)); i < Math.min(n, Math.ceil(s0 + d) + 1); i++) dip[i] = Math.min(dip[i], interp(i, xs, ys));
      for (let t = s0 - 10; t < s0 + d + 10; t += 10) fine.push(t);
    }
    for (let i = 0; i < n; i++) {
      const vel = interp((i - PAD + LAT) / 1000, ct, cv);
      v[i] = Math.max(1, vel + offS[i]);
      const comp = interp(Math.log2(hz[i]), [Math.log2(175), Math.log2(260), Math.log2(400)], [-0.8, 0, -3.1]);
      pressure[i] = Math.min(15000, EFFORT.pRef * Math.pow(v[i] / EFFORT.vRef, EFFORT.expo) * Math.pow(10, (calS[i] - comp) / 20) * interp(i, fx, fy) * dip[i]);
      add[i] = clip((v[i] - EFFORT.breathyAt) / (EFFORT.modalAt - EFFORT.breathyAt), 0, 1);
    }
    const gridSet = new Set(); for (let t = 0; t < endMs; t += EFFORT.stepMs) gridSet.add(t);
    for (const t of fine) gridSet.add(clip(Math.round(t), 0, Math.floor(endMs) - 1));
    const grid = [...gridSet].sort((a, b) => a - b);
    const lq = Math.log(1.005);
    const pq = grid.map(t => { const p = pressure[Math.min(n - 1, Math.floor(t))]; return p < 1 ? 0 : Math.round(Math.exp(Math.round(Math.log(p) / lq) * lq) * 10) / 10; });
    const gq = grid.map(t => 'g' + String(Math.round(add[Math.min(n - 1, Math.floor(t))] * 20)).padStart(2, '0'));
    const runs = vals => { const out = []; let s0 = 0;
      for (let i = 1; i <= vals.length; i++) if (i === vals.length || vals[i] !== vals[s0]) { out.push([grid[s0], i < vals.length ? grid[i] : endMs, vals[s0], 0]); s0 = i; }
      return out; };
    return { pressure: runs(pq), glottal: runs(gq), effortCurve: { pressure, adduction: add } };
  }

  function splice(seq, s, e, value) {
    const out = [];
    for (const [a, b, v, sl] of seq) {
      if (b <= s || a >= e) { out.push([a, b, v, sl]); continue; }
      if (a < s) out.push([a, s, v, sl]);
      if (b > e) out.push([e, b, v, sl]);
    }
    out.push([s, e, value, 0]);
    return out.sort((x, y) => x[0] - y[0]);
  }
  function fill(seq, start, end, neutral) {
    const out = []; let t = start;
    for (let [a, b, v, sl] of [...seq].sort((x, y) => x[0] - y[0])) {
      a = Math.max(a, start); b = Math.min(b, end);
      if (b <= t) continue;
      a = Math.max(a, t);
      if (a > t + 0.5) out.push([t, a, neutral, 0, true]);
      out.push([a, b, v, sl, false]); t = b;
    }
    if (t < end) out.push([t, end, neutral, 0, true]);
    return out;
  }

  // a gestural score; `vowel` picks the closed or the open vowel tier
  function gesText(tiers, endMs, vowel) {
    const tc = { vowel: TC.posture, lip: 12, 'tongue-tip': 12, velic: 15, glottal: TC.glottis, f0: TC.pitch, pressure: TC.pressure };
    const neutral = { vowel: 'c10_0', lip: '', 'tongue-tip': '', velic: 0, glottal: 'g00', f0: 12 * Math.log2(130), pressure: 0 };
    const names = { vowel: ['vowel-gestures', ''], lip: ['lip-gestures', ''], 'tongue-tip': ['tongue-tip-gestures', ''], velic: ['velic-gestures', ''],
      glottal: ['glottal-shape-gestures', ''], f0: ['f0-gestures', 'st'], pressure: ['lung-pressure-gestures', 'dPa'] };
    const src = Object.assign({}, tiers, { vowel: vowel === 'open' ? tiers.vowelOpen : tiers.vowelClosed, 'tongue-tip': tiers.tt || [] });
    const x = ['<gestural_score>\n'];
    for (const tier of ['vowel', 'lip', 'tongue-tip', 'tongue-body', 'velic', 'glottal', 'f0', 'pressure']) {
      if (tier === 'tongue-body') { x.push(`  <gesture_sequence type="${tier}-gestures" unit="">\n  </gesture_sequence>\n`); continue; }
      const [nm, unit] = names[tier];
      x.push(`  <gesture_sequence type="${nm}" unit="${unit}">\n`);
      const gs = fill(src[tier], 0, endMs, neutral[tier]), merged = [];
      for (const g of gs) {
        if (merged.length && g[1] - g[0] < 3) merged[merged.length - 1][1] = g[1];
        else merged.push(g.slice());
      }
      if (merged.length > 1 && merged[0][1] - merged[0][0] < 3) { merged[1][0] = merged[0][0]; merged.shift(); }
      for (let [a, b, v, sl, neu] of merged) {
        let val;
        if (typeof v === 'string' && isNaN(Number(v)) || v === '') val = v;
        else { v = Number(v); if (tier === 'pressure') v = Math.min(15000, Math.max(0, v)); val = v.toFixed(6); }
        const tcs = tier === 'pressure' && val === '0.000000' ? 12 : tc[tier];
        if (tier === 'f0') sl = Math.max(-80, Math.min(80, sl));
        x.push(`    <gesture value="${val}" slope="${sl.toFixed(6)}" duration_s="${((b - a) / 1000).toFixed(6)}" time_constant_s="${(tcs / 1000).toFixed(6)}" neutral="${neu && (tier === 'lip' || tier === 'tongue-tip') ? 1 : 0}" />\n`);
      }
      x.push('  </gesture_sequence>\n');
    }
    x.push('</gestural_score>\n');
    return x.join('');
  }

  // bars for the display: each measure's downbeat, performed
  function bars(st, clock) {
    return st.bars.map(([label, tick]) => [clock.ms(tick) / 1000 + PAD / 1000, label]);
  }

  // everything for one exaggeration: performance -> map -> two gestural scores
  function render(data, st) {
    const P = perform(data, st);
    const M = vocalMap(P, st);
    const G = gestures(P, st, M);
    return { P, M, G, closed: gesText(G.tiers, G.endMs, 'closed'), open: gesText(G.tiers, G.endMs, 'open'), bars: bars(st, M.clock), endMs: G.endMs };
  }

  root.Hummer = { render, repair, perform, vocalMap, gestures, gesText, bars, Clock, PAD, LAT, OPEN_MAX, AIR, interp };
})(typeof self !== 'undefined' ? self : globalThis);
