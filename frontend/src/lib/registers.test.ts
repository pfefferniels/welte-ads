import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"
import { JSDOM } from "jsdom"
import { getPeriodicalRegister, getPersonRegister, namingsIn, periodicalRegister, personRegister, printingsIn } from "./registers"
import { getAllMetadata } from "./tei"

const GND = "https://d-nb.info/gnd/"
const PADEREWSKI = `${GND}118986724`

const parsed = (xml: string) => new JSDOM(xml, { contentType: "text/xml" }).window.document

const source = (id: string, journal: string, dates: string[], place = "München", ref = "https://www.geonames.org/2867714") => `
  <sourceDesc xml:id="${id}">
    <bibl>Ein Titel</bibl>
    <biblFull>
      <publicationStmt>
        <pubPlace ref="${ref}">${place}</pubPlace>
        ${dates.map(when => `<date type="publication" when="${when}">${when.slice(0, 4)}</date>`).join("")}
      </publicationStmt>
      <seriesStmt>
        <title level="j" type="main">${journal}</title>
        <biblScope unit="issue">Nr. 1</biblScope>
        <biblScope unit="pages">3</biblScope>
      </seriesStmt>
    </biblFull>
  </sourceDesc>`

const tei = (sources: string, text: string, decls = "") => `
  <TEI xmlns="http://www.tei-c.org/ns/1.0">
    <teiHeader>
      <fileDesc>
        <titleStmt><respStmt><persName xml:id="np" corresp="${GND}1">Pfeffer</persName></respStmt></titleStmt>
        <publicationStmt><pubPlace>Tübingen</pubPlace></publicationStmt>
        ${sources}
      </fileDesc>
    </teiHeader>
    <text${decls && ` decls="${decls}"`}><body>${text}</body></text>
  </TEI>`

describe("namingsIn", () => {
  it("lists the names in the text, not those in the header or in the editor's notes", () => {
    const doc = parsed(tei(source("source_1", "Die Musik", ["1910"]), `
      <p>Played by <persName type="artist" corresp="${PADEREWSKI}">Ignace J.
        Paderewski</persName> and <persName>W. C. Heaton</persName>.<note type="editorial">The
        slogan was invented by <persName>Raymond Rubicam</persName>.</note></p>`))
    expect(namingsIn(doc)).toEqual([
      { uri: PADEREWSKI, type: "artist", written: "Ignace J. Paderewski" },
      { uri: "", type: "", written: "W. C. Heaton" },
    ])
  })
})

describe("printingsIn", () => {
  const sources = source("source_1", "Die Musik", ["1910-11-15"])
    + source("source_2", "The Times", ["1926-07", "1926-04"], "London", "https://www.geonames.org/2643743")

  it("gives one printing for each source, the transcribed one marked", () => {
    const printings = printingsIn(parsed(tei(sources, "<p/>", "#source_2")))
    expect(printings.map(p => [p.source, p.periodical, p.transcribed])).toEqual([
      ["source_1", "Die Musik", false],
      ["source_2", "The Times", true],
    ])
    expect(printings[1]).toMatchObject({
      place: "London",
      placeRef: "https://www.geonames.org/2643743",
      dates: ["1926-07", "1926-04"],
      issue: "Nr. 1",
      pages: "3",
    })
  })

  it("takes the first printing as the transcribed one where the text does not say", () => {
    expect(printingsIn(parsed(tei(sources, "<p/>"))).map(p => p.transcribed)).toEqual([true, false])
  })
})

const naming = (uri: string, written: string, type = "artist") => ({ uri, type, written })

