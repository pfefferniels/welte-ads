import { describe, expect, it } from "vitest"
import fs from "fs"
import path from "path"
import { JSDOM } from "jsdom"
import { getTopics } from "./tei"

// Every advertisement explains its own markup: its <encodingDesc> holds
// the shared project description and editorial principles and declares
// each rendition and topic that it uses, as tei/shared/encoding.xml does.
// When one of these tests fails, run `npm run sync-tei`.

const teiDir = path.join(process.cwd(), "..", "tei")
const parse = (xml: string) => new JSDOM(xml, { contentType: "text/xml" }).window.document
const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, " ").trim()

const sharedXml = fs.readFileSync(path.join(teiDir, "shared", "encoding.xml"), "utf-8")
const shared = parse(sharedXml)
// the shared file and the advertisements refer to the same files, each by
// its path relative to itself
const fromShared = (reference: string | null | undefined) =>
  reference ? path.posix.join("shared", reference) : ""
const model = sharedXml.match(/<\?xml-model href="([^"]*)"[^>]*\?>/)
const schema = fromShared(model?.[1])
const schemaRef = shared.getElementsByTagName("schemaRef")[0]
const odd = fromShared(schemaRef?.getAttribute("url"))

const declarations = (doc: Document, element: string) => new Map(
  Array.from(doc.getElementsByTagName(element)).map(el => [el.getAttribute("xml:id"), text(el)]))

const pointers = (doc: Document, attribute: string) => Array.from(new Set(
  Array.from(doc.querySelectorAll(`[${attribute}]`)).flatMap(el =>
    (el.getAttribute(attribute) || "").split(/\s+/).filter(Boolean).map(value => value.replace(/^#/, "")))))

// the scans of these do not tell which printing they show
const unknownPrinting = ["ad007.xml", "ad029.xml"]

const ads = fs.readdirSync(teiDir).filter(file => file.endsWith(".xml")).sort()
  .map(file => ({ file, xml: fs.readFileSync(path.join(teiDir, file), "utf-8") }))

describe.each(ads)("$file", ({ file, xml }) => {
  const doc = parse(xml)

  it("points to the printing that it transcribes", () => {
    const decls = doc.getElementsByTagName("text")[0].getAttribute("decls")
    if (unknownPrinting.includes(file)) return expect(decls).toBeNull()
    const sources = Array.from(doc.getElementsByTagName("sourceDesc")).map(source => `#${source.getAttribute("xml:id")}`)
    expect(sources).toContain(decls)
  })

  it("points to the project schema and ODD", () => {
    expect(schema).toMatch(/\.rng$/)
    expect(odd).toMatch(/\.odd$/)
    expect(fs.existsSync(path.join(teiDir, schema))).toBe(true)
    expect(xml).toContain(model?.[0].replace(`href="${model[1]}"`, `href="${schema}"`))

    expect(fs.existsSync(path.join(teiDir, odd))).toBe(true)
    const ref = doc.getElementsByTagName("schemaRef")[0]
    expect(ref?.getAttribute("url")).toBe(odd)
    expect(ref?.getAttribute("type")).toBe(schemaRef.getAttribute("type"))
  })

  it("carries the shared project description and editorial principles", () => {
    for (const element of ["projectDesc", "samplingDecl", "editorialDecl"]) {
      expect(text(doc.getElementsByTagName(element)[0])).toBe(text(shared.getElementsByTagName(element)[0]))
    }
  })

  it("declares every rendition it uses", () => {
    const own = declarations(doc, "rendition")
    const all = declarations(shared, "rendition")
    for (const id of pointers(doc, "rendition")) {
      expect(own.get(id), `#${id}`).toBeDefined()
      expect(own.get(id), `#${id}`).toBe(all.get(id))
    }
  })

  it("declares every topic it uses", () => {
    const own = declarations(doc, "category")
    const all = declarations(shared, "category")
    for (const id of pointers(doc, "ana")) {
      expect(own.get(id), `#${id}`).toBeDefined()
      expect(own.get(id), `#${id}`).toBe(all.get(id))
    }
  })

  // the text shows the first reading of each <app>, so it must be that of
  // the transcribed printing
  it("gives first the reading of the printing that it transcribes", () => {
    const sources = Array.from(doc.getElementsByTagName("sourceDesc")).map(source => source.getAttribute("xml:id"))
    const decls = (doc.getElementsByTagName("text")[0].getAttribute("decls") || "").replace(/^#/, "")
    const cited = (reading: Element) =>
      (reading.getAttribute("source") || "").split(/\s+/).filter(Boolean).map(ref => ref.replace(/^#/, ""))
    for (const app of Array.from(doc.getElementsByTagName("app"))) {
      const readings = Array.from(app.children).filter(reading => reading.localName === "rdg")
      for (const reading of readings) {
        for (const id of cited(reading)) expect(sources, `#${id}`).toContain(id)
      }
      if (decls && !app.getElementsByTagName("lem").length) {
        expect(cited(readings[0]), text(app)).toContain(decls)
      }
    }
  })

  it("dates every printing in ISO 8601", () => {
    for (const date of Array.from(doc.querySelectorAll('date[type="publication"]'))) {
      const when = date.getAttribute("when") || ""
      expect(when).toMatch(/^\d{4}(-\d{2}(-\d{2})?)?$/)
      expect(when.slice(0, 4)).toBe(text(date))
    }
  })
})

describe("getTopics", () => {
  it("reads the label and description of a topic", () => {
    const topic = getTopics()["#exact_reproduction"]
    expect(topic.label).toBe("Exact Reproduction")
    expect(topic.description).toMatch(/^In virtually all promotional materials/)
  })

  it("leaves out a description that is not given", () => {
    expect(getTopics()["#home"]).toEqual({ label: "Home" })
  })
})
