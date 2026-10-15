import { describe, expect, it } from "vitest"
import { JSDOM } from "jsdom"
import { markRedundantLineBreaks } from "./tei"

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

  it("marks a doubled line break", () => {
    expect(marked("<div>Erste Zeile<lb/><lb/>Zweite</div>")).toEqual([false, true])
  })
})
