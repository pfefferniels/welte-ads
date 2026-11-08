// The live voice: for an exaggeration s, espressivo performs the exaggerated MPM, the hummer turns
// that performance into two gestural scores, VocalTractLab (WebAssembly) turns them into tract
// states and then into sound, streamed to the page in blocks with their spectrogram columns.
importScripts('vtl.js', 'espressivo.js', 'hummer.js', 'engine.js');

const SR = 44100, STEP = 110, PREROLL = 0.3;                  // s of warm-up before a start point
const SPEC = { rows: 360, fmin: 70, fmax: 4500, hop: 441, win: 4096, nfft: 8192, top: 41.09, range: 60 };
let ready = null, current = 0, cache = null;

const yieldNow = (() => {                                       // a zero-delay turn of the event loop
  const ch = new MessageChannel(), q = [];
  ch.port1.onmessage = () => q.shift()();
  return () => new Promise(r => { q.push(r); ch.port2.postMessage(0); });
})();

async function init() {
  const get = (f, t) => fetch(f).then(r => { if (!r.ok) throw new Error(f + ': ' + r.status); return r[t](); });
  const [st, msm, mpm, speaker] = await Promise.all([get('data/static.json', 'json'), get('data/score.msm.xml', 'text'),
    get('data/performance.mpm.xml', 'text'), get('data/hummer_live.speaker.xml', 'text')]);
  const M = await createVTL({ print() {}, printErr() {} });
  return { st, msm, mpm, E: VTLEngine(M, speaker) };
}

// The voice is the inner guide of the playing: always LEAD more exaggerated than the piano, except
// in the dimensions that move notes in time, which it shares with the piano so the two stay together
const LEAD = 0.3;
const DIMENSIONS = ['tempo', 'tempoShape', 'dynamics', 'dynamicsShape', 'rubato', 'articulation', 'accentuation', 'ornamentSpread',
  'ornamentSpacing', 'ornamentDynamics', 'asynchrony', 'imprecisionTiming', 'imprecisionDynamics', 'imprecisionDuration', 'pedalShape'];
const TIMING = new Set(['tempo', 'tempoShape', 'rubato', 'asynchrony', 'ornamentSpread', 'ornamentSpacing', 'imprecisionTiming']);

// one exaggeration level, from the MPM to tract states (cached: a seek reuses it)
function prepare(R, s) {
  const t0 = performance.now();
  const ex = factors => espressivo.exaggerateMpm(R.mpm, { factors }).mpm;
  const perf = mpm => espressivo.performMsmToData({ msm: R.msm, mpm });
  const pianoData = perf(Math.abs(s - 1) < 1e-9 ? R.mpm : ex(espressivo.weightedFactors(s, {})));
  Hummer.repair(pianoData);
  const voiceMpm = ex(Object.fromEntries(DIMENSIONS.map(d => [d, TIMING.has(d) ? s : s + LEAD])));
  const data = perf(voiceMpm);
  data.curve = perf(voiceMpm.replace(/<dynamics /g, '<dynamics subNoteDynamics="true" ')).parts[0].controlChanges.find(c => c.kind === 'channelVolume').points;
  const t1 = performance.now();
  const H = Hummer.render(data, R.st);
  const t2 = performance.now();
  const maxStates = Math.ceil(H.endMs / 1000 * SR / STEP) + 10;
  const S = { closed: R.E.states(H.closed, maxStates), open: R.E.states(H.open, maxStates) };
  const t3 = performance.now();
  // the piano: every note, held by the sustain pedal as on the roll
  const pianoNotes = pianoData.parts.flatMap(p => p.notes);
  const sus = pianoData.parts[0].controlChanges.find(c => c.controller === 'sustain' || c.kind === 'sustain').points.map(p => [p.milliseconds / 1000, p.value]);
  const maxEnd = Math.max(...pianoNotes.map(n => n.milliseconds.end)) / 1000;
  const piano = pianoNotes.map(n => {
    const on = n.milliseconds.date / 1000; let off = Math.max(n.milliseconds.end / 1000, on + 0.3);
    let i = -1; while (i + 1 < sus.length && sus[i + 1][0] <= off) i++;
    if (i >= 0 && sus[i][1] >= 64) { let j = i; while (j < sus.length && sus[j][1] >= 64) j++; off = j < sus.length ? sus[j][0] : maxEnd + 0.6; }
    return [on + Hummer.PAD / 1000, off - on, n.pitch, n.velocity];
  }).sort((a, b) => a[0] - b[0]);
  return { s, voiceS: s + LEAD, S, weight: H.G.tiers.weight, bars: H.bars, clock: { d: H.M.clock.d, m: H.M.clock.m }, piano,
    dur: (S.closed.n - 1) * STEP / SR, times: { espressivo: t1 - t0, hummer: t2 - t1, gestures: t3 - t2 } };
}

