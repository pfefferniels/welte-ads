# Pilot: automatic topic discovery with multilingual sentence embeddings

*Welte-Mignon Advertisements Collection, 195 TEI files, 12 languages. Pilot run on 24 October 2026. Scripts are in `pilot_code/`. Small result files are in `pilot_code/outputs/`.*

## In short

- **Embeddings sort the ads mainly by function, not by rhetoric.** Of the 50 clusters found by BERTopic, I judged 19 to be rhetorical motifs, 18 functional content (addresses, firm lines, dates, prices, invitations, artist lists), 10 figure descriptions and 3 mixed. 60% of the units in the rhetorical clusters carry a hand topic. In the functional clusters the share is only 9.8%.
- **The discovered clusters agree with the hand taxonomy, but not closely.** Comparing clusters with hand topics gives NMI 0.365, against 0.212 when the same labels are shuffled at random. The adjusted Rand index (ARI) is only 0.04 (0.14 without HDBSCAN noise). Five hand topics come out as coherent clusters: *educational_use*, *phantom_body*, *affordability*, *secret* and *sitting_woman*. The big topics (*exact_reproduction*, *superiority*, *home*, *virtual_presence*, *touch_of_a_button*) are spread over 12–17 clusters each. *personality* and *immediate_recognizability* end up inside an *exact_reproduction* cluster.
- **Candidate new topics** (clusters that match no hand topic): **endorsement by famous musicians**, **size of the roll library and the number of recording artists**, **"available in 115 makes of piano"** (compatibility and choice), **originality and patents**, and **the public concert or demonstration as an event**. Reading the clusters, and then searching by keyword, also turned up **royal and aristocratic patronage** (ad165, ad041, ad010). Clustering did not find that one.
- **As an annotation assistant the method is useful.** It found the same sentence annotated in one ad but not in another. Example: *"The Master's Fingers on Your Piano"* appears in 14 ads, is annotated in 3, and gets two different topics there. Another 22 near-duplicate sentence pairs carry a topic on one side only. Precision of "seeded" retrieval of missed annotations: 23/50 top-5 hits are plausible, and 10 of those 23 are the same slogan. Retrieval works for topics with clear wording (*technical_invention* 5/5, *superiority* 4/5) and fails for abstract scene-like topics (*home* 0/5, *touch_of_a_button* 0/5).
- **The hand categories are fairly separable when the span itself is embedded.** A leave-one-out 5-NN classifier on the annotated spans reaches 0.615 (mpnet) and 0.676 (bge-m3), after removing neighbours from the same ad and near-duplicates. The majority baseline is 0.172. The pairs most often confused are *exact_reproduction* with *virtual_presence*, *immortality*, *personality* and *superiority*, and *superiority* with *unreached_ideal*. If the whole sentence around a span is embedded instead, accuracy drops to 0.44: the topics are properties of spans, not of sentences.
- **Translated copy is rare. Reused copy within one language is common.** LaBSE finds only 11 cross-language sentence pairs that are true translations (22 units, 1.5%), mostly testimonials (de↔da, sv↔pl, de↔pl) and one fully translated pair of ads (ad108 en ↔ ad191 fr). In contrast, 13–17% of the text units repeat a sentence from another ad in the same language almost word for word. Two clusters are driven by such repetition (the Heintzman firm signature and the "Master's Fingers" slogan).
- **There is a clear shift over time.** In 1905–1914 the ads feature concerts and dates (35.7% of ads vs 7.2% in 1917–1929), testimonials admiring the inventors (12.9% vs 0%) and "the most remarkable invention" (11.4% vs 0%). In 1917–1929 they feature salon scenes in the illustrations (1.4% → 19.2%), street addresses, the dealer network, prices and terms, and phantom hands. The hand topics show the same shift: *affordability* 1.4% → 18.4%, *phantom_body* 0% → 12.0%, *technical_invention* 30.0% → 12.8%, *distinction_from_mechanical* 17.1% → 4.0%. Part of this comes from a few advertisers' series (the Auto Pneumatic Action Co. alone has 15 late ads).
- **Editor and LLM annotations:** there is no evidence that the LLM labels are less compatible with the editor's. Once neighbours from the same firm are excluded, editor spans are predicted *better* from LLM references (0.432 / 0.492) than from other editor spans (0.329 / 0.411). Without that exclusion the editor's own consistency looks high, mostly because 70 of the 183 editor spans come from one advertiser's series of ads.

---

## 1 Setup

### 1.1 Units (step 1)

`01_extract_units.py` re-extracts the text from `tei/ad*.xml`. It keeps track of which topic span covers each character, so it knows exactly which sentence overlaps which topic span.

- **Text read:** only `<text>/<body>`. Skipped: `<note>`, `<gap>` (and its `<desc>`), and every `<rdg>` of an `<app>` except the first. Figure descriptions become units of their own.
- **Boundaries:** block elements (`div`, `head`, `p`, `ab`, `item`, `list`, `signed`, `address`, `lg`, …) are hard boundaries. `<lb/>`, `<addrLine>`, `<l>`, `<cb/>` and `<pb/>` are soft line breaks.
- **Dehyphenation at `<lb/>`:** the extractor checks the corpus vocabulary, built without the halves of words broken at line ends. A hyphenated form that occurs elsewhere keeps its hyphen. A capital after the hyphen keeps it too (*Welte-*|*Mignon*, *Klavier-*|*Abteilung*). In lines set in capitals, the hyphen is kept only if both halves are words. Otherwise the parts are joined. Result: 559 line-end hyphens, 497 joined and 62 kept (log in the scratchpad: `hyphenation_log.json`). Remaining errors are rare and harmless for embeddings, for example *soulexpression*.
- **Sentence splitting:** at `. ! ? …` (including `. . . .`), not after abbreviations, initials or numbers. Units longer than 45 words are split again at `; : —` (clause level).
- **Short units:** 2,310 text units, of which 817 have fewer than 4 words. They were set aside: 1,489 words, 6.8% of the 21,904 words in text units. Examples: `Richard Strauss.`, `Zürich Sonnenquai.`, `£575 (not £1150)`, `WELTE TERMS`. 18 topic spans lie only in such short units, for example ad011 "Convenient Terms", ad093 "i Hjemmet" and ad029 "Phantom Fingers.".
- **Kept:** 1,493 text units (median 11 words, maximum 89) plus 184 figure-description units. The 184 are the 183 `<figure>` elements plus one `<desc>` placed directly in a `<seg>` (ad024). Languages of the text units: en 748, de 312, es 81, sv 76, nl 74, fr 53, no 49, da 45, pl 24, ru 16, ca 9, pt 6.
- **Taxonomy:** `tei/shared/encoding.xml` holds 32 topic categories (the brief said 33); all 32 occur in the spans.
- **Topics on units:** 513 of the kept text units overlap a topic span, and 36 figure units carry a topic. That makes 549 of the 1,677 units (32.7%). A `<seg>` that wraps a `<figure>` gives its topic to the figure unit (5 cases).
- **Spans:** 647 topic spans in total. 646 are used: one, ad050#0, lies in a non-first `<rdg>`. Median span length: 9 words (editor) and 7 words (LLM).
- **Ids:** `ad021.2` is ad021, unit 2 (counting from 0). `ad021.f0` is its first figure description. `ad014#0` is the first topic span of ad014.

