# Topic-model methods for automatic topic discovery, and how they fit the Welte-Mignon Advertisements corpus

Corpus constraints used throughout (from the assignment): 195 ads, about 22,800 tokens (mean about 117, median 84, min 10, max 1,080 tokens per ad); 12 languages (en 66, de 38, nl 22, es 14, sv 14, da 12, fr 11, no 9, pl 4, pt 2, ru 2, ca 1); about 183 illustrations described in prose; an expert taxonomy of 33 rhetorical topoi marked on 647 spans (median 7 words). Status: October 2026.

## 1. Probabilistic and matrix-factorisation models (LDA, STM, DTM, BTM, DMM/GSDMM, NMF): data requirements, behaviour at about 200 short documents, and pseudo-documents

### Takeaway
None of the classic bag-of-words models can be run on the raw 195-ad, 12-language corpus in a meaningful way. Bag-of-words models need many documents of reasonable length that share one vocabulary, and here the largest single language (English) has only 66 ads. These models become usable only after two steps: (a) normalising everything into one language, for example by machine translation, and (b) using sentences or paragraphs as the units of analysis. Even then, the right reading is "exploratory, check stability", not "discovery". The one strong reason to keep this family is STM: it can use metadata such as year and market, and its spectral initialisation is deterministic, so runs are reproducible.

