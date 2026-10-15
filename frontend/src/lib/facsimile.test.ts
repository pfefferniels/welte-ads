import { describe, expect, it } from "vitest"
import { computeLayout, exclusionBands, parsePoints } from "./facsimile"

describe("parsePoints", () => {
  it("reads TEI points, tolerating line breaks", () => {
    expect(parsePoints("315,2071 315,2460\n  929,2460 929,2071")).toEqual([
      [315, 2071], [315, 2460], [929, 2460], [929, 2071],
    ])
  })
})

describe("computeLayout", () => {
  const rect = (x1: number, y1: number, x2: number, y2: number): [number, number][] =>
    [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]

  it("crops a page to the area its zones cover", () => {
    const layout = computeLayout({
      surfaces: [{ url: "page.png", width: 2479, height: 3508 }],
      zones: [
        { id: "a", surface: 0, points: rect(300, 2000, 900, 2400) },
        { id: "b", surface: 0, points: rect(250, 2500, 1000, 3000) },
      ],
    }, 0)

    expect(layout.width).toBe(750)
    expect(layout.height).toBe(1000)
    expect(layout.zones.a).toMatchObject({ left: 50, top: 0, width: 600, height: 400, shape: null })
    expect(layout.zones.b).toMatchObject({ left: 0, top: 500 })
    expect(layout.surfaces[0].full).toEqual({ left: -250, top: -2000, width: 2479, height: 3508 })
  })

  it("does not crop beyond the page", () => {
    const layout = computeLayout({
      surfaces: [{ url: "page.png", width: 1000, height: 1000 }],
      zones: [{ id: "a", surface: 0, points: rect(0, 0, 1000, 1000) }],
    })
    expect(layout.surfaces[0].crop).toEqual({ left: 0, top: 0, width: 1000, height: 1000 })
  })

  it("puts the pages of a multi-page ad side by side, uncropped", () => {
    const layout = computeLayout({
      surfaces: [
        { url: "1.tif", width: 1000, height: 1500 },
        { url: "2.tif", width: 900, height: 1500 },
      ],
      zones: [
        { id: "a", surface: 0, points: rect(100, 100, 200, 200) },
        { id: "b", surface: 1, points: rect(100, 100, 200, 200) },
      ],
    })

    expect(layout.surfaces.map(s => s.left)).toEqual([0, 1060])
    expect(layout.width).toBe(1960)
    expect(layout.zones.a.left).toBe(100)
    expect(layout.zones.b.left).toBe(1160)
  })

  it("keeps the shape of L-shaped zones only", () => {
    const layout = computeLayout({
      surfaces: [{ url: "page.png", width: null, height: null }],
      zones: [
        // a near-rectangle with an extra point
        { id: "almost", surface: 0, points: [[0, 0], [500, 0], [500, 1], [501, 100], [0, 100]] },
        // full width at the top, half width below
        { id: "l", surface: 0, points: [[0, 200], [400, 200], [400, 300], [200, 300], [200, 500], [0, 500]] },
      ],
    }, 0)

    expect(layout.zones.almost.shape).toBeNull()
    expect(layout.zones.l.shape).toEqual([[0, 0], [400, 0], [400, 100], [200, 100], [200, 300], [0, 300]])
  })
})

describe("exclusionBands", () => {
  // full width at the top, the right half cut away below y = 100
  const l: [number, number][] = [[0, 0], [400, 0], [400, 100], [200, 100], [200, 300], [0, 300]]

  it("excludes the cut-out corner of an L-shape on the right", () => {
    const bands = exclusionBands(l, 400, 300)!
    const at = (y: number) => {
      let top = 0
      for (const band of bands) {
        if (y < top + band.height) return band
        top += band.height
      }
      return bands[bands.length - 1]
    }

    expect(bands.reduce((h, b) => h + b.height, 0)).toBe(300)
    expect(at(50).right).toBeNull()
    expect(at(200).right?.width).toBe(200)
    expect(bands.every(b => b.left === null)).toBe(true)
  })

  it("does not let a sliver on one side cancel a notch on the other", () => {
    // a notch at the top left, and the bottom right corner cut off steeply
    const shape: [number, number][] = [[150, 0], [400, 0], [400, 280], [20, 300], [0, 300], [0, 100], [150, 100]]
    const bands = exclusionBands(shape, 400, 300)!
    expect(bands[0].left?.width).toBe(150)
    expect(bands[bands.length - 1].left).toBeNull()
  })

  it("ignores the sloppy corners of an automatic segmentation", () => {
    const sloppy: [number, number][] = [[10, 0], [400, 0], [400, 290], [390, 300], [0, 300], [0, 8]]
    expect(exclusionBands(sloppy, 400, 300)).toBeNull()
  })
})
