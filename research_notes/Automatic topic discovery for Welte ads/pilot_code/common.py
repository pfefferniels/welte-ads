"""Shared helpers for the pilot scripts."""
import json, os, re, collections
import numpy as np

OUT = os.environ.get('OUT', '/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/pilot')


def load(model='mpnet'):
    U = {u['uid']: u for u in json.load(open(f'{OUT}/units.json'))}
    S = {s['sid']: s for s in json.load(open(f'{OUT}/spans.json'))}
    uids = json.load(open(f'{OUT}/items_units.json'))
    sids = json.load(open(f'{OUT}/items_spans.json'))
    XU = np.load(f'{OUT}/emb_{model}_units.npy')
    XS = np.load(f'{OUT}/emb_{model}_spans.npy')
    units = [U[i] for i in uids]
    spans = [S[i] for i in sids]
    return units, spans, XU, XS


def stopwords():
    from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
    from stop_words import get_stop_words
    sw = set(ENGLISH_STOP_WORDS)
    for l in ['german', 'dutch', 'spanish', 'swedish', 'danish', 'norwegian', 'french', 'polish', 'portuguese',
              'russian', 'catalan']:
        sw |= set(get_stop_words(l))
    # historical Scandinavian / Dutch / German spellings and very frequent function words not in the lists
    sw |= set('''paa naar saa hvad af ogsaa aar zoo dezen eene eener desen thun ihres ihren seyn
    ved vore vor hvor bliver blive kun kunne will may one ones also every new us yet'''.split())
    return sw


TOKEN = r"(?u)\b[^\W\d_][^\W\d_'’-]{2,}\b"


def ctfidf(docs, labels, top=10, sw=None):
    """BERTopic-style class-based TF-IDF: W_tc = tf_tc / sum_t tf_tc * log(1 + A / f_t)."""
    from sklearn.feature_extraction.text import CountVectorizer
    sw = sw if sw is not None else stopwords()
    labs = sorted(set(labels))
    joined = [' '.join(d for d, l in zip(docs, labels) if l == c) for c in labs]
    cv = CountVectorizer(token_pattern=TOKEN, lowercase=True, stop_words=list(sw), min_df=1)
    M = cv.fit_transform(joined).toarray().astype(float)
    vocab = np.array(cv.get_feature_names_out())
    tf = M / np.maximum(M.sum(1, keepdims=True), 1)
    A = M.sum() / len(labs)
    idf = np.log(1 + A / np.maximum(M.sum(0), 1))
    W = tf * idf
    return {c: list(vocab[np.argsort(-W[i])[:top]]) for i, c in enumerate(labs)}


def representatives(X, idx, n=5, diverse_ads=True, units=None):
    """Members closest to the cluster centroid; at most one per ad if diverse_ads."""
    c = X[idx].mean(0)
    c /= np.linalg.norm(c)
    order = [idx[j] for j in np.argsort(-(X[idx] @ c))]
    out, seen = [], set()
    for i in order:
        ad = units[i]['ad'] if units is not None else None
        if diverse_ads and ad in seen:
            continue
        seen.add(ad)
        out.append(i)
        if len(out) == n:
            break
    return out


def period(year):
    return 'early' if year <= 1914 else 'late'
