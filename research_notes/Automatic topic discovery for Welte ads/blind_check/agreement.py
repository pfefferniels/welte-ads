"""Agreement between the editor's blind coding and Claude's annotation.

Usage: python3 agreement.py CODES_DIR
CODES_DIR holds the editor's answers as saved by the blind-check page and
read back with ArtifactData (out_dir), one JSON file per ad under
codes/<ad>.json with fields topics, note, done. Claude's topics per ad are
read from the TEI files. Prints Cohen's kappa per topic over the ads that
the editor marked done, and the overall agreement on ad-topic pairs.
"""
import sys, json, glob, os, collections
from lxml import etree
REPO = '/home/user/welte-ads'
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
enc = etree.parse(f'{REPO}/tei/shared/encoding.xml')
TOPICS = enc.xpath('//t:taxonomy[@xml:id="topics"]/t:category/@xml:id', namespaces=NS)
LABEL = {c.get('{http://www.w3.org/XML/1998/namespace}id'): c.findtext('t:gloss', namespaces=NS) for c in enc.xpath('//t:taxonomy/t:category', namespaces=NS)}
editor = {}
for f in glob.glob(os.path.join(sys.argv[1], '**', '*.json'), recursive=True):
    d = json.load(open(f))
    d = d.get('data', d)
    if d.get('done'): editor[os.path.basename(f)[:-5]] = set(d.get('topics', []))
claude = {}
for ad in editor:
    doc = etree.parse(f'{REPO}/tei/{ad}.xml')
    claude[ad] = {p[1:] for e in doc.xpath('//t:text//*[@ana]', namespaces=NS) for p in e.get('ana').split()}
n = len(editor)
print(f'{n} ads coded by the editor\n')
def kappa(a, b):
    po = sum(x == y for x, y in zip(a, b)) / len(a)
    pa, pb = sum(a) / len(a), sum(b) / len(b)
    pe = pa * pb + (1 - pa) * (1 - pb)
    return None if pe == 1 else (po - pe) / (1 - pe)
rows = []
for t in TOPICS:
    a = [t in editor[ad] for ad in editor]; b = [t in claude[ad] for ad in editor]
    if not any(a) and not any(b): continue
    k = kappa(a, b)
    both = sum(x and y for x, y in zip(a, b))
    rows.append((t, sum(a), sum(b), both, k))
print(f'{"topic":34} editor claude both  kappa')
for t, ea, cb, both, k in sorted(rows, key=lambda r: (r[4] is None, -(r[4] or 0))):
    print(f'{LABEL[t][:34]:34} {ea:6} {cb:6} {both:4}  {"–" if k is None else f"{k:5.2f}"}')
pairs_e = {(ad, t) for ad in editor for t in editor[ad]}; pairs_c = {(ad, t) for ad in editor for t in claude[ad]}
inter = len(pairs_e & pairs_c)
print(f'\nad–topic pairs: editor {len(pairs_e)}, Claude {len(pairs_c)}, both {inter}; '
      f'precision of Claude against the editor {inter / max(1, len(pairs_c)):.2f}, recall {inter / max(1, len(pairs_e)):.2f}')
ks = [r[4] for r in rows if r[4] is not None]
print(f'mean kappa over {len(ks)} topics: {sum(ks) / len(ks):.2f}' if ks else '')
