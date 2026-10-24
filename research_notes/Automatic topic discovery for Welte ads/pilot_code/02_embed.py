"""Step 2: embed units (kept text units + figure descriptions) and topic spans.

usage: python 02_embed.py mpnet|e5|bgem3
Writes $OUT/emb_<model>_units.npy, emb_<model>_spans.npy (L2-normalised), and items_units.json/items_spans.json
(the row order). Models are cached in $HF_HOME (scratchpad).
"""
import json, os, sys, time
import numpy as np

OUT = os.environ.get('OUT', '/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/pilot')
os.environ.setdefault('HF_HOME', '/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/hf_cache')
from sentence_transformers import SentenceTransformer
import torch

MODELS = {
    'mpnet': ('sentence-transformers/paraphrase-multilingual-mpnet-base-v2', ''),
    'e5': ('intfloat/multilingual-e5-base', 'query: '),   # symmetric use: "query: " on both sides
    'bgem3': ('BAAI/bge-m3', ''),                          # dense vectors only
}


def items():
    U = json.load(open(f'{OUT}/units.json'))
    S = json.load(open(f'{OUT}/spans.json'))
    units = [u for u in U if (u['kind'] == 'fig' or not u['short'])]
    spans = [s for s in S if s['text'] and s['tag'] != 'seg(in variant rdg)']
    json.dump([u['uid'] for u in units], open(f'{OUT}/items_units.json', 'w'))
    json.dump([s['sid'] for s in spans], open(f'{OUT}/items_spans.json', 'w'))
    return units, spans


def main(key):
    name, prefix = MODELS[key]
    torch.manual_seed(0)
    torch.set_num_threads(4)
    units, spans = items()
    t0 = time.time()
    m = SentenceTransformer(name, device='cpu')
    m.max_seq_length = 256
    print(key, name, 'loaded in %.0fs' % (time.time() - t0), 'max_seq_length', m.max_seq_length)
    for what, rows in (('units', units), ('spans', spans)):
        t0 = time.time()
        X = m.encode([prefix + r['text'] for r in rows], batch_size=16, normalize_embeddings=True,
                     show_progress_bar=False, convert_to_numpy=True)
        np.save(f'{OUT}/emb_{key}_{what}.npy', X.astype(np.float32))
        print(what, X.shape, '%.0fs' % (time.time() - t0))
    # tokenizer fragmentation per language (subword tokens per word) - for the historical spelling note
    tok = m.tokenizer
    import collections
    stat = collections.defaultdict(lambda: [0, 0])
    for u in units:
        if u['kind'] != 'text':
            continue
        n = len(tok.tokenize(u['text']))
        stat[u['lang']][0] += n
        stat[u['lang']][1] += len(u['text'].split())
    json.dump({k: v[0] / v[1] for k, v in stat.items()}, open(f'{OUT}/fragmentation_{key}.json', 'w'), indent=1)
    print({k: round(v[0] / v[1], 2) for k, v in sorted(stat.items())})


if __name__ == '__main__':
    main(sys.argv[1])
