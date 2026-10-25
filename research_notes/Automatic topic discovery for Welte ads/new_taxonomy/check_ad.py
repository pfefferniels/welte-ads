"""Check a re-annotated advertisement: python3 check_ad.py tei/ad009.xml [...]

- the text of <text> is unchanged against the last commit (only tags added
  or removed around it);
- every @ana points to a topic of the new taxonomy in tei/shared/encoding.xml;
- every topic <seg> has a unique xml:id topic_N, type="topic", resp="#claude";
  every <figure> with @ana has an xml:id and resp="#claude";
- no xml:id names other words than it did before (a kept topic_N may change
  its topics but not its text);
- the file is valid against the project schema.
"""
import sys, re, subprocess
from lxml import etree
REPO = '/home/user/welte-ads'
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
XID = '{http://www.w3.org/XML/1998/namespace}id'
enc = etree.parse(f'{REPO}/tei/shared/encoding.xml')
TOPICS = set(enc.xpath('//t:taxonomy[@xml:id="topics"]/t:category/@xml:id', namespaces=NS))
norm = lambda s: re.sub(r'\s+', ' ', s).strip()
ok = True
for path in sys.argv[1:]:
    rel = path.split(REPO + '/')[-1]
    problems = []
    new = etree.parse(path)
    old_xml = subprocess.run(['git', '-C', REPO, 'show', f'HEAD:{rel}'], capture_output=True).stdout
    old = etree.fromstring(old_xml)
    t_new = new.xpath('//t:text', namespaces=NS)[0]; t_old = old.xpath('//t:text', namespaces=NS)[0]
    if norm(''.join(t_new.itertext())) != norm(''.join(t_old.itertext())):
        a, b = norm(''.join(t_old.itertext())), norm(''.join(t_new.itertext()))
        i = next((i for i in range(min(len(a), len(b))) if a[i] != b[i]), min(len(a), len(b)))
        problems.append(f'text changed near: …{a[max(0,i-40):i+40]}… → …{b[max(0,i-40):i+40]}…')
    # every element other than seg/figure attributes should be as before: compare tag sequence without topic segs
    def skeleton(t):
        out = []
        for e in t.iter():
            if not isinstance(e.tag, str): continue
            if e.tag.endswith('}seg') and (e.get('type') == 'topic' or e.get('ana') is not None): continue
            attrs = {k: v for k, v in e.attrib.items() if not (e.tag.endswith('}figure') and k in ('ana', 'resp', XID))}
            out.append((e.tag, tuple(sorted(attrs.items()))))
        return out
    if skeleton(t_new) != skeleton(t_old):
        problems.append('elements or attributes other than topic segs (and @ana/@resp/@xml:id on figures) changed')
    ids = {}
    for e in t_new.xpath('.//*[@ana]', namespaces=NS):
        name = etree.QName(e).localname
        for p in e.get('ana').split():
            if not p.startswith('#') or p[1:] not in TOPICS: problems.append(f'unknown topic {p} on {name} {e.get(XID)}')
        if name == 'seg':
            if e.get('type') != 'topic': problems.append(f'seg {e.get(XID)} with @ana lacks type="topic"')
            if not re.fullmatch(r'topic_\d+', e.get(XID) or ''): problems.append(f'seg with @ana has xml:id {e.get(XID)!r}, not topic_N')
        elif name == 'figure':
            if not e.get(XID): problems.append('figure with @ana lacks xml:id')
        else:
            problems.append(f'@ana on <{name}>; only seg and figure carry topics')
        if e.get('resp') != '#claude': problems.append(f'{name} {e.get(XID)} has resp {e.get("resp")!r}, not "#claude"')
    for e in t_new.xpath('.//t:seg[@type="topic"]', namespaces=NS):
        if not e.get('ana'): problems.append(f'topic seg {e.get(XID)} without @ana: unwrap it instead')
        for anc in e.iterancestors():
            if etree.QName(anc).localname in ('note', 'desc', 'gap'): problems.append(f'topic seg {e.get(XID)} inside <{etree.QName(anc).localname}>')
    allids = new.xpath('//@xml:id')
    dup = {i for i in allids if allids.count(i) > 1}
    if dup: problems.append(f'duplicate xml:id {sorted(dup)}')
    old_ids = {e.get(XID): norm(''.join(e.itertext())) for e in t_old.xpath('.//t:seg[@type="topic" or @ana]', namespaces=NS)}
    for e in t_new.xpath('.//t:seg[@type="topic"]', namespaces=NS):
        i = e.get(XID)
        if i in old_ids and old_ids[i] != norm(''.join(e.itertext())):
            problems.append(f'{i} now names other words than before; give the new span a new number')
    v = subprocess.run(['xmllint', '--noout', '--relaxng', f'{REPO}/tei/schema/welte-ads.rng', path], capture_output=True, text=True)
    if v.returncode: problems.append('schema: ' + v.stderr.strip().splitlines()[0])
    topics = sorted({p[1:] for e in t_new.xpath('.//*[@ana]', namespaces=NS) for p in e.get('ana').split()})
    print(f'{rel}: ' + ('OK' if not problems else 'PROBLEMS') + f'  topics: {" ".join(topics)}')
    for p in problems: print('   - ' + p)
    ok &= not problems
sys.exit(0 if ok else 1)
