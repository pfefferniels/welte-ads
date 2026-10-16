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
const schema = sharedXml.match(/<\?xml-model[^>]*\?>/)?.[0]

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

  it("points to the TEI schema", () => {
    expect(schema).toBeDefined()
    expect(xml).toContain(schema)
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
