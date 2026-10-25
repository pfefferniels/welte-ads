import json, re, collections
SP='/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/'
RN='/home/user/welte-ads/research_notes/Automatic topic discovery for Welte ads/'
base=json.load(open('base.json')); cl=json.load(open('clusters.json'))
tax=base['taxonomy']; segs=json.load(open(SP+'segs.json')); ads=json.load(open(SP+'ads.json'))
per=lambda d:'early' if int(d[:4])<=1914 else 'late'
nper=collections.Counter(per(a['date']) for a in ads)
topic_ads=collections.defaultdict(set); topic_ads_p=collections.defaultdict(lambda:collections.defaultdict(set))
for s in segs:
    for t in s['ana']:
        topic_ads[t].add(s['ad']); topic_ads_p[t][per(s['date'])].add(s['ad'])
resp=collections.defaultdict(collections.Counter)
for s in segs:
    for t in s['ana']: resp[t][(s['resp'] or 'none').lstrip('#')]+=1
def hand_item(t,**kw):
    d=dict(id=t,label=tax[t]['label'],desc=tax[t]['desc'],kind='hand',passages=sum(1 for s in segs if t in s['ana']),
           nads=len(topic_ads[t]),ads=sorted(topic_ads[t]),resp=dict(resp[t]),examples=base['examples'][t])
    d.update(kw); return d
views={}
# 1 current: as the site, weight = passages
views['current']=[hand_item(t,weight=sum(1 for s in segs if t in s['ana'])) for t in tax if topic_ads[t]]
# 2 time: % of ads in period
views['time']={p:[hand_item(t,weight=round(100*len(topic_ads_p[t][p])/nper[p],1),count=len(topic_ads_p[t][p])) for t in tax if topic_ads_p[t][p]] for p in ('early','late')}
views['timeClusters']={p:[dict(id=c['id'],label=c['label'],long=c['long'],kind=c['type'],weight=round(100*c[p]/nper[p],1),count=c[p],
    units=c['units'],nads=c['weight'],ads=c['ads'],topics=c['topics'],withTopic=c['withTopic'],examples=c['examples']) for c in cl['clusters'] if c['type']=='R' and c[p]] for p in ('early','late')}
# 3 clusters
views['clusters']=[dict(id=c['id'],label=c['label'],long=c['long'],kind=c['type'],weight=c['weight'],units=c['units'],nads=c['weight'],
    ads=c['ads'],topics=c['topics'],withTopic=c['withTopic'],examples=c['examples'],early=c['early'],late=c['late']) for c in cl['clusters']]
# 4 seeded: hand topics (ads) + candidates from retrieval/propagation + new topics
slogan=['ad014','ad015','ad016','ad020','ad021','ad022','ad023','ad024','ad025','ad029','ad030','ad033','ad040','ad143']
cand={'technical_invention':['ad130','ad131','ad005','ad041','ad170','ad008'],
 'superiority':['ad172','ad106','ad093','ad038','ad004','ad153','ad033','ad169'],
 'immortality':['ad027','ad130','ad131','ad100'],
 'virtual_presence':slogan+['ad180'],
 'phantom_body':['ad028','ad027'],
 'affordability':['ad006','ad038','ad143','ad054'],
 'miracle':['ad100','ad010'],
 'exact_reproduction':['ad176'],'home':['ad145','ad038'],'educational_use':['ad175']}
candnote={'virtual_presence':'Mostly one slogan, "The Master\'s Fingers on Your Piano", printed in 14 ads but annotated in 3: twice virtual_presence (editor, ad014, ad020), once phantom_body (LLM, ad143). The candidates assume the editor\'s reading; deciding between the two readings comes first.',
 'phantom_body':'"These are the Phantom Hands of a thousand immortal pianists …" is unannotated in ad027 but carries phantom_body in ad026, ad028, ad104, ad105; ad028.0 repeats the annotated headline of ad104.',
 'home':'Retrieval worked badly here (0 of 5 top hits plausible); the two candidates came from ranks 6–7.',
 'touch_of_a_button':'Retrieval found no plausible candidates (0 of 5).'}
seeded=[]
for t in tax:
    if not topic_ads[t]: continue
    c=sorted(set(cand.get(t,[]))-topic_ads[t])
    seeded.append(hand_item(t,weight=len(topic_ads[t])+len(c),now=len(topic_ads[t]),candidates=c,candnote=candnote.get(t,'')))
