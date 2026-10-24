# LLM-based topic discovery, concept induction and LLM-assisted inductive coding (state of research, Oct 2026), applied to the Welte-Mignon Advertisements Collection

Scope note: these notes cover LLM-driven methods only. Classical and embedding topic models (LDA, BERTopic clustering) and DH practice are covered by other researchers. All per-corpus statements refer to the Welte corpus as described in the brief: 195 ads, ~22,800 word tokens, median 84 tokens per ad, 12 languages, ~183 prose descriptions of illustrations, an expert taxonomy of topoi, and 647 @ana spans (436 assigned by Claude, 183 by the editor).

Local observation from the repository: the taxonomy in `tei/shared/encoding.xml` (/home/user/welte-ads/tei/shared/encoding.xml) has 32 `<category>` elements, not 33 as the brief says. Only 5 of them carry a `<desc>` definition (distinction_from_mechanical, exact_reproduction, immortality, secret, touch_of_a_button). The other 27 have only a `<gloss>` label, and some labels differ from their IDs (`listening` has the gloss "Revelled Listening", `unreached_ideal` has "Ideal Instrument"). This matters for every method below, because LLM coding quality depends heavily on explicit codebook definitions (see Q5).

---

## 1. TopicGPT (Pham et al., NAACL 2024): stages, hierarchy, evaluation, code

### Takeaway
TopicGPT is a prompt-only pipeline: an LLM generates a list of topics, the list is refined by merging near-duplicates and pruning rare topics, and then each document is assigned to topics with a supporting quote. Each topic is a short label plus a one-sentence description. Against human-labelled English corpora it aligned with ground truth clearly better than LDA, SeededLDA and BERTopic. Its design assumes large corpora and frequency-based pruning, and it was evaluated in English only. Both of those assumptions need changing for a 195-ad multilingual corpus.

