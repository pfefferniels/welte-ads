# Let machines audit, not replace, your topoi

There are more technical ways to find topics in the Welte-Mignon ads, and two of them have now been tried on this corpus. Neither rebuilt your taxonomy from scratch, and nothing in the research literature suggests any method could at this scale: 195 ads, about 22,800 tokens, 12 languages. What does work is to use multilingual sentence embeddings and LLM-based concept induction as **second readers** that check, extend and sharpen the 32 categories you built by hand.

In the embedding pilot, BERTopic clusters agreed with your taxonomy clearly better than chance but only modestly (**NMI 0.365, against 0.212 for shuffled labels; ARI never above 0.17**). Most of the clusters mapped the functional parts of the ads (addresses, dealer lines, dates). The clusters still recovered five of your topics cleanly. They also exposed inconsistent annotation: the slogan "The Master's Fingers on Your Piano" occurs in 14 ads but is annotated in only 3, under two different topics.

In the blind LLM pilot, a TopicGPT-style induction produced 40 topics and matched **seven of your categories at Cohen's κ ≥ 0.67**. It also proposed a whole layer the taxonomy lacks: the persuasive devices of testimony, acclaim, and institutional and royal patronage, plus the public demonstration concert and the "original, patented" brand claim.

The evidence is strongest where the two independent methods point at the same gaps. Where both fail (Revelled Listening, Sitting Woman as a motif, Secret, deliberate singletons like Jazz), close reading is doing work that frequency-driven machines cannot do. Both pilots are single exploratory runs. The LLM pilot was also performed by Claude, the model family that assigned 436 of the 647 existing annotations, so its agreement with those annotations is not independent validation.

## Your 32 categories are arguments, the profile topic models handle worst

**The data.** The taxonomy in `tei/shared/encoding.xml` holds **32 categories, all of them used**. Only five carry a `<desc>` definition (*distinction_from_mechanical*, *exact_reproduction*, *immortality*, *secret*, *touch_of_a_button*). The other 27 have only a label, and two labels differ from their IDs: *listening* is glossed "Revelled Listening" and *unreached_ideal* "Ideal Instrument" ([encoding.xml](../tei/shared/encoding.xml)). The texts carry **647 topic annotations** (617 on `<seg>`, 30 on `<figure>`) in 177 of the 195 ads. Of these, **436 are marked `resp="#claude"`, 183 `resp="#np"` (yours), and 28 have no `@resp`**.

One span is invisible to any script that counts `@ana`. Line 397 of `tei/ad022.xml` wraps "in your home or studio" in `<seg corresp="#home" …>`, where `ana="#home"` was evidently meant ([ad022.xml](../tei/ad022.xml)). Separately, 18 ads have no topic span at all, among them the Kaiser–Grieg anecdote in ad041 and the concert programmes in ad047, ad048, ad077, ad084, ad188 and ad189 ([LLM pilot, stage 3](../research_notes/Automatic%20topic%20discovery%20for%20Welte%20ads/pilot_llm_induction_stage3.md)).

