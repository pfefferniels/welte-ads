"""Static data for the live page (run with the offline pipeline's working directory as WORKDIR): score, MPM, the melody's note list, ornaments, the hum style,
calibration, the speaker with a lattice of mouth shapes, and trimmed piano samples.
Then ../reduction/reduction_to_json.py replaces the melody with what is hummed (reduction.mei), and
calibrate.cjs measures the voice and sets the per-note calibration and the gain."""
import json, os, re, shutil, subprocess, sys
import numpy as np
S = os.environ.get('WORKDIR', '.') + '/'   # the offline pipeline's working directory
sys.path.insert(0, S + 'work_rec'); sys.path.insert(0, S + 'work')
import hummer as H, vtlfit as V
OUT = os.environ.get('LIVE_OUT', S + 'live/site/')
shutil.copy(S + 'render/score_converted.msm', OUT + 'data/score.msm.xml')
shutil.copy(S + 'data/performance.mpm', OUT + 'data/performance.mpm.xml')
mel = json.load(open(S + 'work/melody.json'))
profile = json.load(open(S + 'work_rec/profile.json'))
pal = np.load(S + 'work_rec/palette.npz'); P = dict(zip(pal['names'], pal['shapes']))
cal = json.load(open(S + 'exag/calibration_x100.json'))
mpm = open(S + 'data/performance.mpm', encoding='utf-8').read()
orn = {str(int(float(d))): i for d, i in re.findall(r'<ornament date="([^"]+)"[^>]*xml:id="([^"]+)"', mpm)}
hums = ['hum1', 'hum2', 'hum3']; towards = ['open2', 'open4', 'open1']
ld = V.TN.index('LD')
# the mouth-shape lattice: closed mixes of the three hums in 10 % steps, and for each the open
# shape it leans toward at its widest (OPEN_MAX of the way from parted lips): the page blends the
# two tubes by the opening amount
shapes = {}
for i in range(11):
    for j in range(11 - i):
        k = 10 - i - j
        C = (i * P['hum1'] + j * P['hum2'] + k * P['hum3']) / 10
        shapes[f'c{i}_{j}'] = C
        for T in towards:
            b0 = float(np.clip((0.11 - C[ld]) / (P[T][ld] - C[ld]), 0, 1))
            b = b0 + H.OPEN_MAX * (1 - b0)
            shapes[f'{T}_{i}_{j}'] = (1 - b) * C + b * P[T]
H.write_speaker({nm: dict(zip(V.TN, vec)) for nm, vec in shapes.items()}, OUT + 'data/hummer_live.speaker.xml')
static = dict(
    melody=[dict(id=n['id'], measure=n['measure'], rend2=n['rend2']) for n in mel['notes']],
    ornaments=orn, scoops=[s for s in profile['f0_scoop_all'] if s < 0] or [-2.0],
    release_s=profile['release_s'], wobble_cents=round(profile['wobble_cents_rms'] * 0.8, 1),
    calibration=[cal.get(str(k), 0.0) for k in range(len(mel['notes']))],
    towards=towards, n_shapes=len(shapes))
json.dump(static, open(OUT + 'data/static.json', 'w'), separators=(',', ':'))
print(len(shapes), 'shapes;', len(static['melody']), 'melody notes;', len(orn), 'ornaments')
# piano: every other velocity layer of the pitches the piece reaches, mono, 7 s
NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B']
for b in [33, 36, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81]:
    for l in [3, 5, 7, 9]:
        src = S + f'salamander/{NAMES[b % 12]}{b // 12 - 1}v{l}.mp3'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-t', '7', '-ac', '1',
                        '-af', 'afade=t=out:st=5.5:d=1.5', '-codec:a', 'libmp3lame', '-q:a', '5', OUT + f'piano/p{b}v{l}.mp3'], check=True)
print('piano samples written')
# The calibration in data/static.json was then refined once from a render of the live chain itself
# (note levels against the dynamics, as run_hummer.calibrate does), and the output gain set to put
# the voiced level at -23 dB; data/static.json in the repository holds those values.
