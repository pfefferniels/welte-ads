import { describe, expect, it } from "vitest"
import { iiifImageUrl, iiifService, libraryOf } from "./iiif"

describe("iiifService", () => {
  it("reads the service of an IIIF 2 and an IIIF 3 request", () => {
    expect(iiifService("https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130861_00335/full/full/0/default.jpg"))
      .toBe("https://api.digitale-sammlungen.de/iiif/image/v2/bsb00130861_00335")
    expect(iiifService("https://iiif.archive.org/image/iiif/3/item%2Fitem_0025.jp2/full/max/0/default.jpg"))
      .toBe("https://iiif.archive.org/image/iiif/3/item%2Fitem_0025.jp2")
  })

  it("refuses a URL that is no full-image request", () => {
    expect(iiifService("scan.png")).toBeNull()
  })
})

describe("iiifImageUrl", () => {
  it("asks for no more than the image has", () => {
    const image = { service: "https://example.org/iiif/p1", width: 1200, height: 1600 }
    expect(iiifImageUrl(image, 2000)).toBe("https://example.org/iiif/p1/full/1200,/0/default.jpg")
  })

  it("asks the Internet Archive for its page image of the same file", () => {
    const image = {
      service: "https://iiif.archive.org/image/iiif/3/countrylife37gard%2Fcountrylife37gard_jp2.zip%2Fcountrylife37gard_jp2%2Fcountrylife37gard_0174.jp2",
      width: 3221, height: 4705,
    }
    expect(iiifImageUrl(image, 2000)).toBe("https://archive.org/download/countrylife37gard/page/leaf174_w2000.jpg")
  })
})

describe("libraryOf", () => {
  it("names the library and finds its link among the printing's links", () => {
    expect(libraryOf("https://tile.loc.gov/image-services/iiif/service:ndnp:x", [
      "https://babel.hathitrust.org/cgi/pt?id=x",
      "https://chroniclingamerica.loc.gov/lccn/sn83030214/1913-12-07/ed-1/seq-3",
    ])).toEqual({ name: "Library of Congress", url: "https://chroniclingamerica.loc.gov/lccn/sn83030214/1913-12-07/ed-1/seq-3" })
  })
})
