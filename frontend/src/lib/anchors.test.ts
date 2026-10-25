import { describe, expect, it } from "vitest"
import { anchorOf, artistLink, authorityOf, nameAnchor, personAnchor } from "./anchors"

describe("anchorOf", () => {
  it("joins the words in lower case, without accents", () => {
    expect(anchorOf("Neue Zürcher Zeitung Zürich")).toBe("neue-zurcher-zeitung-zurich")
    expect(anchorOf("Harper's Magazine, New York")).toBe("harper-s-magazine-new-york")
    expect(anchorOf("  W.C. HEATON, Pres. ")).toBe("w-c-heaton-pres")
  })

  it("keeps letters of other scripts", () => {
    expect(anchorOf("Жизнь искусства Петроград")).toBe("жизнь-искусства-петроград")
  })
})

describe("personAnchor", () => {
  it("derives the anchor of a person from the GND number", () => {
    expect(personAnchor("https://d-nb.info/gnd/11918625X")).toBe("gnd-11918625X")
    expect(artistLink("https://d-nb.info/gnd/118986724")).toBe("/artists/#gnd-118986724")
  })

  it("derives the anchor of a name without a GND URI from the name as written", () => {
    expect(nameAnchor("W. C. Heaton, Pres.")).toBe("name-w-c-heaton-pres")
  })
})

describe("authorityOf", () => {
  it("names the authority file that a URI points into", () => {
    expect(authorityOf("https://d-nb.info/gnd/2032471-6")).toBe("GND")
    expect(authorityOf("https://www.wikidata.org/entity/Q5700512")).toBe("Wikidata")
    expect(authorityOf("welte.studios")).toBeNull()
    expect(authorityOf("")).toBeNull()
  })
})