**Why the categories resist topic models.** In topic-model terms the corpus has a single subject: every ad is about the Welte-Mignon. Your categories record *how* the product is argued and pictured (Exact Reproduction, Immortality, Phantom Body). They attach to short spans (median 9 words for yours, 7 for Claude's) that overlap and are often implicit ([embedding pilot](../research_notes/Automatic%20topic%20discovery%20for%20Welte%20ads/pilot_embedding_clustering.md)). Shadrova lists exactly these properties (granularity, explicitness, overlap, scope) as category decisions a topic count cannot encode. She concludes that topic modelling "without massive validation does not provide better, more objective, or more exact evidence to most research questions than close reading would" ([Shadrova 2021](https://jdmdh.episciences.org/8608/pdf)).

Blei, who introduced LDA, is just as plain. A topic "is a probability distribution over terms", and "a model of texts, built with a particular theory in mind, cannot provide evidence for the theory" ([Blei 2012](https://journalofdigitalhumanities.org/2-1/topic-modeling-and-digital-humanities-by-david-m-blei/)). The constructive position in digital humanities is Nelson's computational grounded theory: detect patterns by machine, refine them by close reading, confirm them with further tests. Under that view a hand-built taxonomy is the model being tested, not something to be swapped out ([Nelson 2020](https://ideas.repec.org/a/sae/somere/v49y2020i1p3-42.html)).

**What precedent projects found.** Topic models run on historical newspapers mostly recovered genres and formulas, not themes. Mining the Dispatch surfaced fugitive-slave ads as a topic ([AHA 2012](https://aha.confex.com/aha/2012/webprogram/Paper8981.html)). A model of the article-segmented Kölnische Zeitung isolated insurance, housing and labour-market ads ([Kölnische Zeitung study](https://www.researchgate.net/publication/400554275_Article_based_topic_modeling_on_re-processed_historical_newspapers)).

The closest advertising precedent, Wevers and Verhoef's Coca-Cola study, worked with collocations rather than topic models. Its sharpest result was an absence. Within a ±10-word window, "not a single document" linked Coca-Cola to the United States, and any American way of life was conveyed "in implicit terms or through visual content" ([Wevers & Verhoef 2017](https://dhq-static.digitalhumanities.org/pdf/000338.pdf)).

Computational frame analysis is the nearest methodological analogue to your topoi. On Austrian EU coverage, LDA found the salient, explicit frames with high precision but low recall, and it missed others entirely. Keyword-seeded keyATM "seems unfit for frame analysis". Supervised classifiers trained on manual codes reached F1 up to 0.86 ([Eisele et al. 2023](https://pure.uva.nl/ws/files/176873306/Capturing_a_News_Frame.pdf)). The research for this report found no computational study of phonograph, gramophone or player-piano advertising, so the Welte corpus would be a new case.

**Why classical bag-of-words models fail here.** On the raw corpus the reason is simple: 12 nearly disjoint vocabularies mean the first "topics" would be languages. English, the largest language, has 66 ads; Catalan has one. LDA's binding constraint is the number of documents ([Tang et al. 2014](https://proceedings.mlr.press/v32/tang14.html)). Off-the-shelf LDA "exhibits very large topic instability" when the training data are merely reshuffled ([Agrawal et al.](https://arxiv.org/abs/1608.08176v2)). A dynamic topic model would have about 7.5 ads per year from which to estimate each time slice ([DTM](https://dl.acm.org/doi/10.1145/1143844.1143859)). Neural VAE-style topic models are worse still: even on 14,000–32,000 documents, none came close to the stability of Gibbs-sampled Mallet LDA ([Hoyle et al. 2022](https://ar5iv.labs.arxiv.org/html/2210.16162)).

This family becomes usable only after two transformations. The first is machine translation into one language, which reproduces bag-of-words topic-model results closely ([de Vries et al. 2018](https://www.cambridge.org/core/product/43CB03805973BB8AD567F7AE50E72CA6)). The second is splitting ads into sentences; the pilot showed this yields **1,493 usable text units plus 184 figure descriptions**.

The one model worth keeping from this family is the Structural Topic Model (STM). Its spectral initialisation is deterministic ("no matter the seed that is set, the same results will be generated"), and it takes metadata as covariates ([stm vignette](https://cran.r-project.org/web/packages/stm/vignettes/stmVignette.pdf)). For your project, that would mean fitting `stm(K = 10–20, prevalence = ~ market_group + s(year) + unit_type)` on English translations of the sentences, with the 12 languages collapsed into about five market groups. `estimateEffect()` could then test whether Distinction from Mechanical is more prevalent in German-language copy. That makes STM a reproducible check on metadata effects, not a discovery engine.

The approaches surveyed below fall into seven families:

| Family | Typical tools | What it would mean for the Welte ads | Verdict |
|---|---|---|---|
| Bag-of-words topic models | LDA, STM, NMF, GSDMM | Translate about 1,500 sentences to English, fit 10–20 topics with year and market as covariates | Only as a reproducible metadata check |
| Embedding clustering | BERTopic, Turftopic | Embed original-language sentences, cluster them, read the clusters against your 32 categories | Piloted: maps the functional parts, recovers 5 topics, flags inconsistencies |
| Taxonomy-anchored models | zero-shot/guided BERTopic, keyATM, seededlda, kNN | Your categories as seeds, plus 5–10 unseeded topics for discovery | Best fit for "keep mine, find the rest"; untested at this scale |
| LLM concept induction | TopicGPT, LLooM | Blind topic generation over all 195 ads, then an alignment table against your categories | Piloted: recovers your core, proposes an authority layer |
| Contrastive description | D5, GoalEx, nlparam | "What distinguishes 1905–14 ads from 1917–29 ads?" | Piloted: robust period hypotheses, confounded by advertiser series |
| Visual models | CLIP, vision-language models | Zero-shot audit of the pictorial categories on the facsimiles | Feasible, untested on 1905–30 halftones |
| Reuse detection | passim, LaBSE | Find translated or reprinted copy so that counts are made per copy family | Piloted: 11 translation pairs, 13–17% same-language reuse |

## Embedding clusters mapped the ads' structure and five of your topics

**How the pilot worked.** Multilingual sentence embeddings are the only family that handles 12 languages without translation: a sentence and its paraphrase in another language land close together in one vector space. BERTopic chains four steps: embeddings, UMAP dimension reduction, HDBSCAN clustering, and class-based TF-IDF keywords ([Grootendorst 2022](https://arxiv.org/pdf/2203.05794)). The method comes with three warnings. Its own FAQ says that with "only a few documents (~1000)" it is "very difficult to properly extract topics" ([BERTopic FAQ](https://maartengr.github.io/BERTopic/faq.html)). Turftopic's model overview calls clustering models "unreliable and unstable" ([Turftopic](https://x-tabdeveloping.github.io/turftopic/model_overview/)). And multilingual embeddings "tend to group documents by language" unless corrected ([Chang et al. 2025](https://arxiv.org/abs/2412.12433)).

The pilot embedded all 1,677 units with `paraphrase-multilingual-mpnet-base-v2`, which took 33 seconds on four CPUs. It used multilingual-e5 and bge-m3 for comparison, and ran BERTopic with fixed seeds; a rerun reproduced every partition label for label ([embedding pilot](../research_notes/Automatic%20topic%20discovery%20for%20Welte%20ads/pilot_embedding_clustering.md)).

**What the clusters were.** The main run found **50 clusters and left 26.5% of units unclustered**. On reading them, 19 were rhetorical motifs, 18 functional content (firm lines, addresses, concert dates, prices, invitations, artist lists), 10 figure descriptions and 3 mixed. In the rhetorical clusters 60% of units carry one of your topics, against 9.8% in the functional ones. These labels were written while the hand-topic counts were visible, so the typing is not independent of your annotation.

The rhetorical clusters are genuinely multilingual, which is the decisive advantage over word-based models. Cluster c2, "the artist's personal playing reproduced", puts the Danish *"som sad han selv foran Instrumentet"* (ad099.3) next to the German *"mit all' seinen persönlichen Eigenschaften – des Anschlags, der Phrasierung, des Pedalgebrauchs"* (ad005.16), alongside English, Dutch and Norwegian sentences. Cluster c43 joins German and Polish sentences on pedagogical value and the Vienna Conservatory.

Two technical findings help with model choice. First, e5 clusters followed language far more than mpnet or bge-m3 did (NMI with language 0.38 against about 0.15). Second, historical spelling cost only **0.04–0.05 cosine similarity** on average (0.849 for period forms against 0.902 for hand-modernised versions). Abbreviations such as the Swedish *själfsp.* hurt most. Normalising spelling is therefore an improvement, not a precondition.

**Where the clusters met your taxonomy.** Five of your topics emerged as coherent clusters:

- *educational_use*: cluster c43 is 89% this topic.
- *phantom_body*: cluster c20 ("When Phantom Fingers Play") plus figure cluster c42.
- *affordability*: cluster c33 is 100% this topic.
- *secret*: cluster c36 ("Only Welte-Mignon possesses the secret of perfect reproduction").
- *sitting_woman*: figure clusters c47 and c12.

The large topics did not cohere. *exact_reproduction*, *home*, *virtual_presence*, *superiority* and *touch_of_a_button* each spread over 12–17 clusters, and *personality* and *immediate_recognizability* dissolved into the *exact_reproduction* cluster c2. *Distinction_from_mechanical* was not found at all: 72% of its units fell into noise. Six categories with fewer than about ten units (*atmosphere*, *hostess*, *analysis*, *artistic_accompaniment*, *analogy_to_phonograph*, *jazz*) could not form a cluster at the chosen minimum size, so the method cannot speak to them.

**How stable the clusters were.** Partitions were very stable across seeds where units were clustered in both runs (ARI 0.89–0.96). The rhetorical clusters, however, were cut differently from run to run. "Entertaining guests in the salon" (c44), for example, scored a best match of only 0.19 and 0.00 in the other seeds. The pilot's reading is that the rhetorical middle of the corpus is a continuum, and only formulaic text forms dense, repeatable islands.

**Where embeddings earned their keep: checking the annotations.** A leave-one-out nearest-neighbour test predicted the topic of each annotated span from its five most similar spans. It excluded spans from the same ad and near-duplicates. Accuracy was **0.615 with mpnet and 0.676 with bge-m3, against a 0.172 majority baseline**. When the whole surrounding sentence was embedded instead of the span, accuracy fell to 0.44: your topics are properties of spans, not of sentences. The errors cluster in a "fidelity family". The most confused pairs were *exact_reproduction* with *virtual_presence* (15 errors), with *immortality* (12) and with *personality* (11), and *superiority* with *unreached_ideal* (15 errors with bge-m3). Those are the boundaries most in need of written decision rules.

Searching for near-identical sentences across ads found 245 pairs, 26 of which carry different topics. In 22 of those, one side has no topic at all. The slogan "The Master's Fingers on Your Piano" appears in 14 ads. You annotated it *virtual_presence* in ad014 and ad020, Claude annotated it *phantom_body* in ad143, and the other eleven occurrences carry no topic. Other examples:

- ad027.1, "These are the Phantom Hands of a thousand immortal pianists", is unannotated, while the same sentence carries *immortality*, *miracle* and *phantom_body* in ad026 and ad028 (yours) and in ad104 and ad105 (Claude's).
- The English ad108.4 is *affordability*, while its French translation ad191.4 is *home*.

This propagation check is the cheapest and most precise machine contribution to the edition.

Retrieving unannotated sentences similar to a topic's spans was less reliable. 23 of the top 50 were plausible, 10 of them the same slogan. Retrieval worked for lexically stable topics (*technical_invention* 5/5, *superiority* 4/5) and failed for scene-like ones (*home* and *touch_of_a_button*, 0/5 each). Generic "hub" sentences were the main reason: "the greatest living pianists" (ad031.3) ranked first for *immortality*, the opposite of its meaning.

**Your annotations versus Claude's.** The embeddings show no sign that Claude's labels follow different semantics from yours. Once neighbours from the same firm are excluded, your spans are predicted *better* from Claude's spans (0.432 with mpnet) than from your own (0.329). Your apparent self-consistency rested heavily on one series: **70 of your 183 spans come from the Auto Pneumatic Action Co. ads**, and your spans cover 10 firms against Claude's 59. That matters for any validation design that treats your spans as the gold standard.

## A blind LLM reading recovered your core and proposed an authority layer

**What the literature says about LLM topic induction.** TopicGPT is a prompt-only pipeline with three stages. An LLM generates topics as a label plus a one-sentence description; the list is refined by merging near-duplicates and pruning rare topics; then each document is assigned topics with a supporting quote. Against human-labelled Wikipedia topics it reached a harmonic-mean purity of **0.74 against 0.64 for the strongest baseline** ([Pham et al. 2024](https://arxiv.org/abs/2311.01449)).

Two design choices clash with your corpus. Topics below a frequency threshold of 5–10 documents are pruned, which deleted a substantive low-frequency topic ("Culture") in the authors' own tests. And evaluation was English-only ([TopicGPT paper](https://arxiv.org/html/2311.01449v2)).

LLooM, the CHI 2024 system for "concept induction", is the closest existing method to what you do by hand. It distils each document into bullets of 5–8 words, clusters the bullets, and has a stronger model write each concept as a name, a one-sentence inclusion criterion and exemplars. It then scores every document against every criterion. It was built and tested on samples of about 200 documents and cost about **$1.44 per run** at 2024 prices ([Lam et al. 2024](https://arxiv.org/html/2404.12259)). Its bullets have almost exactly the grain of your spans, and its criteria have the form your 27 undefined categories lack.

The main warning comes from Li et al. (ACL 2025): LLM topic models give readable but "overly generic topics for domain-specific datasets" unless a human is in the loop ([Li et al. 2025](https://arxiv.org/abs/2502.14748)). Studies of qualitative coding point the same way. LLMs are reliable at *deductive* coding with a clear codebook; human plus LLM coding reached κ 0.87 against 0.66 for the original human coding in one case ([Dai et al. 2023](https://arxiv.org/pdf/2310.15100)). In *inductive* coding, by contrast, even human experts diverge, and gold-label accuracy and expert-judged quality part ways ([Parfenova et al. 2025](https://aclanthology.org/2025.findings-naacl.361/)).

**What the pilot produced.** Claude worked through all 195 ads in file order, by hand rather than through an API pipeline, without first opening your taxonomy or annotations. It kept a running list of labels that grew to about 65, then merged near-duplicates and dropped candidates found in fewer than three ads. The result was **40 topics in 10 groups**, averaging 5.5 topics per ad, and seven purely functional ads carried none ([LLM pilot, stage 1](../research_notes/Automatic%20topic%20discovery%20for%20Welte%20ads/pilot_llm_induction_stage1.md)). The counts are approximate (the pilot estimates ±10–15% per topic): a precision pass alone removed 14 wrong assignments, one of them a non-existent ad ID.

Because the induction read every ad evenly, it also caught something no annotation pass had flagged: **ad205 (Havana, 1919) prints a testimonial attributed to Liszt**, who died in 1886.

**How the induced topics map onto yours.** Unblinded and reduced to the ad level, the comparison found seven near-exact matches: *exact_reproduction* (κ 0.87), *educational_use* (0.97), *analogy_to_photography* (0.94), *immortality* (0.79), *distinction_from_mechanical* (0.79), *virtual_presence* (0.69) and *home* (0.67). Every one of your categories is covered at 64% or more by its mapped topic or topics, except *affordability* (29%, because the induction treated prices and terms as functional content). Conversely, **14 of the 40 induced topics have no counterpart in your taxonomy** ([LLM pilot, stage 3](../research_notes/Automatic%20topic%20discovery%20for%20Welte%20ads/pilot_llm_induction_stage3.md)).

Some disagreements are different cuts through the same semantic space. You separate *home* (place) from *touch_of_a_button* (availability on demand); the induction separated "pianists in your home, at your command" from "effortless, no skill needed". Together the two pairs cover nearly the same ads (joint κ 0.75), but the boundary between them differs. Likewise, you separate *superiority* from the absolute "Ideal Instrument", while the induction separated absolute perfection from uniqueness over rivals. Note that **52 of the 54 ads coded *superiority* were annotated by Claude** and the other two have no `@resp`, so that category's working meaning was shaped by the earlier LLM pass rather than by you.

The table below sets the two pilots side by side for your categories.

| Your category | Embedding clusters | Blind LLM induction |
|---|---|---|
| exact_reproduction | split over 13 clusters | exact match (κ 0.87) |
| educational_use | recovered: c43 is 89% this topic | exact match (κ 0.97) |
| immortality | split; 26 of 46 units in noise | match (κ 0.79), with "counterfactual past" split off |
| distinction_from_mechanical | not found (72% noise) | match (κ 0.79), slightly broader |
| home / virtual_presence | split over 12 / 15 clusters | near matches (κ 0.67 / 0.69) |
| personality, immediate_recognizability | merged into the exact_reproduction cluster | broader topics (κ 0.52 / 0.41) |
| phantom_body | recovered (c20 plus figure cluster c42) | broader, includes "zitieren" and summoning (κ 0.58) |
| affordability | recovered: c33 is 100% this topic | different boundary (κ 0.38) |
| miracle | partly: c11 is 70% this topic | much broader, includes "wonderful" (κ 0.37) |
| superiority / unreached_ideal | split; most-confused pair | different cut: perfection vs uniqueness |
| secret | recovered with exact_reproduction (c36) | absorbed into uniqueness |
| sitting_woman | recovered in figure clusters | noticed, not promoted to a topic |
| listening ("Revelled Listening") | split, mainly figure clusters | not found as such |
| jazz, hostess, atmosphere, analysis, accompaniment, phonograph | below minimum cluster size | merged into broader topics |

The pattern is instructive. **Embeddings follow wording and function, so they recover lexically marked and pictorial topics. The LLM follows arguments, so it recovers argumentative topics such as Distinction from Mechanical, which embeddings scattered into noise.** Neither found the categories that you bring from theory or iconography. Revelled Listening needs a conceptual interest in listening practices. Sitting Woman was seen but ranked as imagery rather than argument. Secret was read as a wording of exclusivity rather than a motif of trade secrecy.

The long tail is the clearest fingerprint of the two procedures. **Six of your categories are used in three or fewer ads, three of them in a single ad**, whereas the induced list bottoms out at about seven ads. Close reading creates a category when one passage is historically telling; frequency-based induction removes it by design.

**Candidate new topics.** The candidates below carry the most weight where both pilots, working independently, point to them:

| Candidate topic | Embedding pilot | LLM pilot | Ads to check |
|---|---|---|---|
| Endorsement and testimony (who vouches) | clusters c13, c45; c45 only pre-war (9 of 70 early ads, 0 of 125 late) | quoted testimonials (43 ads), collective acclaim (38) | ad131.12 "OPINIONS OF THE WORLD'S FAMOUS MUSICIANS", ad175.7, ad008.7, ad100 (13 voices) |
| Public concert or demonstration | clusters c4, c18, c19; concert dates in 35.7% of early vs 7.2% of late ads | machine as concert performer (28 ads, 6 with no span at all) | ad047, ad048, ad077, ad084, ad168, ad188, ad189 |
| Originality and patents | cluster c26 "Licensed under original Welte-Mignon patents" | originality and priority (21 ads; 1 pre-war, 20 post-war) | ad016.12, ad017, ad033.25, ad066.0 |
| Fits any piano, unobtrusive | clusters c38 "115 makes of pianos" and c7 | dual use and integration (30 ads), a broadening of *invisibility* | ad014.15, ad020.5, ad023.17, ad026 |
| Royal and aristocratic patronage | not clustered; found by reading plus keyword search | royal patronage (11 ads), annotated as such nowhere | ad041 (Kaiser–Grieg), ad165, ad010.12, ad209 |
| Size of the roll library | cluster c34, 1 of 15 units annotated | listed as functional content | ad012.10, ad006.14, ad025.0 |
| Counterfactual past ("if only for Liszt") | retrieval flagged ad130.13 / ad131.11 as missed *immortality* | 10 ads, 9 of them pre-war | ad009, ad088, ad130, ad151 |
| The "modest name" quip | – | 9 ads in German, Danish, Polish and Spanish | ad169, ad088, ad208, ad211 |
| Electricity as an argument | – | 36 ads, about 10 argumentative; mainly Scandinavian, Dutch, Iberian | ad075, ad049, ad201 |

The common thread is that **your taxonomy codes what a passage claims, not who vouches for it or in what format**. A testimonial is annotated as *miracle* or *technical_invention*, but the act of citing Paderewski or the Vienna Conservatory has no slot. Stage 3 of the LLM pilot suggests a second, small taxonomy of persuasive devices (testimonial, collective acclaim, institution, court, owner, press), kept separate from the motif taxonomy rather than adding five more topics to it.

**The circularity problem, and what softens it.** The same model family assigned 436 of the 647 existing annotations, so agreement between a blind Claude induction and those annotations partly measures Claude's consistency with itself. LLM evaluators demonstrably prefer their own outputs ([Panickssery et al. 2024](https://arxiv.org/html/2404.13076v1)).

Two observations soften this, without removing it. First, the blind topics covered your own and unattributed annotations better (180 of 189 category–ad pairs, **95%**) than the Claude-assigned ones (319 of 390, **82%**). So the induction was not simply replaying the earlier pass, although your spans also sit on the most salient passages. Second, where the taxonomy had no slot, the earlier Claude pass had stretched existing categories:

- concert programmes became *virtual_presence* (ad120, ad127, ad159, ad160, ad167, ad168);
- electricity and patents became *technical_invention*;
- medals became *superiority*;
- salon ornament became *home*.

The blind induction created new slots for exactly these passages. That convergence on the *gaps* is informative even within one model family. It still shows only what an LLM finds salient, not that either taxonomy is correct.

## Seeded and contrastive methods turn the taxonomy into testable claims

**Seeded and guided models.** These start from your taxonomy and keep a channel open for discovery, which matches your situation better than blind clustering. keyATM takes a few keywords per topic, labelled before fitting. It adds unseeded "Other" topics through `no_keyword_topics`, and in its authors' applications it was less sensitive to the number of topics than unseeded models ([Eshima, Imai & Sasaki 2024](https://doi.org/10.1111/ajps.12779); [keyATM docs](https://keyatm.github.io/keyATM/articles/pkgdown_files/keyATM_base.html)). Seeded LDA does the same with a `residual` argument for undefined topics ([seededlda](https://rdrr.io/cran/seededlda/man/textmodel_seededlda.html)). Zero-shot BERTopic embeds predefined topic labels and assigns each document whose similarity clears `zeroshot_min_similarity`. Documents below that threshold are clustered into new topics, and the docs note that "descriptive names work better" ([BERTopic zero-shot](https://maartengr.github.io/BERTopic/getting_started/zeroshot/zeroshot.html)).

For your project, zero-shot BERTopic is the closest match to "keep my 32, find the rest". In practice it would involve four steps:

1. Write each category as a descriptive sentence, for example "The instrument reproduces the pianist's playing exactly, with every nuance" instead of "Exact Reproduction".
2. Embed spans or clauses rather than sentences, since the pilot showed topics live at span level.
3. Tune the threshold to maximise agreement with your own annotated spans.
4. Read the residual clusters as candidate topics.

keyATM would run on English translations with 5–10 keywords per category and 5–10 unseeded topics, and its Covariates or Dynamic variants would handle year and market. Without translation it would need per-language keyword lists, such as *unsterblich / immortal / onsterfelijk / odödlig / udødelig / inmortal / immortel* for Immortality.

The warnings are real. In frame analysis, keyATM clusters were interpretable but did not fit the manual gold standard ([Eisele et al. 2023](https://pure.uva.nl/ws/files/176873306/Capturing_a_News_Frame.pdf)). Watanabe, author of seededlda, writes in a 2025 preprint that semi-supervised LDA "fails to identify specific topics defined by seed words" ([Watanabe 2025](https://arxiv.org/abs/2512.18119)). The research found no application of these tools to fewer than about 1,000 documents. The embedding pilot's seeded retrieval is a fair preview: expect success on topics with stable wording and failure on scene-like ones such as Home and Touch of a Button.

Fully supervised span classification is the strongest option where training data suffice. Motif indexing in the *Arabian Nights* reached F1 0.85 with a fine-tuned Llama 3, but only 0.73 on "complexly expressed" motifs, with about 13 positive examples per motif ([Alyami & Finlayson 2026](https://arxiv.org/pdf/2603.19283)). Your annotations average about 20 per category, so this suits only the large ones.

**Contrastive methods.** These ask a different question: what is more often true of one group of ads than another? D5 has an LLM propose natural-language hypotheses about two corpora, then checks each one against every document. Its validator correlates only 71% with human validity judgements, and the authors warn that spurious correlations can pass ([D5](https://arxiv.org/html/2302.14233v2)). GoalEx clusters a corpus according to a goal stated in words ([GoalEx](https://arxiv.org/abs/2305.13749)). For the Welte ads such a goal could be "cluster the ads by how they describe the relation between the human pianist and the machine". The resulting partition could then be set against your topoi to see which questions the taxonomy already answers.

**What the period contrast found.** Stage 2 of the LLM pilot ran a D5-style contrast by hand, with Claude as both proposer and verifier ([LLM pilot, stage 2](../research_notes/Automatic%20topic%20discovery%20for%20Welte%20ads/pilot_llm_induction_stage2.md)). Hypotheses were marked robust only if they passed a Bonferroni threshold and held within individual languages. Four were robust:

- **Pre-war ads legitimise a new kind of instrument; post-war ads defend a brand.** The "sensational, epoch-making invention" claim falls from 47% to 14% of ads, and "not mechanical" from 26% to 6%. Originality and priority claims rise from 1% to 16%, and the "Licensee" label appears in 18% of post-war ads.
- **Expert-testimony dossiers give way to owners, hostesses and domestic scenes.** Quoted testimonials fall from 36% to 14%.
- **Domestication.** "Great pianists in your home" rises from 20% to 43%, and illustrations showing people from 3% to 27%.
- **The public demonstration concert fades** from 26% to 8%.

A useful negative result is that **immortality rhetoric does not grow after the war** (20% against 22%), even though more of the recorded pianists had died by then.

The embedding pilot reached the same picture independently, using your annotations plus its own clusters. Concert-date clusters fall from 35.7% to 7.2% of ads. Salon scenes in the illustrations rise from 1.4% to 19.2%. *affordability* rises from 1.4% to 18.4% and *phantom_body* from 0 to 12.0%. *distinction_from_mechanical* falls from 17.1% to 4.0%. *exact_reproduction* stays flat (47.1% against 48.8%), consistent with your own `<desc>`, which says the claim of exact and faithful reproduction is "consistently emphasized" between 1905 and 1926 ([embedding pilot](../research_notes/Automatic%20topic%20discovery%20for%20Welte%20ads/pilot_embedding_clustering.md)).

The market contrasts are sharp but more fragile. Scandinavian ads almost never mention posterity (1 of 35). Dutch ads never use wonder vocabulary (0 of 22). German-language ads are authority ads, with quoted testimonials in 45%.

**Why these contrasts need care.** Period and language are entangled: 74% of German-language ads are pre-war, while 79% of English-language ads are post-war. Single advertisers also run long series (Auto Pneumatic 15 ads, Hug 11, Reutemann 9), so 195 ads are not 195 independent observations.

Copy reuse compounds this. LaBSE, an encoder built for finding translations, identified **11 translation pairs with perfect precision at cosine ≥ 0.80**. Most were testimonials (German into Danish, Polish and Swedish), plus one fully translated ad (ad108 in English, ad191 in French). Meanwhile, **13–17% of text units repeat a sentence from another ad in the same language** almost word for word. The paraphrase-trained mpnet was a poor translation detector: only 11 of 30 high-similarity pairs were real translations.

The LLM pilot found the same Freiburg copy recurring across markets. ad003 (Leipzig, 1909) equals ad103 (Riga, 1911) and nearly equals ad086 (Copenhagen, 1912). So a topic's frequency in a market partly measures which central copy local dealers picked up. Media historians warn not to "mistake textual similarities as evidence for shared understanding" ([Keck, Oiva & Fyfe 2023](https://cudan.tlu.ee/pub/2022_Media-History_Keck-Oiva-Fyfe_Transnational-News.pdf)). The practical rule is to count copy families rather than printings, and to treat every contrast as a hypothesis checked by close reading.

## A defensible workflow keeps machine categories in their own layer

**First, the codebook.** The highest-leverage step is not a model at all. Halterman and Keith show that LLMs used as measurement tools depend on codebooks prepared for both humans and machines, and that smaller open-weight models struggle to follow codebooks zero-shot ([Halterman & Keith 2025](https://arxiv.org/html/2407.10747v2)). Twenty-seven of your categories have no definition, which is why the earlier Claude pass had to guess at the boundaries of *superiority* and *popular*.

An LLM can draft LLooM-style criteria, a name plus a one-sentence inclusion test, from the spans already assigned to each category, and you edit and approve them. One hypothetical example from the research notes: "Virtual Presence: does the text claim that the instrument makes an absent or dead performer present in the listener's room?" The blurred pairs need explicit decision rules: *exact_reproduction* against *virtual_presence*, *personality* and *immortality*; *superiority* against *unreached_ideal*; *home* against *touch_of_a_button*. So does the question of whether prices and terms belong in *affordability* at all.

**Second, cheap fixes the pilots already found.** Correct the `corresp`/`ana` slip in ad022, and review the propagation list:

- the eleven unannotated "Master's Fingers" occurrences (ad015, ad016, ad021, ad022, ad023, ad024, ad025, ad029, ad030, ad033, ad040);
- ad027.1 (phantom hands);
- ad010.2 (*miracle*);
- ad172.6 (*superiority*);
- ad175.11 (*educational_use*);
- the inconsistent translation pair ad108.4 / ad191.4.

**Third, independent validation.** Your 183 spans are the only human reference, and they are concentrated in a few advertisers. The research supports four safeguards ([Pangakis et al.](https://arxiv.org/pdf/2306.00176); [Barrie et al.](https://arxiv.org/pdf/2407.02039)):

- **Blind double coding.** Code a stratified sample of 30–40 ads across languages, decades and advertisers without seeing Claude's labels, and compute Krippendorff's alpha at the ad-by-topic level.
- **Show machine suggestions only after your own judgement.** In one study, experts' agreement with an LLM rose from 43.9% without its suggestions to 71.5% with them ([Choi et al. 2024](https://arxiv.org/pdf/2410.04699)).
- **A different model family for cross-checks.** Run deductive re-assignment and any new induction with an open-weight model run locally, or with GPT or Gemini, rather than Claude.
- **Repeat runs.** Run any induction three to five times with shuffled reading order, prompt-stability testing in the style of Barrie et al., and pinned model versions. Keep only topics that recur.

**The visual side.** Your facsimiles allow a semi-independent check of the pictorial categories. This matters because the prose figure descriptions cluster by the describer's English vocabulary, not by the images. CLIP-style zero-shot labelling has opened historical image collections to natural-language queries, but it carries training-data bias that has to be checked by hand ([Smits & Wevers 2023](https://academic.oup.com/dsh/article/38/3/1267/7078540)). In an iconography benchmark, textual category definitions helped vision-language models more than few-shot examples did ([Spinaci et al. 2025](https://anthology.ach.org/volumes/vol0003/benchmarking-multimodal-large-language-models-in/)), another argument for writing definitions first. Concretely, you could prompt CLIP with "a woman seated in an armchair listening to a piano" or "a piano with ghostly hands on the keys". You would then compare its rankings with the 30 figures that carry a topic, and use nearest-neighbour search to find reused cuts across markets ([Viral Images 2026](https://arxiv.org/abs/2606.16209)).

**Encoding the results.** Keep machine output out of the authoritative layer. TEI's `<annotation>`, modelled on the W3C Web Annotation Data Model, supports a `classifying` motivation. `<certainty>` takes a numeric `@degree`, and `<application>` documents the software and version that acted on a document ([TEI annotation](https://tei-c.org/release/doc/tei-p5-doc/en/html/ref-annotation.html); [TEI certainty](https://tei-c.org/release/doc/tei-p5-doc/en/html/ref-certainty.html); [TEI application](https://tei-c.org/release/doc/tei-p5-doc/en/html/ref-application.html)). The W3C model has a `Software` agent class but no confidence property ([W3C](https://www.w3.org/TR/annotation-model/)).

A workable convention, for which the research found no published edition precedent, has four parts:

- a separate `<taxonomy xml:id="topics-machine">` whose categories point with `@corresp` to your categories where they map;
- standoff annotations with `resp="#pipeline-v1"` and a certainty value;
- promotion to inline `@ana` only after your review, recorded as a `<change who="#np">`;
- unmapped machine categories left visible as the discovery residue.

A companion interactive page shows how the site's Topics bubble chart would look under each option: the current taxonomy, the taxonomy over time, unsupervised clusters, the seeded taxonomy plus new topics, and blind LLM topics.

**Cost and effort.** Machine time is negligible: embedding the whole corpus with the main model took 33 seconds, and a LLooM run cost about $1–2 at 2024 prices. The research notes judge the full workflow at about 1.5–3 weeks of focused work, nearly all of it spent on exporting data, checking translations and reading output. That estimate is informed judgement, not a benchmark.

## Conclusion

The question "is there a more technical way to discover topics?" turns out to have a better answer than yes or no. The machines' most valuable output here is not a replacement list of topics but a **measurement of your taxonomy**: which categories are separable (nearest-neighbour accuracy around 0.68, against a 0.17 baseline), which blur into one another, where annotations contradict each other across identical copy, and which dimension of the ads it does not encode at all, namely who vouches for the instrument and in what format. The two pilots also have complementary blind spots that turn out to be a method in themselves. Embeddings see wording and function, the LLM sees arguments, and you see theory, iconography and the historically telling single case. Three readers with different failure modes, compared systematically, give a stronger warrant for each category than any one of them alone.

That reframing also points to a contribution beyond the edition. Shadrova asks how machine-estimated topic prevalence compares with prevalence based on categories scholars built themselves ([Shadrova 2021](https://jdmdh.episciences.org/8608/pdf)). The Welte collection is unusually well placed to answer, because it pairs dense span-level expert annotation with a closed, multilingual corpus. The concrete next steps are to write the missing definitions, run the consistency fixes, settle the converging candidate topics, and validate on a blind sample with a second model family. Done in that order, it yields a taxonomy that is hand-made but machine-audited, and that can be defended in exactly the terms its critics would use.
