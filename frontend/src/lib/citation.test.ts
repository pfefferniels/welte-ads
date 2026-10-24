import { describe, expect, it } from "vitest"
import { Cited, STYLES, Style, germanDate, plain } from "./citation"
import { getAllMetadata } from "./tei"

const ad: Cited = {
  slug: 'ad008',
  title: 'Mit dem Welte Mignon ist ...',
  company: 'Alfred Schmid Nachf.',
  date: 'November 15, 1910',
  status: 'checked',
  year: '2026',
  modified: '2026-10-20',
}

const cite = (style: Style, cited: Partial<Cited> = {}, accessed: string | null = '2026-10-04') =>
  STYLES[style].cite({ ...ad, ...cited }, accessed).map(form => plain(form.parts))

describe("germanDate", () => {
  it("writes days and months the German way", () => {
    expect(germanDate('November 15, 1910')).toBe('15. November 1910')
    expect(germanDate('October 6 and 9, 1908')).toBe('6. und 9. Oktober 1908')
    expect(germanDate('November 14, 16, 23 and 28, 1913')).toBe('14., 16., 23. und 28. November 1913')
    expect(germanDate('January 28 to February 28, 1908')).toBe('28. Januar bis 28. Februar 1908')
    expect(germanDate('October 18, 1928 to July 3, 1930')).toBe('18. Oktober 1928 bis 3. Juli 1930')
    expect(germanDate('Sunday, December 7, 1913')).toBe('Sonntag, 7. Dezember 1913')
  })

  it("translates months without days", () => {
    expect(germanDate('March to June 1926')).toBe('März bis Juni 1926')
    expect(germanDate('November 1925/February 1926')).toBe('November 1925/Februar 1926')
  })

  it("reads abbreviated months and a year without a comma", () => {
    expect(germanDate('Jun 3 1925')).toBe('3. Juni 1925')
    expect(germanDate('Feb 21, 1925')).toBe('21. Februar 1925')
  })

  it("keeps what is not English", () => {
    expect(germanDate('15.11.1910')).toBe('15.11.1910')
    expect(germanDate('Bd. 30, 1909/10')).toBe('Bd. 30, 1909/10')
  })

  it("leaves no English in the date of any ad, and all its numbers", () => {
    const english = /\b(and|to|January|February|March|May|June|July|October|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec|[A-Z][a-z]+day)\b/
    for (const { slug, titleSub } of getAllMetadata()) {
      const german = germanDate(titleSub)
      expect(german, slug).not.toMatch(english)
      // and keeps every day and year
      expect(german.match(/\d+/g), slug).toEqual(titleSub.match(/\d+/g))
    }
  })
})

