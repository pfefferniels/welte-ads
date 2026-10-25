"""Step 8: editor (#np) vs LLM (#claude) annotation consistency, controlling for repeated copy.

usage: python 08_resp_consistency.py [mpnet|bgem3|e5]
kNN (k=5, similarity-weighted votes) over span-text embeddings. A query span may not use neighbours from the
same ad, with cos >= 0.9, or from the same firm (normalised firm name). Reference sets are size-matched
(20 random draws). Variant 'en+de': queries and references restricted to English and German ads, where both
annotators worked.
"""
import sys, json, re, collections
import numpy as np
from common import load, OUT

model = sys.argv[1] if len(sys.argv) > 1 else 'mpnet'
units, spans, XU, XS = load(model)
firm_of = {u['ad']: u['firm'] for u in json.load(open(f'{OUT}/units.json'))}
STOP = {'pianohaus', 'the', 'and', 'company', 'ltd', 'limited', 'inc', 'nachf', 'co'}


def fkey(f):
    toks = [t for t in re.findall(r'[a-zäöüåæøé]{3,}', f.lower()) if t not in STOP]
    return ' '.join(toks[:2])


firm = np.array([fkey(firm_of[s['ad']]) for s in spans])
ad = np.array([s['ad'] for s in spans])
lang = np.array([s['lang'] for s in spans])
resp = np.array([s['resp'] or 'none' for s in spans])
labels = [set(s['ana']) for s in spans]
S = XS @ XS.T
np.fill_diagonal(S, -9)


def run(query_mask, ref_mask, exclude_firm=True, k=5):
    ok = []
    for i in np.where(query_mask)[0]:
        row = S[i].copy()
        row[ad == ad[i]] = -9
        row[S[i] >= 0.9] = -9
        if exclude_firm:
            row[firm == firm[i]] = -9
        row[~ref_mask] = -9
        nb = np.argsort(-row)[:k]
        votes = collections.Counter()
        for j in nb:
            for t in labels[j]:
                votes[t] += row[j]
        ok.append(votes.most_common(1)[0][0] in labels[i])
    return float(np.mean(ok)), len(ok)


out = {}
rs = np.random.default_rng(0)
for variant, base in (('all languages', np.ones(len(spans), bool)), ('en+de only', np.isin(lang, ['en', 'de']))):
    for exf in (False, True):
        key = f'{variant}, exclude same firm={exf}'
        nref = min(int(((resp == 'np') & base).sum()), int(((resp == 'claude') & base).sum())) - 1
        d = {'n_np': int(((resp == 'np') & base).sum()), 'n_claude': int(((resp == 'claude') & base).sum()), 'nref': nref}
        for q in ('np', 'claude'):
            for r in ('np', 'claude'):
                accs = []
                for rep in range(20):
                    pool = np.where((resp == r) & base)[0]
                    m = np.zeros(len(spans), bool)
                    m[rs.choice(pool, size=nref, replace=False)] = True
                    accs.append(run((resp == q) & base, m, exclude_firm=exf)[0])
                d[f'query={q} ref={r}'] = (round(float(np.mean(accs)), 3), round(float(np.std(accs)), 3))
        out[key] = d
        print(key, d)
# span length and number of topics per span by group
out['labels_per_span'] = {g: round(float(np.mean([len(labels[i]) for i in range(len(spans)) if resp[i] == g])), 2)
                          for g in ('np', 'claude')}
out['firms_per_group'] = {g: len(set(firm[resp == g])) for g in ('np', 'claude')}
print(out['labels_per_span'], out['firms_per_group'])
json.dump(out, open(f'{OUT}/resp_consistency_{model}.json', 'w'), indent=1)
