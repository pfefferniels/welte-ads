# Pilot: LLM-based inductive topic discovery — Stage 2 (contrastive discovery, still blind)

*Written before any look at the editor's taxonomy, like Stage 1. In the style of D5 / GoalEx (Zhong et al.): state, in natural language, what distinguishes two groups of documents, then check each statement against counts. The "proposer" and the "verifier" are both me. Verification uses the Stage 1 coding (Appendix A of Stage 1), plus a few surface features computed by script: token counts, presence of figures, people in figures, second-person address, prices and terms, brand compounds.*

## 0. Groups, and why the numbers must be read cautiously

- **Period:** P1 = 1905–1914 (n = 70); P2 = 1917–1929 (n = 125). There are no ads from 1915–16; 1914 has one ad.
- **Market / language:** EN 66 (US 32, Australia 16, Canada 14, UK 3, Mexico 1) · DE 38 (Zürich 19 + Bern 1, Riga 5, München 4, Berlin 3, others) · Scandinavian 35 (sv 14, da 12, no 9) · NL 22 (incl. one from Batavia) · Iberian 17 (es 14, pt 2, ca 1; Havana 11) · FR 11 (Lausanne, Geneva, Paris, Montréal) · pl/ru 6.
- **Confounding.** Period and language are strongly entangled. DE is 74 % pre-war (28/38), while EN is 79 % post-war (52/66) and NL 82 % post-war (18/22). Advertisers run **series**: Auto Pneumatic 15 ads, Hug 11, Reutemann 9, Winther 8, Heintzman 8, Dahlström 7, Stowers 6 … So 195 ads are not 195 independent observations. For the period contrasts I therefore also give (i) the split **within** each language and (ii) the number of **distinct advertisers**.
- **Statistics.** Two-sided Fisher exact tests on ad counts are given as a rough guide only. With 40 topics × several contrasts, and with advertiser clustering, the p-values are optimistic. Only contrasts that survive a Bonferroni-style threshold (p < 0.00125 for the 40 period tests) **and** point the same way within languages are marked **robust**.

## (a) What distinguishes 1905–1914 from 1917–1929

### H-a1. Pre-war ads introduce and legitimise a *new kind of instrument*; post-war ads defend a *brand* among competitors. **Robust**

| Indicator | P1 (70) | P2 (125) | Within-language (P1 → P2) | Distinct advertisers (P1 / P2) |
|---|---|---|---|---|
| F1 Sensational / epoch-making invention | 33 (47 %) | 17 (14 %) | EN 7/14 → 8/52; DE 14/28 → 3/10; SCAN 6/12 → 2/23 | 18 / 14 |
| A4 Not mechanical, not a player piano | 18 (26 %) | 7 (6 %) | EN 3/14 → 6/52; DE 9/28 → 1/10; SCAN 5/12 → 0/23 | 10 / 7 |
| Product named "Mignon" without "Welte" | 17 (24 %) | 0* | — | — |
| F4 Originality & priority ("the original", patents) | 1 (1 %) | 20 (16 %) | EN 0/14 → 16/52; NL 0/4 → 3/18 | 1 / 10 |
| Host-piano brand compounds (Steinway-Welte, Heintzman Welte-Mignon, Linconola …) | 6 (9 %) | 46 (37 %) | — | — |
| "Licensee" / "Licensed under …" | 0 | 23 (18 %) | — | — |

\*ad116 (1923) spells it "WELT-MIGNON".

The pre-war ads have to explain what the thing *is* and that it is not a pianola:
- ad147 (sv, 1907): "Beundransvärd uppfinning!" — *An admirable invention!*
- ad210 (pl, 1906): "Nowością sensacyjną jest fortepian reprodukcyjny „Mignon"" — *a sensational novelty.*
- ad009 (de, 1905): "Das Reproduktionsklavier hat nichts gemein mit mechanischen Spielapparaten wie Pianola, Phonola etc."

The post-war ads assume the category and fight over authenticity:
- ad017 (en, 1928): "The WELTE-MIGNON Is the Original REPRODUCING PIANO And Was the First Ever Sold in the World"
- ad032 (en, 1924): "The Original Welte-Built Welte-Mignon Reperforming Grand Piano"
- ad021 (en, 1926): "Before buying any reproducing piano ascertain whether or not it contains the famous WELTEMIGNON LICENSEE REPRODUCING ACTION."
- ad066 (nl, 1926): "DE ORIGINEELE AUTOPIANO'S WELTE MIGNON (ELECTRISCHE REPRODUCTIE PIANO)"

