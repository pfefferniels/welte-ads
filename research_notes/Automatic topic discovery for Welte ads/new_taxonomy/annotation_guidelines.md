# Re-annotating the Welte-Mignon advertisements with the new topics

The edition's hand-made taxonomy of topics has been replaced by a new one: 36 topics found in four
blind readings of all ads. Every advertisement must now be annotated with the new topics, at the
level of passages, replacing the old annotations completely.

## The taxonomy
`/home/user/welte-ads/tei/shared/encoding.xml`, `<taxonomy xml:id="topics">`: 36 `<category>`
elements, each with an `xml:id` (the pointer, e.g. `#faithful_reproduction`), a `<gloss>` (label)
and a `<desc>` (the coding rule). The same list is in
`/tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/consolidate/taxonomy.json`.
Read all rules before you start and apply them literally. Boundaries to keep in mind:
- faithful_reproduction (exact, faithful, natural) vs touch_and_individuality (names touch, phrasing,
  pedalling, individuality) vs the_artists_soul (soul, spirit, feeling); illusion_of_presence (as if
  the artist were here) vs phantom_hands (ghostly hands, keys moving by themselves, summoning).
- masters_at_home (great pianists in your home, at any time, at your command) vs effortless (no
  skill, a button) vs domestic_comfort (a cosy private scene) vs entertaining_guests (company).
- superlatives (perfect, the best) vs unique_and_superior (the only one, better than rivals, beware
  of imitations) vs the_original (the first, the original patents, the firm's history).
- epoch_making_invention (an invention, the newest thing) vs how_it_works (explains the technology,
  recording, likens it to photography or the phonograph).
- testimonials (a named person quoted in praise) vs world_renown (fame throughout the world,
  acclaim by all artists or the press, institutions, medals).
- Prices, terms of payment, addresses, dealer lines, invitations to a demonstration, artist rosters
  and model names are NOT topics (within_reach is the argument that it is affordable to all, not a
  price).

## Suggestions per ad
Your batch file maps each ad to the topics that the four blind readings gave it, with the number of
readings that did (e.g. `"faithful_reproduction": "4/4"`). They are suggestions only: check each
against the rule and the text, keep what fits, drop what does not, and add topics they missed.
"2/4" and "1/4" suggestions are often wrong; "4/4" ones are usually right.

## What to do with each ad
Work only inside `<text>` of the files in your batch. Find it with `grep -n "<text" FILE` and read
from there to the end; the header above is boilerplate and must not be changed.
1. Read the ad (body and the `<desc>` of each `<figure>`), decide its topics.
2. Existing topic segs (`<seg … ana="…">`, normally `type="topic"`): if the span expresses one or
   more of the new topics, set `ana` to their pointers (space-separated, e.g.
   `ana="#wonder #epoch_making_invention"`), set `resp="#claude"` and `type="topic"`, and keep its
   `xml:id`. If it expresses none, unwrap it: remove the `<seg>` start and end tags and keep
   everything between them exactly. (ad022 has a seg with `corresp="#home"` instead of `ana`;
   treat it the same way.)
3. Add a new seg for each passage that expresses a topic and is not yet covered:
   `<seg xml:id="topic_N" ana="#…" type="topic" resp="#claude">…</seg>`. N continues above the
   highest topic_N the file had before you started (count the ones you unwrap too), so that no
   number ever names other words than before.
4. Figures: if the picture described in `<figure><desc>` shows a topic (phantom hands, a
   domestic scene, guests, an elegant setting, the case as furniture, an evocative scene, a royal
   emblem, a portrait used as a testimonial …), put `ana="#…" resp="#claude"` on the `<figure>`
   and give it an `xml:id="figure_N"` unique in the file if it has none. Remove `ana` and `resp`
   from a figure that shows none of the new topics (keep its xml:id).
5. Every topic you assign to the ad must be anchored by at least one seg or figure. Mark each
   distinct passage that expresses a topic, usually one to three per topic per ad; headlines count.

## How to draw a span
- Cover the words that carry the topic: a phrase, a clause or a sentence (typically 3–30 words),
  not a whole paragraph, and not a single generic word.
- Spans must be well-formed XML: start and end inside the same parent element. A seg may contain
  `<lb/>`, `<hi>`, `<persName>`, `<name>`, `<quote>` … whole, but must not cut through one. If a
  passage crosses such a boundary, take the largest part inside one element, or use two segs.
- Do not nest topic segs or let them overlap; if one passage carries two topics, use one seg with
  both pointers.
- Never annotate inside `<note>`, `<gap>` or `<desc>`. In an `<app>`, annotate inside its first
  `<rdg>` (the transcribed printing), or wrap the whole `<app>` together with its context.
- testimonials: mark the heading that introduces the quotes ("Urteile berühmter Musiker:",
  "Opinions of the world's famous musicians") if there is one; otherwise the printed name of the
  quoted person (e.g. the `<hi>` that holds the `<persName>`). This leaves the quoted words free
  for the topics they express.
- Do not change a single character of the text, its whitespace inside words, its `<lb/>`s, or any
  other element or attribute. Only insert, remove or change topic segs and the topic attributes of
  figures.

## Check every file
After editing a file, run from `/home/user/welte-ads`:

    python3 /tmp/claude-0/-home-user-welte-ads/623b00ea-ba47-5cea-91e1-93d72f6e2279/scratchpad/consolidate/check_ad.py tei/adNNN.xml

It compares the text with the last commit, checks the pointers, ids and resp, and validates the
file against the schema. Fix every problem it reports before moving on. It also prints the file's
topics, which is a quick way to see whether every topic you decided on is anchored.

## Do not
- edit any file outside your batch, run `npm run sync-tei`, or commit anything;
- read the research notes or reports in the repository (they are not needed).
