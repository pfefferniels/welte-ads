"""Step 7: prevalence of discovered clusters and hand topics, 1905-1914 vs 1917-1929.

usage: python 07_time.py [mpnet] [run]
Ad-level prevalence (share of ads with >= 1 unit in the cluster / >= 1 span of the topic), Fisher exact test,
Benjamini-Hochberg adjusted. Also the composition of the two periods (language, annotator, firm).
"""
import sys, json, collections
import numpy as np
from scipy.stats import fisher_exact
from common import load, OUT

model = sys.argv[1] if len(sys.argv) > 1 else 'mpnet'
run = sys.argv[2] if len(sys.argv) > 2 else 'bt_s0_m10'
units, spans, XU, XS = load(model)
allunits = json.load(open(f'{OUT}/units.json'))
lab = json.load(open(f'{OUT}/clusters_{model}.json'))[run]
labels = json.load(open('cluster_labels_mpnet_bt_s0_m10.json')) if (model, run) == ('mpnet', 'bt_s0_m10') else {}
ads = {}
for u in allunits:
    ads[u['ad']] = u
per = {a: ('early' if u['year'] <= 1914 else 'late') for a, u in ads.items()}
N = collections.Counter(per.values())
words = collections.Counter()
for u in allunits:
    if u['kind'] == 'text':
        words[per[u['ad']]] += u['nwords']


def bh(p):
    p = np.array(p)
    o = np.argsort(p)
    q = np.empty_like(p)
    m = len(p)
    prev = 1.0
    for rank, i in reversed(list(enumerate(o, 1))):
        prev = min(prev, p[i] * m / rank)
        q[i] = prev
    return q


def table(groups, name):
    rows = []
    for g, adset in groups.items():
        e = sum(1 for a in adset if per[a] == 'early')
        l = sum(1 for a in adset if per[a] == 'late')
        _, p = fisher_exact([[e, N['early'] - e], [l, N['late'] - l]])
        rows.append([g, e, l, e / N['early'], l / N['late'], p])
    q = bh([r[5] for r in rows])
    for r, qq in zip(rows, q):
        r.append(qq)
    rows.sort(key=lambda r: r[6])
    print(f'\n=== {name}: early ads={N["early"]} late ads={N["late"]}')
    for g, e, l, se, sl, p, qq in rows:
        lab_ = labels.get(str(g), ['', ''])[1][:60] if name == 'clusters' else ''
        print(f'  {str(g):28s} early {e:3d} ({se:5.1%})  late {l:3d} ({sl:5.1%})  p={p:.4f} q={qq:.4f}  {lab_}')
    return [dict(group=str(g), early=e, late=l, early_share=round(se, 3), late_share=round(sl, 3), p=float(p),
                 q=float(qq)) for g, e, l, se, sl, p, qq in rows]


cl = collections.defaultdict(set)
for u, c in zip(units, lab):
    if c != -1:
        cl[c].add(u['ad'])
tp = collections.defaultdict(set)
for s in spans:
    for t in s['ana']:
        tp[t].add(s['ad'])
res = dict(N=dict(N), words=dict(words))
res['clusters'] = table(cl, 'clusters')
res['topics'] = table(tp, 'topics')
# topic spans per 1000 words
sp = collections.Counter()
for s in spans:
    for t in s['ana']:
        sp[(t, per[s['ad']])] += 1
res['spans_per_1000_words'] = {t: (round(1000 * sp[(t, 'early')] / words['early'], 2),
                                   round(1000 * sp[(t, 'late')] / words['late'], 2)) for t in tp}
# composition
comp = {}
comp['lang'] = {p: collections.Counter(ads[a]['lang'] for a in ads if per[a] == p).most_common() for p in N}
comp['status'] = {p: collections.Counter(ads[a]['status'] for a in ads if per[a] == p).most_common() for p in N}
comp['span_resp'] = {p: collections.Counter(s['resp'] or 'none' for s in spans if per[s['ad']] == p).most_common() for p in N}
comp['firm_top'] = {p: collections.Counter(ads[a]['firm'][:30] for a in ads if per[a] == p).most_common(6) for p in N}
res['composition'] = comp
print('\nwords', dict(words))
for k, v in comp.items():
    print(k, v)
print('\nspans per 1000 words (early, late):', dict(sorted(res['spans_per_1000_words'].items(), key=lambda x: -sum(x[1]))))
json.dump(res, open(f'{OUT}/time_{model}_{run}.json', 'w'), indent=1, ensure_ascii=False)