### H-a2. Pre-war persuasion is a *dossier of expert testimony*; post-war persuasion uses owners, hostesses and scenes. **Robust**

- E1 Quoted testimonials: P1 25 (36 %) vs P2 18 (14 %); p ≈ 0.001. Within languages: DE 15/28 → 2/10; EN 4/14 → 6/52.
- Ads stacking **three or more** testimonial voices: P1 14 vs P2 4 (ad005, 008, 009, 037, 041, 100, 130, 131, 139, 140, 148, 151, 170, 171, 172, 175, 205, 212). The extreme case is ad100 (Riga 1908), "Aus MIGNON's Autographenmappe" (*from Mignon's autograph album*), with 13 voices, two of them in verse.
- Testimonial *formulas* that cluster pre-war: B2 the counterfactual past, P1 9 vs P2 1 (p ≈ 0.0005, 7 different advertisers); J1 the modest name, P1 6 vs P2 3; E4 royal and court patronage, P1 7 (10 %) vs P2 4 (3 %).
- Post-war, the voice shifts to a fictive owner ("… That's why I bought it", ad029, 030, 040, all 1927) and to hostess scenes (ad038, ad145). Expert quotes survive post-war mainly where old copy is recycled: the Nikisch quote of 1905/09 reappears in ad037 (1921) and ad185 (1927); Pugno appears in ad117 (1924) and ad205 (1919).

### H-a3. Post-war ads *domesticate and socialise* the instrument: home, family, guests, the reader as "you". **Robust for D1; strong for the rest**

| Indicator | P1 | P2 | Within-language |
|---|---|---|---|
| D1 Great pianists in your home, at your command | 14 (20 %) | 54 (43 %) | EN 2/14 → 36/52 |
| D3 Domestic comfort & intimacy | 2 (3 %) | 20 (16 %) | EN 1/14 → 14/52 |
| D4 Entertaining guests | 0 | 12 (10 %) | EN 0 → 8; SCAN 0 → 3 |
| Ads with any illustration | 20 (29 %) | 76 (61 %) | — |
| Illustrations showing people (listeners, guests, family) | 2 (3 %) | 34 (27 %) | — |
| …of which women are shown | 2 | 22 | — |
| Second-person address to the reader, EN ("you/your") | 6/14 | 40/52 | — |
| Direct address to the reader, DE ("Sie/Ihr") | 1/28 (ad175) | 3/10 (ad181, 186, 197) | — |

Examples:
- ad197 (de, 1923): "Ihre Gäste sind ganz entzückt …"
- ad106 (en, 1926): "when the family is gathered around a cheery log fire"
- ad181 (de, 1921): "Verlangen Sie von uns fertige Programme für Ihre Hauskonzerte auf Welte-Mignon." — *ask us for ready-made programmes for your house concerts.*

By contrast, pre-war illustrations show the instrument alone (ad075/076: "The Welte-Mignon cabinet player (Vorsetzer) in an Art Nouveau case").

### H-a4. The *public demonstration concert* is the pre-war launch format; post-war the concert moves into the home. **Robust for G5**

- G5 The machine as concert performer: P1 18 (26 %) vs P2 10 (8 %); 14 vs 8 advertisers. Examples: ad077 (no, 1907) "Samtlige spillet af Edv. Grieg." (*all played by Edv. Grieg*); ad159/160 (sv, 1908) "Tio [Tolf] pianister konsertera medelst "Mignon-Apparat""; ad167/168 (Zürich, 1909) "am Flügel Alfred Grünfeld"; ad047/048 (nl, Concertgebouw 1908, Nijmegen 1910); ad132/133 (Sydney 1910/11).
- Invitations to demonstrations of any kind (keyword-based): ≈59 % of P1 vs ≈38 % of P2.
- The "concert at home" (a D1 variant) is mainly post-war: ad106/109 "A program by the great De Pachmann—an evening with the incomparable Paderewski"; ad143 "A Concert By Living Pianists In Your Home"; ad181; ad183; ad192; ad193.
- Post-war public events become *hybrids* with live performers (ad136/137, Melbourne 1927: Lambert "playing alternately" with Paderewski's roll) or institutional showcases (ad045/046, Geneva Conservatoire 1927; ad127, Petrograd 1923).

### H-a5. The summoned artist turns from a *verbal* conceit (pre-war "zitieren") into a *visual* one (post-war phantom hands). **Strong but advertiser-concentrated**

- C2 Phantom hands & summoned spirits: P1 3 (4 %) vs P2 24 (19 %); p ≈ 0.004; 2 vs 10 advertisers.
- All 3 pre-war cases are verbal and German: "um einen d'Albert, Busoni … zu zitieren" (ad003 1909, ad103 1911) and Zöllner's poem "du zitierst nicht bloss die Geister" (ad100 1908).
- Post-war it becomes iconography: semi-transparent hands in the Auto Pneumatic logo (ad015–ad040), the half-transparent Paderewski (ad011, 1921), "Phantom Fingers" (ad026–028, ad104/105), and an unattended piano before listeners (ad080, 1918; ad182, 1924; ad197, 1923).
- 19 of the 24 post-war cases are in English-language ads, so this is partly a US/Canada contrast (see H-b1).

### H-a6. Post-war ads sell *versatility, everyday repertoire and terms*; pre-war ads sell *the art of the great pianists*. **Robust for G4; strong for G3**

- G4 Breadth of repertoire & moods: P1 0 vs P2 17 (14 %); p ≈ 0.0004; 11 advertisers. Popular music, dance and jazz are only post-war: ad092 (da, 1921) "Øjeblikkets kendte og populære Danse"; ad038 (1923) "a hundred masters of jazz"; ad019 (1928) Gershwin's "Rhapsody in Blue"; ad190 (1926) "the classics, operatic or dance music".
- G3 Dual use & unobtrusive integration: P1 5 (7 %) vs P2 25 (20 %). This reflects the product shift from the push-up Vorsetzer to built-in actions: "invisible and does not interfere with manual playing" (ad026–028), "in 115 makes of pianos", the Quadrola's "vier verschillende manieren" (*four different ways*, ad064/065).
- Prices and payment terms in the text: ≈2 (3 %) vs ≈23 (18 %). I1 Within everyone's reach: 1 vs 8. I3 Gift/season: 1 vs 6.
- The opposite drift: D2 "Effortless, no skill needed" is *more* frequent pre-war, 13 (19 %) vs 9 (7 %). This is the push-button novelty of the electric Vorsetzer ("Ein Druck auf den Knopf genügt", ad003; "Et Tryk paa Knappen", ad086). After the war it is taken for granted, except in the explicit "for people who cannot play" pitch (ad097, ad107).

### H-a7. What does *not* change (useful negative results)

These topics are about equally common in both periods, so they are the corpus's *constant* rhetorical core:

| Topic | P1 | P2 |
|---|---|---|
| A1 Faithful reproduction | 44 % | 50 % |
| B1 Immortality & posterity | 20 % | 22 % |
| C1 Wonder, miracle, magic | 41 % | 34 % |
| F2 Perfection & superlatives | 34 % | 40 % |
| A5 Presence illusion | 16 % | 16 % |
| E2 Collective acclaim | 24 % | 17 % |
| F7 Electricity | 19 % | 18 % |

Notably, immortality does **not** grow after the war, even though more of the recorded pianists had died by then (Reisenauer †1907, Carreño †1917). The "dead artist still plays" variant is rare in both periods (ad004 1919, ad052 1921, ad193 1927; generically ad130/131 1909).

## (b) What distinguishes markets and languages

### H-b1. English-language ads are long, narrative and in the second person. They carry the bundle "home at command + immortality + phantom + versatility + originality". Expert quotes are rare.

- Median length 136 tokens (DE 76, IBER 66, SCAN 52, FR 51, NL 40). Illustrated 64 %. Second person 65 %. Rhetorical topics per ad: mean 7.0 (DE 6.6, IBER 4.6, SCAN 4.2, FR 3.3, NL 2.5).
- EN vs the rest (p < 0.01):

| Topic | EN | Rest |
|---|---|---|
| D1 Home at command | 58 % | 23 % |
| B1 Immortality | 36 % | 14 % |
| C2 Phantom | 29 % | 6 % |
| G3 Dual use | 29 % | 9 % |
| F4 Originality | 24 % | 4 % |
| D3 Domestic comfort | 23 % | 5 % |
| G4 Repertoire & moods | 21 % | 2 % |
| I1 Within reach | 11 % | 2 % |
| F5 Photography | 11 % | 2 % |
| H1 Evocative scenes | 9 % | 1 % |

  E1 testimonials, by contrast, appear in only 15 % of EN ads (vs 45 % DE).
- **Sub-markets differ sharply:**
  - **US** (32, mostly New York 1919–28, Auto Pneumatic / Welte-Mignon Corp. / Welte Studios) is a national brand campaign: D1 24/32, C2 13/32, G3 14/32, F4 11/32, but G5 concerts 0/32.
  - **Canada** (14: Heintzman, Mason & Risch, Lindsay, Nordheimer) is about domestic comfort, moods and scenes: D3 7/14, G4 7/14, H1 3/14. Nordheimer's 1909–10 "only instrument of the kind in Canada" recitals are the exception.
  - **Australia** (16: Nicholson, Brash's, Paling's, Findlays, Savery's) is about public recitals and testimonials: G5 7/16, E1 5/16. Example: ad132 "INVITATION RECITAL by the MARVELLOUS STEINWAY-WELTE PLAYER".
  - **UK** (3, Steinway London) says "The Instrument of the Immortals".
- *Caveat:* "EN" is less a language than three or four different selling systems.

### H-b2. German-language ads are *authority* ads: expert testimony, invention, education, court, distinction. No versatility, no prices.

- DE vs the rest (p < 0.01):

| Topic | DE | Rest |
|---|---|---|
| E1 Quoted testimonials | 45 % | 17 % |
| F1 Invention | 45 % | 21 % |
| G1 Education | 26 % | 5 % |
| E4 Royal/court | 18 % | 3 % |
| D5 Status ("vornehm") | 18 % | 4 % |
| I2 Proven quality ("bewährt", "Erprobt in jedem Klima") | 13 % | 2 % |
| G3 Dual use | 0 % | 19 % |

  G4 repertoire breadth is also absent (0/38), and prices appear in only 1 ad.
- Examples: ad102 (Vienna Conservatory purchase as "Ein glänzender Beweis", *a brilliant proof*); ad165 (the Grand Ducal court letter); ad182 (1924) "Die Instrumente des vornehmen Heims Die Kunst der Unsterblichen" (*the instruments of the distinguished home — the art of the immortals*).
- *Confound:* 28/38 DE ads are pre-war, and 20 are by two Zürich dealers (Reutemann, Hug). Some of H-b2 is therefore H-a2 again. But the 10 post-war DE ads keep "vornehm", immortality and the "zitieren" quote (ad182, 185, 198). They add guests (ad197) and a blind-test challenge (ad186), not prices or jazz.

### H-b3. Scandinavian ads are short, superlative and technical. They almost never talk about posterity or about having the masters at home.

- B1 Immortality: SCAN 1/35 (3 %) vs the rest 26 % (p ≈ 0.001). D1 Home at command: 4/35 (11 %) vs 40 % (p ≈ 0.001). C2 Phantom: 1/35.
- What they do use: F2 superlatives 14/35 (40 %), especially the Danish Winther formula "Verdens fineste Kunstspilapparat" (*the world's finest art-playing apparatus*; ad088, 089, 092, 094, 096, 098, 099) and the Swedish "världens förnämsta" (ad153, 155, 156); electricity 12/35 (34 %); collective endorsement 10/35 (29 %), "anbefalet af … Musikautoriteter" (*recommended by musical authorities*), rather than full quotes.
- The category word itself is evaluative: Danish and Norwegian "Kunstspil(le)apparat" and the slogan "KUNSTMUSIK i Hjemmet" (ad093) put "art" into the product name. The Swedish pre-war Dahlström series adds concerts (ad159, 160) and institutional uses (hospitals, sanatoria, restaurants: ad150, 151).

### H-b4. Dutch ads are the most *functional* and sober: no wonder vocabulary, almost no testimony or immortality.

- C1 Wonder: NL 0/22 vs the rest 42 % (p < 0.0001). B1 Immortality: 1/22. E1 Testimonials: 2/22. Median length 40 tokens. Half of the Dutch ads (11/22) carry at most one rhetorical topic (EN 2/66).
- Typical content: sole agency, "electrische reproductie-piano" (F7 8/22, 36 %), "Origineele", a fair stand (ad057 "EXPOSEERT JAARBEURS UTRECHT VASTE GEBOUW, STAND 5031"; ad053), and used or discount sales (ad050, 054).
- *Exceptions* that read like translated German copy: ad049 (Kettner 1912, with the de Lange quote) and ad067/069 (Maastricht 1926/27). The latter's "Alle groote kunstenaars roemen dit instrument … het eenige … natuurgetrouwe weergave van het handspel" mirrors the German "der einzige Apparat …" formula.

### H-b5. Iberian-language ads (mostly Havana) stress *superlatives, electricity and verification by the artist*. They also argue explicitly against unknown brands and the climate.

- A6 Artist verification: IBER 6/17 (35 %) vs the rest 9 % (p ≈ 0.006). Examples: Pugno's "me he oído a mí mismo" (ad117, ad205); "rollos autógrafos" (ad202/203); a Paderewski signature facsimile (ad208); a photo of Hofmann recording (ad116).
- Also: F2 superlatives 9/17 (53 %); electricity 5/17 ("PIANOS ELECTRICOS", ad199; "ULTIMAS NOVEDADES PIANOS ELECTRICOS", ad121); medals (ad117, ad207); social proof by numbers ("más de DIEZ MIL familias", ad205); "NO GASTE SU DINERO EN COMPRAR UN PIANO DE MARCA DESCONOCIDA" (ad205); tropical build (ad205).
- Rare: immortality (1/17) and home at command (3/17).
- *Caveat:* 11/17 are from Havana, 10 of them from two firms (Stowers, Custin), so this is close to a single-advertiser profile.

### H-b6. French-language ads are few and event-centred, framed by institutions.

- Concerts, auditions and exhibitions dominate: ad045/046 (Geneva Conservatoire 1927), ad184 ("le clou de l'Exposition", *the highlight of the exhibition*), ad042/043 ("Auditions gratuites"). E3 Institutional recognition is 3/11.
- The Montréal French ads translate English-Canadian copy (ad191 = ad108). The "evocative scenes" topic reaches French only through translation.

### H-b7. Cross-market observation: much "market" variation is a choice among centrally supplied copy

Identical or near-identical copy recurs across languages and countries:
- ad003 (Leipzig 1909) = ad103 (Riga 1911) ≈ ad086 (Copenhagen 1912): "Ein Druck auf den Knopf genügt … zu zitieren" / "Et Trvk paa Knappen, og der gengives en Albert Paderewski, Reisenauer etc."
- Saint-Saëns's "Kennst du das Land?" in German (ad100, Riga 1908) and Danish (ad088, 1919).
- Paderewski's "modest name" quip in German (ad005, ad169), Polish (ad211, ad212) and Spanish (ad208).
- Nikisch's "in Person vor sich" in ad005, 009, 037, 172, 179, and his "zitieren" remark in ad037 and ad185.
- ad028 (Boston 1924) ≈ ad104 (London, Ontario 1924): "Rhythmic beat of a Gaucho dance"; ad108 (Toronto) = ad191 (Montréal, French).
- ad000 (London 1913) and ad130/131 (Sydney 1909): "After many inventions and many failures …".

So a topic's frequency in a market partly measures **which central copy local dealers picked up**, not only local taste. A distribution-history explanation (Freiburg copy vs New York licensee copy vs dealer-written copy) is likely to account for much of what H-b1–H-b5 describe.

## Summary of the contrastive hypotheses

| # | Hypothesis | Strength |
|---|---|---|
| H-a1 | Novelty & legitimation (pre-war) → brand & authenticity contest (post-war) | robust |
| H-a2 | Expert-testimony dossiers (pre-war) → owners, hostesses, scenes (post-war) | robust |
| H-a3 | Domestication: home, family, guests, "you", illustrated people (post-war) | robust (D1), strong (rest) |
| H-a4 | Public demo concert (pre-war) → concert at home / hybrid events (post-war) | robust |
| H-a5 | Summoning: verbal "zitieren" (pre-war) → visual phantom hands (post-war) | strong, advertiser-concentrated |
| H-a6 | Art of the masters (pre-war) → versatility, popular repertoire, terms (post-war) | robust (G4), strong (G3, prices) |
| H-a7 | Constant core: fidelity, immortality, wonder, superlatives, presence | negative result |
| H-b1 | EN = long, narrative, home/immortality/phantom/versatility; few expert quotes; sub-markets differ | strong |
| H-b2 | DE = authority (testimony, invention, education, court, distinction) | strong, confounded with period |
| H-b3 | SCAN = short, superlative, electric, collective endorsement; no posterity, no home | strong |
| H-b4 | NL = functional, no wonder vocabulary | robust |
| H-b5 | IBER = superlatives, electricity, artist verification, brand and climate warnings | moderate (mostly two Havana firms) |
| H-b6 | FR = events and institutions | weak (n = 11) |
| H-b7 | Much market variation = selection among central copy | qualitative |

**Limits.** The proposer and the verifier are the same model, using the same coding. A D5-style pipeline would verify each hypothesis with a separate pass over every ad ("does this ad show X? yes/no"), ideally by a different model or a human. All proportions inherit the ±10–15 % uncertainty of the Stage 1 counts. Cells are small (FR 11, pl/ru 6). The hypotheses are descriptive: they say nothing about *why* (company policy, licensing history, dealer networks, wartime anti-German sentiment), which needs the historian.