A={c['id']:c for c in cl['clusters']}
def new(id,label,adlist,desc,examples,source):
    return dict(id=id,label=label,kind='new',weight=len(adlist),nads=len(adlist),ads=sorted(adlist),desc=desc,examples=examples,source=source)
U=lambda *ids: set().union(*[set(A[i]['ads']) for i in ids])
seeded+= [
 new('n_endorse','Endorsement by famous musicians',U('c13','c45'),'Citing a great name as an authority: testimonial headers, letters of praise for the inventors. Your topics mark what a testimonial says (Miracle, Technical Invention), not the act of citing it.',
   [dict(ad='ad131',lang='en',text="OPINIONS OF THE WORLD'S FAMOUS MUSICIANS:"),dict(ad='ad175',lang='de',text='Musikalische Grössen urteilen wie folgt:'),dict(ad='ad008',lang='de',text='Den Erfindern meine aufrichtige Bewunderung.')],'Clusters 13 and 45; cluster 45 occurs only in 1905–1914 (9 of 70 early ads, none later).'),
 new('n_library','Roll library & recording artists',U('c34'),'The size of the repertoire and the number of artists who record: "a veritable army of artists".',
   [dict(ad='ad012',lang='en',text='One hundred and fifty-six musicians have recorded more than five thousand selections for the Welte-Mignon.'),dict(ad='ad025',lang='en',text='A Veritable Army of Artists Record for Welte-Mignon')],'Cluster 34: only 1 of its 15 sentences carries one of your topics. Late ads only.'),
 new('n_anypiano','In any piano you choose',U('c38'),'Compatibility and choice in the licensee era: the action can be installed in over a hundred makes of piano.',
   [dict(ad='ad014',lang='en',text='You can choose from 112 standard makes of pianos that now install the Welte-Mignon* Reproducing Action.'),dict(ad='ad020',lang='en',text='Select any piano you prefer but be sure the reproducing action is WELTE-MIGNON.*')],'Cluster 38 (functional in form, but it argues). 0 early ads, 13 late ads.'),
 new('n_original','The original & its patents',U('c26'),'Originality and legitimacy: the "original" Welte, its basic patents, the founder story; the licensee-era contest over who is original.',
   [dict(ad='ad016',lang='en',text='*Licensed under original Welte-Mignon patents'),dict(ad='ad033',lang='en',text='Thus M. Welte & Sons were the originators of the idea of reproducing the playing of pianists, and were granted the original, basic patents …')],'Cluster 26 (mixed with "dealers everywhere"). Currently folded into Superiority or unannotated.'),
 new('n_concert','The concert as an event',U('c4'),'Public Welte-Mignon concerts and demonstrations with a date, hall and programme.',
   [dict(ad='ad047',lang='nl',text='INVITATIE Mignon-Concert DINSDAG 27 OCT. des avonds 8 u. IN DE KLEINE ZAAL VAN HET CONCERTGEBOUW.'),dict(ad='ad168',lang='de',text='Mittwoch, den 19. Mai 1909, nachmittags 3 Uhr Welte-Mignon-Konzert im Konzertsaale der Pianofortefabrik R. Reutemann')],'Cluster 4 (concert dates); the invitation clusters 18 and 19 would add more. Concerts appear in 35.7% of early ads and 7.2% of late ads.'),
 new('n_royal','Royal patronage',{'ad003','ad010','ad033','ad041','ad070','ad103','ad165','ad209'},'Courts, princes and aristocrats as listeners and patrons, including "Hoflieferant" (purveyor to the court) titles.',
   [dict(ad='ad041',lang='en',text='How EDVARD GRIEG was Surprised by Kaiser Wilhelm II'),dict(ad='ad165',lang='de',text='Ihre Königliche Hoheit erinnern sich mit wehmütiger Freude der Befriedigung, mit welcher der heimgegangene Grossherzog den Tönen des Instrumentes gelauscht hat …'),dict(ad='ad010',lang='de',text='Hoflieferant Sr. Kgl. Hoheit des Prinzen Rupprecht von Bayern.')],'Not found by clustering: spotted while reading clusters 34 and 44, then counted by keyword search (8 ads, counting "Hoflieferant" lines).'),
 new('n_venues','Venues beyond the home',{'ad150','ad067','ad138'},'Concert salons, hospitals, sanatoria, clubs, restaurants, cinemas: uses outside the private home.',
   [dict(ad='ad150',lang='sv',text='För hem, konsertsalonger, musikinstitut, sjukhus, sanatorier, klubblokaler, förstkl. restauranger …')],'Found while reading; currently annotated Home or not at all.'),
]
views['seeded']=seeded
# 5 LLM blind induction
code=json.load(open(SP+'coding_final.json'))
st1=open(RN+'pilot_llm_induction_stage1.md').read()
defs={}
for m in re.finditer(r'\*\*([A-J]\d) ([^*]+)\*\* \(([^)]*)\)\.\s*\*Rule:\*\s*(.+?)\n((?:- .+\n?)*)',st1):
    exs=[]
    for b in m.group(5).strip().split('\n')[:2]:
        mm=re.match(r'- (ad\d+) \((\w+), (\d+)\)[^:]*:\s*(.+)',b)
        if mm:
            q=mm.group(4); gl=''
            g=re.search(r' — \*(.+?)\*\s*$',q)
            if g: gl=g.group(1); q=q[:g.start()]
            exs.append(dict(ad=mm.group(1),lang=mm.group(2),text=q.strip().strip('"“”')[:240],gloss=gl))
    defs[m.group(1)]=dict(rule=m.group(4).strip(),examples=exs)
