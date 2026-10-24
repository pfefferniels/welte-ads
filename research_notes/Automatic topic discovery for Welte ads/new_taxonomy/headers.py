"""After the re-annotation: declare Claude in every ad that does not yet
do so, name the annotation of topics in its role, and record the change
in the revision history. Edits the text, so the files keep their layout."""
import glob, re, sys
CHANGE = 'Topics replaced by a new taxonomy, induced and assigned by Claude; not yet checked by the editor.'
changed = 0
for f in sorted(glob.glob('/home/user/welte-ads/tei/ad*.xml')):
    x = open(f, encoding='utf-8').read()
    y = x
    if 'xml:id="claude"' not in y:
        # after the last respStmt of the titleStmt, with its indentation
        ts = re.search(r'<titleStmt>.*?</titleStmt>', y, re.S)
        last = list(re.finditer(r'\n([ \t]*)<respStmt>.*?</respStmt>', ts.group(0), re.S))[-1]
        ind = last.group(1)
        inner = re.search(r'\n([ \t]*)<resp>', last.group(0)).group(1) if '\n' in last.group(0).strip('\n') else ind + '  '
        block = (f'\n{ind}<respStmt>\n{inner}<resp>Annotation of topics</resp>\n'
                 f'{inner}<name xml:id="claude">Claude (AI model by Anthropic)</name>\n{ind}</respStmt>')
        at = ts.start() + last.end()
        y = y[:at] + block + y[at:]
    else:
        y = re.sub(r'<resp>Further printings</resp>(\s*<name xml:id="claude">)', r'<resp>Further printings and annotation of topics</resp>\1', y)
    m = re.search(r'(<revisionDesc[^>]*>)(\n([ \t]*))', y)
    if CHANGE not in y:
        y = y[:m.end(1)] + f'{m.group(2)}<change when="2026-10-24" who="#claude">{CHANGE}</change>' + y[m.end(1):]
    if y != x:
        open(f, 'w', encoding='utf-8').write(y); changed += 1
print('changed', changed)
