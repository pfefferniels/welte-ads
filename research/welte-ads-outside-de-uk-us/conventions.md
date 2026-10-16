# Selection and transcription conventions

These rules were used for every transcription in this folder.

## Which ads to transcribe
KEEP: proper display ads (set as ads, boxed or in the ad pages) whose MAIN subject is
the Welte-Mignon: Welte-Mignon, Steinway-Welte, licensee instruments (Estey-Welte,
Baldwin-Welte, Auto Piano Welte-Mignon, Gaveau Welte-Mignon …), the Quadrola.
Also keep:
- dealer ads that announce a Welte-Mignon demonstration or recital, if set as an ad;
- dealer ads for a single Welte-Mignon instrument (new or used) that is the ad's sole subject;
- ads with exactly two products of similar weight (e.g. Angelus and Mignon). Flag
  these as "two products" and replace the part about the other product with [gap: …].

EXCLUDE (the user's rules):
- "Welte among many": the Welte-Mignon is one item in a list of brands or products,
  appears only in the firm line, or is secondary to another product or subject.
  Examples: a general piano-shop ad with one Welte line, a sale list, a Steinway
  exhibition that mentions a Welte demonstration.
- "Paid notices": text set like editorial or news copy (advertorials, "échos", reading
  notices, puffs), and notices about other matters (e.g. a shop move "AVIS").
- Still excluded as before: private classifieds, editorial pieces, radio listings,
  advertisers who are not Welte, a licensee or a dealer (hotels, restaurants), ads whose
  advertiser cannot be identified, and anything outside 1905–1930.

Transcribe ONE printing per distinct design, using the best scan, and list the other
printings as further printings. Different text counts as a different design.

## How to transcribe (diplomatic, from the scan image, not from OCR)
- Use the highest resolution available; zoom or crop as needed.
- Each printed line goes on its own line, in reading order.
- Keep line-end hyphens as printed.
- Spelling, punctuation, capitalisation, accents and diacritics exactly as printed.
  Text printed in capitals is written in capitals.
- Do not correct errors: keep them and add [sic] right after.
- Write long s (ſ) as s, resolve ligatures, and transcribe Fraktur in normal letters.
  Keep ß, umlauts etc. as printed.
- Separate each block of the ad (headline, box, column, caption, signature or address
  block) with a blank line. Where the layout is side by side, transcribe left before
  right and mark it with a bracket line, e.g. [right column].
- Illustrations: [Illustration: short description], in place.
- Uncertain word: [Welte?]. Illegible: [illeg. ~3 words].
- Parts about other products: [gap: what is left out]. Keep everything else.
- Omit purely decorative ornaments and rules.
- Typography: no inline marking. Add a "Typography:" line after the block listing
  notable features (bold, large type, letter-spaced, italic, small caps, centred,
  framed, which lines).
- Proofread every transcription a second time against the image, letter by letter.

## Output format (Markdown), one section per ad
### <ID, e.g. NL-01> — <headline or first words>
- **Periodical:** title, place, date, issue, page
- **Advertiser:** name and address as printed
- **Language:**
- **Transcribed from:** URL of the page; local image file
- **Further printings:** date, page, URL; note any differences you noticed
- **Notes:** judgements on the criteria (e.g. two products), uncertainties, date problems

```text
…transcription…
```
Typography: …

End the file with a section "## Excluded on re-inspection", one line per item with its reason.