### Cited Findings
**LDA, and how much data it needs**
- LDA (Blei, Ng & Jordan 2003) models each document as a mixture of topics, and each topic as a distribution over a single shared vocabulary. — [JMLR](https://www.jmlr.org/papers/v3/blei03a.html)
- Tang et al. (ICML 2014) analysed the factors that limit LDA, using posterior-contraction theory plus experiments on synthetic, news, web and tweet data.
  - Secondary readings of the paper identify the **number of documents** as the most important factor.
  - Short documents are a known weak point. The authors say LDA's poor performance on short texts was a folk belief they set out to justify formally.
  - — [PMLR](https://proceedings.mlr.press/v32/tang14.html), [PDF](https://public.websites.umich.edu/~qmei/pub/icml2014-tang.pdf)
  - Caveat: later work notes that the contraction results hold only when words per document grow together with the number of documents. — [arXiv 1710.11070](https://arxiv.org/pdf/1710.11070)
- Run-to-run instability of plain LDA:
  - Agrawal, Fu & Menzies found "order effects": shuffling the training data produces different topics. They report that standard LDA "exhibits very large topic instability".
  - Their conclusion is that off-the-shelf LDA settings "should now be deprecated". Their remedy is to tune LDA's parameters for stability with differential evolution (LDADE).
  - — [arXiv 1608.08176](https://arxiv.org/abs/1608.08176v2)

**Structural Topic Model (STM)**
- STM (Roberts et al.) adds document metadata to a topic model. — [AJPS 2014](https://doi.org/10.1111/ajps.12103); [JSS 2019 vignette](https://cran.r-project.org/web/packages/stm/vignettes/stmVignette.pdf)
  - **Prevalence covariates** change how much each topic is used. Example: `prevalence = ~ rating + s(day)`.
  - **A content covariate** changes which words a topic uses.
  - The content covariate must be a single categorical variable, and its computational cost "rises quickly with the number of groups". — [stm vignette](https://cran.r-project.org/web/packages/stm/vignettes/stmVignette.pdf)
- Spectral initialisation (`init.type = "Spectral"`):
  - It uses a method-of-moments, NMF-like decomposition of the word co-occurrence matrix. It is "deterministic and globally consistent under reasonable conditions": "no matter the seed that is set, the same results will be generated" on a given machine and stm version.
  - It has been the default since stm 1.3.0, and the authors "generally recommend" it. — [stm vignette](https://cran.r-project.org/web/packages/stm/vignettes/stmVignette.pdf)
- Choosing K in stm:
  - `searchK()` reports held-out likelihood, residuals, semantic coherence and exclusivity.
  - `K = 0` runs the Lee & Mimno (2014) convex-hull method. It is **not** deterministic, it can return a different number of topics with each seed, and it "has no particular statistical guarantees". — [stm vignette](https://cran.r-project.org/web/packages/stm/vignettes/stmVignette.pdf)
- The CRAN stm package is maintained; version 1.3.8 was published in September 2025. — [CRAN refman](https://search.r-project.org/CRAN/refmans/stm/html/stm.html)

**Dynamic Topic Model**
- The DTM (Blei & Lafferty 2006) chains topic-word distributions across discrete time slices, so each slice must contain enough documents to estimate topics. — [ICML 2006 / ACM](https://dl.acm.org/doi/10.1145/1143844.1143859)

**Short-text models (BTM, GSDMM)**
- The Biterm Topic Model (Yan et al. 2013) models unordered word pairs (biterms) pooled across the whole corpus. This works around sparse co-occurrence inside short documents. — [WWW 2013 / ACM](https://dl.acm.org/doi/10.1145/2488388.2488514)
- GSDMM (Yin & Wang 2014) is the collapsed Gibbs-sampling version of the Dirichlet Multinomial Mixture.
  - It assumes **each short text has exactly one topic**.
  - It infers the number of clusters up to a chosen upper bound.
  - — [KDD 2014 / ACM](https://dl.acm.org/doi/10.1145/2623330.2623715); [Qiang et al. survey](https://ar5iv.labs.arxiv.org/html/1904.07695)
- Qiang et al.'s survey and benchmark of short-text topic models (open-source Java library STTM): — [arXiv 1904.07695](https://ar5iv.labs.arxiv.org/html/1904.07695)
  - DMM-based methods that use word embeddings (GPU-DMM, GPU-PDMM, LF-DMM) generally performed best.
  - BTM and GSDMM "always outperform LDA" in classification.
  - GSDMM had the best mean NMI (0.590 vs LDA 0.542).
  - Results are "highly data set dependent".
  - Self-aggregation models such as SATM, which build pseudo-documents, did worst, because errors in building the pseudo-documents get amplified.
- GSDMM hyperparameter defaults common in the literature did not match values found by a data-driven evaluation on British Telecom data. — [Plymouth 2023](https://pearl.plymouth.ac.uk/handle/10026.1/20740)

**NMF**
- O'Callaghan, Greene, Carthy & Cunningham (2015) compared LDA and NMF descriptors across corpora.
  - NMF usually produced more coherent topics, and LDA descriptors were more generic and redundant.
  - Term weighting had a large effect.
  - They suggest NMF suits "niche or non-mainstream corpora".
  - — [Expert Systems with Applications, DOI 10.1016/j.eswa.2015.02.055](https://researchrepository.ucd.ie/handle/10197/6482?mode=full)

**Unit of analysis: sentences instead of whole documents**
- Watanabe & Baturo (2023) designed Seeded **Sequential** LDA specifically for "sentence-level topic modeling", motivated by topic-specific analysis of sentences. — [seededlda site](https://koheiw.github.io/seededlda/); [SSCR DOI](https://doi.org/10.1177/08944393231178605)
- Watanabe's December 2025 preprint "Distributed Asymmetric Allocation" also classifies **sentences**.
  - It argues that unsupervised LDA "splits topics into sub-topics in short documents".
  - — [arXiv 2512.18119](https://arxiv.org/abs/2512.18119)
- The BERTopic FAQ advises against removing text before embedding, because embedding models need full context. It does not discuss splitting long documents. — [BERTopic FAQ](https://maartengr.github.io/BERTopic/faq.html)

### Inferences
**What happens with LDA on the raw multilingual corpus**
- The vocabularies of the 12 languages are almost disjoint, so a word co-occurrence model will first separate **languages**, not rhetorical motifs. English, German and Dutch would each become one or more "topics".
- Per language, the data are tiny. English has about 66 ads (roughly 7–8k tokens at the corpus mean), and Polish, Portuguese, Russian and Catalan have 1–4 ads each.
- Verdict: **not fit for purpose** in raw form.

**Bag-of-words models after translation into English**
- After translation, the corpus is one vocabulary of about 22–25k tokens. That is still far below what LDA needs to give stable topics: Tang et al. point to document count as the binding constraint.
- Expect strong instability between runs (Agrawal et al.).
- If LDA is used at all, use Mallet-style Gibbs LDA, which is the most stable classical option (see Section 5), and run several seeds.

**Splitting ads into sentences or paragraphs (recommended)**
- Splitting serves three purposes:
  - It matches the grain of the expert annotation: spans have a median of 7 words, and there are about 3.3 spans per ad (647/195).
  - It respects the fact that an ad mixes several topoi. The one-topic-per-document assumption of GSDMM/DMM is wrong for whole ads but plausible for sentences.
  - It raises the number of units to roughly 1,000–1,500. This is my estimate, assuming 15–20 tokens per sentence; count it from the TEI.
- Cost: bag-of-words vectors become extremely sparse. This favours GSDMM/BTM-type models or, better, embeddings (Section 3).
- Middle ground: paragraphs. Many ads have a headline, body, testimonial and dealer block, which could be read from TEI `<p>`/`<ab>` structure if it is encoded.

**DTM**
- 195 ads over 26 years is about 7.5 ads per year, and fewer once split by market, so per-slice estimation is impossible.
- DTM is **unfit and effectively superseded** for this use. Time is better handled as a smooth STM prevalence covariate (`s(year)`) or with BERTopic `topics_over_time` (Section 3).

**STM: how date and market metadata could be used, conceptually**
- Run it on English-normalised paragraphs or sentences with `prevalence = ~ market + s(year) + unit_type`, where `unit_type` is ad text vs illustration description.
- `estimateEffect()` could then test questions such as:
  - "Does 'Immortality' rhetoric rise after the artist-death era of the 1920s?"
  - "Is 'Distinction from Mechanical' more prevalent in German than in English-language markets?"
- The language or market content covariate (one categorical variable) could show market-specific vocabulary inside a shared topic. With markets of 1–14 ads, however, this is over-parameterised. Collapse markets into about 4 groups (Anglophone, German, Dutch, Scandinavian, Romance/other) first.
- Deterministic spectral initialisation is a real advantage for a humanities PhD, where results must be reproducible.

**BTM and GSDMM**
- Both are viable only at sentence level on translated text.
- They are 2013–2014 methods. Embedding-based DMM variants and BERTopic-style clustering have largely superseded them for short texts, and for this corpus they add little beyond the embedding route.
- Python implementations exist (for example `gsdmm`, `bitermplus`), but maintenance varies.

**NMF**
- NMF on TF-IDF of translated sentences is a fast, deterministic baseline when NNDSVD initialisation is used, and in scikit-learn it takes minutes.
- The O'Callaghan et al. finding that NMF does well on niche corpora is mildly encouraging for a specialised advertising corpus.

### Gaps
- No study found that tests LDA, STM or NMF on corpora as small as 200 documents, or 1,000–1,500 sentence pseudo-documents, with multilingual historical text. Thresholds for this scale are therefore extrapolations.
- The exact list of limiting factors in Tang et al. 2014 was taken from secondary summaries; the original was not read in full.
- No benchmark found on whether sentence-level or paragraph-level pseudo-documents give better alignment with an expert taxonomy of rhetorical motifs.

## 2. Seeded, guided and anchored models that start from an existing taxonomy

### Takeaway
This family fits the user's situation best: an expert taxonomy already exists, and the question is whether data-driven methods confirm it, refine it, or reveal motifs that were missed. Every serious option has a slot for "extra, unseeded" topics, which is the discovery component:
- keyATM: `no_keyword_topics`
- seededlda: `residual`
- zero-shot BERTopic: documents below the similarity threshold are clustered into new topics

The most promising options are zero-shot BERTopic on multilingual sentence embeddings, which needs no shared vocabulary, and keyATM or seededlda on machine-translated text. Anchored CorEx is a reasonable alternative in Python.

### Cited Findings
**Seeded LDA (seededlda in R/quanteda)**
- Seeded LDA goes back to Jagarlamudi, Daumé & Udupa (2012), who used seed words as lexical priors in topic models. — [EACL 2012](https://aclanthology.org/E12-1021/)
- Watanabe & Zhou (2020) presented seeded LDA as "theory-driven analysis" for social sciences and humanities. Users pre-define topics with a seed-word dictionary. — [SSCR, DOI 10.1177/0894439320907027](https://ftp.eenet.ee/pub/cran/web/packages/seededlda/index.html)
- `textmodel_seededlda()` arguments: — [rdrr seededlda docs](https://rdrr.io/cran/seededlda/man/textmodel_seededlda.html)
  - `dictionary`: a quanteda dictionary of seed words; glob, regex or fixed matching.
  - `residual`: "the number of undefined topics", named "other".
  - `weight`: default 0.01, the pseudo-count given to matched seed words.
  - `alpha`: default 0.5.
  - `beta`: default 0.1.
  - `max_iter`: default 2000.
  - `auto_iter`: early stop on convergence.
- seededlda v1.0 (2023) added Sequential LDA, for sentence-level topics, and distributed LDA. The package site itself points users to keyATM as a newer semi-supervised option. — [seededlda site](https://koheiw.github.io/seededlda/)
- Critique, dated 2025: Watanabe's own DAA preprint states that semi-supervised LDA "fails to identify specific topics defined by seed words". It proposes DAA as more accurate and faster for sentence classification on UN speeches. The page lists no software release. — [arXiv 2512.18119](https://arxiv.org/abs/2512.18119)

**keyATM (Eshima, Imai & Sasaki, AJPS 2024)**
- Researchers supply a few keywords per topic and label topics **before** fitting, not after.
- In the authors' applications, keyATM gave more interpretable results, better document classification and **less sensitivity to the number of topics** than standard models.
- It supports covariates and time trends.
- — [AJPS 68(2):730–750, DOI 10.1111/ajps.12779](https://doi.org/10.1111/ajps.12779); [arXiv 2004.05964](https://arxiv.org/abs/2004.05964v2)
- Model variants in the R package: keyATM Base, keyATM Covariates, keyATM Dynamic and Weighted LDA. — [keyATM docs](https://keyatm.github.io/keyATM/)
- `no_keyword_topics` adds topics without keywords, output as "Other_1…Other_n".
- The default is 1,500 Gibbs iterations. Convergence is checked with `plot_modelfit()`, `plot_alpha()` and `plot_pi()`.
- The docs note that a "typical corpus contains several thousands of unique terms" and give no minimum document count.
- — [keyATM Base vignette](https://keyatm.github.io/keyATM/articles/pkgdown_files/keyATM_base.html)

**Anchored CorEx (Gallagher et al., TACL 2017)**
- Correlation Explanation learns topics by maximising information about the data, with no generative model.
- Domain knowledge enters as word-level **anchors**, which need "minimal human effort".
- Topics were comparable to unsupervised and semi-supervised LDA variants.
- It supports hierarchical topics and runs on sparse binary document-word matrices.
- The Python package `corextopic` is labelled pre-alpha.
- — [ACL Anthology Q17-1037](https://aclanthology.org/Q17-1037/); [arXiv 1611.10277](https://arxiv.org/abs/1611.10277); [PyPI corextopic](https://pypi.org/project/corextopic/1.0.1)

**Guided BERTopic**
- `seed_topic_list` takes keyword lists that work at two levels:
  - Each seed list is embedded. Each document is assigned the closest seed, or -1, and these labels feed a semi-supervised UMAP.
  - Seed words get a fixed c-TF-IDF multiplier (1.2 in the docs).
- Seeds only "nudge". A seeded topic that is absent from the data will not appear, and seeds must be accurate. — [BERTopic guided docs](https://maartengr.github.io/BERTopic/getting_started/guided/guided.html)

**Zero-shot BERTopic**
- `zeroshot_topic_list` takes topic **labels**, which are embedded and compared with each document by cosine similarity. Documents at or above `zeroshot_min_similarity` get the predefined topic.
- Documents **below** the threshold are clustered by the normal pipeline into **new topics**, and both sets are merged.
- "Descriptive names work better", and the threshold must be tuned per embedding model.
- `probs` are empty after fitting unless `.transform()` is called.
- — [BERTopic zero-shot docs](https://maartengr.github.io/BERTopic/getting_started/zeroshot/zeroshot.html)

**Manual BERTopic: describing the existing labels**
- Passing existing labels `y` with empty embedding, dimensionality-reduction and clustering sub-models makes BERTopic compute only c-TF-IDF representations per label. This "only takes a couple of seconds".
- Topics-over-time, topics-per-class and hierarchy features still work.
- A semi-supervised mode is also listed in the docs. — [BERTopic manual docs](https://maartengr.github.io/BERTopic/getting_started/manual/manual.html); [semi-supervised docs](https://maartengr.github.io/BERTopic/getting_started/semisupervised/semisupervised.html)

**Turftopic KeyNMF**
- Seeding takes a free-text **seed phrase**, such as a research question, that focuses the extracted topics.
- It is currently available only for KeyNMF. — [Turftopic seeded docs](https://x-tabdeveloping.github.io/turftopic/seeded/)

### Inferences
**How each tool keeps the user's topics and still discovers new ones**
- **keyATM / seededlda**:
  - One keyword topic per topos (or per merged topos family), plus 5–10 `no_keyword_topics` / `residual` topics.
  - The "Other" topics are the discovery channel. Read their top sentences to see whether they are new motifs or just noise (boilerplate, dealer addresses, prices).
  - Because both are bag-of-words models, keywords must occur in the modelled text. This means either per-language keyword lists for 12 languages (for example *unsterblich / immortal / onsterfelijk / odödlig / udødelig / inmortal / immortel* for "Immortality"), or translating everything to English first.
  - Seed words can be derived from the user's own 647 spans, for example as the top c-TF-IDF words per gold topic from Manual BERTopic.
- **Zero-shot BERTopic**: the closest match to "keep my 33, find the rest":
  - Gold topics are matched by embedding similarity, which works across languages with a multilingual encoder.
  - Unmatched sentences are clustered into new candidate topics.
  - Labels should be **descriptive sentences**, not 2-word tags. For example: "The instrument reproduces the pianist's playing exactly, with every nuance" instead of "Exact Reproduction"; "The artist's playing is preserved for posterity; the artist lives on forever" instead of "Immortality". Abstract tags such as "Phantom Body" or "Virtual Presence" will embed poorly.
- **Calibrating `zeroshot_min_similarity`**: the 647 gold spans give an empirical way to set it. Choose the value that maximises F1 of zero-shot assignment against the sentences that overlap gold spans.
- **Taxonomy granularity**:
  - 33 topics on about 1,000–1,500 sentences, with about 20 spans per topic on average and some topics probably much rarer, is too fine-grained for any probabilistic model.
  - Consider merging into about 8–15 families for the model, for example "fidelity" (Exact Reproduction, Virtual Presence), "transcendence" (Immortality, Miracle, Phantom Body), "non-mechanical" (Distinction from Mechanical, Superiority), and "domesticity" (Home, Sitting Woman, Touch of a Button). Keep the fine taxonomy for evaluation.
- **Pictorial motifs** such as "Sitting Woman" exist only in the illustration descriptions. Those descriptions are editorial prose, not period text. Model them as a separate unit type, or exclude them, so that editorial vocabulary does not create artificial topics.
- **LSS and Newsmap** (Watanabe's quanteda tools) are semi-supervised **scaling or classification** tools, not topic discovery. LSS could, for example, place sentences on a seed-defined "mechanical vs artistic" axis. They are peripheral here.
- **Anchored CorEx**: worth considering in Python. Anchors can be multilingual word lists, since an anchor is just a set of columns. Its binary bag-of-words setup tolerates sparse short units. The pre-alpha package status is a maintenance risk.

### Gaps
- No published application found of keyATM, seededlda or CorEx to corpora with fewer than about 1,000 documents. Behaviour at this scale is untested.
- No evidence found on how zero-shot BERTopic thresholds behave with multilingual encoders or historical text. The docs say only "tune manually".
- The mechanism of Turftopic's seed phrase was not documented on the page fetched.

## 3. Embedding-based and neural models (BERTopic, Top2Vec, CTM/ZeroShotTM, FASTopic, KeyNMF/Turftopic, ECRTM), and which multilingual embedding models to use

### Takeaway
Embedding-based models are the only family that can handle 12 languages without translation, because similarity is computed in a shared multilingual semantic space. BERTopic, used as a toolbox rather than with its defaults, plus Turftopic's KeyNMF or S3 as more stable alternatives, are the realistic candidates. Two cautions:
- Clustering-based models (BERTopic, Top2Vec) are documented as unstable.
- Multilingual embeddings tend to cluster **by language**.

VAE-style neural topic models (CTM/ZeroShotTM, ECRTM, and research models in general) are **not suitable** for about 200 documents: they are less stable than classical LDA even on large corpora. Recommended encoders:
- baseline: `paraphrase-multilingual-mpnet-base-v2`
- stronger options to compare: `intfloat/multilingual-e5-large-instruct` and `BAAI/bge-m3`

Avoid LaBSE for topical similarity. No benchmark exists for 1905–1930 spelling, so the user's own gold spans should be used to choose the encoder.

### Cited Findings
**BERTopic: pipeline**
- Grootendorst (2022): document embeddings, then UMAP dimensionality reduction, then HDBSCAN clustering, then class-based TF-IDF (c-TF-IDF) topic representations. — [arXiv 2203.05794](https://arxiv.org/pdf/2203.05794)

**BERTopic: guidance for small data (FAQ)**
- With "only a few documents (~1000)" it is "very difficult to properly extract topics". If too few topics come out, lower `min_topic_size` or `n_neighbors`.
- Outliers (-1) are controlled by HDBSCAN `min_samples`, which defaults to `min_cluster_size`. Remedies: `.reduce_outliers()` with four strategies, or replacing HDBSCAN with k-means, which produces no outliers.
- UMAP is stochastic. Set `random_state` for reproducibility "at the expense of performance".
- `nr_topics="auto"` merges similar topics.
- For multilingual documents, `paraphrase-multilingual-MiniLM-L12-v2` is recommended, and `paraphrase-multilingual-mpnet-base-v2` for higher quality.
- — [BERTopic FAQ](https://maartengr.github.io/BERTopic/faq.html)

**BERTopic: time, class, representation and LLM features**
- Topics over time (dynamic topic modelling), topics per class, and representation models (KeyBERTInspired, MMR, and LLM-based labelling).
- These work on top of any fitted model, including manual/labelled models. — [BERTopic manual docs](https://maartengr.github.io/BERTopic/getting_started/manual/manual.html); [BERTopic zero-shot docs](https://maartengr.github.io/BERTopic/getting_started/zeroshot/zeroshot.html)
- Docs pages for these features: [topics over time](https://maartengr.github.io/BERTopic/getting_started/topicsovertime/topicsovertime.html), [topics per class](https://maartengr.github.io/BERTopic/getting_started/topicsperclass/topicsperclass.html), [LLM representation](https://maartengr.github.io/BERTopic/getting_started/representation/llm.html).

**Top2Vec**
- Angelov (2020) jointly embeds documents and words, clusters with HDBSCAN, and takes topic vectors as cluster centroids. — [arXiv 2008.09470](https://arxiv.org/abs/2008.09470)
- Turftopic's model overview groups BERTopic and Top2Vec as "clustering models" and describes them as "**Unreliable and unstable**". — [Turftopic model overview](https://x-tabdeveloping.github.io/turftopic/model_overview/)

**Turftopic library (Kardos et al., JOSS 2025)**
- Implements S³ (Semantic Signal Separation), KeyNMF, GMM, Topeax, clustering models (BERTopic/Top2Vec-style), C-Top2Vec, autoencoding models (ZeroShotTM/CombinedTM) and FASTopic.
- Features: seeded, dynamic, online, hierarchical and cross-lingual modelling, plus LLM topic naming. — [JOSS 10(111) 8183](https://joss.theoj.org/papers/10.21105/joss.08183); [Turftopic docs](https://x-tabdeveloping.github.io/turftopic/)
- In the model overview:
  - KeyNMF's strengths are listed as "Reliability" and "Multilingual performance".
  - GMM: "Reliability".
  - Topeax: "Stability".
  - FASTopic is "Very slow" and "Memory hungry".
  - — [Turftopic model overview](https://x-tabdeveloping.github.io/turftopic/model_overview/)
- Cross-lingual support:
  - S³, ClusteringTopicModel, AutoEncodingTopicModel(combined=False) and GMM work cross-lingually when given a multilingual encoder. Encoder choice should follow MTEB(Multilingual).
  - KeyNMF has an **experimental** `cross_lingual=True` term-matching mode that merges near-synonymous terms across languages (for example "africa-afrikanisch-african").
  - — [Turftopic cross-lingual docs](https://x-tabdeveloping.github.io/turftopic/cross_lingual/)

**KeyNMF**
- Introduced by Kristensen-McLachlan, Hicke, Kardos & Thunø (CHR 2024).
- It extracts keyword importances per document with contextual embeddings (KeyBERT-like), then factorises them with NMF.
- Reported as "competitive on a number of Chinese datasets and metrics", and supports static and dynamic modelling. — [arXiv 2410.12791](https://arxiv.org/abs/2410.12791)

**Contextualized Topic Models (CombinedTM / ZeroShotTM)**
- Bianchi et al. (EACL 2021): ZeroShotTM learns topics from English documents and transfers them to unseen documents in Italian, French, German and Portuguese via multilingual embeddings. — [ACL Anthology 2021.eacl-main.143](https://aclanthology.org/2021.eacl-main.143/)
- The CTM README:
  - ZeroShotTM is the only CTM variant for cross-lingual use.
  - It recommends `paraphrase-multilingual-mpnet-base-v2`.
  - Use preprocessed text for the bag of words and raw text for embeddings.
  - Keep the vocabulary under about 2,000 words.
  - No guidance on small datasets.
  - — [GitHub MilaNLProc/contextualized-topic-models](https://github.com/MilaNLProc/contextualized-topic-models)

**Stability of neural vs classical models**
- Hoyle, Goel, Sarkar & Resnik (Findings of EMNLP 2022) compared Mallet Gibbs LDA with Scholar, Scholar+KD, Dirichlet-VAE and CTM, on 14k Wikipedia articles and 32k bill summaries.
  - Mallet was "significantly more stable … often by a large margin" and had the best alignment with human category labels.
  - No neural model approached Mallet's topic-word stability.
  - — [arXiv 2210.16162](https://ar5iv.labs.arxiv.org/html/2210.16162)

**FASTopic and ECRTM**
- FASTopic (Wu et al., NeurIPS 2024) models relations between pretrained document embeddings and learnable topic and word embeddings, regularised as optimal-transport plans.
  - The authors claim better effectiveness, efficiency, stability and transferability than baselines on benchmark datasets. These are the authors' own claims. — [NeurIPS 2024](https://proceedings.neurips.cc/paper_files/paper/2024/hash/998f8d8ff2697da2eae5f87143668754-Abstract.html); [arXiv 2405.17978](https://arxiv.org/pdf/2405.17978)
- ECRTM (Wu et al., ICML 2023) is a VAE-family neural topic model with embedding-clustering regularisation against topic collapse. — [PMLR v202](https://proceedings.mlr.press/v202/wu23c.html)

**Multilingual encoders**
- `paraphrase-multilingual-mpnet-base-v2` and `-MiniLM-L12-v2`:
  - Cover 50+ languages and are trained by distillation on parallel data. — [SBERT pretrained models](https://www.sbert.net/docs/sentence_transformer/pretrained_models.html); [Reimers & Gurevych, EMNLP 2020](https://aclanthology.org/2020.emnlp-main.365/)
  - BERTopic's FAQ and the CTM README both recommend them. — [BERTopic FAQ](https://maartengr.github.io/BERTopic/faq.html); [CTM README](https://github.com/MilaNLProc/contextualized-topic-models)
- LaBSE:
  - Covers 109 languages and is built for bitext mining. It "works less well for assessing the similarity of sentence pairs that are not translations of each other". — [SBERT pretrained models](https://www.sbert.net/docs/sentence_transformer/pretrained_models.html); [Feng et al., ACL 2022](https://aclanthology.org/2022.acl-long.62/)
- multilingual-e5:
  - MMTEB (ICLR 2025; more than 500 tasks, 250+ languages) found that instruction-tuned models consistently beat their non-instruction-tuned counterparts.
  - `multilingual-e5-large-instruct` gained especially in bitext mining and **clustering**. — [MMTEB arXiv 2502.13595](https://arxiv.org/pdf/2502.13595v4); [mE5 report arXiv 2402.05672](https://arxiv.org/abs/2402.05672)
- BGE-M3 is a multilingual, multi-granularity embedding model (dense, sparse and multi-vector). — [arXiv 2402.03216](https://arxiv.org/abs/2402.03216)

**Language clustering in multilingual embeddings**
- Clustering-based cross-lingual topic models "tend to group documents by language" because of "language-dependent dimensions" in multilingual representations.
- An SVD-based dimension-refinement step reduces this and "generally outperforms" other cross-lingual topic models. — [Chang et al., BUCC @ COLING 2025, arXiv 2412.12433](https://arxiv.org/abs/2412.12433)
- Libovický, Rosa & Fraser (Findings of EMNLP 2020) found multilingual representations only moderately language-neutral.
  - Simple **per-language centering** improves language neutrality: subtracting each language's mean vector. — [arXiv 2004.05160](https://arxiv.org/abs/2004.05160v3); [ACL Anthology 2020.findings-emnlp.150](https://preview.aclanthology.org/new-sigs/2020.findings-emnlp.150/)

**Historical language and OCR noise**
- Evidence is mixed:
  - OCR noise degrades topic stability and coherence. — [L3I/HAL](https://hal-univ-rochelle.archives-ouvertes.fr/L3I/hal-03025563v1)
  - Embedding-based models (especially ETM) were "slightly more resilient than LDA" to noise. — Zosa et al., ICADL 2021, via [L3I paper](https://l3i.univ-larochelle.fr/app/uploads/sites/12/2024/05/paper_11.pdf)
  - The Dutch National Library found OCR did not in general compromise LDA results on historical newspapers. — [KB Lab](https://lab.kb.nl/node/94)
  - Living with Machines recommends OCR quality above 90%, or at least above 80%, for topic modelling. — [Living with Machines](https://livingwithmachines.ac.uk/?p=1355)
- When language models are **trained** on OCR-noisy text, outputs drift further from clean targets as quality drops. On small corpora, PPMI and word2vec were more robust than transformers. This concerns training, not using pretrained encoders. — [Todorov & Colavizza, ICAART 2022, arXiv 2202.00470](https://arxiv.org/abs/2202.00470)
- Before German orthographic standardisation (1901), spelling variation was much wider, which complicates search and downstream NLP. — [arXiv 2409.02841](https://www.arxiv.org/pdf/2409.02841)
- British and American spelling variants sit close together in language-model embedding space. — [arXiv 2303.03457](https://arxiv.org/pdf/2303.03457)

### Inferences
**BERTopic on 195 whole ads with default settings (verdict: does not work)**
- `min_topic_size=10` and HDBSCAN would yield a handful of clusters, many outliers, and probably language-driven clusters.
- At sentence level (about 1,000–1,500 units) it becomes feasible, but only with small-data settings. These are my recommendations, to be validated:
  - Precompute embeddings once and pass them via `fit_transform(docs, embeddings=E)`.
  - Optionally center embeddings per language (Libovický et al.) to suppress language clusters.
  - `UMAP(n_neighbors=10, n_components=5, min_dist=0.0, metric="cosine", random_state=42)`.
  - `HDBSCAN(min_cluster_size=5, min_samples=2)`, or replace it with `AgglomerativeClustering`/`KMeans` so there are no outliers. At this scale, a fixed K of about 30–50 that is then inspected is reasonable.
  - `CountVectorizer(min_df=2, ngram_range=(1,2))` with multilingual stop-words, plus domain stop-words (Welte, Mignon, Freiburg, dealer and street names, prices), or masking of TEI-tagged names, places and organisations.
  - Representation: `KeyBERTInspired` + MMR; optionally an LLM for labels.
  - Run `topics_over_time(docs, years)` and `topics_per_class(docs, classes=market)`.
- **Useful trick**: compute embeddings on the **original-language** sentences, so that semantics come from the original text, and pass **English translations** as `docs`. The c-TF-IDF keywords are then readable in one language instead of a 12-language word salad.
  - Otherwise c-TF-IDF over a mixed vocabulary will be dominated by English, the largest language, and per-language synonyms will split across keyword slots.
- **Top2Vec**: same issues as BERTopic, fewer modular options, and its doc2vec mode needs large corpora. It is **superseded by BERTopic/Turftopic** for this use.
- **CTM / ZeroShotTM**:
  - It requires training a VAE on the target corpus.
  - Training on the 66 English ads and transferring to the other 11 languages is far too little data.
  - Hoyle et al. show neural topic models are less stable than Mallet even with 14k–32k documents.
  - Verdict: **unfit**. Its niche (cross-lingual transfer of English-trained topics) is now better served by multilingual encoders plus clustering.
- **FASTopic and ECRTM**: neural optimisation on about 1k short units is unproven. The FASTopic stability claims come from large benchmarks. Treat as **research curiosities, not first choices**.
- **KeyNMF (Turftopic)**:
  - Attractive because NMF is deterministic given its initialisation, it is listed as reliable and good at multilingual work, and it supports a seed phrase and dynamic modelling.
  - Its weak point here is that keywords remain language-specific unless the experimental `cross_lingual=True` is used.
  - A sensible second model next to BERTopic.
- **S³ and GMM (Turftopic)**:
  - Both work natively cross-lingually and produce topics as axes or soft components, which suits motifs that co-occur within a sentence.
  - They are worth a quick try because the API is shared.
- **Choosing the encoder empirically**: use the gold spans as a probe.
  - Embed the 647 spans with each candidate encoder.
  - Measure k-nearest-neighbour accuracy of the topos label, especially **across languages** (does a Swedish "Immortality" span retrieve English and German "Immortality" spans?).
  - Pick the encoder with the best cross-lingual retrieval. This turns the "historical spelling" question into a measurable one for this corpus.
- **Hand transcription**: the edition is hand-transcribed TEI, so OCR noise matters little. The remaining risk is **period orthography**, for example pre-1947 Dutch *mensch* vs *mens*, and pre-reform Scandinavian spellings.
  - Bag-of-words models treat every variant as a separate word type.
  - Subword-tokenised encoders probably degrade more gracefully. This is untested here; see Gaps.
  - Translation to modern English also normalises spelling as a side effect.

### Gaps
- No benchmark found that evaluates multilingual sentence encoders on early-20th-century orthography (Dutch, Scandinavian, German) or on period advertising language.
- No published BERTopic or Turftopic application found on fewer than about 1,000 short multilingual units, and no published small-data defaults.
- Whether `paraphrase-multilingual-mpnet-base-v2` covers Norwegian (nb) and Catalan specifically was not verified.
- Newer 2025–2026 encoders (for example Qwen3-Embedding, EmbeddingGemma, jina-embeddings-v3) were not checked against the live MTEB leaderboard. Check its clustering tab before choosing.
- The FASTopic and S³ papers were not read in full. The Turftopic leaderboard numbers were not visible on the fetched page.

## 4. Multilingual strategy: translate first, use multilingual embeddings, or use polylingual topic models?

### Takeaway
For bag-of-words models (LDA, STM, keyATM, seededlda, NMF), translating into one language first is well supported. Evidence from political science shows machine-translated corpora reproduce topic-model results on human translations closely. For embedding models, multilingual encoders avoid translation but bring a language-clustering bias that must be corrected. Polylingual topic models need aligned document tuples and much more data, so they are **outdated for this corpus**.

The pragmatic hybrid: embed the original text, model or label topics on an English translation, and keep the original-language sentence as the unit that is cited and read.

### Cited Findings
**Translate first**
- de Vries, Schoonvelde & Schumacher (Political Analysis 2018), on Europarl:
  - Term-document matrices and LDA output from Google-Translated text were "highly similar" to those from human-translated text, in both topic prevalence and content.
  - They judge MT a useful tool for comparative bag-of-words research. — [Political Analysis 26(4), DOI 10.1017/pan.2018.26](https://www.cambridge.org/core/product/43CB03805973BB8AD567F7AE50E72CA6); [open-access PDF](https://pure.uva.nl/ws/files/62677667/no_longer_lost_in_translation_evidence_that_google_translate_works_for_comparative_bag_of_words_text_applications.pdf)
- Maier, Baden et al. (Communication Methods & Measures 2022) compared machine translation with a multilingual dictionary before topic modelling, on English, Hebrew and Arabic tweets and news:
  - Both approaches gave many equivalent topics, and the differences showed up mainly in social-media text.
  - The dictionary approach captured core (conflict) themes in more detail. MT picked up peripheral topics that the dictionary missed. — [HUJI record](https://cris.huji.ac.il/en/publications/machine-translation-vs-multilingual-dictionaries-assessing-two-st/)

**Polylingual topic models**
- Mimno et al. (EMNLP 2009) extended LDA to learn topics aligned across languages, demonstrated on EuroParl and Wikipedia with more than ten languages each. The model relies on **tuples of linked documents** across languages. — [ACL Anthology D09-1092](https://aclanthology.org/D09-1092/)
- Lind et al. (CMM 2022) surveyed multilingual topic-modelling strategies for comparative research and demonstrated the PLTM.
  - The PLTM "bridges the gap between languages by making use of document connections in training documents".
  - Because those training documents are "the crucial resource", they compare strategies for building them. — [Univie record](https://ucrisportal.univie.ac.at/en/publications/building-the-bridge-topic-modeling-for-comparative-research/); [DOI 10.1080/19312458.2021.1965973](https://doi.org/10.1080/19312458.2021.1965973)

**Multilingual embeddings**
- Embeddings group documents by language. Fixes: SVD dimension refinement ([arXiv 2412.12433](https://arxiv.org/abs/2412.12433)) and per-language centering ([arXiv 2004.05160](https://arxiv.org/abs/2004.05160v3)).
- A BNAIC 2022 study on a multi-language corpus (via search snippet; the page returned HTTP 503):
  - BERTopic with multilingual embeddings performed best among the methods tested, but was hurt by "low quality multilingual sentence embeddings of low-resource languages".
  - Topic coherence did not correlate with human interpretability. — [BNAIC 2022 submission 6221](https://bnaic2022.uantwerpen.be/BNAICBeNeLearn_2022_submission_6221)
- A 2026 study of Russian policy speeches chose to translate and run BERTopic in English. Its earlier native-Russian pipeline needed much heavier language-specific preprocessing and trials of several multilingual encoders. This is a design choice, not a benchmark. — [arXiv 2605.15886](https://arxiv.org/pdf/2605.15886)

**ZeroShotTM**
- ZeroShotTM transfers topics trained in one language to others. — [EACL 2021](https://aclanthology.org/2021.eacl-main.143/)

### Inferences
**Recommendation: dual-track text**
- Keep the original transcription as the analytical unit and the citation.
- Produce an English working translation, and optionally a German one, for bag-of-words models and for keyword representations.
- Use multilingual embeddings of the originals for clustering and zero-shot matching.

**Translation risks specific to this corpus**
- MT may flatten the period-specific rhetorical vocabulary that the topoi depend on. For example, German *beseelt*, *Künstlerspiel*, *Seele des Spiels* may all become "soulful" or "artist's playing".
- MT may mistranslate pre-reform Scandinavian or Dutch spellings.
- With 2026-era LLM translation this risk is smaller than with the 2018 Google Translate studied by de Vries et al., but it is not zero.
- Mitigation: spot-check translations of the 647 gold spans. They are short, so this is cheap, and it is a direct test of whether each topos survives translation.

**Polylingual topic models (PLTM)**
- Welte reused the same copy across markets (to be verified in the edition). If translated variants of one ad are identified in the TEI, they form natural "document tuples" that a PLTM, or a parallel-data projection like Libovický et al.'s, could exploit.
- But with 195 ads in total, a PLTM is not viable. Treat it as **historically important but superseded** by multilingual encoders.

**Very small languages**
- Catalan (1 ad), Portuguese (2), Russian (2) and Polish (4) cannot form language-specific topics in any model.
- In embedding space they can join cross-lingual clusters only if the encoder aligns them well, which is the BNAIC low-resource caveat.
- Translation is safest for these.

### Gaps
- No head-to-head study found that compares translate-first against multilingual-embedding topic models on the same corpus with human evaluation. The evidence is indirect: MT for bag-of-words, and embedding bias for clustering.
- The BNAIC 2022 paper could not be opened, so its claims come from a search snippet.
- A 2026 preprint on the Political Manifesto Corpus reportedly finds that translation distorts embedding similarity differently per language. It appeared only in search results and was not verified, so it is not cited above.
- No evidence found on MT quality for 1905–1930 advertising language in Swedish, Danish, Norwegian or Dutch.

## 5. Evaluation and stability: coherence metrics, run-to-run instability, choosing K, small-corpus pitfalls, and comparison with the gold taxonomy

### Takeaway
On this corpus, standard automated coherence metrics (NPMI, C_v) should not decide anything. They are poorly validated against human judgement, and with 22k tokens in 12 languages their co-occurrence statistics are meaningless. The user's 647 gold spans are the main asset: they allow an extrinsic evaluation that most topic-model studies lack. The tools are:
- sentence-level contingency tables of discovered topic × gold topos
- ARI, NMI and P1 (purity/inverse-purity)
- best-match F1 per topos

Stability across seeds must be measured explicitly, and ensembling or consensus across runs is advisable.

### Cited Findings
**Automated coherence metrics**
- Hoyle et al. (NeurIPS 2021, "Is Automated Topic Model Evaluation Broken?"):
  - Automated coherence can declare a winning model when human evaluations do not.
  - There is a **validation gap**: coherence was not validated for neural models. There is also a **standardisation gap**: benchmarks are inconsistent.
  - They recommend pairing automated metrics with human evaluation. — [arXiv 2107.02173](https://arxiv.org/pdf/2107.02173); [NeurIPS 2021](https://neurips.cc/virtual/2021/poster/27300)
- Stammbach, Zouhar, Hoyle, Sachan & Ash (EMNLP 2023):
  - LLM ratings of topic word sets correlate more strongly with human judgements than existing automated metrics.
  - LLMs are better at coherence rating than at word intrusion.
  - LLMs can help choose the number of topics, especially when the research question is included in the prompt.
  - Code: [GitHub](https://github.com/dominiksinsaarland/evaluating-topic-model-output). — [ACL Anthology 2023.emnlp-main.581](https://aclanthology.org/2023.emnlp-main.581); [arXiv 2305.12152](https://arxiv.org/abs/2305.12152v2)
- In a multi-language corpus study, topic coherence was not correlated with human interpretability. — [BNAIC 2022](https://bnaic2022.uantwerpen.be/BNAICBeNeLearn_2022_submission_6221) (snippet only)

**Stability and alignment with human categories**
- Hoyle et al. (Findings of EMNLP 2022) measured stability as total topic distance between runs: Rank-Biased Overlap with optimal bipartite matching, on both topic-word and document-topic estimates, over 10 seeds or hyperparameter samples.
  - They measured alignment with human labels via **ARI, NMI and P1** (the harmonic mean of purity and inverse purity).
  - Mallet LDA was the most stable and best aligned.
  - **Ensembling** (pool topics from 10 runs, cluster them, average within clusters) beat the median single run in 97% of settings and often beat the best run. — [arXiv 2210.16162](https://ar5iv.labs.arxiv.org/html/2210.16162)
- Off-the-shelf LDA shows large topic instability under data reordering. Tuning the parameters for stability (LDADE) reduces it. — [arXiv 1608.08176](https://arxiv.org/abs/1608.08176v2)
- BERTopic results vary between runs because UMAP is stochastic. Fixing `random_state` restores reproducibility at some cost. — [BERTopic FAQ](https://maartengr.github.io/BERTopic/faq.html)
- Turftopic flags clustering models as "unreliable and unstable", and KeyNMF/GMM as "reliable". — [Turftopic model overview](https://x-tabdeveloping.github.io/turftopic/model_overview/)

**Choosing K**
- STM: `searchK()` (held-out likelihood, residuals, semantic coherence, exclusivity), or `K=0` (Lee-Mimno), which is stochastic and has "no particular statistical guarantees". — [stm vignette](https://cran.r-project.org/web/packages/stm/vignettes/stmVignette.pdf)
- keyATM: less sensitive to K than unseeded models. — [AJPS](https://doi.org/10.1111/ajps.12779)
- BERTopic: `nr_topics="auto"` merges similar topics. Forcing a fixed number can lower quality. — [BERTopic FAQ](https://maartengr.github.io/BERTopic/faq.html)

**Human evaluation by qualitative researchers**
- In a study of 12 qualitative researchers, 8 preferred BERTopic over LDA and NMF for "detailed, coherent clusters". — [Kaur & Wallace, arXiv 2412.14486](https://arxiv.org/abs/2412.14486)

### Inferences
**Why coherence metrics fail here**
- NPMI/C_v estimated within the corpus rest on about 22k tokens split across 12 languages, which is far too sparse.
- No external reference corpus of 1905–1930 multilingual advertising language exists.
- Report coherence at most as a sanity check, never to choose models or K.

**Choosing K**
- Choose K by:
  - (a) interpretability, read through representative sentences;
  - (b) stability across 10 or more seeds;
  - (c) alignment with the gold taxonomy at a matching granularity.
- An LLM rating of topic word lists (Stammbach et al.) can be a cheap extra signal.

**Protocol for comparing discovered topics with the 647-span gold taxonomy**
1. **Common unit.** Use sentences. Label each sentence with the topos or topoi whose spans overlap it, or "none". Expect multi-label sentences: either keep the multi-label form or assign the majority or longest-overlap topos.
2. **Contingency table** of discovered topic × gold topos, as counts and as row and column percentages. This is the most informative artefact for a humanist reader. It shows which topoi a model:
   - merges (for example Immortality + Virtual Presence into one cluster),
   - splits (for example Exact Reproduction into "fidelity to nuance" and "technical mechanism"),
   - misses entirely (likely for abstract motifs such as "Phantom Body").
3. **Summary scores** on the annotated sentences only, with bootstrap confidence intervals, because there are only about 20 spans per topos on average:
   - ARI and NMI between hard assignments (argmax for mixed-membership models);
   - P1 (purity and inverse purity);
   - per-topos best-match F1.
4. **Discovery check.** Inspect clusters made mostly of unannotated sentences. These are candidate new topoi, or confirmation that the remaining text is boilerplate (addresses, prices, model names).
5. **Stability.** Run 10 or more seeds per configuration and report RBO or Jaccard topic overlap. Only report topics that recur in most runs, or ensemble the runs as Hoyle et al. 2022 do.

**Expected mismatch between topics and topoi**
- Topic models find **lexical or semantic themes**: artist testimonials and pianist names, technical features, the dealer and price block, concert/salon settings.
- The taxonomy encodes **rhetorical arguments** that are often expressed indirectly.
- So expect high agreement for lexically marked topoi (Home, Touch of a Button, Distinction from Mechanical) and low agreement for abstract ones (Phantom Body, Miracle).
- Low agreement is not by itself evidence that the taxonomy is wrong.

### Gaps
- No study found that evaluates topic models against a **rhetorical or topos** taxonomy, as opposed to subject-matter categories.
- How agreement metrics behave with such small per-class counts (about 20 spans) is not addressed in the literature found. Bootstrap intervals are an inference, not an established protocol.
- Doogan & Buntine (NAACL 2021) and other critiques of coherence were not fetched and are not cited.

## 6. Practical recommendations: which 2–3 methods to try, with which unit of analysis, which library, and how much effort

### Takeaway
For a 195-ad, 12-language corpus with an expert taxonomy, three methods are realistically worth trying. All use sentences (or paragraphs) as the unit and use the 647 gold spans for calibration and evaluation:
1. **Zero-shot + clustering BERTopic** on multilingual embeddings (Python `bertopic`), as the main discovery tool.
2. **keyATM**, or seededlda as the alternative (R), on English-translated sentences, as the "taxonomy-first" probabilistic check, with metadata.
3. **A stable baseline**: Turftopic KeyNMF or S³ (Python `turftopic`), or STM with spectral initialisation (R `stm`) when metadata effects (year, market) are the question.

**Drop**: LDA on raw text, DTM, PLTM, CTM/ZeroShotTM, Top2Vec, and VAE-family neural models (ECRTM and similar). They are too data-hungry, too unstable, or superseded.

### Cited Findings
The recommendations below rest on these sources:
- **Zero-shot BERTopic** keeps predefined topics and clusters the rest into new topics. — [BERTopic zero-shot](https://maartengr.github.io/BERTopic/getting_started/zeroshot/zeroshot.html)
- **Manual BERTopic** turns existing labels into c-TF-IDF descriptors in seconds. — [BERTopic manual](https://maartengr.github.io/BERTopic/getting_started/manual/manual.html)
- **BERTopic small-data and multilingual guidance**: about 1,000 documents is already "very difficult"; recommended encoders are the paraphrase-multilingual family. — [BERTopic FAQ](https://maartengr.github.io/BERTopic/faq.html)
- **keyATM**: pre-labelled keyword topics, unseeded "Other" topics, covariate and dynamic variants, lower sensitivity to K. — [keyATM docs](https://keyatm.github.io/keyATM/articles/pkgdown_files/keyATM_base.html); [AJPS](https://doi.org/10.1111/ajps.12779)
- **seededlda**: residual topics, and a sequential (sentence-level) variant. — [rdrr](https://rdrr.io/cran/seededlda/man/textmodel_seededlda.html); [seededlda](https://koheiw.github.io/seededlda/)
- **Machine translation preserves bag-of-words topic-model results.** — [de Vries et al. 2018](https://www.cambridge.org/core/product/43CB03805973BB8AD567F7AE50E72CA6)
- **Turftopic KeyNMF/GMM are listed as reliable; KeyNMF has a seed phrase and experimental cross-lingual term matching; clustering models are listed as unstable.** — [Turftopic overview](https://x-tabdeveloping.github.io/turftopic/model_overview/); [seeded](https://x-tabdeveloping.github.io/turftopic/seeded/); [cross-lingual](https://x-tabdeveloping.github.io/turftopic/cross_lingual/)
- **STM**: deterministic spectral initialisation and prevalence covariates. — [stm vignette](https://cran.r-project.org/web/packages/stm/vignettes/stmVignette.pdf)
- **Classical Mallet LDA is more stable than neural topic models; ensembling helps.** — [Hoyle et al. 2022](https://ar5iv.labs.arxiv.org/html/2210.16162)
- **Multilingual embeddings cluster by language; per-language centering or SVD refinement helps.** — [arXiv 2412.12433](https://arxiv.org/abs/2412.12433); [arXiv 2004.05160](https://arxiv.org/abs/2004.05160v3)

### Inferences
The concrete plan below is my synthesis, not taken from a single source.

**Step 0: data preparation (about 1–2 days)**
- Export from TEI one row per sentence (or paragraph) with these fields:
  - `ad_id`, `lang`, `year`, `market/country`, `unit_type` (copy / headline / testimonial / dealer block / illustration description)
  - original text
  - gold topoi overlapping the unit
- Mask or strip TEI-tagged personal names, places, organisations, addresses and prices, or add them to stop-word lists. Otherwise "Welte", "Freiburg", dealer names and pianist names will dominate topics.
- Machine-translate all units to English with an LLM or DeepL-class engine. Spot-check the gold spans.

**Step 1: Manual BERTopic as a quick win (a few hours)**
- Fit BERTopic with `y = gold topos` on the annotated spans or sentences.
- This yields c-TF-IDF keyword profiles per topos, per language (`topics_per_class`) and over time (`topics_over_time`).
- It is not discovery, but it gives seed-word lists for Step 3 and a first quantitative description of the taxonomy.

**Step 2: zero-shot + clustering BERTopic (about 2–4 days including tuning)**
- Unit: original-language sentences, embedded once.
- Encoders: compare `paraphrase-multilingual-mpnet-base-v2`, `intfloat/multilingual-e5-large-instruct` and `BAAI/bge-m3`. Choose by cross-lingual kNN accuracy on the gold spans.
- Optionally subtract per-language mean vectors.
- `zeroshot_topic_list`: 33 (or about 12 merged) **descriptive sentences** written by the user, one per topos.
- `zeroshot_min_similarity`: tuned to maximise F1 on gold-annotated sentences.
- Remaining sentences go to UMAP (`n_neighbors` about 10, `random_state` fixed) and then HDBSCAN (`min_cluster_size` about 5) or Agglomerative clustering.
- Representations come from English translations, via precomputed embeddings plus translated docs, using KeyBERTInspired and optionally LLM labels.
- Output to read:
  - which sentences match each topos;
  - the new clusters (candidate topoi);
  - topos prevalence over time and per market.
- Repeat over 10 seeds and keep only recurring new clusters.

**Step 3: keyATM on translated sentences or paragraphs (about 2–4 days in R)**
- Keywords: 5–10 English keywords per topos (or topos family), taken from Step 1 and the user's expertise, checked with `visualize_keywords`.
- `no_keyword_topics` = 5–10 for discovery.
- `keyATM Covariates` with market group + year, or `keyATM Dynamic` with year bins.
- Alternative: `seededlda::textmodel_seededlda(residual = 5–10)` or `textmodel_seqlda` for sentence-level sequential topics.
- Compare its sentence-level assignments with the gold topoi and with Step 2.

**Step 4 (optional): stable baseline or metadata model (about 1–2 days)**
- Option A: Turftopic `KeyNMF(n, encoder=…, seed_phrase="rhetoric used to advertise a reproducing piano")` on translated sentences, or `SemanticSignalSeparation` on multilingual embeddings.
- Option B: `stm(..., K = 10–20, prevalence = ~ market_group + s(year) + unit_type, init.type = "Spectral")` on translated paragraphs, then `estimateEffect()`.

**Total effort**
- About 1.5–3 weeks of focused work for someone comfortable with Python or R, most of it spent on data export, translation checks and close reading of outputs, not on model fitting.
- Fitting itself takes seconds to minutes at this scale, so seed and parameter sweeps are cheap.

**What the user can realistically expect**
- (a) Quantitative confirmation of which topoi are lexically or semantically distinct and which merge.
- (b) A handful of candidate new motifs from residual or "Other" topics and unmatched clusters.
- (c) Timelines of topos prevalence per market.
- They should **not** expect a model to "discover" the 33-topos taxonomy from scratch. At this scale, automatic discovery complements expert annotation and cannot replace it.

**How to frame it in the thesis**
- A "computer-assisted, taxonomy-anchored" approach: seeded or zero-shot models plus discovery residuals, evaluated against the hand annotation.
- This is methodologically more defensible than unsupervised LDA, given the evidence that coherence metrics are unreliable (Hoyle 2021) and that topic models are unstable (Hoyle 2022; Agrawal et al.).

### Gaps
- The effort estimates and parameter values above are informed judgement, not benchmarked figures. They should be validated in a pilot run on the actual TEI data.
- No published case study found of topic modelling historical **advertisements** (as opposed to newspaper articles). Wevers' work on Dutch newspaper ads uses other text-mining methods. — [DHQ 14(2)](https://www.digitalhumanities.org/dhq/vol/14/2/000445/000445.html)
- Surveys suggested in the brief (Zhao et al. 2021 on neural topic models; Abdelrazek et al. 2023) were not consulted directly. The method-level primary sources above cover the same ground for this corpus.
