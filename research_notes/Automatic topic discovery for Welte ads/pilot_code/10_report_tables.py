"""Print the markdown tables used in pilot_embedding_clustering.md from the JSON outputs."""
import json, collections
import numpy as np
from common import load, OUT, ctfidf, stopwords

units, spans, X, XS = load('mpnet')
runs = json.load(open(f'{OUT}/clusters_mpnet.json'))
lab = runs['bt_s0_m10']
labels = json.load(open('cluster_labels_mpnet_bt_s0_m10.json'))
cross = json.load(open(f'{OUT}/crossling_mpnet.json'))
red = {int(k): v for k, v in cross['cluster(text members, distinct copy groups, redundancy)'].items()}
cmp_ = json.load(open(f'{OUT}/compare_mpnet.json'))['bt_s0_m10']
kw = ctfidf([u['text'] for u in units], lab, top=6, sw=stopwords())


def best_jacc(run2):
    b = runs[run2]
    A, B = collections.defaultdict(set), collections.defaultdict(set)
    for i, (x, y) in enumerate(zip(lab, b)):
        A[x].add(i)
        B[y].add(i)
    return {c: max(len(s & t) / len(s | t) for d, t in B.items() if d != -1) for c, s in A.items() if c != -1}

j1, j2 = best_jacc('bt_s1_m10'), best_jacc('bt_s2_m10')
print('| # | type | label (manual) | units | ads | languages | c-TF-IDF keywords | with hand topic | top hand topics | stable s1/s2 | copy redundancy |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
order = sorted(set(lab) - {-1}, key=lambda c: (labels[str(c)][0] != 'R', labels[str(c)][0], -lab.count(c)))
for c in order:
    idx = [i for i, l in enumerate(lab) if l == c]
    mem = [units[i] for i in idx]
    langs = collections.Counter(u['lang'] for u in mem).most_common(3)
    tops = collections.Counter(t for u in mem for t in u['topics']).most_common(2)
    ntop = sum(1 for u in mem if u['topics'])
    r = red.get(c, (0, 0, 0))
    print(f'| {c} | {labels[str(c)][0]} | {labels[str(c)][1]} | {len(idx)} | {len(set(u["ad"] for u in mem))} | '
          f'{", ".join(f"{l} {n}" for l, n in langs)} | {", ".join(kw[c][:5])} | {ntop} | '
          f'{", ".join(f"{t} {n}" for t, n in tops)} | {j1[c]:.2f}/{j2[c]:.2f} | {r[2]:.2f} |')

# compact contingency
print('\n\n| hand topic | units (multi-label) | in noise | top clusters (units) | verdict |')
print('|---|---|---|---|---|')
C = collections.defaultdict(collections.Counter)
for u, l in zip(units, lab):
    for t in u['topics']:
        C[t][l] += 1
for t, v in sorted(cmp_['per_topic'].items(), key=lambda x: -x[1]['total']):
    if v['total'] < 6:
        continue
    top = [(c, n) for c, n in C[t].most_common() if c != -1][:3]
    print(f'| {t} | {v["total"]} | {v["noise"]} | ' + '; '.join(f'c{c} {n}' for c, n in top) + f' | {v.get("verdict", "-")} |')

# model comparison
print('\n\n| model | BERTopic clusters / noise | NMI topic (perm. mean) | NMI non-noise (perm.) | ARI non-noise | NMI language (perm.) | seed ARI non-noise (s0-s1, s0-s2, s1-s2) | kNN acc@5 | kNN strict | kNN sentence ctx strict |')
print('|---|---|---|---|---|---|---|---|---|---|')
for m in ('mpnet', 'e5', 'bgem3'):
    c = json.load(open(f'{OUT}/compare_{m}.json'))['bt_s0_m10']
    st = json.load(open(f'{OUT}/stability_{m}.json'))
    sd = json.load(open(f'{OUT}/seeded_{m}.json'))['knn']
    seeds = ', '.join(str(st[k]['ARI_nonnoise']) for k in ('bt_s0_m10 vs bt_s1_m10', 'bt_s0_m10 vs bt_s2_m10', 'bt_s1_m10 vs bt_s2_m10'))
    print(f'| {m} | {c["n_clusters"]} / {c["n_noise"]} | {c["NMI_topic"]} ({c["NMI_topic_perm_mean"]}) | '
          f'{c["NMI_topic_nonnoise"]} ({c["NMI_topic_nonnoise_perm_mean"]}) | {c["ARI_topic_nonnoise"]} | '
          f'{c["NMI_lang_text"]} ({c["NMI_lang_text_perm_mean"]}) | {seeds} | {sd["span_text"]["acc_k5"]} | '
          f'{sd["span_text_strict"]["acc_k5"]} | {sd["sentence_context_strict"]["acc_k5"]} |')
for m in ('mpnet', 'bgem3'):
    sd = json.load(open(f'{OUT}/seeded_{m}.json'))['knn']['span_text_strict']
    print(f'\n{m} strict recall:', sd['recall_per_topic'])
    print(f'{m} strict confusions:', sd['top_confusions'][:10])
