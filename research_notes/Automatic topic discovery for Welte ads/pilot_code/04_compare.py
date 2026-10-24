"""Step 4: compare discovered clusters with the hand taxonomy.

usage: python 04_compare.py [mpnet|e5|bgem3] [run ...]
For each run: NMI/ARI between cluster and main hand topic on units that carry a topic (with a permutation
baseline), NMI with language, per-topic recovery, per-cluster topic coverage, full contingency table (CSV).
"""
import sys, json, collections
import numpy as np
from common import load, OUT
from sklearn.metrics import adjusted_rand_score as ARI, normalized_mutual_info_score as NMI

model = sys.argv[1] if len(sys.argv) > 1 else 'mpnet'
runs_req = sys.argv[2:] or ['bt_s0_m10', 'km30_s0', 'ward30']
units, spans, X, XS = load(model)
runs = json.load(open(f'{OUT}/clusters_{model}.json'))
rng = np.random.default_rng(0)
res = {}
for run in runs_req:
    lab = np.array(runs[run])
    has = np.array([bool(u['topics']) for u in units])
    main = np.array([u['main_topic'] or '' for u in units])
    lang = np.array([u['lang'] for u in units])
    istext = np.array([u['kind'] == 'text' for u in units])
    ad = np.array([u['ad'] for u in units])
    sub = has
    nonnoise = sub & (lab != -1)
    r = dict(n_units=int(len(units)), n_with_topic=int(sub.sum()), n_with_topic_nonnoise=int(nonnoise.sum()),
             n_clusters=int(len(set(lab) - {-1})), n_noise=int((lab == -1).sum()))
    r['NMI_topic'] = round(NMI(main[sub], lab[sub]), 3)
    r['ARI_topic'] = round(ARI(main[sub], lab[sub]), 3)
    r['NMI_topic_nonnoise'] = round(NMI(main[nonnoise], lab[nonnoise]), 3)
    r['ARI_topic_nonnoise'] = round(ARI(main[nonnoise], lab[nonnoise]), 3)
    perm = [NMI(rng.permutation(main[sub]), lab[sub]) for _ in range(200)]
    r['NMI_topic_perm_mean'] = round(float(np.mean(perm)), 3)
    r['NMI_topic_perm_p99'] = round(float(np.percentile(perm, 99)), 3)
    permn = [NMI(rng.permutation(main[nonnoise]), lab[nonnoise]) for _ in range(200)]
    r['NMI_topic_nonnoise_perm_mean'] = round(float(np.mean(permn)), 3)
    r['NMI_lang_text'] = round(NMI(lang[istext], lab[istext]), 3)
    r['NMI_lang_text_perm_mean'] = round(float(np.mean([NMI(rng.permutation(lang[istext]), lab[istext]) for _ in range(50)])), 3)

    # contingency: multi-label (a unit with 2 topics counts for both)
    clusters = sorted(set(lab), key=lambda c: (c == -1, c))
    topics = sorted({t for u in units for t in u['topics']},
                    key=lambda t: -sum(1 for u in units if t in u['topics']))
    C = np.zeros((len(topics), len(clusters)), int)
    for u, l in zip(units, lab):
        for t in u['topics']:
            C[topics.index(t), clusters.index(l)] += 1
    with open(f'{OUT}/contingency_{model}_{run}.csv', 'w') as f:
        f.write('topic,total,' + ','.join(f'c{c}' for c in clusters) + '\n')
        for i, t in enumerate(topics):
            f.write(f'{t},{C[i].sum()},' + ','.join(map(str, C[i])) + '\n')
    size = collections.Counter(lab)
    cov = {int(c): round(sum(1 for u, l in zip(units, lab) if l == c and u['topics']) / size[c], 3) for c in clusters}
    # per topic recovery (multi-label, excluding noise)
    per_topic = {}
    for i, t in enumerate(topics):
        tot = C[i].sum()
        nn = C[i, :-1].sum() if clusters[-1] == -1 else tot
        noise = tot - nn
        if nn == 0:
            per_topic[t] = dict(total=int(tot), noise=int(noise))
            continue
        j = int(np.argmax(C[i, :-1] if clusters[-1] == -1 else C[i]))
        c = clusters[j]
        ntopic_in_c = sum(1 for u, l in zip(units, lab) if l == c and u['topics'])
        main_in_c = collections.Counter(u['main_topic'] for u, l in zip(units, lab) if l == c and u['topics'])
        share = C[i, j] / nn
        purity = C[i, j] / max(ntopic_in_c, 1)  # share of topic-bearing units of that cluster carrying t
        nclu = int((C[i, :-1] if clusters[-1] == -1 else C[i]).astype(bool).sum())
        dom = main_in_c.most_common(1)[0][0]
        if share >= 0.4 and purity >= 0.5:
            verdict = 'recovered'
        elif share >= 0.4 and dom != t:
            verdict = f'merged (into cluster dominated by {dom})'
        elif share < 0.4 and nclu >= 3:
            verdict = 'split'
        else:
            verdict = 'partly'
        per_topic[t] = dict(total=int(tot), noise=int(noise), n_clusters=nclu, top_cluster=int(c),
                            top_share=round(float(share), 2), top_cluster_size=int(size[c]),
                            purity_in_top=round(float(purity), 2), verdict=verdict)
    r['per_topic'] = per_topic
    r['cluster_topic_coverage'] = cov
    r['clusters_without_topic(cov<=0.1)'] = [int(c) for c in clusters if c != -1 and cov[c] <= 0.1]
    res[run] = r
    print(f'--- {model} {run}')
    for k, v in r.items():
        if k not in ('per_topic', 'cluster_topic_coverage'):
            print(' ', k, v)
    for t, v in per_topic.items():
        if v['total'] >= 6:
            print('   ', t, v)
json.dump(res, open(f'{OUT}/compare_{model}.json', 'w'), indent=1)