### Cited Findings
- Peer-reviewed at NAACL 2024 (main conference). Authors: Chau Minh Pham, Alexander Hoyle, Simeng Sun, Philip Resnik, Mohit Iyyer. Topics consist of "natural-language labels and free-form descriptions" rather than word lists, and users can add constraints or edit topics without retraining. Headline result: "harmonic mean purity of 0.74 against human-annotated Wikipedia topics compared to 0.64 for the strongest baseline." — [arXiv 2311.01449](https://arxiv.org/abs/2311.01449); [ACL Anthology PDF](https://aclanthology.org/2024.naacl-long.164.pdf)
- **Stage 1, generation (GPT-4).** Documents are sampled and processed one at a time. For each, the model either assigns it to an existing topic or creates a new one, written as a label plus a one-sentence description. The prompt is seeded with two human-written example topics that set the format. — [TopicGPT paper (HTML)](https://arxiv.org/html/2311.01449v2)
- **Stage 2, refinement.** Sentence-Transformer embeddings flag topic pairs with cosine similarity ≥ 0.5, and the LLM merges near-duplicates. Topics below a frequency threshold are removed (10 documents for Bills, 5 for Wiki). — [TopicGPT paper (HTML)](https://arxiv.org/html/2311.01449v2)
- **Stage 3, assignment (GPT-3.5-turbo).** The prompt contains the topic list, 2–3 examples and one document. Output is a topic label, a document-specific description and a supporting quote. A self-correction step re-prompts on invalid outputs (e.g., "None" or a topic not in the list), up to 10 retries. Settings were temperature 0, top_p 0 and max_tokens 300. Long documents were truncated. — [TopicGPT paper (HTML)](https://arxiv.org/html/2311.01449v2)
- **Hierarchy (Appendix A).** Refined topics become top-level topics. For each, the LLM generates subtopics from that topic's documents and cites supporting documents. The authors show only qualitative examples and did not benchmark this against hierarchical topic models. — [TopicGPT paper (HTML)](https://arxiv.org/html/2311.01449v2)
- **Datasets.** Wiki: 14,290 articles with 15/45/279 labels at three levels. Bills: 32,661 U.S. bill summaries with 21/114 labels. — [TopicGPT paper (HTML)](https://arxiv.org/html/2311.01449v2)
- **Results (P1 harmonic purity / ARI / NMI).**
  - Wiki, default: TopicGPT 0.73/0.58/0.71; LDA 0.59/0.44/0.65; BERTopic 0.54/0.24/0.50; SeededLDA 0.61/0.47/0.65.
  - Bills, default: TopicGPT 0.57/0.42/0.52; LDA 0.39/0.21/0.47; BERTopic 0.42/0.10/0.40; SeededLDA 0.50/0.28/0.43.
  - Human evaluation of misaligned topics: LDA 62.4% vs refined TopicGPT 30.3% on Wiki, and 80.2% vs 31.9% on Bills.
  - Source: [TopicGPT paper (HTML)](https://arxiv.org/html/2311.01449v2)
- **Open models.** Mistral-7B-Instruct for assignment reached P1 0.51 on Bills (GPT-3.5: 0.57), still above the baselines. For generation, however, open models over-split: Mistral produced 1,418 topics and GPT-3.5 produced 151, mostly overly specific. — [TopicGPT paper (HTML)](https://arxiv.org/html/2311.01449v2)
- **Cost.** About $88 for Bills and $155 for Wiki in 2023 API prices. — [TopicGPT paper (HTML)](https://arxiv.org/html/2311.01449v2)
- **Stated limitations.**
  - Reliance on closed models and non-determinism of the OpenAI API even with greedy decoding.
  - Truncation of long documents.
  - Refinement can delete important low-frequency topics (e.g., "Culture" in Bills).
  - English-only evaluation.
  - Possible memorisation of the Wikipedia text–label mapping, which may make the Wiki results a best case.
  - Source: [TopicGPT paper (HTML)](https://arxiv.org/html/2311.01449v2)
- **Code.** https://github.com/chtmp223/topicGPT; `pip install topicgpt_python` (on PyPI since 11/2024). Functions: `generate_topic_lvl1`, `generate_topic_lvl2`, `refine_topics`, `assign_topics`, `correct_topics`. Input is JSONL with `text` and optional `id` and `label` fields. Supported backends: OpenAI, Azure, Vertex AI, Gemini, and vLLM for open models. — [GitHub: chtmp223/topicGPT](https://github.com/chtmp223/topicGPT)
- A 2025 comparison notes that TopicGPT is slow even when it processes only a sample, because of repeated document-level LLM calls during assignment. — [Neural Computing & Applications 2025](https://link.springer.com/article/10.1007/s00521-025-11593-9)

### Inferences
- **Scale is not an obstacle here.** ~22,800 words (an estimated 30–40k LLM tokens, inflated by non-English tokenisation) is about 1% of Bills. Sampling and truncation are unnecessary: every ad can go through generation, and cost would be a few dollars at most.
- **The main design problem is the frequency-based refinement.** With a threshold of 5–10 documents, rare but analytically important topoi in a 195-ad corpus (e.g., "Jazz", "Analogy to Photography", "Secret") would be pruned, the same failure the authors report for "Culture". For this corpus, set the threshold to 1–2 or disable pruning.
- **Concrete application, "blind induction" run.**
  1. Export the 195 ad texts (originals, optionally with English translations) as JSONL.
  2. Seed generation with two neutral format examples that are not from the editor's taxonomy (e.g., "[1] Price: mentions cost or payment terms").
  3. Run generation, then refinement with a low pruning threshold.
  4. Compare the induced list with the 32 categories, sorting each induced topic into one of three groups:
     - matches an editor topic (convergent evidence);
     - finer than or broader than an editor topic (granularity disagreement);
     - no editor counterpart (candidate new topos, to be checked against sources).
  5. List editor topics that were never induced. These are either latent or interpretive topoi an LLM does not surface (plausible for "Phantom Body" or "Invisibility"), or categories present in too few ads.
- **Concrete application, "seeded" run.** Feed the editor's 32 topics as the seed list so that generation only adds topics. This tests what is missing from the taxonomy, but it loses the blindness that makes run 1 an independent check.
- **Hierarchy.** `generate_topic_lvl2` could propose a two-level structure, e.g. broad rhetorical fields ("fidelity/authenticity", "domestic life", "technology vs art", "transcendence of death/absence") above the fine topoi. The editor's flat list of 32 has no such level yet. These broad fields are hypothetical examples, not run outputs.
- **Granularity mismatch.** TopicGPT assigns topics per document with one supporting quote. The editor's annotations are span-level (median 7 words). Because ads are short (median 84 tokens), document-level assignments plus quotes come close to span-level coding, but they will not reproduce multiple spans of the same topic within one ad.
- **Multilingual input.** TopicGPT was never evaluated on multilingual or historical text. Its topic labels will come out in English even from German or Swedish input, which helps comparison but may flatten language-specific rhetoric (e.g., "seelenvoll" vs "soulful").

### Gaps
- No published evaluation of TopicGPT on very small corpora (<500 documents), on historical text, or on non-English or multilingual corpora.
- The hierarchical extension has not been quantitatively evaluated.
- Exact prompt wording was not captured here. It is in the repo's `prompt/` folder.

---

## 2. LLooM / concept induction (Lam et al., CHI 2024)

### Takeaway
LLooM turns text into "concepts": a short name, a one-sentence natural-language inclusion criterion and exemplar documents. It gets there by distilling each document into short bullets, clustering the bullets, and having a stronger LLM synthesise each cluster into a concept. Every document is then scored against every concept's criterion. The concepts work as operational coding rules rather than keyword lists. This is the closest existing method to what the editor does by hand (short spans → named topos), and its criteria output could supply the missing definitions in the taxonomy.

### Cited Findings
- Peer-reviewed at CHI 2024 (DOI 10.1145/3613904.3642830). Authors: Michelle S. Lam, Janice Teoh, James Landay, Jeffrey Heer, Michael S. Bernstein. Concept induction yields "high-level concepts" with explicit inclusion criteria, as opposed to topic-model keywords. Example: for toxic comments, BERTopic produced "women, power, female" while LLooM produced "Criticism of traditional gender roles". — [arXiv 2404.12259](https://arxiv.org/abs/2404.12259)
- **Operators.**
  - Distill-filter: GPT-3.5 extracts exact quotes.
  - Distill-summarize: GPT-3.5 writes 2–4 bullets of 5–8 words each.
  - Cluster: bullets are embedded with text-embedding-ada-002 and clustered with HDBSCAN, detached from their source documents.
  - Synthesize: GPT-4 outputs a concept name (2–4 words), a one-sentence criteria prompt and 1–2 exemplar IDs, looking for "pockets of examples that have unifying connections".
  - Loop: the pipeline re-runs on documents not covered by any concept, or covered only by "generic" concepts (ones that match at least 50% of the data).
  - Score: each criterion is applied to every document as a multiple-choice question with a rationale, mapped from "Strongly agree" (1.0) to "Strongly disagree" (0.0) and thresholded (the scenarios used 1.0).
  - Seed: an optional user term that steers Distill and Synthesize.
  - Source: [LLooM paper (HTML)](https://arxiv.org/html/2404.12259)
- **User steering.** Analysts can add or edit concepts and criteria, merge or split concepts, define data slices and rescore. — [LLooM paper (HTML)](https://arxiv.org/html/2404.12259)
- **Technical evaluation (coverage of ground-truth topics).**
  - Bills: LLooM 0.74, GPT-4 Turbo 0.56, BERTopic 0.29.
  - Wiki: LLooM 0.81, GPT-4 0.83, GPT-4 Turbo 0.82, BERTopic 0.63.
  - In analysis scenarios, LLooM averaged about 2x as many high-quality topics as BERTopic and covered about 93% of examples vs 77.7%.
  - LLooM runs used about 200 sampled items (e.g., Wiki n=205, Bills n=213, partisan posts n=405).
  - Source: [LLooM paper (HTML)](https://arxiv.org/html/2404.12259)
- **Cost and time.** About $1.44, 848k tokens and 13.7 minutes per run on average. Scoring accounts for 79.9% of the cost. — [LLooM paper (HTML)](https://arxiv.org/html/2404.12259)
- **Stated limitations.**
  - Many parameters, not robustly tested.
  - No verification yet of quotes, bullet accuracy or score correctness.
  - Non-determinism across reruns.
  - Hallucination.
  - Scenarios lacked ground truth.
  - Only partial overlap with BERTopic (e.g., 50% of BERTopic topics covered by LLooM on one dataset).
  - Source: [LLooM paper (HTML)](https://arxiv.org/html/2404.12259)
- **Code.** https://github.com/michelle123lam/lloom; `pip install text_lloom`. The current implementation uses GPT-4o and GPT-4o mini. Docs: https://stanfordhci.github.io/lloom/about/get-started — [GitHub: michelle123lam/lloom](https://github.com/michelle123lam/lloom)

### Inferences
- **The size fits LLooM's design.** LLooM was built and tested on samples of about 200 documents, almost exactly the size of the Welte corpus (195 ads plus 183 illustration descriptions). A full run would cost about the reported ~$1–2 at 2024 prices.
- **Distilled bullets resemble @ana spans.** Bullets of 5–8 words are structurally very close to the editor's spans (median 7 words). So LLooM's intermediate output can be compared directly with the editor's spans: do the bullets for ad X cluster where the editor's spans for ad X sit?
- **Criteria prompts can become `<desc>` definitions.** LLooM's output format (name + criterion + exemplars) is what the 27 undefined categories lack. An editor could run LLooM, map synthesised concepts to existing categories, and adopt or edit the criterion text as the `<desc>`. Example of the format, hypothetical and not run: "Virtual Presence — Does the text claim that the instrument makes an absent or dead performer present in the listener's room?" These definitions would then make later LLM or human assignment more reliable and auditable (see Q5, Halterman & Keith).
- **Seeding as a research instrument.** Runs seeded with "body" or "corporeality", "death/time" or "technology vs art" would test whether "Phantom Body", "Immortality" and "Distinction from Mechanical" are robustly recoverable when the model is pointed at the dimension.
- **Score step as a cross-check.** The score step amounts to deductive coding with LLM-written definitions. Its matrix (ads × concepts) can be compared with the editor's @ana matrix, but see the circularity caveats in Q6.
- **Multilingual embeddings.** LLooM's cluster step uses an English-centric embedding (ada-002 in the paper). A multilingual embedding model is needed so that German, Dutch and Spanish bullets about the same topos cluster together. An alternative is to distil in English: ask for English bullets from non-English ads.

### Gaps
- No LLooM evaluation on historical, non-English or multilingual text.
- No published inter-rater comparison of LLooM concepts with an expert-built codebook on the same data.
- Whether the current release supports non-OpenAI models was not confirmed from the repo page.

---

## 3. Goal-driven / explainable clustering and "describing differences in words" (GoalEx, D5, nlparam, HypotheSAEs, VisDiff)

### Takeaway
A family of Berkeley-centred methods (Zhong, Steinhardt, Klein et al.) treats the analyst's research goal as an input. Three variants:
- GoalEx clusters a corpus by a goal stated in natural language.
- D5 states, in natural language, what is more often true of corpus A than corpus B, and checks each candidate statistically.
- "Explaining Datasets in Words" fits clustering, classification and time-series models whose parameters are natural-language predicates.

HypotheSAEs (ICML 2025) gets hypotheses from a sparse autoencoder instead of prompting. These are the right tools for questions like "what distinguishes pre-1914 from post-1918 ads?", but with ~100 ads per side every discovered difference is a hypothesis to verify by close reading, not a finding.

### Cited Findings
- **GoalEx** (Wang, Shang, Zhong; EMNLP 2023).
  - The goal and the cluster explanations are both free-form language. Example goal: "cluster the comments based on why the annotators think the summary is imperfect".
  - Three steps: (1) prompt an LLM with a corpus subset plus the goal to brainstorm explanations, each one a candidate cluster; (2) classify every sample against every explanation; (3) use integer linear programming to choose clusters that cover most samples with minimal overlap.
  - Code: https://github.com/ZihanWangKi/GoalEx
  - Source: [arXiv 2305.13749](https://arxiv.org/abs/2305.13749)
- **D5** (Zhong, Zhang, Li, Ahn, Klein, Steinhardt).
  - Listed as a NeurIPS 2023 poster. The arXiv page itself lists no venue.
  - Input: two corpora and a research goal. Output: natural-language descriptions of their differences. It contributes OpenD5, a benchmark of 675 open-ended problems spanning business, social sciences, humanities, ML and health.
  - Sources: [arXiv 2302.14233](https://arxiv.org/abs/2302.14233); [NeurIPS 2023 listing](https://neurips.cc/virtual/2023/poster/71738)
- **D5 procedure.**
  - Proposer: GPT-3, GPT-3.5 or GPT-4 sees samples from A and B (25 per prompt within a 3,200-token limit) plus the goal and lists hypotheses. Prompts are resampled until 60 candidates exist. Single words that are much more frequent in one corpus are blocked to avoid trivial lexical hypotheses.
  - Validator: validity is V(h) = E_A[T(h,x)] − E_B[T(h,x)], where T is the certainty that predicate h holds for text x. A fine-tuned Flan-T5 approximates human judgements, and a t-test filters candidates.
  - Goal-conditioning improved relevance, novelty and significance, but human rater agreement was only moderate (kappa 0.37–0.56).
  - Limitations: the validator is "informative yet unreliable" (71% Spearman correlation with human validity ratings); spurious correlations can pass validation; findings are correlational; the system sometimes paraphrases the same discovery.
  - Code: https://github.com/ruiqi-zhong/D5
  - Source: [D5 paper (HTML)](https://arxiv.org/html/2302.14233v2)
- **"Explaining Datasets in Words: Statistical Models with Natural Language Parameters"** (Zhong, Wang, Klein, Steinhardt).
  - NeurIPS 2024 poster; arXiv revised Jan 2025.
  - Clustering, time-series and classification models whose parameters are natural-language predicates (e.g., "discusses COVID"). Fitting uses continuous relaxation and gradient descent, then LLM prompting turns the parameters back into language.
  - Applications: taxonomising chat dialogues, tracking how they change over time, and explaining visual features of memorable images. The method works on text and images.
  - Code: github.com/ruiqi-zhong/nlparam
  - Sources: [arXiv 2409.08466](https://arxiv.org/abs/2409.08466); [NeurIPS 2024 listing](https://neurips.cc/virtual/2024/poster/93296)
- **HypotheSAEs** (Movva et al.; ICML 2025).
  - Trains a sparse autoencoder on text embeddings, selects the features that predict a target variable, and has an LLM interpret each feature as a natural-language hypothesis.
  - On synthetic data it beats baselines by at least 0.06 F1. On real data it yields about 2x as many significant findings, using 1–2 orders of magnitude less compute than LLM-only methods.
  - Applications: partisan differences in Congressional speeches and drivers of headline engagement.
  - Code: https://github.com/rmovva/HypotheSAEs
  - Source: [arXiv 2502.04382](https://arxiv.org/abs/2502.04382)
- **VisDiff** (Dunlap et al.; CVPR 2024, oral). "Set Difference Captioning": given image sets A and B, output a description more often true of A. It captions images (BLIP-2), has GPT-4 propose differences, and re-ranks them with CLIP. On the hardest split of its 187-pair benchmark it finds 61% (top-1) and 80% (top-5) of the ground-truth differences. Code: https://github.com/Understanding-Visual-Datasets/VisDiff — [CVPR 2024 paper](https://openaccess.thecvf.com/content/CVPR2024/papers/Dunlap_Describing_Differences_in_Image_Sets_with_Natural_Language_CVPR_2024_paper.pdf); [arXiv 2312.02974](https://arxiv.org/html/2312.02974v2)

### Inferences
- **D5-style period contrast (concrete).**
  - Corpus A: ads dated 1905–1914. Corpus B: ads dated 1919–1930.
  - Goal: "Identify claims about the reproducing piano, the performer or the listener that are more frequent in one period's advertisements than the other's."
  - The proposer might return hypotheses like "emphasises the endorsement of named famous pianists" or "presents the instrument as dance or entertainment music for the home". These are illustrative only, not run results.
  - Each hypothesis is then checked in two independent ways: (a) an LLM or human labels every ad true/false for the predicate; (b) the editor's existing @ana codes are compared, if a hypothesis maps to a topos.
  - With n ≈ 100 per side, use exact or permutation tests and expect few hypotheses to survive. Report hypotheses together with the example ads that support them.
- **Market contrast.** The same design works for German-language vs English-language (US/UK) ads. Language is confounded with market, though: the proposer may pick up language-specific phrasing rather than rhetoric, so it is safer to give the proposer English translations of both sets.
- **GoalEx (concrete).** Possible goals: "cluster the ads by how they describe the relation between the human pianist and the machine", or "cluster by what the ad promises the owner will experience". Each goal produces a different, purpose-built partition, which can be set against the editor's general-purpose topoi to see which goals the taxonomy already covers.
- **nlparam time-series variant.** In principle this could model how predicate prevalence shifts across 1905–1930, e.g. the date-dependence of "Exact Reproduction", which the existing `<desc>` already claims is emphasised "between 1905 and 1926". This would be a way to test the editor's own historical claims.
- **HypotheSAEs is probably underpowered here.** Training a sparse autoencoder on 195 embeddings (or ~650 span embeddings) is likely too little data. The paper's applications used large corpora (Congressional speeches, headlines), and no minimum sample size is stated, so this is an inference, not a documented threshold.
- **VisDiff on illustrations.** Applied to pre-1914 vs post-1918 illustrations (via scans or the existing 183 prose descriptions), VisDiff could test pictorial shifts, e.g. whether "Sitting Woman" scenes become more or less frequent, or whether settings move from salon to living room.

### Gaps
- None of these methods has been tested on historical or multilingual corpora, or on corpora of ~100 documents per group.
- D5's validator was fine-tuned on English Turker data.
- The minimum corpus size for HypotheSAEs is not documented.

---

## 4. Other LLM topic-modelling work 2023–2026, LLM-based topic evaluation, critiques and benchmarks, multilingual and historical text

### Takeaway
Beyond TopicGPT and LLooM, the main lines are:
- direct prompting for topics (PromptTopic, Mu et al. 2024);
- LLM labelling inside BERTopic;
- LLMs as judges of topic quality (Stammbach et al. 2023).

The most important 2025 critique (Li et al., ACL 2025) finds that LLM topic models give readable but *overly generic* topics on domain-specific data, plus hallucinations, unless a human is in the loop. That is a direct warning for a narrow, specialised corpus like Welte ads. No published work evaluates LLM topic induction on multilingual historical advertising.

### Cited Findings
- **PromptTopic** (Wang et al.; IEEE BigData 2023). Extracts topics per sentence or document with an LLM, then aggregates and condenses them to a preset number. It targets short texts lacking word co-occurrence and avoids manual parameter tuning. Evaluated on 20 Newsgroups, Yelp and Twitter. — [arXiv 2312.09693](https://arxiv.org/html/2312.09693v1); [JCU record](https://researchonline.jcu.edu.au/82402)
- **Mu, Dong, Bontcheva & Song** (LREC-COLING 2024, pp. 10160–10171). Appropriately prompted LLMs can serve as an alternative to LDA-style topic modelling, including for refining and merging topics. — [ACL Anthology 2024.lrec-main.887](https://preview.aclanthology.org/setup/2024.lrec-main.887); [arXiv 2403.16248](https://arxiv.org/html/2403.16248v2)
- **LLM labelling in BERTopic.** BERTopic passes c-TF-IDF keywords and by default 4 representative documents per topic (`nr_docs`, `diversity`, `doc_length` adjustable) to an LLM through `[KEYWORDS]` and `[DOCUMENTS]` prompt tags. Backends: OpenAI (or local Ollama), LlamaCPP, Hugging Face TextGeneration, LiteLLM, LangChain, Cohere. Here the LLM only names clusters that the embedding model has already formed. — [BERTopic docs: LLM representation](https://maartengr.github.io/BERTopic/getting_started/representation/llm.html)
- **Stammbach, Zouhar, Hoyle, Sachan & Ash** (EMNLP 2023). LLM ratings of topic coherence correlate more strongly with human judgements than existing automated metrics. LLMs do better on rating word sets than on intrusion tasks. Including the research question in the prompt helps estimate the right number of topics. — [ACL Anthology 2023.emnlp-main.581](https://aclanthology.org/2023.emnlp-main.581); [code](https://github.com/dominiksinsaarland/evaluating-topic-model-output)
- **Li, Calvo-Bartolomé, Hoyle, Xu, Dima, Fung & Boyd-Graber**, "Large Language Models Struggle to Describe the Haystack without Human Help" (ACL 2025).
  - LLM-based methods give more readable topics and higher average win probabilities, but "overly generic topics for domain-specific datasets".
  - Human supervision reduces hallucination and genericity but costs effort.
  - LDA "remains effective for exploration but is less user-friendly".
  - Evaluation measured what users actually learn about the corpus, not just coherence.
  - Source: [arXiv 2502.14748](https://arxiv.org/abs/2502.14748)
- 2025 papers also raise doubts about standard metrics (NPMI) and propose LLM-as-judge pairwise evaluation. Results on whether LDA or LLM-based methods win vary by dataset and text length. — search summary of [arXiv 2507.08498](https://arxiv.org/pdf/2507.08498) and [ACL 2025 long 902](https://aclanthology.org/2025.acl-long.902.pdf) (abstract-level only, not read in full)
- **Historical newspapers.** A 2026 preprint on Slovene turn-of-the-century newspapers (sPeriodika) used BERTopic for themes and LLMs for aspect-based sentiment on "OCR-degraded historical Slovene", choosing a Slovene-adapted model (GaMS3-12B-Instruct). Even in this historical DH project the LLM was used for *classification*, not for topic induction. — [arXiv 2603.25051 (preprint)](https://arxiv.org/abs/2603.25051)
- **Anachronism.**
  - Underwood, Nelson & Wilkens (2025 preprint): prompting a modern model with period prose does not produce period-faithful output, and fine-tuned output is still distinguishable from authentic text. They suggest pretraining on period prose may be needed. — [arXiv 2505.00030](https://arxiv.org/html/2505.00030v1)
  - Levchenko (ACH Anthology 2025): LLM OCR of 18th-century Russian books shows a "modernization trap", normalising historical spelling to modern standards. — [Anthology of Computers and the Humanities vol. 3](https://anthology.ach.org/volumes/vol0003/building-historical-corpora-with-multimodal-llms/)

### Inferences
- **Expect generic topics.** Li et al. predict exactly what an unsupervised LLM run on Welte ads would likely produce: generic marketing categories ("product quality", "home entertainment", "music technology", "endorsements") rather than the editor's specific topoi such as "Phantom Body" or "Touch of a Button". The genericity problem is the main reason to keep the editor in the loop through seeding, goals, and editing or splitting concepts.
- **LLM-as-judge for a corpus this small.** Stammbach-style evaluation could rate the coherence of induced topics, but with only ~650 spans the editor can simply inspect them. LLM-judged coherence is more useful as a tie-breaker between alternative runs than as validation.
- **Anachronism risk for 1905–1930 ads.** Modern LLMs may impose present-day analytic vocabulary ("brand storytelling", "user experience", "influencer endorsement", "nostalgia marketing") or read later concepts into period rhetoric. Mitigations:
  - require verbatim original-language quotes for every induced topic;
  - ask the model to name topics in the period's own words where possible;
  - keep the editor's historical framing (e.g., "Distinction from Mechanical" refers to period debates about player pianos) as the reference.

### Gaps
- No study found that applies LLM topic induction to historical advertising, to a corpus of ~200 short documents, or to a 12-language corpus.
- No benchmark found that compares LLM-induced topics with an expert humanities taxonomy as ground truth.
- The NIST paper "From Traditional Topic Models to LLM Topic Models: Can LLMs replace...?" ([NIST](https://www.nist.gov/publications/traditional-topic-models-llm-topic-models-can-large-language-models-replace-traditional)) was found but not read.

---

## 5. LLM-assisted qualitative / thematic analysis, codebook development and reliability vs human coders

### Takeaway
Across qualitative-methods and CSS studies, LLMs are reliable at **deductive** coding with a clear codebook, often matching human–human agreement. They are much weaker at **inductive** code generation, where many codes are judged unreasonable or merely alternative, and where even human–human agreement is low. Mixed human–LLM workflows (LLM proposes, human decides) give the best results. For the Welte project this suggests the LLM should *propose* candidate topoi and definitions, while the editor's judgement remains the reference. It also suggests that improving the codebook (adding `<desc>` definitions) is the highest-leverage step for any LLM assignment.

### Cited Findings
- **De Paoli** (Social Science Computer Review 42(4), 2024). GPT-3.5-Turbo performed an inductive thematic analysis following Braun & Clarke's phases on two open interview datasets already analysed by other researchers. The model "can infer most of the main themes from previous research". The earlier preprint was more hedged ("some main themes at least partially"). Follow-ups propose thematic saturation as a validity metric and open-ended prompts for initial coding (FQS 2024). — [SSCR 2024 PDF (repository copy)](https://rke.abertay.ac.uk/ws/files/81658175/DePaoli_PerformingAnInductiveThematicAnalysis_Published_2024.pdf); [arXiv 2305.13014](https://arxiv.org/abs/2305.13014v4); [FQS article](https://qualitative-research.net/index.php/fqs/article/view/4196)
- **Dai, Xiong & Ku**, "LLM-in-the-loop" (Findings of EMNLP 2023). A human–LLM framework using in-context learning to build a codebook. On two survey datasets, human+LLM coding reached kappa 0.87 vs 0.66 for the original human coding (case 1) and 0.81 vs 0.77 (case 2). The authors conclude one human plus the LLM can match two human coders. These figures come from the arXiv version and were not checked against the camera-ready. — [arXiv 2310.15100](https://arxiv.org/pdf/2310.15100); [ACL Anthology 2023.findings-emnlp.669](https://preview.aclanthology.org/watermark/2023.findings-emnlp.669)
- **Chew et al. (RTI)**, LLM-assisted content analysis (LACA; arXiv preprint 2023). GPT-3.5 often reaches deductive-coding agreement comparable to human coders. LACA helps refine codebook prompts and identify codes where the LLM is "randomly guessing". — [arXiv 2306.14924](https://arxiv.org/pdf/2306.14924)
- **Xiao, Yuan, Liao, Abdelghani & Oudeyer** (IUI '23 Companion). GPT-3 combined with an expert codebook reached "fair to substantial" agreement (Cohen's kappa) with experts on deductive coding of children's questions. They caution that LLMs may miss nuanced meanings. — [arXiv 2304.10548](https://arxiv.org/abs/2304.10548v1)
- **Halterman & Keith**, "Codebook LLMs" (Political Analysis, 2025). Uses three real codebooks (protest events, political violence, manifestos) and proposes a five-stage process: prepare the codebook for both humans and LLMs, test basic capabilities, measure zero-shot accuracy, analyse errors, then supervised training. Open-weight 7–12B models struggled to follow codebooks zero-shot, and instruction-tuning helped substantially. — [arXiv 2407.10747](https://arxiv.org/html/2407.10747v2); [Political Analysis PDF](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/7B323A0E47F782F2698A0AE849EA00DE/S104719872510017Xa.pdf/div-class-title-codebook-llms-evaluating-llms-as-measurement-tools-for-political-science-concepts-div.pdf)
- **Ziems et al.** (Computational Linguistics 50(1), 2024). 13 LLMs on 25 English CSS benchmarks. LLMs do not beat the best fine-tuned models in classification but reach "fair" agreement with humans. For free-form generation (e.g., explanations) they often beat crowdworker references. Recommended role: zero-shot annotators *on* human annotation teams. — [ACL Anthology 2024.cl-1.8](https://aclanthology.org/2024.cl-1.8/)
- **Gilardi, Alizadeh & Kubli** (PNAS 2023). On 6,183 tweets and news articles, ChatGPT zero-shot accuracy beat crowd workers by about 25 points on average, with higher intercoder agreement than crowd workers and trained annotators. Temperature (1 vs 0.2) affected consistency. — [arXiv 2303.15056](https://arxiv.org/abs/2303.15056); [PMC full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC10372638)
- **Pangakis, Wolken & Fasching** (2023 preprint; follow-up at ICWSM 2025). GPT-4 replicated 27 annotation tasks across 11 social-science datasets. Performance was "highly contingent" on dataset and task, so "any automated annotation process using an LLM must validate the LLM's performance against labels generated by humans". — [arXiv 2306.00176](https://arxiv.org/pdf/2306.00176); [ICWSM 2025](https://ojs.aaai.org/index.php/ICWSM/article/view/35883)
- **Parfenova, Marfurt, Pfeffer & Denzler** (Findings of NAACL 2025). Six open LLMs vs human experts on inductive coding.
  - Humans did well on complex sentences and worse on simple ones; LLMs showed the reverse.
  - Some LLM labels matched the gold standard more closely but received *lower* expert ratings, so gold-label accuracy and expert-judged quality diverge.
  - A search snippet reported human inter-coder Krippendorff's alpha of about 0.2; this was not confirmed on the landing page.
  - Source: [ACL Anthology 2025.findings-naacl.361](https://aclanthology.org/2025.findings-naacl.361/)
- **Recent results seen only in search snippets (full text not verified).**
  - A GPT-5 study on inductive content analysis of survey text reports human–LLM ARI 0.61 for codes and 0.54 for themes, close to within-human consistency. — [arXiv 2608.22417 (preprint)](https://arxiv.org/pdf/2608.22417)
  - A medical-education study reports that GPT-4o's inductive codes agreed with human codes in 31.4% of cases, were reasonable alternatives in 26.3% and were not reasonable in 42.3%, while deductive application of the human codebook reached about 96% agreement. — [PubMed 42641075](https://pubmed.ncbi.nlm.nih.gov/42641075/)
- **Törnberg**, "Best Practices for Text Annotation with LLMs" (Sociologica 18(2), 2024, peer-reviewed). Guidelines cover model selection, prompt engineering, structured prompting, prompt stability analysis, validation against human labels, and ethical and legal issues. — [Sociologica](https://sociologica.unibo.it/article/view/19461); [arXiv 2402.05129](https://www.arxiv.org/pdf/2402.05129)

### Inferences
- **Division of labour.** The evidence points to: LLM for candidate generation and first-pass deductive assignment; editor for defining, accepting, merging and rejecting categories; and agreement measured only against *independent* human coding. That is close to the project's current practice (Claude assigns, editor reviews), but it currently lacks the independent-human-coding step (see Q6).
- **Codebook first.** Halterman & Keith and Chew et al. imply that writing `<desc>` definitions with inclusion and exclusion rules and 1–2 positive and negative example spans per topic should measurably improve LLM assignment. Currently 27 of 32 categories have only a label. An LLM can draft these definitions (LLooM criteria, or "describe what unites these spans" prompts over the editor's existing spans), and the editor approves them.
- **Agreement metric.** Spans of different lengths and possibly multiple topics per span call for a unitized or set-valued agreement measure. Krippendorff's alpha (handles multiple coders and missing data) on ad × topic presence/absence is the pragmatic choice. Span-overlap agreement (e.g., token-level F1 or Krippendorff's unitizing alpha) can be added if boundary agreement matters.
- **Low inductive agreement is normal.** Inductive agreement is low even between humans (Parfenova et al.). An LLM-induced taxonomy that differs from the editor's is therefore not evidence that either is wrong. Disagreements are interpretive material, which fits a hermeneutic DH project.

### Gaps
- No study found on LLM inductive coding of historical, multilingual or advertising texts specifically.
- Exact kappa values for Xiao et al. and Chew et al. were not retrieved.
- The GPT-5 and medical-education figures are unverified snippet data.

---

## 6. Failure modes, methodological risks and recommended safeguards (with a concrete workflow for this corpus)

### Takeaway
Documented risks: prompt sensitivity and non-determinism; irreproducibility when closed models change; generic, hallucinated or anachronistic categories; LLM evaluators favouring their own outputs; and human reviewers anchoring on LLM suggestions. All of these apply sharply to the Welte project, because about two-thirds of the existing spans (436/647) were already produced by Claude using the editor's taxonomy. Any validation that uses those spans, or uses Claude to judge Claude, is partly circular. Recommended safeguards: blind induction; a held-out set of independent human coding; agreement metrics; a different model family for cross-checks; versioned and logged prompts and models (preferably locally versioned open-weight models); and prompt-stability testing.

### Cited Findings
- **Prompt stability.** Barrie, Palaiologou & Törnberg propose the Prompt Stability Score (PSS), which adapts intra- and inter-coder reliability to prompt paraphrases and repeated runs. Python package `promptstability`. Small wording changes can shift labels, and high accuracy with one prompt does not guarantee reproducibility. — [arXiv 2407.02039](https://arxiv.org/pdf/2407.02039); [docs](https://promptstability.readthedocs.io/en/latest/search.html)
- **Replication.** Barrie, Palmer & Spirling ("Replication for language models", 2024/25) use rolling iterated replications over months. LLMs can be accurate, but variance is often too high and some results cannot be re-run at all, especially with proprietary models. They recommend *locally versioned open-source models*. Only abstracts and talk pages were found, not the full paper. — [Princeton CSML event](https://csml.princeton.edu/events/replication-language-models-problems-principles-and-best-practice-political-science); [Princeton CSML interview](https://csml.princeton.edu/news/arthur-spirling-advocating-replicability-research-using-language-models)
- **Non-determinism in practice.** TopicGPT's authors report OpenAI API non-determinism even at temperature 0, and LLooM's authors report run-to-run variation. — [TopicGPT](https://arxiv.org/html/2311.01449v2); [LLooM](https://arxiv.org/html/2404.12259)
- **Epistemic risks.** Lin & Zhang (2025 preprint) list validity, reliability, replicability and transparency risks in LLM annotation. They recommend a prompt-development framework, explicit choice of the LLM's role (primary coder vs assistant) and transparent reporting. — [arXiv 2503.22040](https://arxiv.org/abs/2503.22040)
- **Validation is mandatory, task by task.** — [Pangakis et al.](https://arxiv.org/pdf/2306.00176); [Törnberg 2024](https://sociologica.unibo.it/article/view/19461)
- **Self-preference.** Panickssery, Bowman & Feng (NeurIPS 2024): LLM evaluators rate their own outputs higher than others' that humans judge equal. GPT-4 and Llama 2 recognise their own text above chance, and self-recognition correlates linearly with self-preference. — [NeurIPS 2024](https://papers.nips.cc/paper_files/paper/2024/hash/7f1f0218e45f5414c79c0679633e47bc-Abstract-Conference.html); [arXiv 2404.13076](https://arxiv.org/html/2404.13076v1)
- **Anchoring of human reviewers.**
  - Choi et al. (EMNLP 2024; arXiv 2410.04699): experts' agreement with the LLM rose from 43.9% (no suggestions) to 71.5% (with suggestions), and annotation also got faster.
  - Francis et al. (NLPerspectives 2026): LLM pre-annotation increased inter-human agreement and shifted label distributions, an "erosion of human subjectivity".
  - Berzak et al. (EMNLP 2016) found the same bias with parser pre-annotation.
  - A mitigation: reveal model output only after the human's initial judgement.
  - Figures are from search summaries; full papers not read. — [arXiv 2410.04699](https://arxiv.org/pdf/2410.04699); [WhoSaidIt arXiv 2605.26070](https://arxiv.org/pdf/2605.26070)
- **Genericity and hallucination** of unsupervised LLM topic models on domain data. — [Li et al., ACL 2025](https://arxiv.org/abs/2502.14748)
- **Anachronism and modernisation bias** with historical language. — [Underwood et al. 2025 preprint](https://arxiv.org/html/2505.00030v1); [Levchenko, ACH 2025](https://anthology.ach.org/volumes/vol0003/building-historical-corpora-with-multimodal-llms/)
- **Spurious discoveries.** D5's authors warn that spurious correlations can pass their validator, which correlates only 71% with human validity judgements. — [D5](https://arxiv.org/html/2302.14233v2)
- **Pruning of rare topics.** TopicGPT's refinement step deleted a substantively important low-frequency topic. — [TopicGPT](https://arxiv.org/html/2311.01449v2)

### Inferences

**Circularity specific to this corpus**
- **(a) Assignment–validation circularity.** If an LLM-induced taxonomy is scored against "the corpus annotations", 436/647 of those annotations are Claude's. Agreement would partly measure Claude-vs-Claude consistency, and self-preference and self-recognition would inflate it whenever Claude (or a close relative) is also the inducer or judge.
- **(b) Taxonomy-induction circularity.** Claude's spans were produced *with* the editor's taxonomy. An LLM that "rediscovers" the taxonomy from text that LLM-tagged spans have already shaped is weaker evidence than rediscovery from raw text.
- **(c) Review anchoring.** The editor's review of "unchecked" Claude ads is exactly the setting in which Choi et al. found large anchoring effects. Reviewed-and-accepted Claude spans are therefore not equivalent to independent editor coding.

**Concrete safeguards for the Welte project**
1. **Gold set.** Treat the 183 editor-assigned spans (and the ads they come from) as the only human reference. Never mix Claude-assigned or Claude-assigned-then-reviewed spans into a validation set.
2. **Blind double coding.** Draw a stratified sample (e.g., 30–40 ads across languages and decades) that the editor codes *without* seeing Claude's labels. Then compute Krippendorff's alpha (ad × topic) between editor-blind and Claude, and, if possible, a second human coder for a human–human ceiling.
3. **Cross-family checks.** Use a *different* model family from the one that did the original tagging for induction and cross-checks (e.g., an open-weight model such as Qwen, Llama or Mistral run locally, or GPT/Gemini). Convergence across model families is stronger evidence than one model agreeing with itself.
4. **Blind induction first, seeded induction second.** Run TopicGPT or LLooM on raw ad texts *without* the taxonomy and without the @ana spans. Only afterwards compare with or seed from the taxonomy.
5. **Stability.** Run each induction 3–5 times with different seeds and document orders, and paraphrase the main prompts. Report which topics recur across runs (a PSS-style stability measure). Topics that appear in only one run are noise until the editor confirms them.
6. **Versioning and logging.** Pin model IDs and dates, store all prompts, parameters and raw outputs in the repo (e.g., alongside `research_notes`), and record in the TEI which spans came from which model, prompt version and date. The TEI already distinguishes Claude from editor and checked from unchecked, so this extends existing practice. Prefer an open-weight, locally versioned model for any result that will be published.
7. **Anti-anachronism.** Require verbatim original-language evidence quotes for every induced topic and every assignment, so the editor can reject topics whose quotes do not support them.
8. **Order of review.** In review interfaces, have the editor commit an initial judgement before Claude's suggestion is revealed, or at least do this for the validation sample.

**Concrete workflow sketch (LLM part), roughly in order**
- **Step 0, prepare.** Export ads as JSONL with `id`, `lang`, `date`, `market`, original `text`, optional English translation, and the illustration description as a separate record type.
- **Step 1, blind induction.** Run TopicGPT (generation + low-threshold refinement + lvl2) and LLooM (distill → cluster with multilingual embeddings → synthesize → score) on ad texts only, with no taxonomy. Repeat 3–5 times, ideally with two model families.
- **Step 2, align.** Build an alignment table: induced topic ↔ editor category (exact match / broader / narrower / none), with evidence quotes. Outputs:
  - candidate new topoi;
  - candidate merges and splits of existing topoi;
  - editor topoi not recovered.
- **Step 3, codebook.** Draft `<desc>` definitions for the 27 undefined categories from LLooM criteria and from "summarise what these editor spans share" prompts. The editor edits and approves them.
- **Step 4, deductive re-assignment.** Run the definition-rich codebook over all ads with a model from a different family than the one that produced the original 436 spans, and compare with editor gold spans (alpha). This also flags existing Claude spans that the second model disagrees with, to prioritise for review.
- **Step 5, contrastive questions.** Run D5- or GoalEx-style queries: pre-1914 vs post-1918, German vs US market, text vs illustration rhetoric. Treat outputs as hypotheses, and check each by counting coded spans and close reading.
- **Step 6, report.** Document models, prompts, runs, stability, agreement figures, and the editor's acceptance and rejection decisions as part of the edition's encoding description.

### Gaps
- No study found that measures the effect of an LLM *both* assigning and later validating its own codes in a humanities edition.
- The size of self-preference effects for classification or coding tasks (rather than summarisation) is not established in the sources found.
- The full text of Barrie, Palmer & Spirling was not accessed.

---

## 7. Multimodal: can vision-language models induce pictorial motifs (e.g., "Sitting Woman") directly from scanned ads?

### Takeaway
VLMs (GPT-4o, Gemini 2.5, CLIP) can classify historical images against *given* iconographic categories with high but dataset-dependent accuracy. Set-difference methods (VisDiff, nlparam) can describe in words how two image sets differ. No study was found that applies VLMs to historical advertisements, or that induces a pictorial taxonomy from such images. The most practical route here is caption-then-cluster: the corpus already has ~183 prose descriptions of illustrations, which the text methods (TopicGPT, LLooM, D5) can process directly. VLMs are better suited as a second, independent annotator of pictorial topoi.

### Cited Findings
- **Christian iconography benchmark** (Spinaci, Klic & Colavizza; ACH Anthology vol. 3, 2025). GPT-4o and Gemini 2.5 Pro were tested on zero- and few-shot saint classification (ArtDL, ICONCLASS, Wikidata) against fine-tuned ResNet50 baselines. Peaks: about 90.45% (Gemini 2.5 Pro) and 88.20% (GPT-4o) on ArtDL. Accuracy fell sharply on Wikidata images. Adding Iconclass descriptions to prompts helped, while 5-shot exemplars added little. Figures come from a search summary. — [ACH Anthology](https://anthology.ach.org/volumes/vol0003/benchmarking-multimodal-large-language-models-in/)
- **"Have Large Vision-Language Models Mastered Art History?"** (2024 preprint). Compares CLIP, LLaVA and GPT-4o on zero-shot classification of style, author and period, including prompt sensitivity and failure analysis. — [arXiv 2409.03521](https://arxiv.org/pdf/2409.03521)
- **VLM alt-text for heritage collections** (ACH Anthology vol. 3). A rater study with 21 humanities scholars found no significant differences between models. Recurring errors included factual misrecognition and "uncritical reproduction of harmful historical terminology". The authors call VLMs "operationally viable but epistemically fragile" in heritage contexts and recommend human-in-the-loop review. — [ACH Anthology](https://anthology.ach.org/volumes/vol0003/seeing-history-unseen-evaluating-vision-language/)
- **CLIP retrieval in historical prints** (Digital Scholarship in the Humanities 2026 supplement). Fine-tuning raised R-precision by 4–35% for some classes, with mixed results overall. — [DSH](https://academic.oup.com/dsh/article/41/Supplement_1/i307/8248852)
- CLIP is often used "out of the box" in art history without clarity about what its embeddings encode, and dataset bias is a concern. — [arXiv 2602.20853](https://arxiv.org/pdf/2602.20853)
- **Pre-VLM work on historical newspaper ads.** CNN-based clustering of Dutch newspaper ads, and a Programming Historian lesson training a classifier on historical newspaper ads. — [DSH "The visual digital turn"](https://academic.oup.com/dsh/article-pdf/35/1/194/32976784/fqy085.pdf); [Programming Historian](https://programminghistorian.org/en/lessons/computer-vision-deep-learning-pt1)
- **Image-set comparison.**
  - VisDiff describes differences between two image sets in natural language (captioning + GPT-4 proposer + CLIP re-ranker; 61% top-1 / 80% top-5 on its hardest split). — [CVPR 2024](https://openaccess.thecvf.com/content/CVPR2024/papers/Dunlap_Describing_Differences_in_Image_Sets_with_Natural_Language_CVPR_2024_paper.pdf)
  - nlparam explains visual features of images with natural-language predicates. — [arXiv 2409.08466](https://arxiv.org/abs/2409.08466)

### Inferences
- **Deductive (feasible now).** Give a VLM each scan plus a definition, e.g. "Sitting Woman: a woman shown seated, typically at or near the instrument, listening or playing". Ask for presence/absence, a bounding description and a confidence. Validate against the editor's existing pictorial @ana codes. The Spinaci et al. result that textual definitions (Iconclass descriptions) help more than few-shot examples again argues for writing `<desc>` definitions first.
- **Inductive.**
  - (a) Caption-then-cluster: have a VLM write neutral, standardised descriptions of each illustration (who, posture, setting, objects, gaze), then run LLooM or TopicGPT on these captions. Compare them with the editor's 183 descriptions, which may encode the editor's interpretive vocabulary.
  - (b) VisDiff or nlparam on period or market subsets, e.g. "illustrations from 1905–1914 vs 1919–1930".
  - Both are untested on historical ads.
- **Main risks for 1905–1930 imagery.**
  - Misrecognition in degraded halftone scans.
  - Modern gendered or ethnic terminology applied to historical depictions.
  - Over-reading: VLMs may "see" a piano roll or a ghostly figure because the ad text suggests it.

  "Phantom Body" imagery (e.g., an absent pianist rendered as a translucent figure, if present in the corpus) is exactly the kind of subtle, culturally coded motif where VLM output needs expert checking.
- **Ownership of the illustration descriptions.** If the 183 illustration descriptions were written by Claude, the circularity concerns of Q6 apply to them too. If they were written by the editor, they serve as human gold for pictorial topoi.

### Gaps
- No published study found applying VLMs (GPT-4o, Gemini, Claude, Qwen-VL) to historical print advertisements, or inducing pictorial motif taxonomies with VLMs.
- No accuracy figures on halftone or lithographic ad illustrations from 1900–1930.
- The authorship of the 183 illustration descriptions (editor or Claude) is not stated in the brief and should be checked before they are used as gold.
