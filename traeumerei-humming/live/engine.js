// VocalTractLab as a streaming voice: gestural scores -> tract states (VTL's gestural model) ->
// tube shapes (VTL's geometry, only when the tract has moved) -> VTL's acoustics, one 110-sample
// step at a time. The lips-closed and lips-open scores give two tubes; the opening amount blends
// them, so the lips part gradually (VTL's own lip model parts them with a jump).
(function (root) {
  'use strict';
  const H = M => M.HEAPF64 || new Float64Array(M.wasmMemory ? M.wasmMemory.buffer : M.buffer);
  const H32 = M => M.HEAP32 || new Int32Array(M.wasmMemory ? M.wasmMemory.buffer : M.buffer);

  function Engine(M, speakerText) {
    M.FS.writeFile('/live.speaker', speakerText);
    if (M.ccall('vtlInitialize', 'number', ['string'], ['/live.speaker']) !== 0) throw new Error('VocalTractLab did not start');
    const p = M._malloc(32);
    M.ccall('vtlGetConstants', 'number', ['number', 'number', 'number', 'number', 'number', 'number'], [p, p + 4, p + 8, p + 12, p + 16, p + 24]);
    const c = { sr: M.getValue(p, 'i32'), ns: M.getValue(p + 4, 'i32'), nT: M.getValue(p + 8, 'i32'), nG: M.getValue(p + 12, 'i32'), step: M.getValue(p + 16, 'i32') };
    M._free(p);
    const ns = c.ns;
    // scratch memory in the module: one tract, one glottis, two tubes and the mixed one, audio
    const mem = { tp: M._malloc(8 * c.nT), gp: M._malloc(8 * c.nG), au: M._malloc(8 * c.step),
      len: M._malloc(8 * ns), area: M._malloc(8 * ns), art: M._malloc(4 * ns), sc: M._malloc(24) };

    function states(gesText, maxStates) {
      M.FS.writeFile('/s.ges', gesText);
      const tr = M._malloc(8 * c.nT * maxStates), gl = M._malloc(8 * c.nG * maxStates), np = M._malloc(4);
      const r = M.ccall('vtlGesturalScoreToStates', 'number', ['string', 'number', 'number', 'number', 'number'], ['/s.ges', tr, gl, maxStates, np]);
      if (r !== 0) { M._free(tr); M._free(gl); M._free(np); throw new Error('gestural score rejected (' + r + ')'); }
      const n = M.getValue(np, 'i32');
      const tract = H(M).slice(tr >> 3, (tr >> 3) + n * c.nT), glottis = H(M).slice(gl >> 3, (gl >> 3) + n * c.nG);
      M._free(tr); M._free(gl); M._free(np);
      return { n, tract, glottis };
    }

    // tube geometry of one tract state, copied out of the module
    function tube(tract, i) {
      H(M).set(tract.subarray(i * c.nT, (i + 1) * c.nT), mem.tp >> 3);
      M._vtlFastTractToTube(mem.tp, mem.len, mem.area, mem.art, mem.sc, mem.sc + 8, mem.sc + 16);
      const h = H(M), h32 = H32(M);
      return { len: h.slice(mem.len >> 3, (mem.len >> 3) + ns), area: h.slice(mem.area >> 3, (mem.area >> 3) + ns),
        art: h32.slice(mem.art >> 2, (mem.art >> 2) + ns), inc: h[mem.sc >> 3], tts: h[(mem.sc >> 3) + 1], vel: h[(mem.sc >> 3) + 2] };
    }
    const moved = (tract, i, last, tol) => {
      if (last < 0) return true;
      for (let k = 0; k < c.nT; k++) if (Math.abs(tract[i * c.nT + k] - tract[last * c.nT + k]) > tol) return true;
      return false;
    };

    // tube shapes at keyframes every K states (K = 4: 10 ms), each computed only if the tract has
    // moved since the last one, and interpolated in between, as VTL interpolates within a step
    function keyframes(tract, n, K, tol, stats) {
      let lastIdx = -1, lastTube = null;
      const cache = new Map();
      const at = k => {
        k = Math.min(k, n - 1);
        if (cache.has(k)) return cache.get(k);
        let t;
        if (lastTube && !moved(tract, k, lastIdx, tol)) t = lastTube;
        else { const g0 = stats ? performance.now() : 0; t = tube(tract, k); lastTube = t; lastIdx = k;
          if (stats) { stats.geom++; stats.tGeom += performance.now() - g0; } }
        if (cache.size > 4) cache.delete(cache.keys().next().value);
        cache.set(k, t);
        return t;
      };
      const out = { len: new Float64Array(ns), area: new Float64Array(ns), art: new Int32Array(ns), inc: 0, tts: 0, vel: 0 };
      return i => {
        const k0 = Math.floor(i / K) * K, a = at(k0), b = at(k0 + K);
        if (a === b) return a;
        const f = (i - k0) / K;
        for (let j = 0; j < ns; j++) { out.len[j] = a.len[j] + f * (b.len[j] - a.len[j]); out.area[j] = a.area[j] + f * (b.area[j] - a.area[j]); }
        out.art = f < 0.5 ? a.art : b.art;
        out.inc = a.inc + f * (b.inc - a.inc); out.tts = a.tts + f * (b.tts - a.tts); out.vel = a.vel + f * (b.vel - a.vel);
        return out;
      };
    }

    // a synthesis run from state `from` to `to`, as a generator of [audio block, first state]:
    // the caller can stop between blocks (a newer request has arrived) and yield to its event loop
    function* synth(S, weight, from, to, blockStates, tol = 0.01, stats = null) {
      const msPerState = c.step / c.sr * 1000, n = S.closed.n;
      const closedAt = keyframes(S.closed.tract, n, 4, tol, stats), openAt = keyframes(S.open.tract, n, 4, tol, stats);
      M._vtlSynthesisReset();
      let block = new Float32Array(blockStates * c.step), filled = 0, blockStart = from + 1;
      for (let i = from; i < Math.min(to, n); i++) {
        const w = weight[Math.min(weight.length - 1, Math.floor(i * msPerState))];
        // each tube only while it is heard: the open one while the lips are parted at all
        const tc = w < 1 ? closedAt(i) : null, to = w > 0 ? openAt(i) : null;
        const A_ = tc || to, B_ = to || tc, ww = tc && to ? w : 0;
        const h = H(M), h32 = H32(M), L = mem.len >> 3, A = mem.area >> 3, R = mem.art >> 2;
        for (let k = 0; k < ns; k++) {
          h[L + k] = A_.len[k] + ww * (B_.len[k] - A_.len[k]);
          h[A + k] = A_.area[k] + ww * (B_.area[k] - A_.area[k]);
          h32[R + k] = ww < 0.5 ? A_.art[k] : B_.art[k];
        }
        h.set(S.closed.glottis.subarray(i * c.nG, (i + 1) * c.nG), mem.gp >> 3);
        const a0 = stats ? performance.now() : 0;
        M._vtlSynthesisAddTube(i === from ? 0 : c.step, mem.au, mem.len, mem.area, mem.art,
          A_.inc + ww * (B_.inc - A_.inc), A_.vel + ww * (B_.vel - A_.vel), A_.tts + ww * (B_.tts - A_.tts), mem.gp);
        if (stats) stats.tAcoustic += performance.now() - a0;
        if (i > from) {
          block.set(H(M).subarray(mem.au >> 3, (mem.au >> 3) + c.step), filled * c.step);
          if (++filled === blockStates) {
            yield [block, blockStart]; block = new Float32Array(blockStates * c.step); filled = 0; blockStart = i + 1;
          }
        }
      }
      if (filled) yield [block.subarray(0, filled * c.step), blockStart];
    }
    function run(S, weight, from, blockStates, onBlock, stop, tol = 0.01, stats = null) {
      for (const [b, st] of synth(S, weight, from, Infinity, blockStates, tol, stats)) { onBlock(b, st); if (stop && stop()) return false; }
      return true;
    }
    return { c, states, run, synth };
  }
  root.VTLEngine = Engine;
})(typeof self !== 'undefined' ? self : globalThis);