describe("STYLES", () => {
  it("cites an ad in Chicago style as a note and in the bibliography", () => {
    expect(cite('chicago')).toEqual([
      'Niels Pfeffer, ed., “Mit dem Welte Mignon ist ...,” advertisement by Alfred Schmid Nachf., November 15, 1910, '
        + 'in Welte-Mignon Advertisements Collection, https://doi.org/10.5281/zenodo.23496355, '
        + 'accessed October 4, 2026, https://anz.welte225.org/ad008/.',
      'Pfeffer, Niels, ed. “Mit dem Welte Mignon ist ...” Advertisement by Alfred Schmid Nachf., November 15, 1910. '
        + 'In Welte-Mignon Advertisements Collection. https://doi.org/10.5281/zenodo.23496355. '
        + 'Accessed October 4, 2026. https://anz.welte225.org/ad008/.',
    ])
  })

  it("cites an ad in MLA style", () => {
    expect(cite('mla')).toEqual([
      'Pfeffer, Niels, editor. “Mit dem Welte Mignon ist ...” Advertisement by Alfred Schmid Nachf., November 15, 1910. '
        + 'Welte-Mignon Advertisements Collection, 2026, https://doi.org/10.5281/zenodo.23496355, '
        + 'anz.welte225.org/ad008/. Accessed 4 Oct. 2026.',
    ])
  })

  it("cites an ad in APA style", () => {
    expect(cite('apa')).toEqual([
      'Pfeffer, N. (Ed.). (2026). Mit dem Welte Mignon ist ... [Advertisement by Alfred Schmid Nachf., November 15, 1910]. '
        + 'In Welte-Mignon Advertisements Collection. https://doi.org/10.5281/zenodo.23496355. '
        + 'Retrieved October 4, 2026, from https://anz.welte225.org/ad008/',
    ])
    expect(cite('apa', { year: null })[0]).toMatch(/^Pfeffer, N\. \(Ed\.\)\. \(n\.d\.\)\./)
  })

  it("cites an ad after Gardner/Springfeld as the MWA_csl style writes a web page", () => {
    // what is left of citeproc-js's rendering with that style is that the
    // DOI of the collection and the description of the ad are added
    const rest = '»Mit dem Welte Mignon ist ...«, Anzeige von Alfred Schmid Nachf., 15. November 1910, '
      + 'Welte-Mignon Advertisements Collection, https://doi.org/10.5281/zenodo.23496355, '
      + 'https://anz.welte225.org/ad008/, letzte Änderung 20.10.2026, abgerufen am 4.10.2026.'
    expect(cite('gardner-springfeld')).toEqual([
      `Niels Pfeffer (Hrsg.), ${rest}`,
      `Pfeffer, Niels (Hrsg.), ${rest}`,
    ])
    expect(cite('gardner-springfeld', { modified: '' }, null)[0])
      .toMatch(/, https:\/\/anz\.welte225\.org\/ad008\/\.$/)
  })

  it("gives an ad as a BibTeX entry, with what TeX would read as commands escaped", () => {
    expect(cite('bibtex', { company: 'Hardman, Pack & Co.' })).toEqual([[
      '@incollection{pfeffer2026ad008,',
      '  editor    = {Pfeffer, Niels},',
      '  title     = {{Mit dem Welte Mignon ist ...}},',
      '  booktitle = {Welte-Mignon Advertisements Collection},',
      '  year      = {2026},',
      '  doi       = {10.5281/zenodo.23496355},',
      '  url       = {https://anz.welte225.org/ad008/},',
      '  urldate   = {2026-10-04},',
      '  note      = {Advertisement by Hardman, Pack \\& Co., November 15, 1910},',
      '}',
    ].join('\n')])
  })

  it("says in every style that an unchecked ad is Claude's transcription", () => {
    for (const style of Object.keys(STYLES) as Style[]) {
      for (const form of cite(style, { status: 'unchecked' })) {
        expect(form, style).toMatch(/Claude \((AI model|KI-Modell)\)/)
      }
    }
    expect(cite('chicago', { status: 'unchecked' })[1])
      .toContain('November 15, 1910. Transcribed by Claude (AI model), not yet checked by the editor. In ')
    expect(cite('apa', { status: 'unchecked' })[0])
      .toContain('[Advertisement by Alfred Schmid Nachf., November 15, 1910; transcribed by Claude (AI model), not yet checked by the editor].')
  })

  it("leaves out the day of access until it is known", () => {
    for (const style of Object.keys(STYLES) as Style[]) {
      for (const form of cite(style, {}, null)) {
        expect(form, style).not.toMatch(/ccessed|Retrieved|abgerufen|urldate/)
      }
    }
    expect(cite('chicago', {}, null)[0]).toMatch(/zenodo\.23496355, https:\/\/anz\.welte225\.org\/ad008\/\.$/)
  })

  it("does not double the mark that ends a title", () => {
    const [note, bibliography] = cite('chicago', { title: 'Special Announcement!' })
    expect(note).toContain('“Special Announcement!” advertisement')
    expect(bibliography).toContain('“Special Announcement!” Advertisement')
  })

  it("sets the quotations in a title in the inner quotation marks of the style", () => {
    const title = 'A Great Musical Invention. Artistic "Welte" Player.'
    expect(cite('chicago', { title })[1]).toContain('“A Great Musical Invention. Artistic ‘Welte’ Player.” Advertisement')
    expect(cite('gardner-springfeld', { title })[0]).toContain('»A Great Musical Invention. Artistic „Welte“ Player.«, Anzeige')
    // a title that is a quotation is set in the outer ones
    expect(cite('mla', { title: '"Special Announcement"' })[0]).toContain('editor. “Special Announcement.” Advertisement')
  })
})