rel={'A1':('same','exact_reproduction'),'A2':('reshaped','personality (broader)'),'A3':('reshaped','soulfulness (broader)'),'A4':('same','distinction_from_mechanical'),
'A5':('same','virtual_presence'),'A6':('reshaped','immediate_recognizability + analysis (merged, broader)'),'B1':('same','immortality'),'B2':('new','split off immortality'),
'C1':('reshaped','miracle (much broader)'),'C2':('reshaped','phantom_body (broader)'),'C3':('new',''),'D1':('reshaped','home, cut differently against touch_of_a_button'),
'D2':('reshaped','touch_of_a_button, cut differently'),'D3':('reshaped','absorbs listening and atmosphere'),'D4':('reshaped','entertainment + hostess (merged)'),'D5':('new',''),'D6':('new','split off home'),
'E1':('new',''),'E2':('new',''),'E3':('new',''),'E4':('new',''),'E5':('new',''),'F1':('reshaped','technical_invention (partial)'),'F2':('reshaped','superiority + unreached_ideal, cut differently'),
'F3':('reshaped','superiority + secret, cut differently'),'F4':('new',''),'F5':('same','analogy_to_photography + analogy_to_phonograph (merged)'),'F6':('new',''),'F7':('new',''),
'G1':('same','educational_use'),'G2':('reshaped','artistic_accompaniment (broader)'),'G3':('reshaped','invisibility (much broader)'),'G4':('reshaped','dance + jazz + suit_every_mood + popular (merged)'),
'G5':('new',''),'H1':('reshaped','partly atmosphere'),'I1':('reshaped','affordability, without prices and terms'),'I2':('new',''),'I3':('new',''),'J1':('new',''),'J2':('new','')}
llm=[]
for k,v in code.items():
    c=k.split(' ',1)[0]; lab=k.split(' ',1)[1]
    r,mapping=rel[c]
    llm.append(dict(id=c,code=c,label=lab,kind=r,mapping=mapping,weight=len(v),nads=len(v),ads=sorted(v),rule=defs.get(c,{}).get('rule',''),examples=defs.get(c,{}).get('examples',[])))
missing=[c for c in rel if c not in defs]
views['llm']=llm
data=dict(views=views,adsPerPeriod=nper,noise=cl['noise'],nunits=cl['nunits'],labels={t:tax[t]['label'] for t in tax})
json.dump(data,open('data.json','w'),ensure_ascii=False)
print('defs missing',missing); print('llm',len(llm),'seeded',len(seeded),'clusters',len(views['clusters']))
print('kinds',collections.Counter(x['kind'] for x in llm))
print([ (x['id'],x['now'],len(x['candidates'])) for x in seeded if x['kind']=='hand' and x['candidates']])
print([(x['label'],x['weight']) for x in seeded if x['kind']=='new'])
import os; print(os.path.getsize('data.json'))
