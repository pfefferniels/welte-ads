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

  it("ignores specks when cropping", () => {
    const layout = computeLayout({
      surfaces: [{ url: "page.png", width: 3000, height: 4000 }],
      zones: [
        { id: "a", surface: 0, points: rect(300, 300, 2700, 3700) },
        { id: "speck", surface: 0, points: rect(0, 2000, 2, 2002) },
      ],
    }, 0)
    expect(layout.surfaces[0].crop.left).toBe(300)
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
  // the polygon's left edge (x where it starts) at height y
  const edgeAt = (polygon: [number, number][], y: number) =>
    polygon.slice(1, -1).find(([, py]) => py >= y)![0]

  it("excludes the cut-out corner of an L-shape on the right", () => {
    // full width at the top, the right half cut away below y = 100
    const l: [number, number][] = [[0, 0], [400, 0], [400, 100], [200, 100], [200, 300], [0, 300]]
    const floats = exclusions(l, 400, 300)!

    expect(floats.left).toBeNull()
    expect(floats.right?.width).toBe(200)
    // nothing excluded in the upper third, everything right of x = 200 below
    expect(edgeAt(floats.right!.polygon, 50)).toBe(200)
    expect(edgeAt(floats.right!.polygon, 200)).toBe(0)
  })

  it("does not let a sliver on one side cancel a notch on the other", () => {
    // a notch at the top left, and the bottom right corner cut off steeply
    const shape: [number, number][] = [[150, 0], [400, 0], [400, 280], [20, 300], [0, 300], [0, 100], [150, 100]]
    const floats = exclusions(shape, 400, 300)!
    expect(floats.left?.width).toBe(150)
  })

  it("ignores the sloppy corners of an automatic segmentation", () => {
    const sloppy: [number, number][] = [[10, 0], [400, 0], [400, 290], [390, 300], [0, 300], [0, 8]]
    expect(exclusions(sloppy, 400, 300)).toBeNull()
  })
})
