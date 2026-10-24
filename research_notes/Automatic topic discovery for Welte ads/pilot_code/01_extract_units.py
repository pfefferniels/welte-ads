"""Step 1: sentence/clause-level units from the Welte TEI files, with topic-span overlap.

Reads   tei/ad*.xml and tei/shared/encoding.xml (read-only)
Writes  $OUT/units.json   one record per unit (sentence/clause of body text, or figure description)
        $OUT/spans.json   one record per topic span (seg/figure with @ana), with its dehyphenated text
        $OUT/taxonomy.json

How the text is built
- Only <text>/<body> is read. Skipped: <note>, <gap> (and its <desc>), every <rdg> of an <app>
  except the first, and <figure> (figure descriptions become separate units of kind "fig").
- Block elements (div, head, p, ab, item, list, signed, address, lg, figure, gap, ...) are hard
  boundaries: no unit crosses them. <lb/>, <addrLine>, <l>, <cb/>, <pb/> are soft line breaks.
- Every character carries the set of topic spans (elements with @ana) that contain it, so the
  overlap of a unit with a span is known exactly after normalisation.
- Dehyphenation at <lb/>: "re-" + lb + "mains" -> "remains" unless the hyphenated form is attested
  elsewhere in the corpus (and the joined one is not), or the next word starts with a capital
  and the joined form is not attested (e.g. "Welte-" lb "Mignon" stays "Welte-Mignon").
- Sentence split at . ! ? ... (incl. ". . . .") followed by whitespace, except after common
  abbreviations, single-letter initials and bare numbers; units longer than MAXW words are further
  split at ";", ":" or dashes ("clause level").
- Units with fewer than MINW words (tokens containing a letter) are flagged short=True.
"""
import glob, json, os, re, sys, collections
from lxml import etree

REPO = '/home/user/welte-ads'
OUT = os.environ.get('OUT', '/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/pilot')
os.makedirs(OUT, exist_ok=True)
TEI = '{http://www.tei-c.org/ns/1.0}'
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
MINW = 4      # minimum number of words for a unit to be kept
MAXW = 45     # longer units are split at ; : — (clause level)

BLOCK = {'div', 'head', 'p', 'ab', 'item', 'list', 'signed', 'address', 'lg', 'table', 'row',
         'cell', 'label', 'floatingText', 'trailer', 'byline', 'dateline', 'closer', 'opener'}
SOFT = {'lb', 'addrLine', 'l', 'cb', 'pb'}
SKIP = {'note', 'gap', 'desc', 'figDesc', 'fw'}
LB = '\x01'


def ln(e):
    return etree.QName(e).localname if isinstance(e.tag, str) else None


def stream(body, span_ids):
    """Yield ('t', text, spans) | ('lb',) | ('brk',) in document order."""
    out = []

    def walk(e, stack):
        tag = ln(e)
        if tag is None:  # comment / PI
            return
        if tag in SKIP:
            if tag == 'gap':
                out.append(('brk',))
            return
        if tag == 'rdg':
            app = e.getparent()
            rdgs = [c for c in app if ln(c) == 'rdg']
            if rdgs and rdgs[0] is not e:
                return
        if tag == 'figure':
            out.append(('brk',))
            # a printed caption (<head>) inside a figure is body text
            for c in e:
                if ln(c) == 'head':
                    walk(c, stack)
                    out.append(('brk',))
            return
        if tag in BLOCK:
            out.append(('brk',))
        if tag in SOFT:
            out.append(('lb',))
        if tag == 'space':
            out.append(('t', ' ', stack))
        if e.get('ana') is not None and id(e) in span_ids:
            stack = stack | {span_ids[id(e)]}
        if e.text:
            out.append(('t', e.text, stack))
        for c in e:
            walk(c, stack)
            if c.tail:
                out.append(('t', c.tail, stack))
        if tag in BLOCK:
            out.append(('brk',))

    walk(body, frozenset())
    return out


def blocks_from_stream(st):
    """List of blocks; each block = list of (char, spans) with LB markers, raw whitespace -> ' '."""
    blocks, cur = [], []
    for item in st:
        if item[0] == 'brk':
            if cur:
                blocks.append(cur)
            cur = []
        elif item[0] == 'lb':
            cur.append((LB, frozenset()))
        else:
            for ch in item[1]:
                cur.append((' ' if ch.isspace() else ch, item[2]))
    if cur:
        blocks.append(cur)
    return blocks


