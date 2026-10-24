"""Step 6: cross-lingual reused copy (translations of the same copy) and same-language near-duplicates.

usage: python 06_crossling.py [mpnet|e5|bgem3]
- Cross-lingual candidate pairs: kept text units in different languages that are mutual nearest neighbours
  across that language pair, listed by cosine band (for manual precision checks).
- Same-language near-duplicates: cos >= 0.95, different ads.
- Copy groups = connected components of the graph "translation pair (cos >= T_X) or near-duplicate";
  per cluster of the main BERTopic run: number of distinct copy groups ("effective size").
"""
import sys, json, collections
import numpy as np
from common import load, OUT

model = sys.argv[1] if len(sys.argv) > 1 else 'mpnet'
T_X = float(sys.argv[2]) if len(sys.argv) > 2 else 0.85   # cross-lingual threshold (calibrated by reading)
units, spans, XU, XS = load(model)
ti = [i for i, u in enumerate(units) if u['kind'] == 'text']
T = [units[i] for i in ti]
E = XU[ti]
S = E @ E.T
np.fill_diagonal(S, -1)
lang = np.array([u['lang'] for u in T])
ad = np.array([u['ad'] for u in T])
nw = np.array([u['nwords'] for u in T])
langs = sorted(set(lang))

# mutual nearest neighbours per language pair
pairs = []
for a in range(len(T)):
    for l2 in langs:
        if l2 == lang[a]:
            continue
        cand = np.where(lang == l2)[0]
        b = cand[np.argmax(S[a, cand])]
        if a < b:
            back = np.where(lang == lang[a])[0]
            if back[np.argmax(S[b, back])] == a:
                pairs.append((a, int(b), float(S[a, b])))
# ratio margin (Artetxe & Schwenk 2019): cos(x,y) / mean(avg cos of x to its k NN in y's language,
# avg cos of y to its k NN in x's language); k = 4. Penalises "hub" sentences that are close to everything.
K = 4
def knn_mean(a, l2):
    cand = np.where(lang == l2)[0]
    v = np.sort(S[a, cand])[-K:]
    return v.mean()
pairs = [(a, b, c, c / ((knn_mean(a, lang[b]) + knn_mean(b, lang[a])) / 2)) for a, b, c in pairs]
json.dump([dict(a=T[a]['uid'], b=T[b]['uid'], cos=round(c, 4), margin=round(float(m), 4)) for a, b, c, m in pairs],
          open(f'{OUT}/xling_pairs_{model}.json', 'w'))
pairs = [(a, b, c) for a, b, c, m in pairs]
pairs.sort(key=lambda x: -x[2])
bands = [(0.95, 1.01), (0.90, 0.95), (0.85, 0.90), (0.80, 0.85), (0.75, 0.80)]
lines = [f'cross-lingual mutual-NN pairs: {len(pairs)}']
rs = np.random.default_rng(0)
band_counts = {}
for lo, hi in bands:
    bp = [p for p in pairs if lo <= p[2] < hi and nw[p[0]] >= 5 and nw[p[1]] >= 5]
    band_counts[f'{lo:.2f}-{hi:.2f}'] = len(bp)
    lines.append(f'\n##### band {lo:.2f}-{hi:.2f}: {len(bp)} pairs (both >= 5 words); random sample of 12')
    for k in rs.permutation(len(bp))[:12]:
        a, b, c = bp[k]
        lines.append(f'  {c:.3f} [{T[a]["uid"]} {lang[a]}] {T[a]["text"][:150]}')
        lines.append(f'        [{T[b]["uid"]} {lang[b]}] {T[b]["text"][:150]}')
print('band counts', band_counts)

# same-language near duplicates (different ads)
dup = [(a, b, float(S[a, b])) for a in range(len(T)) for b in range(a + 1, len(T))
       if S[a, b] >= 0.95 and lang[a] == lang[b] and ad[a] != ad[b]]
xl = [(a, b, c) for a, b, c in pairs if c >= T_X and nw[a] >= 5 and nw[b] >= 5]

# copy groups (union-find)
parent = list(range(len(T)))
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x
for a, b, c in dup + xl:
    parent[find(a)] = find(b)
comp = [find(i) for i in range(len(T))]
size = collections.Counter(comp)
in_xl = set(a for a, b, c in xl) | set(b for a, b, c in xl)
in_dup = set(a for a, b, c in dup) | set(b for a, b, c in dup)
res = dict(model=model, T_X=T_X, n_text_units=len(T), n_xling_mnn_pairs=len(pairs), band_counts=band_counts,
           n_xling_pairs_ge_T=len(xl), n_units_in_xling_pairs=len(in_xl),
           n_samelang_dup_pairs=len(dup), n_units_in_samelang_dups=len(in_dup),
           n_units_in_any_copy_group=sum(1 for i in range(len(T)) if size[comp[i]] > 1),
           words_in_any_copy_group=int(sum(nw[i] for i in range(len(T)) if size[comp[i]] > 1)),
           words_total=int(nw.sum()))
# which language pairs / ad pairs
res['xling_lang_pairs'] = collections.Counter('-'.join(sorted((lang[a], lang[b]))) for a, b, c in xl).most_common()
adp = collections.Counter(tuple(sorted((ad[a], ad[b]))) for a, b, c in xl)
res['xling_ad_pairs_ge2'] = [(f'{x}-{y}', n) for (x, y), n in adp.most_common() if n >= 2]
# per-ad share of units that are part of a copy group (reused copy) vs unique
per_lang = {}
for l in langs:
    idx = [i for i in range(len(T)) if lang[i] == l]
    per_lang[l] = (len(idx), round(sum(1 for i in idx if i in in_xl) / len(idx), 3),
                   round(sum(1 for i in idx if size[comp[i]] > 1) / len(idx), 3))
res['per_lang(n, share_in_xling_pair, share_in_any_copy_group)'] = per_lang

# are clusters driven by copy? effective size = number of distinct copy groups in the cluster
runs = json.load(open(f'{OUT}/clusters_mpnet.json'))   # primary clustering (mpnet) in all cases
lab = np.array(runs['bt_s0_m10'])[ti]
eff = {}
for c in sorted(set(lab)):
    if c == -1:
        continue
    idx = np.where(lab == c)[0]
    groups = set(comp[i] for i in idx)
    eff[int(c)] = (len(idx), len(groups), round(1 - len(groups) / len(idx), 2))
res['cluster(text members, distinct copy groups, redundancy)'] = eff
res['clusters_redundancy_ge_0.5'] = [c for c, v in eff.items() if v[2] >= 0.5]
json.dump(res, open(f'{OUT}/crossling_{model}.json', 'w'), indent=1, ensure_ascii=False)
lines.append('\n\n##### pairs >= T_X, top 60 by cosine')
for a, b, c in xl[:60]:
    lines.append(f'  {c:.3f} [{T[a]["uid"]} {lang[a]} {T[a]["year"]}] {T[a]["text"][:140]}')
    lines.append(f'        [{T[b]["uid"]} {lang[b]} {T[b]["year"]}] {T[b]["text"][:140]}')
open(f'{OUT}/crossling_{model}.txt', 'w').write('\n'.join(lines))
for k, v in res.items():
    if not k.startswith('cluster('):
        print(k, v)
print('cluster redundancy', eff)
