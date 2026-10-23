import { describe, expect, it } from "vitest"
import { JSDOM } from "jsdom"
import { extractMetadata, getAllAds, getAllMetadata, markRedundantLineBreaks, repeatsShownReading, passageText, plainText, staticText, tidySpaceBeforePunctuation } from "./tei"

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
  const all = getAllMetadata()
  const segments = all.flatMap(ad =>
    ad.topicSegments.map(segment => ({ slug: ad.slug, ...segment })))

  it("gives every topic segment an xml:id to link to", () => {
    expect(segments.filter(segment => !segment.id).map(segment => segment.slug)).toEqual([])
  })

  it("lists a segment with several topics once per topic", () => {
    expect(segments.filter(segment => /\s/.test(segment.topic))).toEqual([])
  })

  it("reads who edited and transcribed an ad and whether it is checked", () => {
    const ads = Object.fromEntries(all.map(ad => [ad.slug, ad]))
    const claude = { name: "Claude (AI model by Anthropic)", id: "claude" }
    const editor = { name: "Niels Pfeffer", id: "np" }

    expect(ads.ad150.status).toBe("unchecked")
    expect(ads.ad150.contributors).toEqual([
      { role: "Editor", ...editor },
      { role: "Transcription, encoding and annotation of topics", ...claude },
    ])
    expect(ads.ad008.status).toBe("checked")
    expect(ads.ad008.contributors).toEqual([{ role: "Transcription and encoding", ...editor }])
    expect(ads.ad037.status).toBe("checked")
    expect(ads.ad037.contributors).toEqual([
      { role: "Transcription and encoding", ...editor },
      { role: "Further printings", ...claude },
    ])
  })

  // the ad pages say so of every unchecked ad
  it("finds every unchecked ad transcribed and annotated by Claude", () => {
    const unchecked = all.filter(ad => ad.status === "unchecked")
    expect(unchecked.length).toBeGreaterThan(0)
    for (const ad of unchecked) {
      const transcribers = ad.contributors.filter(c => c.role.startsWith("Transcription"))
      expect(transcribers.map(c => c.id), ad.slug).toEqual(["claude"])
      expect(ad.topicSegments.filter(segment => segment.resp !== "#claude"), ad.slug).toEqual([])
    }
  })
})

