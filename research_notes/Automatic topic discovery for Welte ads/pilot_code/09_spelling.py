"""Historical spelling check: real corpus sentences vs. hand-modernised versions (and an English gloss).

usage: python 09_spelling.py
For each model: cos(historical, modern), cos(historical, English), cos(modern, English), and subword tokens
per word for the historical vs modern version (XLM-R tokenizer shared by mpnet / e5 / bge-m3).
"""
import json, os
import numpy as np
os.environ.setdefault('HF_HOME', '/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/hf_cache')
from sentence_transformers import SentenceTransformer
from common import OUT

# (unit id, historical text as transcribed, modernised by hand, English gloss)
PAIRS = [
    ('ad122.3', 'съ полной иллюзіей ихъ личной игры можно слышать въ передачѣ',
     'с полной иллюзией их личной игры можно слышать в передаче',
     'with the full illusion of their personal playing one can hear in the reproduction'),
    ('ad122.5', 'Единственный инструментъ, играющій полнымъ объемомъ клавіатуры.',
     'Единственный инструмент, играющий полным объёмом клавиатуры.',
     'The only instrument that plays with the full compass of the keyboard.'),
    ('ad088.6', 'Man maa kun beklage at denne Opfindelse ikke allerede blev gjort tidligere; thi da kunde vi endnu den Dag i Dag høre Beethoven, Mozart og Chopin selv spille.',
     'Man må kun beklage, at denne opfindelse ikke allerede blev gjort tidligere; thi da kunne vi endnu den dag i dag høre Beethoven, Mozart og Chopin selv spille.',
     'One can only regret that this invention was not made earlier, for then we could still hear Beethoven, Mozart and Chopin play themselves today.'),
    ('ad099.6', 'Vore Priser er de billigste, vore Betalingsvilkaar yderst kulante og vor Garanti den mest betryggende',
     'Vores priser er de billigste, vores betalingsvilkår yderst kulante og vores garanti den mest betryggende',
     'Our prices are the lowest, our terms of payment most accommodating and our guarantee the most reassuring'),
    ('ad150.1', 'är världens erkändt bästa själfsp. pianino.',
     'är världens erkänt bästa självspelande piano.',
     'is the world\'s acknowledged best self-playing piano.'),
    ('ad082.8', 'The Welte-Mignon faaes i følgende utførelser:',
     'The Welte-Mignon fås i følgende utførelser:',
     'The Welte-Mignon is available in the following models:'),
    ('ad009.4', 'Ueber die blosse Fingerfertigkeit vermag dieses Wunderklavier alles, was an der Leistung eines Künstlers das Persönliche und Charakteristische ausmacht, zur Geltung zu bringen',
     'Über die bloße Fingerfertigkeit hinaus vermag dieses Wunderklavier alles, was an der Leistung eines Künstlers das Persönliche und Charakteristische ausmacht, zur Geltung zu bringen',
     'Beyond mere dexterity, this wonder piano can bring out everything that makes up the personal and characteristic in an artist\'s performance'),
    ('ad049.11', 'Belangstellenden worden beleefdelijk uitgenoodigd.',
     'Belangstellenden worden beleefd uitgenodigd.',
     'Interested persons are kindly invited.'),
]


def main():
    U = {u['uid']: u for u in json.load(open(f'{OUT}/units.json'))}
    res = {}
    for key, name in (('mpnet', 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2'),
                      ('bgem3', 'BAAI/bge-m3'), ('labse', 'sentence-transformers/LaBSE')):
        m = SentenceTransformer(name, device='cpu')
        rows = []
        for uid, h, mo, en in PAIRS:
            assert h[:20] in U[uid]['text'], (uid, U[uid]['text'][:80])
            E = m.encode([h, mo, en], normalize_embeddings=True)
            th = len(m.tokenizer.tokenize(h)) / len(h.split())
            tm = len(m.tokenizer.tokenize(mo)) / len(mo.split())
            rows.append(dict(uid=uid, lang=U[uid]['lang'], cos_hist_mod=round(float(E[0] @ E[1]), 3),
                             cos_hist_en=round(float(E[0] @ E[2]), 3), cos_mod_en=round(float(E[1] @ E[2]), 3),
                             tok_per_word_hist=round(th, 2), tok_per_word_mod=round(tm, 2)))
        res[key] = rows
        print(key)
        for r in rows:
            print('  ', r)
        print('   mean cos(hist,en)=%.3f  mean cos(mod,en)=%.3f' % (np.mean([r['cos_hist_en'] for r in rows]),
                                                                np.mean([r['cos_mod_en'] for r in rows])))
    json.dump(res, open(f'{OUT}/spelling.json', 'w'), indent=1, ensure_ascii=False)


if __name__ == '__main__':
    main()