// spectrogram columns, black on white, as on the offline tiles
const fft = (() => {
  const n = SPEC.nfft, lg = Math.log2(n), rev = new Uint32Array(n), cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
  for (let i = 0; i < n; i++) { let r = 0; for (let b = 0; b < lg; b++) r |= ((i >> b) & 1) << (lg - 1 - b); rev[i] = r; }
  for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos(-2 * Math.PI * i / n); sin[i] = Math.sin(-2 * Math.PI * i / n); }
  const re = new Float64Array(n), im = new Float64Array(n);
  return x => {
    re.fill(0); im.fill(0);
    for (let i = 0; i < x.length; i++) re[rev[i]] = x[i];
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1, step = n / size;
      for (let i = 0; i < n; i += size) for (let j = 0; j < half; j++) {
        const k = j * step, a = i + j, b = a + half;
        const tr = re[b] * cos[k] - im[b] * sin[k], ti = re[b] * sin[k] + im[b] * cos[k];
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
      }
    }
    return [re, im];
  };
})();
const hann = Float64Array.from({ length: SPEC.win }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (SPEC.win - 1)));
const rowBins = Float64Array.from({ length: SPEC.rows }, (_, r) =>
  SPEC.fmax * Math.pow(SPEC.fmin / SPEC.fmax, r / (SPEC.rows - 1)) / SR * SPEC.nfft);
function columns(audio, c0, c1) {
  const out = new Uint8Array((c1 - c0) * SPEC.rows), frame = new Float64Array(SPEC.win);
  for (let c = c0; c < c1; c++) {
    const center = c * SPEC.hop;
    for (let i = 0; i < SPEC.win; i++) { const k = center - SPEC.win / 2 + i; frame[i] = (k >= 0 && k < audio.length ? audio[k] : 0) * hann[i]; }
    const [re, im] = fft(frame);
    for (let r = 0; r < SPEC.rows; r++) {
      const b = rowBins[r], i0 = Math.floor(b), f = b - i0;
      const d0 = 20 * Math.log10(Math.hypot(re[i0], im[i0]) + 1e-9), d1 = 20 * Math.log10(Math.hypot(re[i0 + 1], im[i0 + 1]) + 1e-9);
      let x = Math.min(1, Math.max(0, ((d0 + f * (d1 - d0)) - (SPEC.top - SPEC.range)) / SPEC.range));
      x = Math.pow(x, 1.15);
      out[(c - c0) * SPEC.rows + r] = Math.round(x < 0.45 ? 255 - 115 * x / 0.45 : 140 * (1 - (x - 0.45) / 0.55));
    }
  }
  return out;
}

// render from a start time to the end, then the beginning up to it; stop when a newer request comes
async function render(R, id, s, tick, startSec) {
  if (!cache || Math.abs(cache.s - s) > 1e-9) {
    cache = null;
    cache = prepare(R, s);
  }
  const L = cache;
  if (id !== current) return;
  if (tick !== undefined && tick !== null)                       // a place in the score -> this timeline
    startSec = Hummer.interp(tick, L.clock.d, L.clock.m) / 1000 + Hummer.PAD / 1000;
  postMessage({ type: 'plan', id, s, voiceS: L.voiceS, dur: L.dur, bars: L.bars, clock: L.clock, piano: L.piano, times: L.times, startSec });
  const audio = new Float32Array(Math.ceil(L.dur * SR));
  const gain = R.st.gain, n = L.S.closed.n;
  // the first state at or before the 10 ms slot of the start: the page counts sound per slot
  const start = Math.max(0, Math.min(n - 1, Math.floor(Math.floor(startSec * 100) * (SR / 100) / STEP)));
  // states from..to sound from `from` to to-1, so the wrap-around runs one state further, to meet the start
  const segments = [[Math.max(0, start - Math.round(PREROLL * SR / STEP)), start, n], [0, 0, start > 0 ? start + 1 : 0]];
  for (const [from, keepFrom, to] of segments) {
    if (to <= from) continue;
    let lastCol = Math.floor(keepFrom * STEP / SPEC.hop);
    for (const [full, st] of R.E.synth(L.S, L.weight, from, to, 40)) {
      const skip = Math.max(0, keepFrom - (st - 1)) * STEP;      // the warm-up is not sent
      if (skip < full.length) {
        const block = full.slice(skip), a = (st - 1) * STEP + skip;
        for (let i = 0; i < block.length; i++) block[i] *= gain;
        audio.set(block, a);
        const upto = Math.floor((a + block.length - SPEC.win / 2) / SPEC.hop);
        const spec = upto > lastCol ? columns(audio, lastCol, upto) : null;
        postMessage({ type: 'audio', id, start: a, data: block, spec, col: lastCol, cols: spec ? upto - lastCol : 0 }, spec ? [block.buffer, spec.buffer] : [block.buffer]);
        if (spec) lastCol = upto;
      }
      await yieldNow();
      if (id !== current) return;
    }
    if (keepFrom === 0 && start > 0) {                           // where the two passes meet: the columns
      const upto = Math.min(Math.floor(audio.length / SPEC.hop), Math.floor(start * STEP / SPEC.hop) + Math.ceil(SPEC.win / 2 / SPEC.hop));
      if (upto > lastCol) {                                      // the first pass drew without the sound before
        const spec = columns(audio, lastCol, upto);
        postMessage({ type: 'audio', id, start: 0, data: new Float32Array(0), spec, col: lastCol, cols: upto - lastCol }, [spec.buffer]);
      }
    }
  }
  postMessage({ type: 'done', id });
}

onmessage = async e => {
  const m = e.data;
  if (m.type !== 'render') return;
  current = m.id;
  try {
    if (!ready) ready = init();
    const R = await ready;
    if (m.id !== current) return;
    await render(R, m.id, m.s, m.tick, m.startSec || 0);
  } catch (err) {
    postMessage({ type: 'error', id: m.id, message: String(err && err.message || err) });
  }
};
