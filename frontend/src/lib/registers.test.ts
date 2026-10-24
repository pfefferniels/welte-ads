import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"
import { JSDOM } from "jsdom"
import { getArtistRegister, getPlaceRegister, namingsIn, personRegister, placeRegister, printingsIn } from "./registers"
import { getAllMetadata } from "./tei"
import { coordinates } from "../labels/coordinates"
import { languages } from "../labels/languages"

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

  it("lists a name once though the readings of other printings repeat it", () => {
    const doc = parsed(tei(source("source_1", "De Maasbode", ["1923"]) + source("source_2", "De Maasbode", ["1923"]), `
      <p><app><rdg source="#source_1"><persName type="artist" corresp="${PADEREWSKI}">PADEREWSKI</persName></rdg><rdg
        source="#source_2"><persName type="artist" corresp="${PADEREWSKI}"><sic>Paderewsky</sic></persName></rdg></app></p>`))
    expect(namingsIn(doc)).toEqual([{ uri: PADEREWSKI, type: "artist", written: "PADEREWSKI" }])
  })

  it("lists a name that only another printing has", () => {
    const doc = parsed(tei(source("source_1", "Berlingske", ["1923"]) + source("source_2", "Berlingske", ["1923"]), `
      <p><app><rdg source="#source_1"/><rdg source="#source_2">played by <persName type="artist"
        corresp="${PADEREWSKI}">Paderewski</persName></rdg></app></p>`))
    expect(namingsIn(doc)).toEqual([{ uri: PADEREWSKI, type: "artist", written: "Paderewski" }])
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

describe("placeRegister", () => {
  const PERTH = "https://www.geonames.org/2063523"
  const printing = (source: string, periodical: string, dates: string[], place = "Perth", placeRef = PERTH, transcribed = false) => ({
    source, periodical, place, placeRef, dates, issue: "", pages: "", transcribed,
  })
  const register = placeRegister([
    {
      slug: "ad001", title: "One", date: "1913-03", company: "nicholson.perth", language: "en",
      printings: [
        printing("source_1", "The West Australian", ["1913-11"], "Perth", PERTH, true),
        printing("source_2", "The Daily News", ["1913-03"]),
        printing("source_3", "The West Australian", ["1913-04"]),
      ],
    },
    {
      slug: "ad002", title: "Two", date: "1910", company: "steinway", language: "de",
      printings: [
        printing("source_1", "The Daily News", ["1910"], "London", "https://www.geonames.org/2643743", true),
        printing("source_2", "Daily Telegraph", ["1911"], "Perth (W.A.)"),
      ],
    },
  ])
  const perth = register.find(place => place.ref === PERTH)!

  it("lists the places by name, anchored by their GeoNames number", () => {
    expect(register.map(place => [place.id, place.names, place.initial])).toEqual([
      ["place-2643743", ["London"], "L"],
      ["place-2063523", ["Perth", "Perth (W.A.)"], "P"],
    ])
    expect([perth.printings, perth.ads]).toEqual([4, 2])
  })

  it("lists the periodicals of a place, each with its printings in the order of their dates", () => {
    expect(perth.periodicals.map(periodical => [periodical.title, periodical.printings.map(p => [p.dates[0], p.ad.slug, p.transcribed])])).toEqual([
      ["The Daily News", [["1913-03", "ad001", false]]],
      ["Daily Telegraph", [["1911", "ad002", false]]],
      ["The West Australian", [["1913-04", "ad001", false], ["1913-11", "ad001", true]]],
    ])
    expect(perth.periodicals[1].printings[0].ad).toEqual({ slug: "ad002", title: "Two", date: "1910" })
  })

  it("counts the printings of a place per year, with their languages", () => {
    expect(perth.years).toEqual([
      { year: 1911, printings: 1, languages: ["de"] },
      { year: 1913, printings: 3, languages: ["en"] },
    ])
    expect(perth.languages).toEqual(["en", "de"])
  })

  it("lists the companies whose ads were printed at a place, with those ads", () => {
    expect(perth.companies).toEqual([
      { key: "nicholson.perth", name: "Nicholson's Ltd, Perth", printings: 3, ads: [{ slug: "ad001", title: "One", date: "1913-03" }] },
      { key: "steinway", name: "Steinway & Sons", printings: 1, ads: [{ slug: "ad002", title: "Two", date: "1910" }] },
    ])
  })
})

describe("the registers of the collection", () => {
  const ads = getAllMetadata()
  const persons = getArtistRegister()
  const places = getPlaceRegister()

  it("give every entry an anchor of its own", () => {
    const ids = persons.map(entry => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(persons.every(person => /^gnd-[0-9X-]+$/.test(person.id))).toBe(true)
    const placeIds = places.map(place => place.id)
    expect(new Set(placeIds).size).toBe(placeIds.length)
    expect(placeIds.every(id => /^place-\d+$/.test(id))).toBe(true)
  })

  it("list every printing, one of each ad as the transcribed one", () => {
    const printings = places.flatMap(place => place.periodicals.flatMap(periodical => periodical.printings))
    const sources = ads.map(ad => fs.readFileSync(path.join(process.cwd(), "..", "tei", `${ad.slug}.xml`), "utf-8"))
      .reduce((sum, xml) => sum + (xml.match(/<sourceDesc[\s>]/g) || []).length, 0)
    expect(printings.length).toBe(sources)
    expect(printings.filter(p => p.transcribed).map(p => p.ad.slug).sort()).toEqual(ads.map(ad => ad.slug).sort())
  })

  it("put every place on the map", () => {
    const missing = places.filter(place => !coordinates[place.ref]).map(place => `${place.names[0]} ${place.ref}`)
    expect(missing).toEqual([])
    expect(places.filter(place => coordinates[place.ref].lat === 0 && coordinates[place.ref].long === 0)).toEqual([])
  })

  it("date every printing to a year", () => {
    expect(places.filter(place => place.years.reduce((sum, year) => sum + year.printings, 0) !== place.printings)).toEqual([])
  })

  it("know and name the language of every printing", () => {
    expect(places.filter(place => !place.languages.length || place.languages.some(code => !languages[code]))
      .map(place => `${place.names[0]}: ${place.languages}`)).toEqual([])
  })

  it("count every printing once for its company", () => {
    const counted = places.flatMap(place => place.companies).reduce((sum, company) => sum + company.printings, 0)
    expect(counted).toBe(places.reduce((sum, place) => sum + place.printings, 0))
  })

  it("list the artists that the ads mention", () => {
    const listed = new Set(persons.map(person => person.uri))
    expect(ads.flatMap(ad => ad.mentions).filter(uri => !listed.has(uri))).toEqual([])
  })
})
