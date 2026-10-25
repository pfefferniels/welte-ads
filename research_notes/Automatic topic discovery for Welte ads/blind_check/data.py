import json, re, subprocess
from lxml import etree
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
C = '/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/consolidate/'
sample = json.load(open(C + 'blind_sample.json'))
LANG = {'en':'English','de':'German','nl':'Dutch','es':'Spanish','sv':'Swedish','da':'Danish','fr':'French','no':'Norwegian','pl':'Polish','pt':'Portuguese','ru':'Russian','ca':'Catalan'}
def blocks(body):
    out = []
    for div in body.iter('{%s}div' % NS['t']):
        if div.getparent().tag.endswith('}div'): continue
        parts = []
        def walk(e):
            tag = etree.QName(e).localname
            if tag in ('note',):
                return
            if tag == 'gap':
                d = ' '.join(''.join(e.itertext()).split())
                parts.append(f'[left out: {d}]' if d else '[left out]'); return
            if tag == 'figure':
                d = ' '.join(''.join(x.itertext()) for x in e.iter('{%s}desc' % NS['t'])).split()
                parts.append('\n[Picture: ' + ' '.join(d) + ']\n'); return
            if tag == 'rdg' and e.getparent().index(e) != 0: return
            if tag == 'lb': parts.append('\n')
            if e.text: parts.append(e.text)
            for c in e:
                walk(c)
                if c.tail: parts.append(c.tail)
        walk(div)
        s = ''.join(parts)
        s = '\n'.join(' '.join(l.split()) for l in s.split('\n'))
        s = re.sub(r'\n{2,}', '\n', s).strip()
        if s: out.append(s)
    return out
ads = []
for ad in sample:
    xml = subprocess.run(['git', '-C', '/home/user/welte-ads', 'show', f'HEAD:tei/{ad}.xml'], capture_output=True).stdout
    d = etree.fromstring(xml)
    g = lambda xp: d.xpath(f'normalize-space(({xp})[1])', namespaces=NS)
    ads.append(dict(ad=ad, lang=LANG[g('//t:langUsage/t:language/@ident')], date=g('//t:sourceDesc//t:date[@type="publication"]/@when'),
        periodical=g('//t:sourceDesc//t:seriesStmt/t:title') or g('//t:sourceDesc//t:publisher/t:orgName'), place=g('//t:sourceDesc//t:pubPlace'),
        advertiser=g('//t:titleStmt/t:author'), scan=g('//t:sourceDesc//t:idno[@type="URLImages"]'),
        blocks=blocks(d.xpath('//t:text/t:body', namespaces=NS)[0])))
tax = json.load(open(C + 'taxonomy.json'))
groups = [('The reproduction', ['faithful_reproduction','touch_and_individuality','the_artists_soul','not_mechanical','illusion_of_presence','artists_hear_themselves']),
 ('Time', ['immortality','if_only_earlier']), ('Wonder', ['wonder','phantom_hands','hearing_is_believing']),
 ('Home and society', ['masters_at_home','effortless','domestic_comfort','entertaining_guests','refinement','furniture']),
 ('Authority', ['testimonials','world_renown','royal_patronage','satisfied_owners','composers_own_works']),
 ('Invention and rank', ['epoch_making_invention','superlatives','unique_and_superior','the_original','how_it_works']),
 ('Uses and repertoire', ['education','beyond_the_home','still_a_piano','repertoire','evocative_scenes']),
 ('Value and occasion', ['within_reach','quality','gifts','national_pride'])]
assert sorted(sum((g for _, g in groups), [])) == sorted(t['id'] for t in tax)
json.dump(dict(ads=ads, topics=tax, groups=groups), open('data.json', 'w'), ensure_ascii=False)
print(len(ads), sum(len(' '.join(a['blocks']).split()) for a in ads), 'words')
print(ads[3]['ad'], ads[3]['periodical'], ads[3]['date'], ads[3]['scan']); print(ads[3]['blocks'][:3])
