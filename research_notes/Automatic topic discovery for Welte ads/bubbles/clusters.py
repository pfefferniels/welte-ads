import json, re, collections
SP='/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/'
PC='/home/user/welte-ads/research_notes/Automatic topic discovery for Welte ads/pilot_code/'
U={u['uid']:u for u in json.load(open(SP+'pilot/units.json'))}
uids=json.load(open(SP+'pilot/items_units.json'))
lab=json.load(open(SP+'pilot/clusters_mpnet.json'))['bt_s0_m10']
assert len(uids)==len(lab), (len(uids),len(lab))
types={k:v[0] for k,v in json.load(open(PC+'cluster_labels_mpnet_bt_s0_m10.json')).items() if k!='_note'}
long={k:v[1] for k,v in json.load(open(PC+'cluster_labels_mpnet_bt_s0_m10.json')).items() if k!='_note'}
short="""Firm & agent lines|Product names|Artist's own playing reproduced|Street addresses|Concert dates|Star pianists brought home|The actual playing of the masters|Installed in your piano|Grand piano drawings|Pianist portraits|Dealer formulae|Wonder testimonials|Salon scenes|Opinions of famous musicians|Pianist portraits II|Interpretation of the greatest|Hear it calls|Prices & purchase|Visit our music salon|Free catalogue|When Phantom Fingers Play|Daily demonstrations|Pianists at your command|Auto Pneumatic signature|Pianos on display|Artist name lists|Original patents|Havana agent|As if present|Speechless astonishment|Wonder of the age|Write for the brochure|Heintzman signature|Low prices, easy terms|Roll library & artists|Product categories|The secret of reproduction|First pianists in your home|115 makes of pianos|Paderewski portraits|The Master's Fingers|Frames & logos|Phantom hands|Pedagogical value|Entertaining guests|Praise for the inventors|Invention of our age|Woman in an armchair|The cabinet player|Exhibition medals""".split('|')
assert len(short)==50
# representative sentences from the txt file
reps=collections.defaultdict(list); cur=None
for line in open(PC+'outputs/clusters_mpnet_bt_s0_m10.txt'):
    m=re.match(r'=== cluster (-?\d+)',line)
    if m: cur=m.group(1); continue
    m=re.match(r'\s+- \[(ad\d+)\.\d+ (\w+) (\d+)\] (.*)',line)
    if m and cur is not None and len(reps[cur])<4:
        reps[cur].append(dict(ad=m.group(1),lang=m.group(2),text=m.group(4).strip()[:220]))
ads=json.load(open(SP+'ads.json'))
nper=collections.Counter('early' if int(a['date'][:4])<=1914 else 'late' for a in ads)
cl=[]
for c in range(50):
    idx=[i for i,l in enumerate(lab) if l==c]
    mem=[U[uids[i]] for i in idx]
    adset=sorted({u['ad'] for u in mem})
    early={u['ad'] for u in mem if u['year']<=1914}; late={u['ad'] for u in mem if u['year']>1914}
    tc=collections.Counter(t for u in mem for t in u['topics'])
    ntop=sum(1 for u in mem if u['topics'])
    cl.append(dict(id=f'c{c}',label=short[c],long=long[str(c)],type=types[str(c)],units=len(mem),weight=len(adset),ads=adset,
        early=len(early),late=len(late),withTopic=ntop,topics=tc.most_common(4),examples=reps[str(c)]))
noise=sum(1 for l in lab if l==-1)
json.dump(dict(clusters=cl,noise=noise,nunits=len(lab),adsPerPeriod=nper),open('clusters.json','w'),ensure_ascii=False,indent=1)
for x in cl: print(x['id'],x['type'],x['units'],x['weight'],x['early'],x['late'],x['label'])
print('noise',noise,len(lab))
# ad sets for candidate new topics
A={x['id']:set(x['ads']) for x in cl}
print('endorse',len(A['c13']|A['c45']),'roll',len(A['c34']),'115',len(A['c38']),'patents',len(A['c26']),'concert',len(A['c4']|A['c18']|A['c19']))
