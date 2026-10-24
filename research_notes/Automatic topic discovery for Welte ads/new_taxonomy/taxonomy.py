import json, collections
SP='/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/'
# id, label, coding rule, components per run (for the per-ad suggestions)
T = [
 ('faithful_reproduction', 'Faithful reproduction',
  'The ad claims that the playing of the artist is reproduced exactly, faithfully, naturally or completely, as "the actual playing" of the pianist. A bare "reproduces the playing of …" without such a qualifier does not count.',
  {1:['A1'],2:['A1'],3:['A1'],4:['A1']}),
 ('touch_and_individuality', 'Touch, nuance and individuality',
  'The ad names what is kept beyond the notes: touch, phrasing, pedalling, dynamics, tempo, shading, tone colour, or the individuality and characteristic style of each pianist.',
  {1:['A2'],2:['A2'],3:['A2','A3']}),
 ('the_artists_soul', "The artist's soul",
  'The instrument is said to capture the soul, spirit, feeling or inner life of the performer, a spiritual register beyond the technical one of touch and nuance ("the living soul of the artist", "Musikseele").',
  {1:['A3'],2:['A4'],3:['A3'],4:['A3']}),
 ('not_mechanical', 'Art, not mechanism',
  'The instrument is set apart from mechanical, automatic or player-piano playing: it is human, artistic, "not a surrogate", or the prejudice that it is mechanical is refuted.',
  {1:['A4'],2:['A5'],3:['A5'],4:['A4']}),
 ('illusion_of_presence', 'Illusion of presence',
  'The listener feels that the artist is present or seated at the instrument ("as if he sat at your piano", "close your eyes"), or cannot tell the reproduction from the live artist.',
  {1:['A5'],2:['A3'],3:['A4'],4:['A2']}),
 ('artists_hear_themselves', 'Artists hear themselves',
  'The artists vouch for their own recordings: they hear or recognise their own playing, are deceived by it, sign the rolls as autographs, or a demonstration proves that each pianist can be recognised.',
  {1:['A6'],2:['A6'],3:['B2'],4:['A5']}),
 ('immortality', 'Immortality and posterity',
  'The playing is preserved for ever or for future generations; the artists become immortal, and dead artists still play.',
  {1:['B1'],2:['B1'],3:['C1'],4:['E1']}),
 ('if_only_earlier', 'If only it had existed earlier',
  'The ad regrets that the invention did not exist earlier, so that we could still hear Liszt, Chopin, Beethoven or Rubinstein. Nearly always voiced by a quoted musician.',
  {1:['B2'],2:['B2'],3:['C2'],4:['E2']}),
 ('wonder', 'Wonder, miracle and magic',
  'The instrument is called a wonder, miracle, marvel or magic, or it causes astonishment, disbelief or speechlessness.',
  {1:['C1'],2:['C1'],3:['D1'],4:['C2']}),
 ('phantom_hands', 'Phantom hands',
  'The absent performer appears as a phantom or spirit: ghostly or semi-transparent hands and figures, keys moving with no one seated, the artist summoned at will ("zitieren", "summon").',
  {1:['C2'],2:['A7'],3:['D2'],4:['A6']}),
 ('hearing_is_believing', 'Hearing is believing',
  'The reader is challenged to verify the claims by listening, comparing or testing ("must be heard to be believed", "hear it in comparison"). A bare invitation to a demonstration does not count.',
  {1:['C3'],2:['D9'],4:['B7']}),
 ('masters_at_home', 'The great pianists in your home',
  'The famous pianists can be heard in your own home or on your own piano, at any time, as often as you wish, at your command ("The Master\'s Fingers on Your Piano", concerts at home).',
  {1:['D1'],2:['E1'],3:['E1','E2'],4:['D1']}),
 ('effortless', 'Effortless: no skill needed',
  'The instrument needs no skill or effort: a button or a key starts it, it plays by itself, it is for those who cannot play.',
  {1:['D2'],2:['E2'],3:['E3'],4:['D8']}),
 ('domestic_comfort', 'Domestic comfort and intimacy',
  'A private, comfortable scene: the fireside, an armchair, lamplight, the family gathered, a quiet evening, in the text or in the picture.',
  {1:['D3'],2:['E4'],3:['E5'],4:['D3']}),
 ('entertaining_guests', 'Entertaining guests',
  'The instrument serves sociability: the hostess, guests, dinners, dancing, social functions; pictures of company gathered around it.',
  {1:['D4'],2:['E5'],3:['E4'],4:['D2']}),
 ('refinement', 'Culture, refinement and distinction',
  'Owning the instrument marks culture, refinement or social standing ("vornehmes Heim", "a visible token of culture"), or the picture places it in an elegant upper-class setting.',
  {1:['D5'],2:['E6'],3:['E6'],4:['D4']}),
 ('furniture', 'Furniture and ornament',
  'The case, its design or period style; the instrument as an ornament of the room.',
  {1:['D6'],2:['E7'],3:['E7'],4:['D5']}),
 ('testimonials', 'Testimonials of famous musicians',
  'A named musician or other notable person is quoted or paraphrased in praise of the instrument.',
  {1:['E1'],2:['D3'],3:['B1'],4:['B1']}),
 ('world_renown', 'World renown and recognition',
  'The instrument is famous and admired throughout the world, acclaimed by all great artists, critics or the press, adopted by conservatories and other institutions, or decorated with medals and prizes. The bare epithet "the famous Welte-Mignon" does not count.',
  {1:['E2','E3'],2:['D6'],3:['B5'],4:['B2','C6']}),
 ('royal_patronage', 'Royal and aristocratic patronage',
  'Royalty, the nobility or the court appear as listeners, owners or patrons, including titles of purveyor to the court ("Hoflieferant").',
  {1:['E4'],2:['D5'],3:['B6'],4:['B3']}),
 ('satisfied_owners', 'Satisfied owners',
  'Ordinary owners, named or anonymous, or the number of owners vouch for the instrument.',
  {1:['E5'],2:['D4'],3:['B7'],4:['B4']}),
 ('composers_own_works', 'Composers play their own works',
  'The ad stresses that composers themselves recorded, or are heard playing, their own compositions.',
  {2:['F3'],3:['B4'],4:['E6']}),
 ('epoch_making_invention', 'Epoch-making invention',
  'The instrument is framed as an invention: epoch-making, ingenious, the greatest of the age, a sensation, the newest thing.',
  {1:['F1'],2:['C2','C3'],3:['D3'],4:['C3']}),
 ('superlatives', 'Superlative perfection',
  'The instrument is called perfect, the best, the finest, supreme or unsurpassed, or the culmination of a line of progress.',
  {1:['F2'],2:['D1'],3:['G1'],4:['C1']}),
 ('unique_and_superior', 'Unique and superior to rivals',
  'The instrument is "the only one", the standard for all others, it surpasses its rivals or has nothing in common with them, or the reader is warned against cheap or unknown makes.',
  {1:['F3'],2:['D2'],3:['G2','G3']}),
 ('the_original', 'The original',
  'The Welte-Mignon is the original or the first reproducing piano, protected by the original patents; the history of the Welte firm and its founders guarantees it.',
  {1:['F4','F6'],2:['C4'],3:['G4'],4:['C5','C7']}),
 ('how_it_works', 'How it works',
  'The ad explains or shows the technology: the recording process, the pneumatic or electric mechanism, the roll, the drive from a light socket, or it likens the recording to photography or the phonograph. A product label such as "electric reproducing piano" alone does not count.',
  {1:['F5','F7'],2:['C5'],3:['D4'],4:['C4']}),
 ('education', 'Education and study',
  'The instrument serves learning and teaching: conservatories, students, studying an interpretation by repeating it.',
  {1:['G1'],2:['F1'],3:['F1'],4:['E3']}),
 ('beyond_the_home', 'Uses beyond the home',
  'Uses outside private listening: accompanying singers or instrumentalists, the stage or ballet, hotels, restaurants, hospitals, sanatoria, clubs.',
  {1:['G2'],2:['F2'],3:['F6'],4:['E5']}),
 ('still_a_piano', 'Still a normal piano',
  'The instrument remains an ordinary piano: it can be played by hand, the mechanism is invisible and leaves its look unchanged, it can be fitted to many makes of piano.',
  {1:['G3'],2:['E3'],3:['F5'],4:['D9']}),
 ('repertoire', 'Breadth of repertoire',
  'The range of music available: classics and dance music, jazz and opera, music for every mood and occasion, a library of thousands of rolls by hundreds of artists.',
  {1:['G4'],2:['E9'],3:['E8','E9'],4:['D11']}),
 ('evocative_scenes', 'Evocative scenes and moods',
  'The copy or the picture paints what the music conjures up: a storm at sea, the Valkyries, a gaucho dance, a garden of long ago.',
  {1:['H1'],2:['E10'],3:['E10']}),
 ('within_reach', "Within everyone's reach",
  'The instrument, or the music it plays, is accessible to all, its value exceeds its price. Prices and terms of payment themselves are not a topic.',
  {1:['I1'],2:['E11'],3:['F3'],4:['D10']}),
 ('quality', 'Quality and durability',
  'The instrument is reliable, well built and lasting, proven in use and in every climate, guaranteed.',
  {1:['I2'],2:['D8'],3:['F4'],4:['C8']}),
 ('gifts', 'Seasonal occasions and gifts',
  'The ad ties the instrument to Christmas, the New Year, a holiday or a season, or offers it as a gift.',
  {1:['I3'],3:['E11'],4:['D12']}),
 ('national_pride', 'National and local pride',
  'An appeal to national or local identity: domestic industry or inventive genius, national honour, national artists and composers.',
  {1:['J2'],2:['F4'],3:['G5'],4:['E7']}),
]
# the ads each run gave each topic
runs = {1: {k.split(' ',1)[0]: set(v) for k, v in json.load(open(SP+'coding_final.json')).items()}}
for r in (2,3,4):
    runs[r] = {t['code']: set(t['ads']) for t in json.load(open(f'{SP}runs/run{r}/topics.json'))['topics']}
ads = [a['ad'] for a in json.load(open(SP+'ads.json'))]
hints = collections.defaultdict(dict)
counts = {}
for tid, label, rule, comp in T:
    for r, codes in comp.items():
        for c in codes: assert c in runs[r], (tid, r, c)
    votes = collections.Counter()
    for r, codes in comp.items():
        for a in set().union(*[runs[r][c] for c in codes]): votes[a] += 1
    need = 2
    sel = [a for a in ads if votes[a] >= need]
    counts[tid] = len(sel)
    for a in ads:
        if votes[a]: hints[a][tid] = f'{votes[a]}/{len(comp)}'
json.dump([dict(id=t, label=l, desc=d) for t, l, d, _ in T], open('taxonomy.json', 'w'), ensure_ascii=False, indent=1)
json.dump(hints, open('hints.json', 'w'), ensure_ascii=False, indent=1)
for t, l, d, c in T: print(f'{t:26} {counts[t]:4}  runs={len(c)}  {l}')
print(len(T))
