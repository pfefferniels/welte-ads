import { describe, expect, it } from "vitest"
import { computeLayout, exclusions, parsePoints } from "./facsimile"

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

describe("exclusions", () => {
  it("excludes the cut-out corner of an L-shape on the right", () => {
    const shape: [number, number][] = [[0, 0], [400, 0], [400, 100], [200, 100], [200, 300], [0, 300]]
    const { left, right } = exclusions(shape, 400, 300, 6)

    expect(left).toBeNull()
    expect(right?.width).toBe(200)
    // nothing excluded in the upper third, everything right of x = 200 below
    expect(right?.polygon[1]).toEqual([200, 0])
    expect(right?.polygon.at(-2)).toEqual([0, 300])
  })
})