### 1.2 Models and parameters

Software: Python 3.13.17, torch 2.14.1+cpu, sentence-transformers 6.2.0, transformers 5.20.2, bertopic 0.17.4, umap-learn 0.5.12, hdbscan 0.8.44, scikit-learn 1.9.1, numpy 2.5.4.

**Embedding models (step 2)**, all L2-normalised, `max_seq_length` 256, run on 4 CPUs:

| key | model | dim | time for 1,677 units |
|---|---|---|---|
| mpnet (main) | `sentence-transformers/paraphrase-multilingual-mpnet-base-v2` | 768 | 33 s |
| e5 | `intfloat/multilingual-e5-base`, prefix `query: ` | 768 | 31 s |
| bgem3 | `BAAI/bge-m3`, dense vectors only | 1024 | 183 s |
| labse | `sentence-transformers/LaBSE`, used only for step 6 | 768 | 99 s |

**Clustering (step 3):**
- BERTopic with UMAP (`n_neighbors=15, n_components=5, min_dist=0.0, metric=cosine, random_state=seed`) and HDBSCAN (`min_cluster_size=10, min_samples=5, eom`). Seeds 0, 1 and 2, plus `min_cluster_size` 6 and 15 with seed 0.
- KMeans with k=30 (`n_init=10`, seeds 0–2) and agglomerative Ward with k=30.
- Keywords by class-based TF-IDF (c-TF-IDF, BERTopic's formula), with stop words for 12 languages (`stop-words` package, scikit-learn's list for English) plus a few historical forms (*paa, af, hvad, zoo …*).
- The main run is **mpnet, BERTopic seed 0, min_cluster_size 10** (`bt_s0_m10`). A rerun reproduced all 9 runs label for label.

### 1.3 Historical spelling (step 2 note)

All three main models share the XLM-R tokenizer, so subword fragmentation is the same for each. Subword tokens per word: en 1.60, es 1.60, de 1.87, fr 1.86, da 1.86, no 1.96, nl 2.01, sv 2.08, pl 2.19, ru 2.75. Russian (pre-1918 spelling with ъ, ѣ, і) is fragmented the most.

I tested 8 real corpus sentences against modernised versions I wrote by hand (`09_spelling.py`). Each version was compared with an English gloss of the sentence:

| unit | historical → modern | mpnet: cos to English, hist / modern |
|---|---|---|
| ad122.3 ru | *иллюзіей ихъ … въ передачѣ* → *иллюзией их … в передаче* | 0.819 / 0.833 |
| ad088.6 da | *Man maa … Opfindelse … kunde* → *Man må … opfindelse … kunne* | 0.921 / 0.970 |
| ad150.1 sv | *erkändt bästa själfsp. pianino* → *erkänt bästa självspelande piano* | 0.800 / 0.990 |
| ad049.11 nl | *beleefdelijk uitgenoodigd* → *beleefd uitgenodigd* | 0.715 / 0.884 |

Over all 8 sentences the mean cosine to the English gloss is 0.849 for the historical forms and 0.902 for the modern ones (bge-m3: 0.864 / 0.903; LaBSE: 0.850 / 0.882).

So historical spelling costs about 0.04–0.05 cosine on average. Pre-reform Russian hardly matters. Abbreviations hurt most (*själfsp.* = *självspelande*), and so do Dutch spellings with double vowels or *-lijk*. Note that my modern version of ad150.1 also expands the abbreviation and changes *pianino* to *piano*. Normalising spelling would be a small improvement, not a precondition.

---

## 2 Unsupervised discovery (step 3)

The main run found **50 clusters**. **445 of 1,677 units (26.5%) are noise**, i.e. assigned to no cluster.

**Stability across seeds:**
- On units that are clustered in both runs, the clusters are very stable: ARI 0.944 (seed 0 vs 1), 0.957 (0 vs 2) and 0.890 (1 vs 2). The median best-match Jaccard of a cluster is 0.79–0.85, and 73–86% of clusters have a match with Jaccard ≥ 0.5.
- Counted over all units, ARI is only 0.54–0.58, because the noise set changes: 445, 396 and 350 noise units.
- `min_cluster_size` 6 gives 85 clusters and 15 gives 36. The coarser clusters are mostly unions of the finer ones.
- KMeans with k=30 is *not* stable: ARI 0.39–0.43 between seeds, median best-match Jaccard 0.34–0.41. Agreement between KMeans and Ward: ARI 0.33.
- **Functional and figure clusters are very stable** (best Jaccard in the other seeds usually ≥ 0.8). **Several rhetorical clusters are not.** Cluster 2 scores 0.35 / 0.96 in seeds 1 / 2, cluster 33 0.23 / 0.41, cluster 36 0.93 / 0.23, cluster 44 0.19 / 0.00 and cluster 45 0.34 / 0.11.
- The meaning: the "rhetorical middle" of the corpus is a continuum, which HDBSCAN cuts differently from run to run. Only formulaic text forms dense, repeatable islands.

### 2.1 Rhetorical clusters

The labels are mine, written after reading each cluster's keywords and sentences. When I wrote them I could see the hand-topic counts, so the "rhetorical vs functional" typing is not independent of the hand annotation. "Topic" is the number of members that carry a hand topic. "Stable" is the best Jaccard in seed 1 / seed 2.

