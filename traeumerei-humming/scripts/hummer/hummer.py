"""Grünfeld hums while he plays: a <vocalMap> inside the MPM, rendered with VocalTractLab.

The vocal part is written into the performance as one more dated map, in ticks like the others,
so it follows Grünfeld's tempo, rubato and ornaments through the same date-to-time mapping as
the piano. Its header holds a vocal style (voice, transposition, postures, inflection habits
measured from a recorded hum). A converter turns the map into VocalTractLab gestural scores.

How the MPM is read as a voice (the generator's rules):
  pitch       every melody note, an octave lower
  portamento  where the chord under a melody note is rolled up to it, the voice slides from the
              previous pitch over exactly the arpeggio's span (portamento.ref -> the <ornament>)
  breath      at the phrase starts and where Grünfeld lifts his hand (the shared voice model)
  inflection  a scoop into each phrase and a fall at its end, sized from the recorded hum
  posture     closed hum when the dynamics are soft; the mouth opens on the louder stretches and
              phrase climaxes; a new position at every change of the sustain pedal and halfway
              through long notes; each phrase starts closed
  lips        detached notes and repeated notes are re-articulated with a lip closure ("m")
  glottis     breathy when soft, less breathy when louder
  pressure    from the MPM dynamics (curve plus each note's velocity offset), with the recorded
              hum's slow swell into a phrase and its quick release
"""
import json, os, re, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'work'))

NS = 'http://www.cemfi.de/mpm/ns/1.0'
WORK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'work')
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
PAD = 0.6            # s of silence before the first note, as in every other rendering
TRANSPOSE = -12


# ------------------------------------------------------------------ performance timing

def load_performance():
    perf = json.load(open(os.path.join(WORK, '..', 'render', 'performed.json')))
    mel = json.load(open(os.path.join(WORK, 'melody.json')))
    notes = [n for p in perf['parts'] for n in p['notes']]
    sus = next(c for c in perf['parts'][0]['controlChanges'] if c.get('controller') == 'sustain')['points']
    return perf, mel, notes, sus


class Clock:
    """Ticks <-> performance milliseconds, from the tempo-mapped points of the rendering
    (unornamented note onsets and the sampled pedal positions)."""
    def __init__(self, notes, sus):
        pts = [(n['date'], n['milliseconds']['date']) for n in notes if not n['ornamented']]
        pts += [(p['date'], p['milliseconds']) for p in sus]
        pts = sorted(set((round(d, 4), round(m, 4)) for d, m in pts))
        d = np.array([p[0] for p in pts]); m = np.array([p[1] for p in pts])
        keep = np.r_[True, (np.diff(d) > 0) & (np.diff(m) > 0)]
        self.d, self.m = d[keep], np.maximum.accumulate(m[keep])

    def ms(self, date):
        return float(np.interp(date, self.d, self.m))

    def date(self, ms):
        return float(np.interp(ms, self.m, self.d))


def ornaments(mpm_text):
    return {int(float(d)): i for d, i in re.findall(r'<ornament date="([^"]+)"[^>]*xml:id="([^"]+)"', mpm_text)}


# ------------------------------------------------------------------ the generator

