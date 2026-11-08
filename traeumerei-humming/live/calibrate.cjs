// Calibrate the live voice once: render it (the voice at x1 + lead, as the page does), measure
// each sung note's level against what the dynamics ask for, and store the per-note corrections
// and the output gain in data/static.json.   node calibrate.cjs <site dir> [rounds]
const fs = require('fs'), vm = require('vm'), path = require('path');
const SITE = path.resolve(process.argv[2]), ROUNDS = Number(process.argv[3] || 1);
vm.runInThisContext(fs.readFileSync(SITE + '/espressivo.js', 'utf8'));
require(SITE + '/hummer.js'); require(SITE + '/engine.js');
const E = globalThis.espressivo, Hm = globalThis.Hummer;
const LEAD = 0.3, s = 1;
const DIMS = ['tempo', 'tempoShape', 'dynamics', 'dynamicsShape', 'rubato', 'articulation', 'accentuation', 'ornamentSpread',
  'ornamentSpacing', 'ornamentDynamics', 'asynchrony', 'imprecisionTiming', 'imprecisionDynamics', 'imprecisionDuration', 'pedalShape'];
const TIMING = new Set(['tempo', 'tempoShape', 'rubato', 'asynchrony', 'ornamentSpread', 'ornamentSpacing', 'imprecisionTiming']);
const stPath = SITE + '/data/static.json', st = JSON.parse(fs.readFileSync(stPath, 'utf8'));
const msm = fs.readFileSync(SITE + '/data/score.msm.xml', 'utf8'), mpm0 = fs.readFileSync(SITE + '/data/performance.mpm.xml', 'utf8');
const mpm = E.exaggerateMpm(mpm0, { factors: Object.fromEntries(DIMS.map(d => [d, TIMING.has(d) ? s : s + LEAD])) }).mpm;
const data = E.performMsmToData({ msm, mpm });
data.curve = E.performMsmToData({ msm, mpm: mpm.replace(/<dynamics /g, '<dynamics subNoteDynamics="true" ') }).parts[0].controlChanges.find(c => c.kind === 'channelVolume').points;
const pct = (a, q) => { const b = Float64Array.from(a).sort(); return b[Math.min(b.length - 1, Math.floor(q * b.length))]; };
(async () => {
  const M = await require(SITE + '/vtl.js')({ print() {}, printErr() {} });
  const V = globalThis.VTLEngine(M, fs.readFileSync(SITE + '/data/hummer_live.speaker.xml', 'utf8'));
  for (let round = 0; round < ROUNDS; round++) {
    const R = Hm.render(data, st);
    const max = Math.ceil(R.endMs / 1000 * 44100 / 110) + 10;
    const S = { closed: V.states(R.closed, max), open: V.states(R.open, max) };
    const y = new Float32Array(S.closed.n * 110);
    const t0 = performance.now();
    V.run(S, R.G.tiers.weight, 0, 400, (b, i) => y.set(b, (i - 1) * 110), null);
    const sec = (performance.now() - t0) / 1000;
    // 40 ms RMS envelope
    const env = new Float64Array(y.length); let acc = 0;
    for (let i = 0; i < y.length; i++) { acc += y[i] * y[i]; if (i >= 1764) acc -= y[i - 1764] * y[i - 1764]; env[i] = Math.sqrt(Math.max(acc, 0) / 1764) + 1e-9; }
    const ct = R.P.ct, cv = R.P.cv, err = [];
    R.M.vn.forEach((v, k) => {
      const d = v.off - v.on, a = v.on + 0.6 + 0.3 * d, b = v.off + 0.6 - 0.15 * d;
      if (b - a < 0.01) { err.push(null); return; }
      const seg = env.subarray(Math.floor(a * 44100), Math.floor(b * 44100));
      const n = R.P.melody[k], off = n.velocity - Hm.interp(n.onset_ms / 1000, ct, cv);
      const want = []; for (let t = v.on + 0.3 * d; t < v.off - 0.15 * d; t += d / 20) want.push(40 * Math.log10(Math.max(1, Hm.interp(t, ct, cv) + off) / 127));
      err.push(pct(want, 0.8) - 20 * Math.log10(pct(seg, 0.8)));
    });
    const ok = err.filter(e => e !== null), med = pct(ok, 0.5);
    const dev = ok.map(e => Math.abs(e - med));
    console.log(`round ${round + 1}: ${(y.length / 44100).toFixed(1)} s in ${sec.toFixed(1)} s; note level vs dynamics before: median |${pct(dev, 0.5).toFixed(2)}| dB, 90th pct |${pct(dev, 0.9).toFixed(2)}| dB`);
    st.calibration = st.calibration.map((c, k) => err[k] === null ? c : Math.round(Math.max(-12, Math.min(12, c + err[k] - med)) * 1000) / 1000);
    let peak = 0; for (const x of y) peak = Math.max(peak, Math.abs(x));
    const thr = peak * 1e-3; let e2 = 0, n2 = 0;
    for (const x of y) if (Math.abs(x) > thr) { e2 += x * x; n2++; }
    st.gain = Math.round(Math.pow(10, -23 / 20) / Math.sqrt(e2 / n2) * 1e4) / 1e4;
    fs.writeFileSync(stPath, JSON.stringify(st));
    fs.writeFileSync(SITE + '/../calib_voice.f32', Buffer.from(y.buffer));
  }
  console.log('gain', st.gain);
})();