| # | label | units / ads | languages | topic | top hand topics | stable |
|---|---|---|---|---|---|---|
| 2 | The artist's personal playing reproduced | 65 / 47 | de 28, en 13, nl 6 | 50 | exact_reproduction 28, personality 10 | 0.35/0.96 |
| 5 | Named star pianists brought to you / your home | 42 / 37 | en 24, de 5, fr 3 | 27 | exact_reproduction 12, home 7 | 0.98/0.86 |
| 6 | Reproduces the actual playing of the great pianists | 38 / 29 | en 23, de 5, sv 4 | 28 | exact_reproduction 13, technical_invention 5 | 0.54/0.75 |
| 11 | Wonder / miracle; enthusiastic testimonials (German) | 28 / 21 | de 21, en 5, da 2 | 10 | miracle 7, technical_invention 3 | 0.76/0.30 |
| 13 | Testimonial headers ("Opinions of the world's famous musicians") | 24 / 18 | en 16, es 5, de 2 | 6 | analogy_to_photography 2, exact_reproduction 2 | 0.62/0.88 |
| 15 | The interpretation of the world's greatest pianists | 23 / 17 | en 20 | 14 | exact_reproduction 6, educational_use 5 | 0.79/0.74 |
| 20 | "When Phantom Fingers Play" | 18 / 12 | en 14, nl 2 | 11 | phantom_body 8, suit_every_mood 2 | 0.95/0.95 |
| 22 | The most famous pianists play for you / are at your command | 17 / 17 | en 11 | 9 | touch_of_a_button 3, miracle 2 | 0.25/0.79 |
| 28 | Hearing them as if present | 16 / 11 | en 10, de 3, es 2 | 9 | virtual_presence 5, listening 2 | 0.82/0.84 |
| 29 | Speechless astonishment, silence | 15 / 11 | en 7, de 4, sv 2 | 10 | miracle 3, touch_of_a_button 2 | 1.00/0.65 |
| 33 | Low prices and easy terms | 15 / 14 | en 10 | 9 | affordability 9 | 0.23/0.41 |
| 34 | Recording artists and the size of the roll library | 15 / 10 | en 13 | **1** | listening 1 | 0.81/1.00 |
| 36 | "Only Welte-Mignon possesses the secret of perfect reproduction" | 14 / 14 | en 14 | 10 | exact_reproduction 8, secret 5 | 0.93/0.23 |
| 37 | Hearing the world's first pianists in your own home | 14 / 13 | en 7, de 3 | 11 | home 8, virtual_presence 3 | 0.61/0.65 |
| 40 | "The Master's Fingers on Your Piano" (slogan) | 12 / 11 | en 12 | 7 | virtual_presence 4, listening 2 | 0.46/0.92 |
| 43 | Pedagogical value; Vienna Conservatory | 11 / 10 | de 9, en 1, pl 1 | 9 | educational_use 8 | 0.91/0.48 |
| 44 | Entertaining guests in the salon | 11 / 11 | en 5, de 3, no 2 | 8 | home 3 | 0.19/0.00 |
| 45 | Admiration for the inventors (testimonials) | 10 / 9 | de 8, en 2 | **3** | superiority 2, technical_invention 1 | 0.34/0.11 |
| 46 | "The most remarkable musical invention of our age" | 10 / 8 | en 6, de 1, nl 1 | 7 | technical_invention 6 | 1.00/0.50 |

Representative sentences, taken from the members closest to each cluster's centroid:

- **c2:** `ad099.3` (da) *"Dets Gengivelse af Kunstnerens Spil er saa nøjagtigt og fuldendt, som sad han selv foran Instrumentet"*. `ad005.16` (de) *"… das Klavierspiel eines Künstlers mit all' seinen persönlichen Eigenschaften – des Anschlags, der Phrasierung, des Pedalgebrauchs etc."*
- **c6:** `ad145.3` *"This beautiful instrument reproduces with marvellous fidelity the actual personal playing of the great Master Pianists."* `ad211.1` (pl) *"ten sensacyjny reprodukcyjny fortepian wzbudza z powodu dokładnego oddawania gry pierwszorzędnych pianistów podziw świata muzycznego."*
- **c20:** `ad104.0` *"Rhythmic Beat of a Gaucho Dance —When Phantom Fingers Play"*. `ad026.7` *"Their phantom fingers perform, again, at your command."*
- **c28:** `ad122.3` (ru) *"съ полной иллюзіей ихъ личной игры можно слышать въ передачѣ"*. `ad117.10` (es) *"… tal como si él estuviese presente, ejecutando su poderío para usted."*
- **c29:** `ad148.3` (sv) *"Den som hört det, står stum inför detta under — —»."* `ad049.10` (nl) *"Inderdaad de illusie is volkomen, sluit men de oogen dan is het of men de Personen zelf hoort"*
- **c33:** `ad099.6` (da) *"Vore Priser er de billigste, vore Betalingsvilkaar yderst kulante og vor Garanti den mest betryggende"*. `ad190.6` *"* Prices and Terms within the Reach of All."*
- **c37:** `ad086.2` (da) *"byder Muligheden at høre Verdens første Pianister i Ens eget Hjem."* `ad143.1` *"In the privacy and comfort of your home with your intimate friends around, you can summon in an instant the Master Pianists of the World …"*
- **c43:** `ad008.11` (de) *"… beweist ihr Gebrauch im K. K. Konservatorium in Wien zu Studienzwecken."* `ad212.4` (pl) *"Wynalazek ten ma nie tylko wielką doniosłość artystyczną, ale również zarazem i pedagogiczną."*
- **c44:** `ad145.5` *"An ideal Instrument for homes where frequent social functions demand much entertaining, the WELTE will interest your guests and relieve the strain of hospitality."* `ad076.2` (no) *"Ved sit elegante Ydre en Pryd for enhver Salon."*
- **c46:** `ad041.11` *"The Welte-Mignon is, without doubt, the most remarkable musical invention of our age."* `ad210.2` (pl) *"Najsłynniejsi artyści uznają „Mignon“ za wynalazek epokowy …"*

The rhetorical clusters are genuinely multilingual: c2 groups German, English, Dutch, Danish and Norwegian sentences, and c43 groups German with Polish. That is the main advantage over word-based topic models for this corpus.

### 2.2 Functional, figure and mixed clusters