def build_vocal_map(profile, palette_names):
    import voicemodel as vm
    perf, mel, notes, sus = load_performance()
    clock = Clock(notes, sus)
    mpm_text = open(os.path.join(DATA, 'performance.mpm'), encoding='utf-8').read()
    orn = ornaments(mpm_text)
    vnotes = vm.build_notes(mel)                     # breaths, voice ends: the shared voice model
    src = mel['notes']
    ct, cv = vm.dynamics_curve(mel)
    hums = [n for n in palette_names if n.startswith('hum')]
    opens = [n for n in palette_names if n.startswith('open')]
    by_date = {}
    for n in notes:
        by_date.setdefault(n['date'], []).append(n)
    # pedal presses: the pedal going down again after having been up
    sv = np.array([p['value'] for p in sus]); sd = np.array([p['date'] for p in sus])
    presses = sd[1:][(sv[1:] >= 64) & (sv[:-1] < 64)]

    ev = []
    def add(tag, date, **a):
        ev.append((float(date), tag, a))

    add('style', 0, **{'name.ref': 'hummer'})
    rng = np.random.default_rng(7)
    scoops = [s for s in profile['f0_scoop_all'] if s < 0] or [-2.0]
    mode, hum_i, open_i = 'hum', 0, 0
    phrase_peak = {}
    k0 = 0
    for k, v in enumerate(vnotes):                   # the highest note of each phrase
        if v.breath_before and k > 0:
            k0 = k
        phrase_peak.setdefault(k0, []).append(k)
    peak_of = {}
    for k0, ks in phrase_peak.items():
        top = max(ks, key=lambda k: (src[k]['pitch'], vnotes[k].off - vnotes[k].on))
        for k in ks:
            peak_of[k] = top

    for k, (v, n) in enumerate(zip(vnotes, src)):
        on_ms, off_ms = v.on * 1000, v.off * 1000
        date = n['date']
        level_vel = float(np.interp(v.on, ct, cv))
        prev = vnotes[k - 1] if k else None
        # --- breath before the phrase
        if v.breath_before:
            gap_start = (prev.off * 1000) if prev else max(0.0, on_ms - 900)
            if on_ms - gap_start > 120:
                add('breath', clock.date(gap_start + 0.35 * (on_ms - gap_start)),
                    duration=round(clock.date(on_ms - 25) - clock.date(gap_start + 0.35 * (on_ms - gap_start)), 2),
                    through='nose')
            mode = 'hum'
            add('inflection', date, type='scoop', depthSt=round(float(scoops[k % len(scoops)]) * 0.8, 2), durationMs=220)
        # --- posture: open on the louder stretches and on phrase climaxes, closed when soft
        long_ = (v.off - v.on) >= 0.8
        want_open = level_vel >= 41 or (peak_of[k] == k and long_ and level_vel >= 37.5)
        if mode == 'hum' and want_open and not v.breath_before:
            mode = 'open'
        elif mode == 'open' and level_vel < 37:
            mode = 'hum'
        press = np.any((presses > (src[k - 1]['date'] if k else -1)) & (presses <= date))
        if v.breath_before or press or k == 0 or (mode == 'open') != (ev_last_mode.get('m') == 'open'):
            if mode == 'hum':
                hum_i = (hum_i + 1) % len(hums); posture = hums[hum_i]
            else:
                rank = np.clip((v.pitch - 60) / 22, 0, 0.999)            # higher notes, more open jaw
                order = ['open2', 'open1', 'open4', 'open3']
                posture = order[int(rank * len(order))] if open_i % 3 else order[min(3, int(rank * len(order)) + 1)]
                open_i += 1
            add('posture', date, value=posture)
            add('velum', date, value=0.30 if mode == 'hum' else 0.02)
            ev_last_mode['m'] = mode
        # a second position halfway through long notes
        if (v.off - v.on) >= 1.0:
            mid = clock.date(on_ms + 0.55 * (off_ms - on_ms))
            if mode == 'hum':
                hum_i = (hum_i + 1) % len(hums); add('posture', mid, value=hums[hum_i])
            else:
                add('posture', mid, value=opens[(open_i + 1) % len(opens)]); open_i += 1
        # --- pitch, with the arpeggio as portamento
        a = {'note.ref': '#' + n['id'].split('-rend')[0]}
        chord = by_date.get(date, [])
        if n['ornamented'] and len(chord) > 1 and k > 0 and not v.breath_before:
            first = min(c['milliseconds']['date'] for c in chord)
            if n['onset_ms'] - first > 25 and int(date) in orn:
                a['portamento.ref'] = '#' + orn[int(date)]
        add('pitch', date, **a)
        # --- articulation: re-articulate repeated or detached notes with the lips
        if k > 0 and not v.breath_before and (v.repeated_in or v.on - prev.key_off > 0.08):
            add('lips', clock.date(on_ms - 70), value='closure', durationMs=70)
        # --- glottis
        add('glottis', date, value='breathy' if n['velocity'] < 37 else ('breathy60' if n['velocity'] < 44 else 'modal'))
        # --- pressure: dynamics, swell into a phrase, release at its end
        L = vm.vel_to_db(n['velocity'])
        pr = 4200 * 10 ** ((L + 21.0) / 25)
        if v.breath_before:
            add('pressure', date, value=round(pr * 0.5))
            add('pressure', clock.date(on_ms + min(400, 0.6 * (off_ms - on_ms))), value=round(pr))
        else:
            add('pressure', date, value=round(pr))
        nxt = vnotes[k + 1] if k + 1 < len(vnotes) else None
        if nxt is None or nxt.breath_before:
            rel = max(on_ms + 0.5 * (off_ms - on_ms), off_ms - profile['release_s'] * 1000)
            add('pressure', clock.date(rel), value=round(pr * 0.45))
            add('inflection', clock.date(rel), type='fall', depthSt=round(-abs(rng.uniform(1.5, 3.5)), 2),
                durationMs=round(off_ms - rel))
            add('pressure', clock.date(off_ms), value=0)
    ev.sort(key=lambda e: e[0])
    return ev, clock