describe("extractMetadata", () => {
  const tei = (titleStmt: string, revisionDesc: string) => `
    <TEI xmlns="http://www.tei-c.org/ns/1.0">
      <teiHeader>
        <fileDesc>
          <titleStmt><title type="main">Ad</title>${titleStmt}</titleStmt>
          <sourceDesc>
            <biblFull><titleStmt><respStmt><resp>Printing</resp><name>Printer</name></respStmt></titleStmt></biblFull>
          </sourceDesc>
        </fileDesc>
        ${revisionDesc}
      </teiHeader>
      <text><body><p><seg xml:id="topic_1" ana="#home #hostess" resp="#claude">im Heim</seg></p></body></text>
    </TEI>`

  it("names the contributors of the title statement with their roles", () => {
    const { contributors } = extractMetadata(tei(`
      <respStmt>
        <resp>Transcription
          and encoding</resp>
        <persName xml:id="np">
          <surname>Pfeffer</surname>
          <forename>Niels</forename>
        </persName>
      </respStmt>
      <respStmt><resp>Proofreading</resp><name>Claude</name><persName>Jane Doe</persName></respStmt>`, ""))
    expect(contributors).toEqual([
      { role: "Transcription and encoding", name: "Niels Pfeffer", id: "np" },
      { role: "Proofreading", name: "Claude", id: "" },
      { role: "Proofreading", name: "Jane Doe", id: "" },
    ])
  })

  it("groups the printings by periodical", () => {
    const source = (id: string, periodical: string, ...dates: string[]) => `
      <sourceDesc xml:id="${id}"><biblFull>
        <publicationStmt>${dates.map(when => `<date type="publication" when="${when}"/>`).join('')}</publicationStmt>
        <seriesStmt><title level="j">${periodical}</title></seriesStmt>
      </biblFull></sourceDesc>`
    const { periodicals } = extractMetadata(`
      <TEI xmlns="http://www.tei-c.org/ns/1.0">
        <teiHeader><fileDesc>
          ${source("source_1", "Vogue", "1926-04-01")}
          ${source("source_2", "The Century", "1926-05")}
          ${source("source_3", "Vogue", "1926-04-15", "1926-05-01")}
        </fileDesc></teiHeader>
        <text><body><p>As <title level="j">The Times</title> says</p></body></text>
      </TEI>`)
    expect(periodicals).toEqual([
      { title: "Vogue", dates: ["1926-04-01", "1926-04-15", "1926-05-01"] },
      { title: "The Century", dates: ["1926-05"] },
    ])
  })

  it("reads the status of the revisions", () => {
    const status = (revisionDesc: string) => extractMetadata(tei("", revisionDesc)).status
    expect(status('<revisionDesc status="checked"><change/></revisionDesc>')).toBe("checked")
    expect(status('<revisionDesc status="unchecked"><change/></revisionDesc>')).toBe("unchecked")
  })

  it("counts an ad without a status as unchecked", () => {
    expect(extractMetadata(tei("", "<revisionDesc><change/></revisionDesc>")).status).toBe("unchecked")
    expect(extractMetadata(tei("", "")).status).toBe("unchecked")
  })

  it("says who assigned each topic", () => {
    expect(extractMetadata(tei("", "")).topicSegments).toEqual([
      { id: "#topic_1", topic: "#home", text: "im Heim", picture: false, resp: "#claude" },
      { id: "#topic_1", topic: "#hostess", text: "im Heim", picture: false, resp: "#claude" },
    ])
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

  it("joins a word broken inside an element", () => {
    expect(plainText(tei('<p><hi rendition="#i">music in-</hi>\n<lb/>vention</p>'))).toBe("music invention")
    expect(plainText(tei("<p>el fra<unclear>-</unclear>\n<lb/>seo</p>"))).toBe("el fraseo")
  })

  it("keeps a dash at the end of a line apart", () => {
    expect(plainText(tei("<p>for you -\n<lb/>tonight</p>"))).toBe("for you - tonight")
  })

  it("leaves out the header", () => {
    expect(plainText(tei("<p>Text</p>"))).toBe("Text")
  })
})

describe("passageText", () => {
  const passage = (body: string) => {
    const xml = `<TEI xmlns="http://www.tei-c.org/ns/1.0"><text>${body}</text></TEI>`
    const doc = new JSDOM(xml, { contentType: "text/xml" }).window.document
    return passageText(doc.querySelector("[ana]")!)
  }

  it("separates the lines of a passage", () => {
    expect(passage('<seg ana="#x">\n  Phantom<lb/>Hands\n</seg>')).toBe("Phantom Hands")
  })

  it("gives only the reading that the facsimile shows", () => {
    expect(passage('<seg ana="#x">met <app><rdg>gecombineerde</rdg><rdg>combineerende</rdg></app> patenten</seg>'))
      .toBe("met gecombineerde patenten")
    expect(passage('<seg ana="#x"><app><rdg>Trvk</rdg><lem>Tryk</lem></app></seg>')).toBe("Tryk")
  })

  it("leaves out pictures and notes", () => {
    expect(passage('<seg ana="#x"><figure><desc>A pianist.</desc></figure>phantom hands<note>On hands.</note></seg>'))
      .toBe("phantom hands")
    expect(passage('<figure ana="#x"><desc>A pianist.</desc></figure>')).toBe("")
  })
})

describe("repeatsShownReading", () => {
  const xml = `<TEI xmlns="http://www.tei-c.org/ns/1.0"><text><p><persName xml:id="a" corresp="liszt">Liszt</persName>
    <app><rdg><persName xml:id="b" corresp="liszt">LISZT</persName></rdg><rdg><persName xml:id="c" corresp="liszt">LISTZ</persName></rdg></app>
    <app><rdg/><rdg>played by <persName xml:id="d" corresp="busoni">Busoni</persName></rdg></app>
    <app><rdg>x</rdg><lem><app><rdg><persName xml:id="e" corresp="ganz">Ganz</persName></rdg><rdg><persName xml:id="f" corresp="ganz">GANZ</persName></rdg></app></lem></app></p></text></TEI>`
  const doc = new JSDOM(xml, { contentType: "text/xml" }).window.document
  const repeats = (id: string) => repeatsShownReading(doc.querySelector(`[*|id="${id}"]`)!, el => el.getAttribute("corresp") || "")

  it("tells what the reading of another printing repeats", () => {
    expect([repeats("a"), repeats("b"), repeats("c")]).toEqual([false, false, true])
  })

  it("keeps what only another printing has", () => {
    expect(repeats("d")).toBe(false)
  })

  it("prefers the lemma and looks through nested readings", () => {
    expect([repeats("e"), repeats("f")]).toEqual([false, true])
  })
})

describe("staticText", () => {
  it("keeps the text and leaves out the header", () => {
    const html = staticText('<tei-TEI><tei-teiHeader><tei-title>Title</tei-title></tei-teiHeader>' +
      '<tei-text><tei-body><tei-hi class="b">Welte</tei-hi><tei-lb></tei-lb>Mignon</tei-body></tei-text></tei-TEI>')
    expect(html).toBe('<tei-text><tei-body><tei-hi class="b">Welte</tei-hi><tei-lb></tei-lb>Mignon</tei-body></tei-text>')
  })

  it("holds the transcription of every ad", () => {
    for (const ad of getAllAds()) {
      const text = ad.textHtml.replace(/<[^>]*>/g, ' ')
      expect(text.replace(/\s+/g, ' ').trim().length, ad.slug).toBeGreaterThan(0)
      expect(ad.textHtml, ad.slug).not.toContain('tei-teiheader')
    }
  })
})
