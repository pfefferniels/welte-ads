"""Step 5 (+8): taxonomy-guided retrieval and leave-one-out kNN classification of the annotated spans.

usage: python 05_seeded.py [mpnet|e5|bgem3]
- Retrieval: for each of the 10 most frequent hand topics, score every UNANNOTATED kept text unit by the mean
  of its 3 highest cosine similarities to the topic's annotated spans; list the top 8 with the nearest span.
- LOO kNN: each span is classified by its k=5 nearest other spans (similarity-weighted votes; a neighbour votes
  for all its topics). Variants: plain; "strict" = neighbours from the same ad and near-duplicates
  (cos >= 0.9) excluded; span text vs. sentence context (embedding of the unit that contains the span).
- Step 8: accuracy for editor (np) vs LLM (claude) spans, and cross-group classification.
"""
import sys, json, collections
import numpy as np
from common import load, OUT

model = sys.argv[1] if len(sys.argv) > 1 else 'mpnet'
units, spans, XU, XS = load(model)
uidx = {u['uid']: i for i, u in enumerate(units)}
out = {}

# ---------- retrieval
cnt = collections.Counter(t for s in spans for t in s['ana'])
top10 = [t for t, _ in cnt.most_common(10)]
cand = [i for i, u in enumerate(units) if u['kind'] == 'text' and not u['topics']]
lines = []
retr = {}
for t in top10:
    sidx = [j for j, s in enumerate(spans) if t in s['ana']]
    S = XU[cand] @ XS[sidx].T                       # cand x spans
    top3 = np.sort(S, 1)[:, -3:].mean(1)
    order = np.argsort(-top3)[:8]
    lines.append(f'##### {t}  (annotated spans: {len(sidx)})')
    retr[t] = []
    for o in order:
        i = cand[o]
        j = sidx[int(np.argmax(S[o]))]
        u = units[i]
        retr[t].append(dict(uid=u['uid'], score=round(float(top3[o]), 3), text=u['text'],
                            nearest_span=spans[j]['sid'], nearest_text=spans[j]['text'],
                            nearest_cos=round(float(S[o].max()), 3)))
        lines.append(f'  {top3[o]:.3f} [{u["uid"]} {u["lang"]} {u["year"]}] {u["text"][:230]}')
        lines.append(f'         nearest span {spans[j]["sid"]} ({S[o].max():.3f}): {spans[j]["text"][:120]}')
open(f'{OUT}/retrieval_{model}.txt', 'w').write('\n'.join(lines))
json.dump(retr, open(f'{OUT}/retrieval_{model}.json', 'w'), ensure_ascii=False, indent=1)
out['n_candidates_unannotated_text_units'] = len(cand)

# ---------- LOO kNN
def span_context_matrix():
    """Embedding of the unit with the largest overlap with each span (figure spans: the figure unit)."""
    rows = []
    best = {}
    for i, u in enumerate(units):
        for sid, v in u['span_overlap'].items():
            if sid not in best or v > best[sid][1]:
                best[sid] = (i, v)
    miss = 0
    for s in spans:
        if s['sid'] in best:
            rows.append(XU[best[s['sid']][0]])
        else:  # span only inside a dropped short unit: fall back to span embedding
            rows.append(XS[spans.index(s)])
            miss += 1
    return np.array(rows), miss


def knn_eval(E, k=5, strict=False, ref_mask=None, query_mask=None):
    sims = E @ E.T
    np.fill_diagonal(sims, -9)
    ads = np.array([s['ad'] for s in spans])
    labels = [set(s['ana']) for s in spans]
    n = len(spans)
    res = []
    for i in range(n):
        if query_mask is not None and not query_mask[i]:
            continue
        row = sims[i].copy()
        if strict:
            row[ads == ads[i]] = -9
            row[sims[i] >= 0.9] = -9
        if ref_mask is not None:
            row[~ref_mask] = -9
        nb = np.argsort(-row)[:k]
        votes = collections.Counter()
        for j in nb:
            for t in labels[j]:
                votes[t] += row[j]
        pred = votes.most_common(1)[0][0]
        res.append(dict(i=i, pred=pred, ok=pred in labels[i], nn1_ok=bool(labels[nb[0]] & labels[i]),
                        true=sorted(labels[i]), resp=spans[i]['resp'] or 'none'))
    return res


def summarise(res, name):
    acc = np.mean([r['ok'] for r in res])
    acc1 = np.mean([r['nn1_ok'] for r in res])
    conf = collections.Counter()
    for r in res:
        if not r['ok']:
            conf[tuple(sorted((r['true'][0] if len(r['true']) == 1 else '+'.join(r['true']), r['pred'])))] += 1
    rec = {}
    for t in cnt:
        rr = [r for r in res if t in r['true']]
        if len(rr) >= 6:
            rec[t] = round(float(np.mean([r['ok'] for r in rr])), 2)
    byresp = {g: (round(float(np.mean([r['ok'] for r in res if r['resp'] == g])), 3),
                  sum(1 for r in res if r['resp'] == g)) for g in ('np', 'claude', 'none')}
    d = dict(n=len(res), acc_k5=round(float(acc), 3), acc_1nn=round(float(acc1), 3),
             recall_per_topic=dict(sorted(rec.items(), key=lambda x: -x[1])),
             top_confusions=[(f'{a} <> {b}', c) for (a, b), c in conf.most_common(15)], by_resp=byresp)
    print(f'--- {name}: n={d["n"]} acc@5={d["acc_k5"]} acc@1nn={d["acc_1nn"]} by_resp={byresp}')
    print('   recall', d['recall_per_topic'])
    print('   confusions', d['top_confusions'][:10])
    return d

# majority baseline: always predict the most frequent topic
maj = cnt.most_common(1)[0][0]
out['majority_baseline'] = (maj, round(float(np.mean([maj in s['ana'] for s in spans])), 3))
print('majority baseline', out['majority_baseline'], 'n spans', len(spans))
ctx, miss = span_context_matrix()
out['context_missing_fallback'] = miss
out['knn'] = {}
for name, E in (('span_text', XS), ('sentence_context', ctx)):
    for strict in (False, True):
        key = f'{name}{"_strict" if strict else ""}'
        out['knn'][key] = summarise(knn_eval(E, strict=strict), key)

# ---------- step 8: editor vs LLM
resp = np.array([s['resp'] or 'none' for s in spans])
cross = {}
for q, r in (('claude', 'np'), ('np', 'claude'), ('np', 'np'), ('claude', 'claude')):
    res = knn_eval(XS, strict=True, ref_mask=(resp == r), query_mask=(resp == q))
    cross[f'query={q} ref={r}'] = (round(float(np.mean([x['ok'] for x in res])), 3), len(res))
print('cross-group (span_text, strict):', cross)
out['cross_resp'] = cross
# topic usage by group
out['topic_share_by_resp'] = {g: {t: round(sum(1 for s in spans if (s['resp'] or 'none') == g and t in s['ana']) /
                                          max(1, sum(1 for s in spans if (s['resp'] or 'none') == g)), 3)
                                  for t in top10} for g in ('np', 'claude')}
out['span_len_words_median'] = {g: float(np.median([len(s['text'].split()) for s in spans if (s['resp'] or 'none') == g]))
                                for g in ('np', 'claude', 'none')}
print('median span length (words)', out['span_len_words_median'])
json.dump(out, open(f'{OUT}/seeded_{model}.json', 'w'), ensure_ascii=False, indent=1)