| type | clusters (units) |
|---|---|
| functional (18 clusters, 583 units, 9.8% with a hand topic) | c0 firm, agent and place lines (156), c1 product-name lines (90), c3 street addresses (47), c4 concert and demonstration dates (42), c10 dealer formulae (28), c16 "see / hear it" calls (22), c17 buying and terms (21), c18 "visit our music salon" (20), c19 invitations, free catalogue (18), c23 "The Auto Pneumatic Action Co., W. C. Heaton, President" (17), c24 pianos on display, trade-in (16), c25 artist name lists (16), c26 "Licensed under the original Welte-Mignon patents" / "dealers everywhere" (16), c27 Havana agent John L. Stowers (16), c31 "Write for the beautiful brochure" (15), c32 "Ye Olde Firme Heintzman & Co." (15), c35 product categories (15), c38 "obtainable in 115 makes of pianos" (13) |
| figure descriptions (10 clusters, 182 units) | c8 drawings of grand pianos (37), c9 / c14 / c39 portraits of pianists (31 / 23 / 13), c12 salon scenes with a woman at the piano (26; listening, sitting_woman), c41 frames and logos (11), c42 phantom hands (11; phantom_body 7), c47 woman in an armchair (10; sitting_woman 5), c48 the cabinet player / Vorsetzer (10), c49 exhibition medals (10, from 2 ads) |
| mixed (3 clusters, 69 units) | c7 product statements ("can be installed in your grand piano"), c21 daily demonstrations / "whenever you wish", c30 "greatest wonder of the age" / "can no longer perish" |

The figure descriptions are English prose by the editor or the LLM, whatever the ad's language. Their clusters therefore follow the *describer's* vocabulary ("Portrait of …", "A woman seated …") rather than the ad's. They are best clustered separately, or used to check the visual topics (*sitting_woman*, *phantom_body*, *listening*).

---

## 3 Comparison with the hand taxonomy (step 4)

### 3.1 Agreement figures

Computed on the 549 units that carry a topic. When a unit overlaps several topics, it is labelled with the topic covering most of its characters. The "shuffled" figure is the mean NMI over 200 random permutations of the topic labels; NMI rises with the number of clusters even for random labels, so this is the fair reference point.

| run | NMI | NMI shuffled (99th pct) | NMI excl. noise (shuffled) | ARI (excl. noise) | NMI with language, text units (shuffled) |
|---|---|---|---|---|---|
| mpnet BERTopic | **0.365** | 0.212 (0.231) | 0.475 (0.275) | 0.040 (0.144) | 0.153 (0.064) |
| mpnet KMeans k=30 | 0.322 | 0.170 (0.186) | – | 0.081 | 0.112 (0.043) |
| mpnet Ward k=30 | 0.330 | 0.169 (0.186) | – | 0.070 | 0.125 (0.043) |
| e5 BERTopic | 0.305 | 0.203 | 0.404 (0.264) | 0.008 (0.058) | **0.380** (0.062) |
| bge-m3 BERTopic | 0.345 | 0.186 | 0.460 (0.239) | 0.054 (0.168) | 0.159 (0.059) |

The agreement is clearly above chance, about 0.15–0.20 NMI higher, but weak: ARI never exceeds 0.17. e5 clusters depend much more on language (NMI with language 0.38). Language matters less for mpnet and bge-m3 (about 0.15).

### 3.2 What happens to each hand topic (mpnet BERTopic)

"Units" counts every unit that overlaps the topic; a unit with two topics counts once for each. The full table is in `outputs/contingency_mpnet_bt_s0_m10.csv`.

| hand topic | units | in noise | main clusters (units) | verdict |
|---|---|---|---|---|
| exact_reproduction | 113 | 32 | c2 28; c6 13; c5 12 (13 clusters in all) | split |
| home | 61 | 20 | c37 8; c5 7; c8 6 (12 clusters) | split |
| virtual_presence | 50 | 17 | c28 5; c40 4; c2 4 (15 clusters) | split |
| superiority | 50 | 16 | c2 10; c1 4; c0 3 (17 clusters) | split |
| immortality | 46 | 26 | c2 7; c5 3; c15 3 | split, mostly noise |
| technical_invention | 42 | 14 | c46 6; c6 5; c7 4 | split; c46 is 86% this topic |
| touch_of_a_button | 33 | 8 | c5 4; c25 3; c22 3 (14 clusters) | split |
| miracle | 30 | 8 | c11 7; c30 4; c29 3 | partly (c11 is 70% this topic) |
| educational_use | 27 | 11 | c43 8; c15 5 | **recovered** (c43 is 89% this topic) |
| phantom_body | 27 | 7 | c20 8; c42 7 (figures); c40 2 | **recovered** |
| personality | 23 | 9 | c2 10 | **merged** into the exact_reproduction cluster c2 |
| affordability | 21 | 1 | c33 9; c24 3; c17 3 | **recovered** (c33 is 100% this topic) |
| distinction_from_mechanical | 18 | 13 | scattered | not found (72% noise) |
| listening | 14 | 1 | c12 5 (salon figures); c28 2; c47 2 | split, mainly visual |
| immediate_recognizability | 10 | 3 | c2 3 | merged into exact_reproduction |
| sitting_woman | 9 | 0 | c47 5; c12 4 (figures only) | **recovered** (visual) |
| invisibility | 9 | 8 | c29 1 | not found |
| secret | 7 | 2 | c36 5 | **recovered**, together with exact_reproduction |

Topics with fewer than about 10 units cannot form a cluster at `min_cluster_size=10` at all. That applies to *atmosphere*, *hostess*, *analysis*, *artistic_accompaniment*, *analogy_to_phonograph* and *jazz*, so this method cannot validate them.

### 3.3 Clusters that match no hand topic

19 of the 50 clusters have ≤ 10% of their members inside a topic span: c0, 3, 9, 10, 14, 18, 19, 23, 26, 27, 31, 32, 34, 35, 38, 39, 41, 48, 49. Most of them are functional, as expected. The interesting part is what else turns up.

**Candidate new rhetorical topics**

1. **Endorsement / testimonial (authority of named musicians).** Clusters c13 and c45, and much of c11. The hand topics mark *what* the testimonial says (*miracle*, *technical_invention*). The rhetorical act of citing a great name has no topic.
   - `ad131.12` *"OPINIONS OF THE WORLD'S FAMOUS MUSICIANS:"*
   - `ad175.7` *"Musikalische Grössen urteilen wie folgt:"*
   - `ad130.20` *"Testimonies by other famous Musicians may be seen on application."*
   - `ad008.7` *"Den Erfindern meine aufrichtige Bewunderung."*
   - `ad170.7` *"Annette Essipow: Ich gratuliere von Herzen den Erfindern, die der Menschheit diese schöne Erfindung geschenkt."*
   - `ad014.9` *"You have my unqualified endorsement."*

   c45 occurs only in 1905–1914: 9 of 70 early ads, 0 of 125 late ads.
2. **Size of the roll library and the number of recording artists.** Cluster c34: only 1 of its 15 members carries a hand topic.
   - `ad012.10` *"One hundred and fifty-six musicians have recorded more than five thousand selections for the Welte-Mignon."*
   - `ad006.14` *"There are over 5,000 record-rolls in the Welte repertoire."*
   - `ad025.0` *"A Veritable Army of Artists Record for Welte-Mignon"*
   - `ad023.13` *"A few more of over 200 Artists who record for Welte-Mignon (Licensee):"*

   Late only: 0 early ads, 10 late ads.