ev_last_mode = {}


def vocal_map_xml(ev):
    lines = ['        <vocalMap xml:id="vocalMap_hummer" name="Grünfeld hums along">']
    for i, (date, tag, a) in enumerate(ev):
        attrs = ''.join(f' {k}="{v}"' for k, v in a.items())
        lines.append(f'          <{tag} date="{date:.2f}"{attrs} xml:id="vocal_{i}"/>')
    lines.append('        </vocalMap>')
    return '\n'.join(lines)


def vocal_styles_xml(profile, palette):
    import vtlfit as V
    p = ['        <vocalStyles>', '          <styleDef name="hummer">',
         f'            <voiceDef synthesizer="VocalTractLab 2.4" speaker="JD3" transposition="{TRANSPOSE}" '
         f'timeConstantMs.pitch="30" timeConstantMs.posture="18" timeConstantMs.pressure="12" latencyMs="15"/>',
         f'            <wobbleDef rmsCents="{profile["wobble_cents_rms"] * 0.8:.1f}" stepMs="125" seed="1"/>']
    for name, vals in palette.items():
        p.append(f'            <postureDef name="{name}">' + ''.join(f'<param name="{n}" value="{x:.4f}"/>' for n, x in zip(V.TN, vals)) + '</postureDef>')
    p += ['          </styleDef>', '        </vocalStyles>']
    return '\n'.join(p)


def write_mpm(ev, profile, palette, out):
    text = open(os.path.join(DATA, 'performance.mpm'), encoding='utf-8').read()
    vm_xml = vocal_map_xml(ev)
    st_xml = vocal_styles_xml(profile, palette)
    i = text.index('</header>')                      # the global header
    text = text[:i] + '\n' + st_xml + '\n      ' + text[i:]
    j = text.index('</dated>')                       # the global dated section
    text = text[:j] + '\n' + vm_xml + '\n      ' + text[j:]
    open(out, 'w', encoding='utf-8').write(text)


# ------------------------------------------------------------------ the converter

def read_vocal_map(path):
    text = open(path, encoding='utf-8').read()
    body = re.search(r'<vocalMap.*?</vocalMap>', text, re.S).group(0)
    ev = []
    for tag, attrs in re.findall(r'<(\w+) (date="[^/]*?)/>', body):
        a = dict(re.findall(r'([\w.]+)="([^"]*)"', attrs))
        ev.append((float(a.pop('date')), tag, a))
    style = re.search(r'<styleDef name="hummer">.*?</styleDef>', text, re.S).group(0)
    voice = dict(re.findall(r'([\w.]+)="([^"]*)"', re.search(r'<voiceDef[^>]*/>', style).group(0)))
    wobble = dict(re.findall(r'([\w.]+)="([^"]*)"', re.search(r'<wobbleDef[^>]*/>', style).group(0)))
    postures = {nm: dict(re.findall(r'<param name="(\w+)" value="([^"]+)"/>', body_))
                for nm, body_ in re.findall(r'<postureDef name="([^"]+)">(.*?)</postureDef>', style)}
    orn = ornaments(text)
    return ev, voice, wobble, postures, {v: k for k, v in orn.items()}


