import { describe, expect, it } from "vitest"
import { JSDOM } from "jsdom"
import { getAdBySlug, getAllMetadata, markRedundantLineBreaks, plainText, staticText, tidySpaceBeforePunctuation } from "./tei"

const marked = (body: string) => {
  const xml = `<TEI xmlns="http://www.tei-c.org/ns/1.0"><text>${body}</text></TEI>`
  const doc = new JSDOM(xml, { contentType: "text/xml" }).window.document
  markRedundantLineBreaks(doc)
  return Array.from(doc.getElementsByTagName("lb")).map(lb => lb.hasAttribute("data-redundant"))
}

describe("markRedundantLineBreaks", () => {
  it("marks a line break that opens a div", () => {
    expect(marked("<div>\n  <lb/>The <lb/>Welte-Mignon</div>")).toEqual([true, false])
  })

  it("marks a line break that opens a nested block", () => {
    expect(marked('<div><lb/>The <head><lb/>Welte-<lb/>Mignon</head><hi rendition="#c"><lb/>Call</hi></div>'))
      .toEqual([true, true, false, true])
  })

  it("keeps line breaks inside inline elements after text", () => {
    expect(marked('<div><lb/>Ein <seg ana="#x">neues <lb/>Instrument</seg></div>')).toEqual([true, false])
  })

  it("keeps a doubled line break as an empty line", () => {
    expect(marked("<div>Erste Zeile<lb/><lb/>Zweite</div>")).toEqual([false, false])
  })
})

describe("tidySpaceBeforePunctuation", () => {
  const tidied = (body: string) => {
    const xml = `<TEI xmlns="http://www.tei-c.org/ns/1.0"><text>${body}</text></TEI>`
    const doc = new JSDOM(xml, { contentType: "text/xml" }).window.document
    tidySpaceBeforePunctuation(doc)
    return doc.getElementsByTagName("text")[0].textContent
  }

  it("drops the indentation before punctuation after an element", () => {
    expect(tidied('<p>eine <seg ana="#x">grosse\n   Erfindung\n</seg>, und</p>')).toBe("eine grosse\n   Erfindung, und")
    expect(tidied('<p>an <persName>Busoni</persName> .</p>')).toBe("an Busoni.")
  })

  it("leaves other spaces alone", () => {
    expect(tidied('<p><seg ana="#x">grosse </seg>Erfindung</p>')).toBe("grosse Erfindung")
    expect(tidied("<p>Preis : 50 Pfg.</p>")).toBe("Preis : 50 Pfg.")
    expect(tidied('<p>das <name>Welte</name> "Mignon"</p>')).toBe('das Welte "Mignon"')
    expect(tidied('<p>„<name>Mignon</name> “ ist</p>')).toBe("„Mignon“ ist")
  })
})

describe("getAllMetadata", () => {
  const segments = getAllMetadata().flatMap(ad =>
    ad.topicSegments.map(segment => ({ slug: ad.slug, ...segment })))

  it("gives every topic segment an xml:id to link to", () => {
    expect(segments.filter(segment => !segment.id).map(segment => segment.slug)).toEqual([])
  })

  it("lists a segment with several topics once per topic", () => {
    expect(segments.filter(segment => /\s/.test(segment.topic))).toEqual([])
  })
})

describe("plainText", () => {
  const tei = (body: string) => `<TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><title>Header</title></teiHeader><text><body>${body}</body></text></TEI>`

  it("joins a word broken at the end of a line", () => {
    expect(plainText(tei("<p>flawless reproduc-<lb/>tions of the &amp; playing</p>"))).toBe("flawless reproductions of the & playing")
  })

  it("keeps a hyphen before a capital and separates lines", () => {
    expect(plainText(tei("<p>Welte-<lb/>Mignon<lb/>Studios</p>"))).toBe("Welte-Mignon Studios")
  })

  it("leaves out the header", () => {
    expect(plainText(tei("<p>Text</p>"))).toBe("Text")
  })
})

describe("staticText", () => {
  it("keeps the text and leaves out the header", () => {
    const html = staticText('<tei-TEI><tei-teiHeader><tei-title>Title</tei-title></tei-teiHeader>' +
      '<tei-text><tei-body><tei-hi class="b">Welte</tei-hi><tei-lb></tei-lb>Mignon</tei-body></tei-text></tei-TEI>')
    expect(html).toBe('<tei-text><tei-body><tei-hi class="b">Welte</tei-hi><tei-lb></tei-lb>Mignon</tei-body></tei-text>')
  })

  it("holds the transcription of every ad", () => {
    for (const { slug } of getAllMetadata()) {
      const ad = getAdBySlug(slug)
      const text = new JSDOM(ad.textHtml).window.document.body.textContent || ''
      expect(text.replace(/\s+/g, ' ').trim().length, slug).toBeGreaterThan(0)
      expect(ad.textHtml, slug).not.toContain('tei-teiheader')
    }
  })
})