WORDCH = re.compile(r"[^\W\d_]", re.U)


def normalise(block, vocab, hyph_log):
    """Remove line-break hyphens, collapse whitespace; keep char->spans mapping."""
    n = len(block)
    out = []
    i = 0
    while i < n:
        ch, sp = block[i]
        if ch == '-' and out and WORDCH.match(out[-1][0]):
            # look ahead: spaces, then LB, then spaces, then a letter?
            j = i + 1
            while j < n and block[j][0] == ' ':
                j += 1
            if j < n and block[j][0] == LB:
                k = j + 1
                while k < n and block[k][0] in (' ', LB):
                    k += 1
                if k < n and WORDCH.match(block[k][0]):
                    # word before / after
                    b = ''.join(c for c, _ in reversed(out))
                    before = re.match(r"[^\W\d_]+", b).group(0)[::-1]
                    a = ''.join(c for c, _ in block[k:k + 40])
                    after = re.match(r"[^\W\d_]+", a).group(0)
                    joined, hyph = (before + after).lower(), (before + '-' + after).lower()
                    caps = before.isupper() and after.isupper()
                    if hyph in vocab and joined not in vocab:
                        keep = True
                    elif after[0].isupper() and not caps:
                        keep = True     # German/English compound: "Klavier-" lb "Abteilung"
                    elif joined in vocab:
                        keep = False
                    elif caps:          # line set in capitals: keep only if both halves are words
                        keep = (before.lower() in vocab and after.lower() in vocab and len(after) >= 5)
                    else:
                        keep = False
                    hyph_log[(before + '-' + after, 'keep' if keep else 'join')] += 1
                    if keep:
                        out.append((ch, sp))
                    i = k
                    continue
        if ch == LB or ch == ' ':
            if out and out[-1][0] != ' ':
                out.append((' ', sp if ch == ' ' else frozenset()))
            i += 1
            continue
        out.append((ch, sp))
        i += 1
    while out and out[-1][0] == ' ':
        out.pop()
    while out and out[0][0] == ' ':
        out.pop(0)
    return out


ABBR = set('''mr mrs messrs dr st co nr no inc ltd jr sr u z b etc vgl ca prof hr fr sig sra srta dn ul al kr
frs cie cía mme mlle ave sq pl tel telef telf op jun dpto pta dir vorm gebr ges str m s p h a e d f g c n j k l
r t v w y o i nachf cia vda hnos av esq bros dept mfg fa fu tlf adr ny resp bzw usw evtl ev bd tlg kl int sen
wilh chr joh jos jul heinr th ph ed ch alb aug gust wm geo chas jas'''.split())
SENT_END = re.compile(r'[.!?…](?:\s?[.!?…])*["”»’\')]*(?=\s)')


def split_sentences(chars):
    s = ''.join(c for c, _ in chars)
    cuts = [0]
    for m in SENT_END.finditer(s):
        end = m.end()
        prev = re.search(r"(\S+)$", s[:m.start()])
        prevtok = prev.group(1) if prev else ''
        nxt = re.match(r"\s+(\S)", s[end:])
        if not nxt:
            continue
        nch = nxt.group(1)
        punct = s[m.start():m.end()]
        if punct.startswith('.') and len(punct.strip('"”»’\')')) == 1:
            core = re.sub(r"[^\w]", '', prevtok).lower()
            if core in ABBR or re.fullmatch(r"\d+", core or 'x') or (len(core) == 1):
                continue
            if nch.islower():  # "etc. and", "Co. of" ...
                continue
        cuts.append(end)
    cuts.append(len(s))
    pieces = []
    for a, b in zip(cuts, cuts[1:]):
        seg = chars[a:b]
        while seg and seg[0][0] == ' ':
            seg = seg[1:]
        while seg and seg[-1][0] == ' ':
            seg = seg[:-1]
        if seg:
            pieces.extend(split_long(seg))
    return pieces


def nwords(s):
    return sum(1 for t in s.split() if WORDCH.search(t))