def to_gestures(path):
    """vocalMap -> per-tier lists of (start_ms, end_ms, value, slope) on the audio timeline."""
    perf, mel, notes, sus = load_performance()
    clock = Clock(notes, sus)
    ev, voice, wobble, postures, orn_date = read_vocal_map(path)
    tr = float(voice['transposition'])
    lat = float(voice['latencyMs'])
    byid = {n['id']: n for n in notes}
    by_date = {}
    for n in notes:
        by_date.setdefault(n['date'], []).append(n)
    T = lambda d: clock.ms(d) + PAD * 1000 - lat
    end_ms = max(n['milliseconds']['end'] for n in notes) + PAD * 1000 + 1500
    tiers = {t: [] for t in ['vowel', 'lip', 'velic', 'glottal', 'f0', 'pressure']}
    # pitch events: resolve note.ref (first or repeated rendition by date) and portamento.ref
    pitch_ev = []
    for date, tag, a in ev:
        if tag != 'pitch':
            continue
        nid = a['note.ref'][1:]
        cand = [n for n in notes if n['id'].split('-rend')[0] == nid and abs(n['date'] - date) < 1]
        n = cand[0]
        st = 12 * np.log2(440 * 2 ** ((n['pitch'] + tr - 69) / 12))
        on = n['milliseconds']['date'] + PAD * 1000 - lat
        glide = None
        if 'portamento.ref' in a:
            od = orn_date[a['portamento.ref'][1:]]
            first = min(c['milliseconds']['date'] for c in by_date[od]) + PAD * 1000 - lat
            glide = (first, on)
        pitch_ev.append([on, st, glide])
    infl = [(T(d), a) for d, tag, a in ev if tag == 'inflection']
    # f0 tier: targets with wobble steps, scoops, falls and portamenti
    rng = np.random.default_rng(int(wobble['seed']))
    step = float(wobble['stepMs'])
    amp = float(wobble['rmsCents']) / 100 * np.sqrt(2)
    f0 = []
    for i, (on, st, glide) in enumerate(pitch_ev):
        nxt_on = pitch_ev[i + 1][0] if i + 1 < len(pitch_ev) else end_ms
        if glide and i > 0:
            prev_st = pitch_ev[i - 1][1]
            # VTL takes at most ~80 st/s: a slide too steep for its arpeggio starts earlier
            need = abs(st - prev_st) / 80.0 * 1000
            if glide[1] - glide[0] < need:
                glide = (glide[1] - need, glide[1])
            # the previous note gives way where the arpeggio begins
            f0 = [(a_, min(b_, glide[0]), v_, s_) for a_, b_, v_, s_ in f0 if a_ < glide[0]]
            f0.append((glide[0], glide[1], prev_st, (st - prev_st) / max(1e-3, (glide[1] - glide[0]) / 1000)))
        t0 = on
        # a scoop belongs to the first pitch at or shortly after its date (an arpeggio can delay it)
        sc = [a for t, a in infl if a['type'] == 'scoop' and on - 300 <= t <= on + 50]
        if sc:
            dms = float(sc[0]['durationMs']); dep = float(sc[0]['depthSt'])
            f0.append((t0, t0 + dms, st + dep, -dep / (dms / 1000)))
            t0 += dms
        fl = [(t, a) for t, a in infl if a['type'] == 'fall' and on < t < nxt_on]
        stop = fl[0][0] if fl else nxt_on
        while t0 < stop - 1:
            t1 = min(stop, t0 + step * rng.uniform(0.7, 1.3))
            f0.append((t0, t1, st + rng.normal(0, amp / 2), 0.0))
            t0 = t1
        if fl:
            t, a = fl[0]
            d = max(30.0, float(a['durationMs']))
            f0.append((t, t + d, st, float(a['depthSt']) / (d / 1000)))
            f0.append((t + d, nxt_on, st + float(a['depthSt']), 0.0))
    tiers['f0'] = f0
    # posture, velum, glottis, pressure: each event holds until the next one of its tier
    for tag, tier in [('posture', 'vowel'), ('velum', 'velic'), ('glottis', 'glottal'), ('pressure', 'pressure')]:
        pts = [(T(d), a['value']) for d, t_, a in ev if t_ == tag]
        tiers[tier] = [(s, e, v, 0.0) for (s, v), (e, _) in zip(pts, pts[1:] + [(end_ms, None)])]
    # breaths: glottis 'h', a little pressure, the posture of the phrase to come
    for d, tag, a in ev:
        if tag == 'breath':
            s = T(d); e = T(d + float(a['duration']))
            tiers['glottal'] = splice(tiers['glottal'], s, e, 'h')
            tiers['pressure'] = splice(tiers['pressure'], s + 0.3 * (e - s), e - 40, 1400.0)
    for d, tag, a in ev:
        if tag == 'lips':
            s = T(d)
            tiers['lip'].append((s, s + float(a['durationMs']), 'll-labial-closure', 0.0))
    return tiers, postures, end_ms, voice


def splice(seq, s, e, value):
    out = []
    for a, b, v, sl in seq:
        if b <= s or a >= e:
            out.append((a, b, v, sl)); continue
        if a < s: out.append((a, s, v, sl))
        if b > e: out.append((e, b, v, sl))
    out.append((s, e, value, 0.0))
    return sorted(out, key=lambda x: x[0])


def fill(seq, start, end, neutral):
    """contiguous gesture list from start to end; gaps get the neutral value"""
    out, t = [], start
    for a, b, v, sl in sorted(seq, key=lambda x: x[0]):
        a, b = max(a, start), min(b, end)
        if b <= t:
            continue
        a = max(a, t)
        if a > t + 0.5:
            out.append((t, a, neutral, 0.0, True))
        out.append((a, b, v, sl, False))
        t = b
    if t < end:
        out.append((t, end, neutral, 0.0, True))
    return out


