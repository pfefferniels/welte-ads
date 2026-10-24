"""Match the topics of four blind runs by the ads they were assigned to.

Run 1 is the pilot (coding_final.json, rules from its stage 1 notes);
runs 2-4 wrote runs/runN/topics.json. For every topic of every run, find
its best match in each other run (Jaccard of ad sets, and containment for
topics that one run splits and another merges). Then group topics that
match each other across runs and report in how many runs each group
recurs.
"""
import json, re, itertools, collections, sys
SP = '/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/'
RN = '/home/user/welte-ads/research_notes/Automatic topic discovery for Welte ads/'
topics = []  # (run, code, label, rule, ads)
code = json.load(open(SP + 'coding_final.json'))
st1 = open(RN + 'pilot_llm_induction_stage1.md').read()
rules = {m.group(1): m.group(2).strip() for m in re.finditer(r'\*\*([A-J]\d) [^*]+\*\* \([^)]*\)\.\s*\*Rule:\*\s*(.+?)\n', st1)}
for k, v in code.items():
    c, lab = k.split(' ', 1)
    topics.append(dict(run=1, code=c, label=lab, rule=rules.get(c, ''), ads=set(v)))
for r in (2, 3, 4):
    try:
        d = json.load(open(f'{SP}runs/run{r}/topics.json'))
    except FileNotFoundError:
        print('run', r, 'missing', file=sys.stderr); continue
    for t in d['topics']:
        topics.append(dict(run=r, code=t['code'], label=t['label'], rule=t.get('rule', ''), ads=set(t['ads'])))
runs = sorted({t['run'] for t in topics})
J = lambda a, b: len(a & b) / len(a | b) if a | b else 0
C = lambda a, b: len(a & b) / min(len(a), len(b)) if a and b else 0
for t in topics:
    t['best'] = {}
    for r in runs:
        if r == t['run']: continue
        cands = [u for u in topics if u['run'] == r]
        u = max(cands, key=lambda u: J(t['ads'], u['ads']))
        t['best'][r] = (u['code'], round(J(t['ads'], u['ads']), 2), round(C(t['ads'], u['ads']), 2))
# groups: run-1 topics as anchors, plus mutual best matches from other runs
def key(t): return (t['run'], t['code'])
byk = {key(t): t for t in topics}
out = []
for t in [t for t in topics if t['run'] == 1]:
    row = dict(code=t['code'], label=t['label'], n=len(t['ads']), matches={})
    for r, (c, j, cont) in t['best'].items():
        u = byk[(r, c)]
        mutual = u['best'][1][0] == t['code']
        row['matches'][r] = dict(code=c, label=u['label'], n=len(u['ads']), J=j, contain=cont, mutual=mutual)
    row['recur'] = 1 + sum(1 for m in row['matches'].values() if m['J'] >= 0.4 or (m['contain'] >= 0.8 and m['mutual']))
    out.append(row)
# topics in other runs that no run-1 topic claims
orphans = []
for t in topics:
    if t['run'] == 1: continue
    c, j, cont = t['best'][1]
    if j < 0.4 and not (cont >= 0.8 and byk[(1, c)]['best'][t['run']][0] == t['code']):
        orphans.append(dict(run=t['run'], code=t['code'], label=t['label'], n=len(t['ads']), best1=(c, byk[(1, c)]['label'], j, cont),
                            others={r: v for r, v in t['best'].items() if r != 1}))
json.dump(dict(rows=out, orphans=orphans), open('alignment.json', 'w'), ensure_ascii=False, indent=1, default=list)
for row in sorted(out, key=lambda r: -r['recur']):
    ms = ' | '.join(f"r{r}:{m['label'][:28]}({m['n']}) J{m['J']} C{m['contain']}{'*' if m['mutual'] else ''}" for r, m in sorted(row['matches'].items()))
    print(f"{row['recur']}/{len(runs)} {row['code']} {row['label'][:40]} ({row['n']}) :: {ms}")
print('\nORPHANS (topics of runs 2-4 without a run-1 match):')
for o in orphans:
    oth = ' '.join(f"r{r}:{c}J{j}" for r, (c, j, cont) in o['others'].items())
    print(f"r{o['run']} {o['code']} {o['label'][:45]} ({o['n']}) best r1 {o['best1'][0]} {o['best1'][1][:25]} J{o['best1'][2]} C{o['best1'][3]} | {oth}")
