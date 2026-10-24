"""Step 3: unsupervised clustering of the unit embeddings.

usage: python 03_cluster.py [mpnet|e5|bgem3]
Runs BERTopic (UMAP + HDBSCAN) with 3 seeds and 2 extra min_cluster_size settings, KMeans (k=30, 3 seeds)
and agglomerative Ward (k=30). Writes $OUT/clusters_<model>.json (labels per run, in items_units order),
$OUT/stability_<model>.json and human-readable cluster descriptions $OUT/clusters_<model>_<run>.txt.
"""
import sys, json, collections, itertools, warnings
import numpy as np
warnings.filterwarnings('ignore')
from common import load, stopwords, ctfidf, representatives, TOKEN, OUT
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.metrics import adjusted_rand_score as ARI, normalized_mutual_info_score as NMI

model = sys.argv[1] if len(sys.argv) > 1 else 'mpnet'
units, spans, X, XS = load(model)
docs = [u['text'] for u in units]
sw = stopwords()
runs = {}

from bertopic import BERTopic
from umap import UMAP
from hdbscan import HDBSCAN
from sklearn.feature_extraction.text import CountVectorizer

BT_SETTINGS = [(0, 10), (1, 10), (2, 10), (0, 6), (0, 15)]   # (seed, min_cluster_size)
for seed, mcs in BT_SETTINGS:
    umap = UMAP(n_neighbors=15, n_components=5, min_dist=0.0, metric='cosine', random_state=seed)
    hdb = HDBSCAN(min_cluster_size=mcs, min_samples=5, metric='euclidean', cluster_selection_method='eom',
                  prediction_data=True)
    vec = CountVectorizer(token_pattern=TOKEN, stop_words=list(sw))
    tm = BERTopic(umap_model=umap, hdbscan_model=hdb, vectorizer_model=vec, top_n_words=10)
    topics, _ = tm.fit_transform(docs, embeddings=X)
    runs[f'bt_s{seed}_m{mcs}'] = [int(t) for t in topics]
    print(f'bertopic seed={seed} mcs={mcs}: clusters', len(set(topics)) - (1 if -1 in topics else 0),
          'noise', sum(1 for t in topics if t == -1))

for seed in (0, 1, 2):
    km = KMeans(n_clusters=30, n_init=10, random_state=seed).fit(X)
    runs[f'km30_s{seed}'] = [int(t) for t in km.labels_]
runs['ward30'] = [int(t) for t in AgglomerativeClustering(n_clusters=30, linkage='ward').fit(X).labels_]
json.dump(runs, open(f'{OUT}/clusters_{model}.json', 'w'))

# ---- stability
def best_match_jaccard(a, b):
    """For each cluster of a (no noise): best Jaccard overlap with any cluster of b."""
    A = collections.defaultdict(set)
    B = collections.defaultdict(set)
    for i, (x, y) in enumerate(zip(a, b)):
        A[x].add(i)
        B[y].add(i)
    out = {}
    for ca, sa in A.items():
        if ca == -1:
            continue
        out[ca] = max(len(sa & sb) / len(sa | sb) for cb, sb in B.items() if cb != -1)
    return out

stab = {}
for r1, r2 in [('bt_s0_m10', 'bt_s1_m10'), ('bt_s0_m10', 'bt_s2_m10'), ('bt_s1_m10', 'bt_s2_m10'),
               ('bt_s0_m10', 'bt_s0_m6'), ('bt_s0_m10', 'bt_s0_m15'),
               ('km30_s0', 'km30_s1'), ('km30_s0', 'km30_s2'), ('km30_s1', 'km30_s2'),
               ('km30_s0', 'ward30'), ('bt_s0_m10', 'km30_s0')]:
    a, b = np.array(runs[r1]), np.array(runs[r2])
    both = (a != -1) & (b != -1)
    bm = best_match_jaccard(list(a), list(b))
    stab[f'{r1} vs {r2}'] = dict(ARI_all=round(ARI(a, b), 3), ARI_nonnoise=round(ARI(a[both], b[both]), 3),
                                 NMI_all=round(NMI(a, b), 3),
                                 median_best_jaccard=round(float(np.median(list(bm.values()))), 3),
                                 share_clusters_jacc_ge_0_5=round(np.mean([v >= 0.5 for v in bm.values()]), 3))
    print(r1, 'vs', r2, stab[f'{r1} vs {r2}'])
json.dump(stab, open(f'{OUT}/stability_{model}.json', 'w'), indent=1)

# ---- descriptions
def describe(run):
    labs = runs[run]
    kw = ctfidf(docs, labs, top=10, sw=sw)
    lines = []
    for c in sorted(set(labs), key=lambda c: (c == -1, -labs.count(c))):
        idx = [i for i, l in enumerate(labs) if l == c]
        mem = [units[i] for i in idx]
        langs = collections.Counter(u['lang'] for u in mem)
        ads = collections.Counter(u['ad'] for u in mem)
        firms = collections.Counter(u['firm'] for u in mem)
        figs = sum(1 for u in mem if u['kind'] == 'fig')
        tops = collections.Counter(t for u in mem for t in u['topics'])
        ntop = sum(1 for u in mem if u['topics'])
        early = sum(1 for u in mem if u['year'] <= 1914)
        if c != -1:
            sims = X[idx] @ X[idx].T
            coh = (sims.sum() - len(idx)) / max(len(idx) * (len(idx) - 1), 1)
        else:
            coh = float('nan')
        lines.append(f'=== cluster {c}  size={len(idx)}  ads={len(ads)}  firms={len(firms)}  figs={figs}  '
                     f'early(<=1914)={early}  mean_cos={coh:.3f}')
        lines.append('  langs: ' + ', '.join(f'{k}:{v}' for k, v in langs.most_common()))
        lines.append('  top ads: ' + ', '.join(f'{k}:{v}' for k, v in ads.most_common(6)))
        lines.append('  keywords: ' + ', '.join(kw[c]))
        lines.append(f'  units with hand topic: {ntop}/{len(idx)}; topics: ' +
                     ', '.join(f'{k}:{v}' for k, v in tops.most_common(6)))
        reps = representatives(X, idx, n=6, units=units) if c != -1 else idx[:6]
        for i in reps:
            u = units[i]
            lines.append(f'   - [{u["uid"]} {u["lang"]} {u["year"]}] {u["text"][:260]}  {u["topics"] or ""}')
    open(f'{OUT}/clusters_{model}_{run}.txt', 'w').write('\n'.join(lines))

for run in ('bt_s0_m10', 'km30_s0'):
    describe(run)
print('done')