describe("personRegister", () => {
  const { persons, unlinked } = personRegister([
    {
      slug: "ad002", title: "Later", date: "1912", printings: [],
      namings: [naming(PADEREWSKI, "Paderewski"), naming(PADEREWSKI, "PADEREWSKI", "composer"), naming("", "W. C. Heaton,", "")],
    },
    {
      slug: "ad001", title: "Earlier", date: "1910-11-15", printings: [],
      namings: [naming(`${GND}0000000X`, "HOFMANN"), naming(`${GND}0000000X`, "Hofmann"), naming(PADEREWSKI, "Paderewski"), naming("", "W.C. HEATON", "")],
    },
  ])

  it("lists each person once, with the ads naming them, earliest first", () => {
    const paderewski = persons.find(person => person.uri === PADEREWSKI)
    expect(paderewski).toEqual({
      id: "gnd-118986724",
      name: "Paderewski, Ignacy Jan",
      uri: PADEREWSKI,
      initial: "P",
      roles: ["artist", "composer"],
      mentions: 3,
      ads: [
        { slug: "ad001", title: "Earlier", date: "1910-11-15" },
        { slug: "ad002", title: "Later", date: "1912" },
      ],
    })
  })

  it("names a person without a label as the ads most often write the name", () => {
    expect(persons.map(person => [person.id, person.name])).toEqual([
      ["gnd-0000000X", "Hofmann"],
      ["gnd-118986724", "Paderewski, Ignacy Jan"],
    ])
  })

  it("lists the names without a GND URI apart, as written", () => {
    expect(unlinked).toEqual([{
      id: "name-w-c-heaton",
      name: "W. C. Heaton",
      uri: "",
      initial: "W",
      roles: [],
      mentions: 2,
      ads: [
        { slug: "ad001", title: "Earlier", date: "1910-11-15" },
        { slug: "ad002", title: "Later", date: "1912" },
      ],
    }])
  })
})

describe("periodicalRegister", () => {
  const printing = (source: string, periodical: string, dates: string[], place = "Perth", transcribed = false) => ({
    source, periodical, place, placeRef: `https://www.geonames.org/${place}`, dates, issue: "", pages: "", transcribed,
  })
  const register = periodicalRegister([
    {
      slug: "ad001", title: "One", date: "1913-03", namings: [],
      printings: [printing("source_1", "The Daily News", ["1913-11"], "Perth", true), printing("source_2", "The Daily News", ["1913-03"])],
    },
    {
      slug: "ad002", title: "Two", date: "1910", namings: [],
      printings: [printing("source_1", "The Daily News", ["1910"], "London", true), printing("source_2", "Bergens Tidende", ["1911"], "Bergen")],
    },
  ])

  it("tells periodicals of the same title apart by their place", () => {
    expect(register.map(entry => [entry.id, entry.initial])).toEqual([
      ["bergens-tidende-bergen", "B"],
      ["the-daily-news-london", "D"],
      ["the-daily-news-perth", "D"],
    ])
  })

  it("lists the printings of a periodical in the order of their dates", () => {
    const perth = register.find(entry => entry.place === "Perth")!
    expect(perth.printings.map(p => [p.dates[0], p.ad.slug, p.source, p.transcribed])).toEqual([
      ["1913-03", "ad001", "source_2", false],
      ["1913-11", "ad001", "source_1", true],
    ])
    expect(perth.printings[0].ad).toEqual({ slug: "ad001", title: "One", date: "1913-03" })
  })
})

describe("the registers of the collection", () => {
  const ads = getAllMetadata()
  const { persons, unlinked } = getPersonRegister()
  const periodicals = getPeriodicalRegister()

  it("give every entry an anchor of its own", () => {
    const ids = [...persons, ...unlinked].map(entry => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(persons.every(person => /^gnd-[0-9X-]+$/.test(person.id))).toBe(true)
    const periodicalIds = periodicals.map(entry => entry.id)
    expect(new Set(periodicalIds).size).toBe(periodicalIds.length)
    expect(periodicalIds.every(Boolean)).toBe(true)
  })

  it("list every printing, one of each ad as the transcribed one", () => {
    const printings = periodicals.flatMap(entry => entry.printings)
    const sources = ads.map(ad => fs.readFileSync(path.join(process.cwd(), "..", "tei", `${ad.slug}.xml`), "utf-8"))
      .reduce((sum, xml) => sum + (xml.match(/<sourceDesc[\s>]/g) || []).length, 0)
    expect(printings.length).toBe(sources)
    expect(printings.filter(p => p.transcribed).map(p => p.ad.slug).sort()).toEqual(ads.map(ad => ad.slug).sort())
  })

  it("list the artists that the ads mention", () => {
    const listed = new Set(persons.map(person => person.uri))
    expect(ads.flatMap(ad => ad.mentions).filter(uri => !listed.has(uri))).toEqual([])
  })
})