def split_long(seg):
    s = ''.join(c for c, _ in seg)
    if nwords(s) <= MAXW:
        return [seg]
    # candidate clause cut points
    cands = [m.end() for m in re.finditer(r'(?:;|:|\s[—–]|—)\s', s)]
    cands = [c for c in cands if nwords(s[:c]) >= MINW and nwords(s[c:]) >= MINW]
    if not cands:
        return [seg]
    mid = len(s) / 2
    c = min(cands, key=lambda x: abs(x - mid))
    left, right = seg[:c], seg[c:]
    while right and right[0][0] == ' ':
        right = right[1:]
    while left and left[-1][0] == ' ':
        left = left[:-1]
    return split_long(left) + split_long(right)


def main():
    files = sorted(glob.glob(f'{REPO}/tei/ad*.xml'))
    # taxonomy
    enc = etree.parse(f'{REPO}/tei/shared/encoding.xml')
    tax = {}
    for c in enc.xpath('//t:taxonomy[@xml:id="topics"]//t:category', namespaces=NS):
        cid = c.get('{http://www.w3.org/XML/1998/namespace}id')
        gloss = ' '.join(''.join(c.xpath('.//t:gloss//text()', namespaces=NS)).split())
        desc = ' '.join(''.join(c.xpath('.//t:desc//text()', namespaces=NS)).split())
        tax[cid] = dict(gloss=gloss, desc=desc)
    json.dump(tax, open(f'{OUT}/taxonomy.json', 'w'), ensure_ascii=False, indent=1)

    docs = []
    for f in files:
        d = etree.parse(f)
        ad = os.path.basename(f)[:-4]
        meta = dict(
            ad=ad,
            lang=d.xpath('string(//t:langUsage/t:language/@ident)', namespaces=NS),
            date=d.xpath('string((//t:sourceDesc//t:date[@type="publication"]/@when)[1])', namespaces=NS),
            status=d.xpath('string(//t:revisionDesc/@status)', namespaces=NS),
            firm=d.xpath('normalize-space(//t:titleStmt/t:author)', namespaces=NS),
        )
        meta['year'] = int(meta['date'][:4])
        body = d.xpath('//t:text/t:body', namespaces=NS)[0]
        span_ids, spans = {}, []
        for e in body.xpath('.//*[@ana]'):
            ana = [a.lstrip('#') for a in e.get('ana').split() if a.lstrip('#') in tax]
            if not ana:
                continue
            sid = f'{ad}#{len(spans)}'
            span_ids[id(e)] = sid
            spans.append(dict(sid=sid, ad=ad, tag=ln(e), ana=ana, resp=(e.get('resp') or '').lstrip('#') or None,
                              elem=e))
        docs.append((meta, body, span_ids, spans))

    # vocabulary for dehyphenation: tokens of text with <lb/> read as a space
    vocab = collections.Counter()
    for meta, body, span_ids, spans in docs:
        st = stream(body, span_ids)
        txt = ''.join(x[1] if x[0] == 't' else (LB if x[0] == 'lb' else ' ') for x in st)
        # drop the two halves of words broken at a line end, so they do not count as attested words
        txt = re.sub(r"[^\W\d_]+-\s*" + LB + r"\s*[^\W\d_]+", ' ', txt)
        for t in re.findall(r"[^\W\d_]+(?:-[^\W\d_]+)*", txt):
            vocab[t.lower()] += 1
            for part in t.split('-'):
                vocab[part.lower()] += 1

    hyph_log = collections.Counter()
    units, span_out = [], []
    for meta, body, span_ids, spans in docs:
        st = stream(body, span_ids)
        blocks = [normalise(b, vocab, hyph_log) for b in blocks_from_stream(st)]
        blocks = [b for b in blocks if b]
        span_chars = collections.defaultdict(list)
        span_len = collections.Counter()
        ui = 0
        for bi, b in enumerate(blocks):
            for c, sp in b:
                for s in sp:
                    span_chars[s].append(c)
                    if c != ' ':
                        span_len[s] += 1
            for piece in split_sentences(b):
                text = ''.join(c for c, _ in piece)
                ov = collections.Counter()
                for c, sp in piece:
                    if c != ' ':
                        for s in sp:
                            ov[s] += 1
                nchar = sum(1 for c, _ in piece if c != ' ')
                units.append(dict(uid=f'{meta["ad"]}.{ui}', kind='text', block=bi, text=text,
                                  nwords=nwords(text), nchar=nchar,
                                  span_overlap={s: v for s, v in ov.items()}, **meta))
                ui += 1
        # figure descriptions as units
        # (one <desc> in ad024 sits directly in a <seg> instead of a <figure>: treated like a figure)
        figs = body.xpath('.//t:figure | .//t:seg[t:desc]', namespaces=NS)
        for fi, fig in enumerate(figs):
            desc = ' '.join(' '.join(x.itertext()) for x in fig.xpath('t:desc', namespaces=NS))
            desc = re.sub(r'\s+', ' ', desc).strip()
            if not desc:
                continue
            # topics of the figure itself and of any @ana ancestor (e.g. <seg ana=".."><figure>)
            sids = [span_ids[id(x)] for x in [fig] + list(fig.iterancestors()) if id(x) in span_ids]
            nc = len(desc.replace(' ', ''))
            units.append(dict(uid=f'{meta["ad"]}.f{fi}', kind='fig', block=-1, text=desc, nwords=nwords(desc),
                              nchar=nc, span_overlap={sid: nc for sid in sids}, **meta))
        for s in spans:
            e = s.pop('elem')
            if s['tag'] == 'figure':
                txt = re.sub(r'\s+', ' ', ' '.join(' '.join(x.itertext()) for x in e.xpath('t:desc', namespaces=NS))).strip()
            else:
                txt = ''.join(span_chars[s['sid']]).strip()
                txt = re.sub(r'\s+', ' ', txt)
                if not txt and e.xpath('.//t:figure | t:desc', namespaces=NS):   # seg that wraps only a figure
                    txt = re.sub(r'\s+', ' ', ' '.join(' '.join(x.itertext()) for x in e.xpath('.//t:figure/t:desc | t:desc', namespaces=NS))).strip()
                    s['tag'] = 'seg>figure'
                elif not txt:   # span inside a non-first <rdg> (not part of the transcribed reading)
                    s['tag'] = 'seg(in variant rdg)'
                    txt = re.sub(r'\s+', ' ', ' '.join(e.itertext())).strip()
            s['text'] = txt
            s['nchar'] = span_len[s['sid']] if s['tag'] == 'seg' else len(txt.replace(' ', ''))
            s.update({k: meta[k] for k in ('lang', 'date', 'year', 'status')})
            span_out.append(s)

    span_by_id = {s['sid']: s for s in span_out}
    for u in units:
        tops = collections.Counter()
        for sid, v in u['span_overlap'].items():
            for a in span_by_id[sid]['ana']:
                tops[a] += v
        u['topics'] = sorted(tops, key=lambda a: -tops[a])          # all overlapping topics
        u['topic_chars'] = dict(tops)
        u['main_topic'] = u['topics'][0] if u['topics'] else None  # topic covering most chars
        u['resps'] = sorted({span_by_id[s]['resp'] or 'none' for s in u['span_overlap']})
        u['short'] = u['nwords'] < MINW
    json.dump(units, open(f'{OUT}/units.json', 'w'), ensure_ascii=False, indent=0)
    json.dump(span_out, open(f'{OUT}/spans.json', 'w'), ensure_ascii=False, indent=0)
    json.dump({f'{k[0]}\t{k[1]}': v for k, v in hyph_log.items()}, open(f'{OUT}/hyphenation_log.json', 'w'),
              ensure_ascii=False, indent=0)

    # ---- report
    T = [u for u in units if u['kind'] == 'text']
    F = [u for u in units if u['kind'] == 'fig']
    keep = [u for u in T if not u['short']]
    print('ads', len(docs), 'spans', len(span_out), 'text units', len(T), 'kept', len(keep), 'short', len(T) - len(keep),
          'fig units', len(F))
    print('short units words total', sum(u['nwords'] for u in T if u['short']),
          'of', sum(u['nwords'] for u in T))
    import statistics
    print('kept unit words median', statistics.median(u['nwords'] for u in keep), 'max', max(u['nwords'] for u in keep))
    print('kept units with topic', sum(1 for u in keep if u['topics']), 'fig units with topic', sum(1 for u in F if u['topics']))
    print('hyphen decisions', collections.Counter(k[1] for k in hyph_log.elements()))
    print('kept units per lang', collections.Counter(u['lang'] for u in keep).most_common())
    cov = collections.Counter()
    for s in span_out:
        cov['in_kept' if any(s['sid'] in u['span_overlap'] for u in keep + F) else 'only_short'] += 1
    print('spans covered by kept units', cov)


if __name__ == '__main__':
    main()