def write_ges(tiers, voice, start, end, path):
    tc = {'vowel': float(voice['timeConstantMs.posture']), 'lip': 12.0, 'velic': 15.0, 'glottal': 12.0,
          'f0': float(voice['timeConstantMs.pitch']), 'pressure': float(voice['timeConstantMs.pressure'])}
    neutral = {'vowel': 'hum1', 'lip': '', 'velic': 0.0, 'glottal': 'breathy', 'f0': 12 * np.log2(130.0), 'pressure': 0.0}
    names = {'vowel': ('vowel-gestures', ''), 'lip': ('lip-gestures', ''), 'velic': ('velic-gestures', ''),
             'glottal': ('glottal-shape-gestures', ''), 'f0': ('f0-gestures', 'st'), 'pressure': ('lung-pressure-gestures', 'dPa')}
    x = ['<gestural_score>\n']
    for tier in ['vowel', 'lip', 'tongue-tip', 'tongue-body', 'velic', 'glottal', 'f0', 'pressure']:
        if tier in ('tongue-tip', 'tongue-body'):
            x.append(f'  <gesture_sequence type="{tier}-gestures" unit="">\n  </gesture_sequence>\n'); continue
        nm, unit = names[tier]
        x.append(f'  <gesture_sequence type="{nm}" unit="{unit}">\n')
        seq = tiers[tier]
        if tier == 'f0':                             # hold the last pitch through silences
            seq = [(a, b, v, s) for a, b, v, s in seq]
        gs = fill(seq, start, end, neutral[tier])
        # fold slivers (< 3 ms, which VTL rejects) into the gesture before them; the tier's
        # total duration, and so the timing of everything after, stays exact
        merged = []
        for g_ in gs:
            if merged and (g_[1] - g_[0]) < 3.0:
                a_, b_, v_, s_, n_ = merged[-1]
                merged[-1] = (a_, g_[1], v_, s_, n_)
            else:
                merged.append(g_)
        if len(merged) > 1 and merged[0][1] - merged[0][0] < 3.0:
            a_, b_, v_, s_, n_ = merged[1]
            merged[1] = (merged[0][0], b_, v_, s_, n_)
            merged = merged[1:]
        for a, b, v, sl, neu in merged:
            d = (b - a) / 1000
            try:
                v = float(v)
            except (TypeError, ValueError):
                pass
            if isinstance(v, str):
                val = v
            else:
                if tier == 'pressure':
                    v = min(15000.0, max(0.0, v))
                val = f'{v:.6f}'
            tcs = tc[tier] if not (tier == 'pressure' and val == '0.000000') else 12.0
            if tier == 'f0':
                sl = max(-80.0, min(80.0, sl))
            x.append(f'    <gesture value="{val}" slope="{sl:.6f}" duration_s="{d:.6f}" time_constant_s="{tcs / 1000:.6f}" '
                     f'neutral="{1 if (neu and tier in ("lip",)) else 0}" />\n')
        x.append('  </gesture_sequence>\n')
    x.append('</gestural_score>\n')
    open(path, 'w').write(''.join(x))


def write_speaker(postures, path):
    import vocaltractlab_cython as v
    sp = open(v.DEFAULT_SPEAKER_PATH, encoding='utf-8').read()
    names = [p['name'] for p in v.get_param_info('tract')]
    xml = ''.join(f'      <shape name="{nm}">\n' + ''.join(f'        <param name="{p}" value="{float(vals[p]):.4f}"/>\n' for p in names) + '      </shape>\n'
                  for nm, vals in postures.items())
    i = sp.index('    </shapes>')
    sp = sp[:i] + xml + sp[i:]
    gv = {nm: np.asarray(v.get_shape(nm, 'glottis'), dtype=float) for nm in ['modal', 'breathy']}
    gn = [p['name'] for p in v.get_param_info('glottis')]
    g = 0.4 * gv['modal'] + 0.6 * gv['breathy']
    gxml = '        <shape name="breathy60">\n' + ''.join(f'          <control_param name="{p}" value="{x:.6f}"/>\n' for p, x in zip(gn, g)) + '        </shape>\n'
    g0 = sp.index('<glottis_model type="Geometric glottis"')
    j = sp.index('      </shapes>', g0)
    sp = sp[:j] + gxml + sp[j:]
    open(path, 'w', encoding='utf-8').write(sp)
