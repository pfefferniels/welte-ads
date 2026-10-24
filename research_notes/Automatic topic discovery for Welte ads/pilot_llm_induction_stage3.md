# Pilot: LLM-based inductive topic discovery — Stage 3 (comparison with the editor's taxonomy)

*Unblinded only after Stages 1 and 2 were saved. Sources: `<taxonomy xml:id="topics">` in `tei/shared/encoding.xml` (32 categories, 6 with a `<desc>`), and the annotated spans in `segs.json` (647 spans in 177 of the 195 ads; `resp`: 183 `#np` (the editor), 436 `#claude`, 28 without a `resp`, here counted with the editor's).*

## 1. How the comparison was made

- Both annotations were reduced to the **ad level**: "ad *x* carries topic *y*". The editor's spans are mostly single-label (12 of 647 carry two `ana` values). My Stage 1 coding is ad-level and multi-label.
- For each pair I computed the overlap, Jaccard index, coverage (the share of the editor category's ads that also carry my topic) and Cohen's κ over all 195 ads.
- *Caveat:* the editor's annotation is not exhaustive. 18 ads have no span at all, among them the Kaiser–Grieg anecdote ad041, the concert programmes ad047/048/077/084/188/189, and Ganz's testimonial ad178. Where I code more ads than the editor, this is therefore partly my broader rules and partly gaps in the annotation. Span-level boundaries (the *same* phrase coded with a *different* single category) also cause apparent disagreement. For example, ad017 "With Photographic Accuracy" is coded only as photography by the editor, but as fidelity *and* photography by me.

## 2. Mapping table

| Editor category (ads) | My topic(s) | Relation | Overlap / κ |
|---|---|---|---|
| exact_reproduction (94) | A1 Faithful reproduction (93) | **exact** | 87 shared, J = 0.87, κ = 0.87 |
| educational_use (17) | G1 Education & study (18) | **exact** | 17 shared, κ = 0.97 |
| analogy_to_photography (8) + analogy_to_phonograph (1) | F5 Photography analogy (9) | **exact** (I merged the two) | 8/8 + 1/1, κ = 0.94 |
| immortality (37) | B1 Immortality (42) + **B2 Counterfactual past** (10) | exact for B1; **I split off B2** | 33 shared, κ = 0.79 |
| distinction_from_mechanical (17) | A4 Not mechanical (25) | **exact**, mine slightly broader | 17/17 covered, κ = 0.79 |
| home (56) | D1 Home, at your command (68); salon cases → D6 / G2 | ≈ exact, cut differently | 48 shared, κ = 0.67 |
| virtual_presence (44) | A5 Presence illusion (31) | ≈ exact for the editor's use; Claude's extensions → G5, C2, D1 | 28 shared, κ = 0.69 |
| personality (22) | A2 Individual nuance & personality (52) | mine broader (adds touch, pedalling, dynamics) | 22/22 covered, κ = 0.52 |
| soulfulness (9) | A3 Soul / living art (17) | mine broader ("living") | 8/9, κ = 0.59 |
| miracle (23) | C1 Wonder, miracle, magic (72) | mine much broader (includes "wonderful" and astonishment) | 23/23, κ = 0.37 |
| phantom_body (15) | C2 Phantom hands & summoned spirits (27) | mine broader ("zitieren", "summon", the uncanny) | 13/15, κ = 0.58 |
| immediate_recognizability (9) + analysis (2) | A6 Artist verification (22) | mine broader (self-hearing, autograph rolls, recording photos) | 7/9 + 2/2, κ = 0.41 |
| technical_invention (38) | F1 Invention (50) + the "culmination" part of F2 | partial; Claude's extensions → F7, F4 | 30/38, κ = 0.50 |
| superiority (54) + unreached_ideal (11) | F2 Perfection & superlatives (74) + F3 Uniqueness (38) | **different cut** (§4) | 56 shared, κ = 0.56 |
| home + touch_of_a_button (26) | D1 + D2 Effortless (22) | **different cut** (§4) | joint κ = 0.75 |
| entertainment (8) + hostess (3) | D4 Entertaining guests (12) | **I merged** | 6/8 + 3/3 |
| dance (6) + jazz (1) + suit_every_mood (6) + popular (6, partly) | G4 Breadth of repertoire & moods (17) | **I merged** | 6/6, 1/1, 5/6, 3/6 |
| invisibility (6) | G3 Dual use & unobtrusive integration (30) | mine much broader | 6/6 |
| secret (6) | F3 Uniqueness & superiority (38) | **I absorbed** it | 6/6 |
| repeatability (6) | D1 (+ G1 "frequent repetition") | **I absorbed** it | 5/6 |
| listening ("Revelled Listening", 12) | D3 Domestic comfort (22) | **not found as such**; partly absorbed | 8/12 |
| atmosphere (3) | D3 + H1 Evocative scenes | below threshold; absorbed | 3/3 |
| sitting_woman (8) | — (Stage 1 residue: "women in the figures") | **noticed, not promoted** | 8/8 inside D3/D4/D5 |
| artistic_accompaniment (1) | G2 Uses beyond the home (8) | absorbed | 1/1 |
| affordability (24) | I1 Within everyone's reach (9) + §4 *functional* (prices, terms, discounts) | **different boundary** | 7/24, κ = 0.38 |

**Summary.** I count 7 near-exact matches (κ ≥ 0.67): exact_reproduction, educational_use, photography, immortality, distinction_from_mechanical, home and virtual_presence. Every one of the editor's 32 categories is covered at ≥ 64 % by its mapped topic(s), except affordability (29 %, by design). Popular is fully covered, but only by spreading it over four topics. Seen from the other side, **14 of my 40 topics have no editor counterpart at all**, and 4 more are almost unmatched: D5 status 15 %, E2 collective acclaim 11 %, E5 owners 10 %, G2 other uses 12 %.

## 3. Editor topics that the blind induction did not produce as separate topics, and why

| Editor category | What happened in Stage 1 | Why |
|---|---|---|
| **Revelled Listening** (12) | Partly inside D3 "domestic comfort". The reading posture ("she revels in …", "Just listening to him", Paderewski "comfortably established in an easy chair like other hearers") was not seen as a motif of its own. | The cue words (listen, revel, chair) are diffuse and common. Seeing a topic here needs a *conceptual* interest in listening practices. It is theory-driven, not frequency-driven. |
| **Sitting Woman** (8) | Recorded in the Stage 1 residue ("women in the figures, ≈25 ads"), but not promoted. | Blind induction ranked *arguments* above *iconography*. The category is gender-historical and visual, so it was recognised but judged "not an appeal". |
| **Secret** (6) | Folded into F3 uniqueness ("only Welte-Mignon possesses the secret …") and F5 ("secret photographic process"). | Read as a *wording* of exclusivity, not as a motif of trade secrecy. The difference is interpretive. |
| **Repeatability** (6) | Folded into D1 ("as often as you wish") and G1 ("frequent repetition"). | Merged during refinement. A finer granularity would have kept it. |
| **Atmosphere** (3), **Analysis** (2), **Jazz** (1), **Phonograph analogy** (1), **Artistic accompaniment** (1), **Hostess** (3) | Absorbed into H1/D3, G1/A6, G4, F5, G2 and D4. | The TopicGPT refinement step **drops or merges topics found in fewer than about 3 ads by design**. The editor deliberately keeps historically significant singletons (jazz!). This is a structural mismatch between frequency-based induction and historical interest. |
| **Popular** (6) | Its passages went to G4 (popular dances), I1 (popularisation, ad100), E5 (ad205 "DIEZ MIL familias") and E2 (ad058 "triomftocht"). | In the annotated spans "popular" mixes *popular music*, *popularity* and *popularisation*. Four of the six ads are Claude-assigned. Blind induction separates these meanings. |
| **Ideal Instrument** (11) | Inside F2 perfection & superlatives. | Different cut: see §4. |
| **Invisibility** (6) | Inside the broader G3 (hand-playable, invisible, attachable to any piano, unchanged appearance). | I chose the more general product-integration frame. |

## 4. Splits, merges and different cuts

- **Different cut through the same semantic space (1): availability.** The editor has *home* (place) vs *touch_of_a_button* (permanent availability on demand, including "jederzeit vorspielen lassen", *have them play at any time*). I have *D1 home + at your command* vs *D2 effortless / no skill*. Both pairs together cover nearly the same ads (joint κ = 0.75), but the internal boundary differs. The editor's cut is closer to the "objectification" reading in her own `<desc>`; mine is closer to the advertisers' argument about competence.
- **Different cut (2): excellence.** The editor has *superiority* vs *Ideal Instrument* (the absolute ideal, Reger's "unerreichte Ideal"). I have *F2 perfection & superlatives* (absolute) vs *F3 uniqueness & superiority over rivals* (comparative, "the only one", "standard for all others"). Note that *superiority* is almost entirely **Claude-assigned (52 of 54 ads; the other 2 have no `resp`)**, so its effective meaning is shaped by the earlier LLM pass.
- **I merged** dance + jazz + suit_every_mood (+ part of popular) into G4; entertainment + hostess into D4; photography + phonograph into F5; immediate_recognizability + analysis + autograph rolls into A6. If the editor's finer distinctions matter historically, for instance *jazz* as a dated marker of the 1920s, these merges lose information. Splitting G4 back into *dance/jazz* vs *every mood* would be easy.
- **I split**:
  - **B2 counterfactual past** out of *immortality*. The annotations put "thi da kunde vi endnu … høre Beethoven, Mozart og Chopin" (ad088) and the Stenhammar / Leschetizky / Lamond versions (ad151, 211, 101) under *immortality*, and "daran lernen" (ad009, 010) under *educational_use*.
  - **D6 furniture & ornament** out of *home*. Claude-assigned "En Pryd for enhver Salon" (ad075/076) and "Zierde für jeden Salon" (ad172) are coded *home*.
  - **I1** out of *affordability*. I put prices, terms and discounts in the functional list. The editor's category includes them (17 of 24 ads), e.g. "avec 25 0/0 de rabais" (ad044), "Vraagt onze speciale Aankoop Voorwaarden" (ad063).

## 5. Candidate new topics (no editor counterpart), with ads for checking

These are ordered by how strongly I would recommend examining them. "Absorbed" means that in some ads the earlier Claude pass stretched an existing category over these passages: evidence that the taxonomy has no slot for them. The editor's own (`#np`) spans almost never touch these passages; the exceptions are ad009/010 → *educational_use* and ad005 "Man muss das Wunder gehört haben" → *miracle*.

1. **G5 The machine as concert performer** (28): a public concert or soirée whose programme credits each piece to an absent pianist ("Spillet af", "am Flügel", "Gespielt von", "CONCERTO PELO GRANDE PIANISTA PADEREWSKI"), including hybrids with live performers and composers playing their own works.
   *Ads:* 005 008 045 046 047 048 077 079 084 120 127 132 133 136 137 139 140 142 158 159 160 167 168 175 187 188 189 200.
   Six of these ads have no editor span at all (047, 048, 077, 084, 188, 189). Where they are annotated, Claude put the programme lines under *virtual_presence* (ad120, 127, 159, 160, 167, 168). This is the clearest gap: a strongly period-specific frame (P1 26 % vs P2 8 %).
2. **Authority and proof** — the whole group E is absent from the taxonomy, which codes the *content* of a testimonial (miracle, invention …) but not the persuasive *device* or *source*:
   - **E1 Quoted testimonials** (43): 005 008 009 010 014 015 032 035 037 041 049 065 075 082 088 089 100 101 116 117 130 131 139 140 143 148 151 158 165 169 170 171 172 175 177 178 179 185 192 205 208 211 212.
   - **E2 Collective acclaim & world fame** (38): 005 008 009 012 033 034 035 058 067 069 076 091 092 093 096 097 099 100 101 105 106 109 112 117 147 148 151 170 172 176 178 185 201 204 205 210 211 212. Partly absorbed into *superiority* (ad204 "de fama universal") and *popular* (ad058).
   - **E3 Institutional recognition** (14): 004 005 008 022 025 045 046 067 102 116 117 169 184 207. Conservatory cases sit in *educational_use*; medals are under *superiority* (ad117, ad207, Claude).
   - **E4 Royal & aristocratic patronage** (11): 003 010 033 041 070 071 103 165 195 196 209. Not annotated as such anywhere: ad041 has no spans; ad165 is only *repeatability*; ad209 is *listening* and *superiority*.
   - **E5 Satisfied owners / social proof** (10): 029 030 040 073 117 170 171 172 176 205.
   *Suggestion:* rather than adding five topics, the editor might add a second, small taxonomy of **persuasive devices / sources of authority** (testimonial, collective acclaim, institution, court, owner, press), orthogonal to the motif taxonomy.
3. **F4 Originality & priority** (21): "The Original …", "the first", patents, "Origineele vinding".
   *Ads:* 001 014 016 017 018 019 020 026 027 028 032 033 061 066 068 105 106 109 112 117 169.
   Almost only post-war (H-a1): the licensee-vs-original contest. Claude-absorbed into *technical_invention* (ad061, ad117) and *superiority* (ad105, ad112).
4. **B2 The counterfactual past** (10): "if only it had existed for Liszt/Chopin/Beethoven".
   *Ads:* 009 010 088 100 101 130 131 151 175 211.
   Could be a sub-category of *immortality* (it is the backward-looking twin of posterity). It is a strong testimonial formula, almost entirely pre-war (9 of 10).
5. **D5 Status, refinement & culture** (13): "vornehmes Heim", "A visible token of culture", "representación evidente de su cultura musical", "pardonable pride".
   *Ads:* 030 031 037 040 145 170 182 185 186 195 198 205 209.
   It touches *hostess* and *sitting_woman* but is not the same: it is about distinction, not gender or sociability.
6. **J1 The modest name** (9): Paderewski's, Saint-Saëns's, Leschetizky's and Carreño's quips about the name "Mignon".
   *Ads:* 005 088 100 169 175 205 208 211 212.
   No spans in any of these ads cover the quip. It is a small but highly characteristic and transnational formula (de, da, pl, es).
7. **F7 Electricity & technical modernity** (36; about 10 argumentative): "Drives ved Elektromotor; kan tilkobles hvilkensomhelst Lysledning", "Ya llegó el día de tener Música eléctrica perfecta".
   *Ads:* 018 049 060 064 065 066 067 069 070 075 076 080 082 083 085 099 100 101 107 115 119 121 122 130 131 136 137 138 142 149 152 157 159 160 199 201.
   Claude-absorbed into *technical_invention* (ad075, 076, 119; also ad050). Markedly market-specific: Scandinavian, Dutch and Iberian ads (H-b3–b5).
8. **J2 National & local pride** (13): "Deutschem Erfindungsgeist", "Erzeugnis der heimischen Industrie", "fait honneur au nom canadien", local composers recording their own works.
   *Ads:* 007 009 034 077 082 112 119 158 165 176 192 200 210.
9. **C3 Hearing is believing** (18): the reader is challenged to test the claim ("Interessiert Sie der Versuch?", "Hear it—in comparison", "Man muss das Wunder gehört haben, um es zu glauben").
   *Ads:* 005 017 026 027 028 030 033 035 040 117 130 131 143 148 151 175 186 202.
   Where annotated at all, the editor and Claude code these passages as *miracle*.
10. **D6 Furniture & ornament** (12): 006 013 017 018 031 067 075 076 135 145 172 208.
11. **G3 Dual use & unobtrusive integration** (30): a broadening of *invisibility* (6). Ads: 002 013 014 016 018 019 020 021 022 023 024 026 027 028 033 049 064 065 082 083 097 099 130 131 145 153 154 157 190 213.
12. Smaller ones, which the editor may well judge too weak:
    - **I2 Quality & durability** (8): 004 006 135 165 169 171 172 205.
    - **I3 Gift & seasonal occasion** (7): 026 028 038 052 134 170 183.
    - **F6 Heritage & founder legend** (8): 004 011 019 033 034 037 100 101.
    - **G2 Uses beyond the private home** (8): 009 022 025 067 090 148 150 151 (hospitals, sanatoria, hotels, ballet). This broadens *artistic_accompaniment*.

A curiosity found along the way: **ad205 (Havana 1919) prints a testimonial attributed to Liszt** ("Estoy admiradísimo"), and ad117 shows his portrait among the "célebres Artistas". Liszt died in 1886, so this is worth a note in the edition.

## 6. Granularity and label wording

- **Shape.** The editor's taxonomy has 32 categories with a long tail: 6 categories are used in ≤ 3 ads, 3 of them in a single ad. My induced list has 40 topics with a floor of about 7 ads. The tail is the clearest fingerprint of the two procedures. Close reading creates a category when *one* passage is historically telling; frequency-based induction removes it.
- **Emphasis.** The editor's scheme is deep on **experience and reception**: listening, atmosphere, sitting woman, hostess, virtual presence, phantom body, soulfulness. Several of its labels are media-theoretical concepts ("Virtual Presence", "Phantom Body"). The blind induction is deep on **persuasion, commerce and brand**: authority sources (E1–E5), originality (F4), heritage (F6), electricity (F7), value and occasion (I1–I3), the concert format (G5) and paratextual formulas (J1, J2). Put simply, the editor asks *what experience is promised*; the LLM also asks *who vouches for it, in what format, and against which competitor*.
- **Label style.**
  - The editor mixes analytic terms ("Virtual Presence", "Analysis", "Atmosphere") with **period phrases** ("Touch of a Button", "Suit every Mood", "Hostess", the "Ideal" of "unerreichte Ideal").
  - My labels are descriptive paraphrases, often **double-barrelled** ("Wonder, miracle, magic", "Status, refinement & culture"). This is a symptom of unresolved granularity: an LLM tends to name a topic by listing its members.
  - Several pairs say the same thing in different registers: "Exact Reproduction" / "Faithful reproduction"; "Distinction from Mechanical" / "Not mechanical"; "Virtual Presence" / "Presence illusion"; "Soulfulness" / "The artist's soul / living art"; "Immediate Recognizability" / "Artist verification".
  - In one case the editor's label is the more precise one: "Revelled Listening" names a posture that my "domestic comfort" only half-captures.
- **Recommendation.** If any of the candidates are adopted, it is worth (a) keeping the editor's preference for short, period-flavoured labels; (b) adding a `<desc>` coding rule to each category, since only 6 of 32 have one and the earlier Claude pass had to guess at boundaries (see *superiority* and *popular*); and (c) deciding explicitly whether functional content (prices, terms) belongs in the topic taxonomy (*affordability* currently mixes both).

## 7. Reflection on the method

**What the blind induction does well**
- It recovers the editor's core quickly and with high agreement: the 7 matches at κ ≥ 0.67, and all big categories covered at ≥ 64 %. Fidelity, presence, immortality, distinction from the mechanical, home, education and photography emerge without any prompting.
- It covers the **whole corpus evenly**, including Danish, Polish, Russian and Catalan ads and the unannotated concert programmes. It also surfaces patterns that are easy to miss when reading ad by ad: device-level regularities (testimony, social proof), transnational formulas (J1, B2) and recycled copy (Stage 2, H-b7).
- It yields **contrastive** hypotheses cheaply (Stage 2), several of which look historically substantive: "novelty → brand contest", the domestication of the 1920s, and the absence of posterity rhetoric in the Scandinavian market.

**What it misses**
- **Theory-driven or iconographic categories** that a reader brings to the material: Revelled Listening, Sitting Woman, and Secret as a motif rather than a wording.
- **Deliberate singletons**: jazz, phonograph, accompaniment.
- **Nuance of register** in favour of broad bins: my C1 swallows "wonderful", where the editor's *miracle* is strict.
- Visual topics depend entirely on the prose descriptions of the figures.

**Reproducibility**
- This was one pass, by one model, in one reading order. Label wording, merge decisions and the cut at 40 would all vary between runs.
- My guess is that the large topics (A1, B1, C1, D1, F2, A5, A4, G1) are stable and that the small ones (H1, I3, J1, F6) are not. That should be tested: 3–5 independent runs with shuffled order (and ideally a second model family), then matching topics across runs and reporting which survive.
- The counts rest on my own coding with a keyword recall check. A precision pass already removed 14 wrong assignments, which shows the error rate of single-pass LLM coding is not negligible. A proper TopicGPT assignment step (the LLM judging every ad × topic separately, quoting its evidence) and an inter-annotator check against editor-only spans would be needed before any numbers go into a publication.

**The circularity caveat**
- The same model family (Claude) had already assigned **436 of the 647** existing spans using the editor's taxonomy. Agreement between a blind Claude induction and those spans is therefore **not independent validation**: shared model priors about what is salient could produce agreement without either being "right".
- Two observations soften this somewhat, but do not remove it.
  - First, my blind topics cover the editor's own and unattributed spans **better (180 of 189 category–ad pairs, 95 %)** than the Claude-assigned spans **(319 of 390, 82 %)**. The blind induction is not simply reproducing the earlier Claude pass. The editor's own spans, however, sit mostly on the richest, most salient passages, which are the easiest to recover.
  - Second, where the taxonomy had **no slot**, the earlier Claude pass **stretched** existing categories: concert programmes became *virtual_presence*, electricity and patents became *technical_invention*, medals and "world-famed" became *superiority*, salon ornament became *home*, and the counterfactual past became *immortality*. The blind induction instead **created** new slots for exactly these passages (G5, F7, F4, E2/E3, D6, B2). This convergence on the *gaps* is informative even though both passes come from the same model family.
- The honest reading is that the pilot shows **what an LLM finds salient** in this corpus, and where that differs from the editor. It does not show that either taxonomy is correct. Independent validation would need the editor (or a second human) to code a sample of ads blind with the merged taxonomy, plus a different model family for comparison.

**Bottom line for the report**
LLM-based concept induction is a useful *second reader*. In a few hours it reproduced most of the hand-made taxonomy's core. It proposed a handful of well-evidenced additions: the concert format; an authority / persuasive-device layer; originality; the counterfactual past; status; the "modest name" formula; electricity as a market-specific appeal. And it generated testable period and market contrasts. It is weaker exactly where close reading is strongest: concepts imported from theory, iconography, and historically telling singletons. Its counts and boundaries need human validation and multi-run stability checks before they can be cited as findings.