3. **Compatibility and choice ("in any piano").** Clusters c38 and c7.
   - `ad014.15` *"You can choose from 112 standard makes of pianos that now install the Welte-Mignon* Reproducing Action."*
   - `ad020.5` *"Select any piano you prefer but be sure the reproducing action is WELTE-MIGNON.*"*
   - `ad023.17` *"You can have this famous action installed in your own piano without messing the appearance or hindering manual playing."*

   This is the strategy of the licensee era: 0 early ads, 13 late ads. It is functional in form but makes an argument.
4. **Originality and legitimacy (the "original" Welte, patents, the founder's story).** Cluster c26 and the history passages in ad033.
   - `ad016.12` *"*Licensed under original Welte-Mignon patents"*
   - `ad033.25` *"Thus M. Welte & Sons were the originators of the idea of reproducing the playing of pianists, and were granted the original, basic patents …"*
   - `ad066.0` *"DE ORIGINEELE AUTOPIANO'S WELTE MIGNON"*

   At present this is folded into *superiority* or left unannotated.
5. **The public concert or demonstration as an event.** Clusters c4, c18 and c19.
   - `ad047.0` *"INVITATIE Mignon-Concert DINSDAG 27 OCT. des avonds 8 u. IN DE KLEINE ZAAL VAN HET CONCERTGEBOUW."*
   - `ad168.0` *"Mittwoch, den 19. Mai 1909, nachmittags 3 Uhr Welte-Mignon-Konzert im Konzertsaale der Pianofortefabrik R. Reutemann"*
   - `ad131.22` *"Public are cordially invited to DAILY RECITALS."*

   The form is functional, but historically it matters: concerts appear in 35.7% of early ads and 7.2% of late ads (c4).
6. **Royal and aristocratic patronage.** *Not* found by clustering: about 10 sentences in 6 ads, scattered over c0, c34, c44 and noise. I spotted it while reading c34 and c44 and confirmed it with a keyword search.
   - `ad165.6` *"Ihre Königliche Hoheit erinnern sich mit wehmütiger Freude der Befriedigung, mit welcher der heimgegangene Grossherzog den Tönen des Instrumentes gelauscht hat …"*
   - `ad041.4` *"How EDVARD GRIEG was Surprised by Kaiser Wilhelm II"*
   - `ad010.12–13` *"Hoflieferant Sr. Kgl. Hoheit des Prinzen Rupprecht von Bayern."*
   - `ad033.11` *"Dukes and statesmen … came from afar to listen and marvel at Michael Welte's astounding creation."*
   - `ad209.0` *"… en las mansiones aristocráticas de Europa …"*

   A minor motif of the same kind is **venues beyond the home**: `ad150.2` *"För hem, konsertsalonger, musikinstitut, sjukhus, sanatorier, klubblokaler, förstkl. restauranger …"*, `ad067.7`, `ad138.3` (Capitol Theatre). It is currently annotated *home* or not at all.

**Functional content** (useful as a map of the ad structure):
- addresses (c3, c27)
- firm, agent and signature lines (c0, c23, c32)
- product names (c1, c35)
- dates and times (c4)
- artist name lists (c25)
- brochures and catalogues (c31)
- invitations and demonstrations (c16, c18, c19, c10)
- prices, terms and trade-in (c17, c24; c33 overlaps *affordability*)
- the dealer network (c26, c38)

If the editor wants these as structural tags rather than topics, embedding clusters would pre-label them with high stability.

---

## 4 Taxonomy-guided ("seeded") retrieval and kNN (step 5)

### 4.1 Retrieval of possible missed annotations

For each of the 10 most frequent topics, every **unannotated** kept text unit (980 units) was scored. Two scores were used:
- **(a) plain:** the mean of its 3 highest cosine similarities to the topic's annotated spans;
- **(b) contrastive:** score (a) minus the same score computed against the spans of all *other* topics.

I read the top 5 of each list and marked a hit as plausible if I would accept the unit as an instance of the topic.

| topic | (a) plain, top 5 | (b) contrastive, top 5 | plausible hits (unit ids) |
|---|---|---|---|
| technical_invention | 5/5 | 5/5 | ad130.0 / ad131.0 *"A GREAT MUSICAL INVENTION."*, ad005.26, ad041.11, ad130.15, ad170.7, ad008.7 |
| superiority | 4/5 | 4/5 | ad172.6 (same as annotated ad170.6), ad106.0 *"The Greatest Reproducing Piano"*, ad093.2, ad038.8, ad004.10 *"Höchste Auszeichnungen auf allen Weltausstellungen."*, ad153.0; ad033.48, ad169.7 at ranks 6–7 |
| immortality | 1/5 | 3/5 | ad027.1 *"These are the Phantom Hands of a thousand immortal pianists; their glorious genius preserved forever …"*, ad130.13 / ad131.11 *"The regret of Musicians must ever be that this great invention was not brought out in 1809 instead of 1909."*; ad100.19 at rank 8 |
| virtual_presence | 5/5 (one slogan) | 1/5 | "The Master's Fingers on Your Piano" in ad021, ad040, ad024, ad016, ad022; ad180.5 *"Er selbst könnte nicht anders spielen."* |
| phantom_body | 5/5 (same slogan) | 2/5 | the same slogan; ad028.0 *"Rhythmic beat of a Gaucho dance -when Phantom Fingers play"* |
| affordability | 1/5 | 3/5 | ad006.20 *"Pianos and Player-Pianos at the Prices You Expect to Pay"*, ad038.5, ad143.9 *"Catalogue and particulars of our Easy Terms on request."*, ad054.3 |
| miracle | 1/5 | 1/5 | ad100.7 *"Das Wunder, das ist „Mignon“ …"*; ad100.6 at rank 7 |
| exact_reproduction | 1/5 | 0/5 | ad176.0 *"Das persönliche Klavierspiel der grossen Meister … wird auf dem Reproduktions-Piano WELTE-MIGNON"* |
| home | 0/5 | 0/5 | ad145.6 *"… will add charm and dignity to the finest home."* and ad038.4 at contrastive ranks 6–7 |
| touch_of_a_button | 0/5 | 0/5 | – |
| **total** | **23/50 (46%)**, of which 10 are the one slogan | **19/50 (38%)** | |

**Why it fails:**
- **Hub sentences.** Generic sentences about "the world's famous pianists" are close to every topic. ad031.3 *"the greatest living pianists"* ranks first for *immortality*, the opposite of its meaning. ad136.2 *"An Extraordinary Exhibition of Piano Technique"* appears in four lists.
- **Fragments.** ad058.0 *"Als Reproductie Piano is de"* is a cut-off headline.
- **Lexical traps.** The contrastive score for *home* ranks ad135.0 *"The Man who Buys a Jerry-Built House"* (a metaphor about piano quality) and addresses *"opposite the Holland House"* at the top.
- **Shop formulas confused with the owner's experience.** For *touch_of_a_button*, the contrastive score finds dealer phrases like ad032.20 *"… a demonstration at any time"*.
- **What works:** topics with stable wording (*invention / Erfindung*, *finest / förnämsta / bester*, *price / terms*) and exact repetitions.

### 4.2 The same sentence, different annotation

Text units in different ads with cos ≥ 0.95 and at least 5 words: **245 pairs**.
- 65 pairs carry a topic on at least one side.
- 39 pairs have identical topics.
- **26 pairs differ**, and in 22 of these one side has no topic at all.

All 26 are listed in `outputs/retrieval_mpnet.txt` (last section). The ones worth checking:

- **"The Master's Fingers on Your Piano"** is in 14 ads: ad014, 015, 016, 020, 021, 022, 023, 024, 025, 029, 030, 033, 040 and 143. It is annotated *virtual_presence* in ad014 and ad020 (editor) and *phantom_body* in ad143 (LLM). Elsewhere it has no topic.
- `ad027.1` *"These are the Phantom Hands of a thousand immortal pianists …"* is unannotated. The same sentence carries *immortality + miracle + phantom_body* in ad026 and ad028 (editor, the same Auto Pneumatic series as ad027) and in ad104 and ad105 (LLM).
- `ad010.2` is the same sentence as `ad009.4` (*miracle*, "Wunderklavier") but has no topic.
- `ad172.6` = `ad170.6` / `ad171.3` (*superiority*): *"Nach meiner Ansicht übertrifft er alle anderen Erfindungen auf diesem Gebiete."*
- `ad175.11` = `ad100.10` (*educational_use*): *"Wie viel hätte „alt und jung“ daraus lernen können."*
- `ad028.0` = `ad104.0` (*phantom_body*). `ad100.9` = `ad175.10` (*miracle*).
- A translation pair with different topics: `ad108.4` *"Yes, but you can easily have one of these pianos in your home."* is *affordability*, while its French version `ad191.4` is *home*.
- `ad003.3` (*touch_of_a_button*) and `ad103.3` (*touch_of_a_button + virtual_presence*) are the same "Ein Druck auf den Knopf …" sentence with partly different topics.

This propagation check is the cheapest and most precise use of the embeddings for the edition.

### 4.3 Leave-one-out kNN classification of the annotated spans

Each span gets the topic with the most votes among its 5 nearest other spans. Votes are weighted by similarity, and a neighbour votes for all its topics. A prediction counts as correct if the predicted topic is one of the span's own topics.
- **Strict:** neighbours from the same ad and near-duplicates (cos ≥ 0.9) are excluded.
- **Sentence context:** the span is represented by the embedding of the unit that contains it.

| model | span text | span text, strict | sentence context, strict | majority baseline |
|---|---|---|---|---|
| mpnet | 0.661 (1-NN 0.717) | 0.615 | 0.444 | 0.172 (*exact_reproduction*) |
| e5 | 0.636 | 0.512 | 0.327 | 0.172 |
| bge-m3 | **0.718** (1-NN 0.752) | **0.676** | 0.463 | 0.172 |

Recall per topic (mpnet, strict):

| recall | topics |
|---|---|
| high (≥ 0.8) | *sitting_woman* 0.89, *home* 0.84, *exact_reproduction* 0.83 (helped by being the majority class), *affordability* 0.83, *phantom_body* 0.81 |
| medium | *technical_invention* 0.68, *miracle* 0.68, *superiority* 0.64, *immortality* 0.63, *touch_of_a_button* 0.54, *educational_use* 0.52, *virtual_presence* 0.46, *personality* 0.43 |
| low (≤ 0.35) | *distinction_from_mechanical* 0.35, *unreached_ideal* 0.33, *immediate_recognizability* 0.33, *secret* 0.29, *listening* 0.25, *soulfulness* 0.18, *popular* 0.17, *suit_every_mood* 0.14, *repeatability* 0.00, *entertainment* 0.00 |

**Most confused pairs** (mpnet, strict, number of errors):

| pair | errors |
|---|---|
| exact_reproduction ↔ virtual_presence | 15 |
| exact_reproduction ↔ immortality | 12 |
| exact_reproduction ↔ personality | 11 |
| exact_reproduction ↔ superiority | 9 |
| superiority ↔ unreached_ideal | 9 |
| educational_use ↔ exact_reproduction | 7 |

With bge-m3 the top pair is **superiority ↔ unreached_ideal (15)**, followed by exact_reproduction ↔ personality (12) and exact_reproduction ↔ virtual_presence (8).

So the "fidelity family" (*exact_reproduction*, *personality*, *virtual_presence*, *immediate_recognizability*, *soulfulness*) and the pair *superiority* / *unreached_ideal* ("the ideal instrument") are where the categories blur, semantically and possibly in the annotation too.

---

## 5 Cross-lingual reused copy (step 6)

For every pair of languages I took the sentences that are each other's best match across that language pair. There are 922 such pairs with mpnet and 992 with LaBSE. I then read them by cosine band.

**mpnet is a poor translation detector.** Among its pairs with cos ≥ 0.85 (both units ≥ 5 words), only **11 of 30 are real translations**. The rest are paraphrases of the same claim, which is what this paraphrase-trained model is built to bring together. Examples: `ad155.1` (sv) / `ad211.1` (pl) / `ad145.3` (en) all say "reproduces the playing of the great pianists"; there are also artist lists and dates.

| mpnet band (mutual best matches) | pairs | real translations in what I read |
|---|---|---|
| ≥ 0.95 | 3 | 3/3 |
| 0.90–0.95 | 8 | 4/8 |
| 0.85–0.90 | 19 | 4 of a sample of 12 |
| 0.80–0.85 | 65 | 0 of a sample of 12 |

**LaBSE** (built for finding translation pairs) is precise: **all 11 pairs with cos ≥ 0.80 are translations.**

| pair | content |
|---|---|
| ad108 (en, 1927) ↔ ad191 (fr, 1926) | 4 sentences: the Heintzman ad, translated in full; at lower similarity also the firm name and the addresses |
| ad088 (da, 1919) ↔ ad100 (de, 1908) | 3 testimonials, e.g. `ad088.6` *"Man maa kun beklage at denne Opfindelse ikke allerede blev gjort tidligere …"* / `ad100.8` *"Man kann nur bedauern, dass diese Erfindung nicht schon früher gemacht wurde …"*; also `ad088.4` / `ad100.6` |
| ad003 / ad103 (de) ↔ ad086 (da) | *"bietet die Möglichkeit, das Originalspiel der ersten Pianisten der Welt im eigenen Heim zu hören"* / *"byder Muligheden at høre Verdens første Pianister i Ens eget Hjem."*; also *"Ein Druck auf den Knopf genügt …"* / *"Et Trvk paa Knappen …"* |
| ad151 (sv, 1908) ↔ ad212 (pl, 1907) | Carreño's testimonial |
| ad169 (de, 1909) ↔ ad211 (pl, 1906) | Paderewski: *"Das einzige, was ich „Mignon“ vorzuwerfen habe, ist nur sein Name …"* / *"Jedyne, co „Mignonowi“ zarzucić mogę, jest jego nazwa …"* |
| ad077 (no) ↔ ad159 (sv) | programme formula *"Spillet af J. J. Paderewski."* / *"Spelad af J. J. Paderewski."* |

Ranking by margin score (similarity relative to each sentence's other close matches) adds a few looser translations: `ad049.10` (nl) ↔ `ad180.9` (de), the "close your eyes" quote, and `ad000.3` ↔ `ad205.14` (*"Call and hear it or write for catalogue"* / *"Pase a oirlos, o solicite catálogos."*). It also adds many pairs that do the same job but are not translations: tickets, daily demonstrations.

**How much is reused?**
- **Translations:** 22 of 1,493 kept text units (1.5%) are in a LaBSE translation pair. Translated copy is concentrated in the **testimonial pamphlets** of 1906–1919 (de → da, pl, sv) and in one bilingual Canadian campaign.
- **Same language:** **199–252 units (13–17%)** repeat a sentence of another ad almost word for word (cos ≥ 0.95: LaBSE 199, mpnet 252). Counting translation pairs too, 220 units are part of a "copy group" (LaBSE), holding 2,937 of 20,415 words (14.4%).
- **Effect on the clusters:** most clusters are *not* driven by reuse. In the main run, only c32 (*Ye Olde Firme Heintzman*, 15 units in 6 copy groups) and c40 (*Master's Fingers*, 12 units in 6 groups) have redundancy ≥ 0.5. c23, c3, c45, c31 and c26 come next, at 0.31–0.47. These are mostly the series of a single advertiser (Auto Pneumatic, Heintzman, Reutemann / Hug). For a "topic", count ads or copy groups, not sentences.

---

## 6 Change over time (step 7)

Two periods: 1905–1914 (70 ads, 8,084 words) and 1917–1929 (125 ads, 13,820 words). The table gives the share of ads with at least one unit in the cluster, or at least one span of the topic. p-values are from Fisher's exact test; q is the p-value adjusted for testing many clusters at once (Benjamini-Hochberg).

| cluster / topic | 1905–14 | 1917–29 | q |
|---|---|---|---|
| c4 concert and demonstration dates | 25 (35.7%) | 9 (7.2%) | 0.0001 |
| c45 admiration for the inventors | 9 (12.9%) | 0 | 0.0017 |
| c46 "most remarkable invention" | 8 (11.4%) | 0 | 0.0026 |
| c2 the artist's personal playing reproduced | 25 (35.7%) | 22 (17.6%) | 0.028 |
| c48 cabinet player (figure) | 8 (11.4%) | 2 (1.6%) | 0.026 |
| c11 wonder / miracle testimonials | 13 (18.6%) | 8 (6.4%) | 0.045 |
| c12 salon scenes with a woman at the piano (figures) | 1 (1.4%) | 24 (19.2%) | 0.0026 |
| c3 street addresses | 7 (10.0%) | 39 (31.2%) | 0.006 |
| c23 Auto Pneumatic signature | 0 | 17 (13.6%) | 0.004 |
| c38 "in 115 makes of pianos" / c26 "licensed under the original patents" | 0 / 0 | 13 / 13 (10.4%) | 0.026 |
| c40 "Master's Fingers" / c34 library size / c42 phantom hands (figures) | 0 / 0 / 0 | 11 / 10 / 10 | 0.038 / 0.045 / 0.045 |
| c33 low prices and easy terms | 1 (1.4%) | 13 (10.4%) | 0.053 |
| *affordability* | 1 (1.4%) | 23 (18.4%) | 0.007 |
| *phantom_body* | 0 | 15 (12.0%) | 0.021 |
| *distinction_from_mechanical* | 12 (17.1%) | 5 (4.0%) | 0.031 |
| *technical_invention* | 21 (30.0%) | 16 (12.8%) | 0.035 |
| *exact_reproduction* | 33 (47.1%) | 61 (48.8%) | 1.0 (stable) |
| *home* | 16 (22.9%) | 40 (32.0%) | 0.51 |

The picture is coherent. Before the First World War the Welte-Mignon is sold as an **invention and an event**: concerts, testimonials, astonishment, the pedagogical value. In the 1920s it is sold as a **domestic consumer product**: salon pictures, payment terms, dealers, a choice of 115 piano makes, phantom fingers. *exact_reproduction* is constant across both periods.

**Caveat:** the periods differ in composition.
- Early ads: de 28, en 14, sv 7. Late ads: en 52, nl 18, es 13.
- Single firms run long series: Auto Pneumatic has 15 late ads, Heintzman 8, Reutemann 9 early ads.

Several late-only clusters are one advertiser's campaign. The numbers describe this collection, not the market.

---

## 7 Editor (#np) vs LLM (#claude) annotations (step 8)

kNN as in 4.3 (strict). The reference sets are drawn at equal size, 182 spans, 20 times. 70 of the 183 editor spans come from the Auto Pneumatic Action Co. series. The editor's spans cover 10 firms, the LLM's 59.

| query → reference | mpnet | mpnet, same firm excluded | bge-m3 | bge-m3, same firm excluded |
|---|---|---|---|---|
| editor → editor | 0.443 | **0.329** | 0.567 | **0.411** |
| editor → LLM | 0.415 | 0.432 | 0.507 | 0.492 |
| LLM → editor | 0.439 | 0.439 | 0.512 | 0.512 |
| LLM → LLM | 0.535 | 0.510 | 0.585 | 0.568 |

Without the firm control, each group predicts itself best. That looks like "two annotation styles". **With the firm control, the editor's own consistency collapses**, and editor spans are predicted better from LLM spans than from other editor spans. In other words, much of the editor's apparent consistency is repeated copy within the Auto Pneumatic series, annotated the same way.

Restricted to English and German, where both annotators worked, the result is the same. Editor → editor drops from 0.442 to 0.328 (mpnet) and from 0.566 to 0.409 (bge-m3), while editor → LLM stays at 0.487 and 0.538.

**Conclusion:** the embeddings show **no sign that the LLM's labels follow different semantics from the editor's**. The inconsistencies in §4.2 involve both annotators, for example the editor's own unannotated "Master's Fingers" and "Phantom Hands" sentences in the Auto Pneumatic ads. Both groups use about one topic per span (1.05 editor, 1.01 LLM).

**Caveats:** language and firm are confounded with the annotator, and kNN agreement measures consistency, not correctness.

---

## 8 What worked and what did not

**Worked**
- Cross-lingual grouping of the same claim (c2, c6, c37, c43) with no translation step. mpnet and bge-m3 are much less driven by language than e5.
- A stable map of the *functional* structure of the ads: addresses, signatures, dates, terms, invitations.
- Finding the same sentence annotated in one ad but not in another. Example: the "Master's Fingers" slogan, annotated in 3 of 14 ads with 2 different topics.
- A kNN check of how separable the hand categories are: 0.62–0.68 strict accuracy against a 0.17 baseline. It locates the categories that blur.
- LaBSE for finding translations: 11 of 11 pairs above 0.80 were real translations.

**Did not work, or only partly**
- **Unsupervised clusters do not reproduce the taxonomy.** ARI ≤ 0.17. The big topics are spread over 12–17 clusters. 26.5% of the units are noise, among them 183 of the 549 topic-bearing units.
- **Rhetorical clusters are less stable** across seeds than functional ones. KMeans partitions are unstable as a whole (ARI about 0.4).
- **Sentence-level units dilute span-level topics.** kNN drops from 0.615 to 0.444 when the containing sentence is embedded instead of the span. A sentence often carries 2–3 motifs plus brand names.
- **Retrieval for abstract topics fails** (*home*, *touch_of_a_button*, *virtual_presence* without the slogan), because of hub sentences and lexical traps.
- **Small motifs** of fewer than about 10 sentences (patronage, venues) and rare hand topics fall below the cluster size and end up as noise.
- **mpnet "translations" are mostly paraphrases.** The figure descriptions cluster by the describer's English vocabulary.
- **Several shifts over time are single-advertiser campaigns.**

---

## 9 Concrete suggestions for the editor

1. **Review the missed annotations.** Most likely:
   - "The Master's Fingers on Your Piano" in ad015, 016, 021, 022, 023, 024, 025, 029, 030, 033 and 040. Decide also between *virtual_presence* and *phantom_body*: ad014 and ad020 vs ad143.
   - ad027.1: phantom hands / immortal pianists.
   - ad010.2: "Wunderklavier", *miracle*.
   - ad172.6: *superiority*.
   - ad175.11: *educational_use*.
   - ad028.0: *phantom_body*.
   - ad100.9: *miracle*.
   - ad130.0 / ad131.0 "A GREAT MUSICAL INVENTION." and ad041.11: *technical_invention*.
   - ad130.13 / ad131.11 "regret … not brought out in 1809": *immortality*.
   - ad106.0 "The Greatest Reproducing Piano" and ad004.10 "Höchste Auszeichnungen …": *superiority*.
   - ad143.9 "Easy Terms" and ad006.20: *affordability*.
   - Also the translation ad108.4 *affordability* vs ad191.4 *home*.
2. **Consider new topics:**
   - *endorsement / testimonial* (ad131.12, ad175.7, ad008.7, ad014.9)
   - *catalogue abundance* (ad012.10, ad006.14, ad025.0)
   - *compatibility and choice of piano* (ad014.15, ad020.5, ad023.17)
   - *originality and patents* (ad016.12, ad033.25, ad066.0)
   - *public concert / demonstration* (ad047.0, ad168.0, ad131.22)
   - possibly *royal / aristocratic patronage* (ad165.6, ad041.4, ad010.12, ad033.11)

   Functional parts such as addresses, prices, artist lists and signatures could be tagged structurally rather than as topics.
3. **Sharpen the boundaries of the topics that blur.**
   - *exact_reproduction* vs *virtual_presence* vs *personality* vs *immortality*: perhaps a two-level taxonomy with a "fidelity" family.
   - *superiority* vs *unreached_ideal*.
   - *home* vs *virtual_presence*.

   For each, write a `<desc>` with a decision rule. Only 5 of the 32 categories in `encoding.xml` have a `<desc>` now: *distinction_from_mechanical*, *exact_reproduction*, *immortality*, *secret* and *touch_of_a_button*.
4. **Rare topics** (< 10 spans: *atmosphere*, *hostess*, *analysis*, *artistic_accompaniment*, *analogy_to_phonograph*, *jazz*, *repeatability*, *popular*) cannot be checked statistically. Merge them, or keep them consciously as qualitative observations.
5. **Method for a next step:**
   - Annotate or cluster at the level of **spans or clauses** rather than sentences.
   - **Deduplicate** near-identical copy before clustering, and count ads or copy groups.
   - Use **bge-m3** for retrieval and kNN, and **LaBSE** for translations.
   - Treat embeddings as an *assistant*: propagation, retrieval, consistency checks, all with the editor deciding. They should not replace the taxonomy.

---

## Reproduction

```
V=<scratchpad>/venv/bin/python; cd pilot_code
$V 01_extract_units.py                       # units.json, spans.json -> $OUT (scratchpad/pilot)
$V 02_embed.py mpnet|e5|bgem3|labse          # embeddings
$V 03_cluster.py mpnet; $V 04_compare.py mpnet
$V 05_seeded.py mpnet; $V 06_crossling.py labse 0.80; $V 07_time.py mpnet bt_s0_m10
$V 08_resp_consistency.py mpnet; $V 09_spelling.py; $V 10_report_tables.py
```

**Where things are:**
- Large outputs (venv, model cache, embeddings, `units.json`) are in the session scratchpad (`OUT` in `common.py`).
- `pilot_code/outputs/` holds the cluster descriptions, retrieval lists, cross-lingual pairs, contingency table and JSON summaries that this report quotes.
- Manual cluster labels: `pilot_code/cluster_labels_mpnet_bt_s0_m10.json`.
