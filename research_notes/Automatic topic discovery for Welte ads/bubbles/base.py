import json, collections, re
from lxml import etree
NS={'t':'http://www.tei-c.org/ns/1.0'}
SP='/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/'
d=etree.parse('/home/user/welte-ads/tei/shared/encoding.xml')
tax={}
for c in d.xpath('//t:taxonomy[@xml:id="topics"]/t:category',namespaces=NS):
    i=c.get('{http://www.w3.org/XML/1998/namespace}id')
    tax[i]=dict(label=c.xpath('normalize-space(t:gloss)',namespaces=NS),desc=c.xpath('normalize-space(t:desc)',namespaces=NS))
segs=json.load(open(SP+'segs.json'))
def period(date):
    y=int(date[:4]); return 'early' if y<=1914 else 'late'
def examples(topic,n=3):
    ex=[s for s in segs if topic in s['ana'] and s['text']]
    ex.sort(key=lambda s:(s['resp']!='#np', -min(len(s['text']),140)))
    out=[]; seen=set()
    for s in ex:
        if s['ad'] in seen: continue
        seen.add(s['ad']); out.append(dict(ad=s['ad'],lang=s['lang'],text=s['text'][:220]))
        if len(out)>=n: break
    return out
def bubbles(filter_fn=lambda s:True):
    c=collections.Counter(a for s in segs if filter_fn(s) for a in s['ana'])
    return [dict(id=t,label=tax.get(t,{}).get('label',t),weight=w,kind='hand') for t,w in c.items()]
base=dict(taxonomy=tax,
  hand=bubbles(),
  early=bubbles(lambda s:period(s['date'])=='early'),
  late=bubbles(lambda s:period(s['date'])=='late'),
  examples={t:examples(t) for t in tax},
  nads=collections.Counter(period(s['date']) for s in segs))
ads=json.load(open(SP+'ads.json'))
base['adsPerPeriod']=collections.Counter(period(a['date']) for a in ads)
json.dump(base,open('base.json','w'),ensure_ascii=False,indent=1)
print(len(base['hand']),base['adsPerPeriod'],sum(b['weight'] for b in base['early']),sum(b['weight'] for b in base['late']))
