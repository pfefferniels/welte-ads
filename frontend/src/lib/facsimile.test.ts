import { describe, expect, it } from "vitest"
import { alongLongerSide, computeLayout, exclusions, freeRect, parsePoints } from "./facsimile"

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

  // a rectangle from the corner, its first side so long and turned so far
  // (clockwise, in degrees), its second side so long
  const slanted = ([x, y]: [number, number], long: number, degrees: number, short: number): [number, number][] => {
    const [cos, sin] = [Math.cos(degrees * Math.PI / 180), Math.sin(degrees * Math.PI / 180)]
    return [[x, y], [x + long * cos, y + long * sin], [x + long * cos - short * sin, y + long * sin + short * cos], [x - short * sin, y + short * cos]]
  }

  it("turns a zone drawn as a slanted rectangle the shorter way, about its centre", () => {
    const layout = computeLayout({
      surfaces: [{ url: "page.png", width: null, height: null }],
      zones: [
        // a picture 400 wide and 500 high, turned 20° anticlockwise
        { id: "picture", surface: 0, points: slanted([1000, 1000], 400, -20, 500) },
        // one sloping side, as an automatic segmentation draws it
        { id: "sloping", surface: 0, points: [[1765, 1977], [1552, 2511], [2408, 2516], [2408, 1977]] },
      ],
    }, 0)

    const { left, top, width, height, rotation } = layout.zones.picture
    expect([width, height, rotation].map(n => Math.round(n))).toEqual([400, 500, -20])
    const centre = layout.surfaces[0].crop
    const [x, y] = slanted([1000, 1000], 400, -20, 500)[2]
    expect(left + width / 2 + centre.left).toBeCloseTo((1000 + x) / 2)
    expect(top + height / 2 + centre.top).toBeCloseTo((1000 + y) / 2)
    expect(layout.zones.sloping).toMatchObject({ rotation: 0, width: 856, height: 539 })
  })
})

describe("alongLongerSide", () => {
  const zone = { id: "z", pageWidth: 1000, left: 0, top: 0, shape: null, floats: null }

  it("turns a slanted band of text so that its lines run along it, from left to right", () => {
    // a band 100 wide and 500 long, rising to the right at 55°
    const band = alongLongerSide({ ...zone, width: 100, height: 500, rotation: 35 })
    expect(band).toMatchObject({ left: -200, top: 200, width: 500, height: 100, rotation: -55 })
    expect(alongLongerSide({ ...zone, width: 100, height: 500, rotation: -30 }).rotation).toBe(60)
  })

  it("leaves a zone that is wider than high, or not slanted, as it is", () => {
    const wide = { ...zone, width: 500, height: 100, rotation: 10 }
    expect(alongLongerSide(wide)).toBe(wide)
    const upright = { ...zone, width: 100, height: 500, rotation: 0 }
    expect(alongLongerSide(upright)).toBe(upright)
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

describe("freeRect", () => {
  const rect = (x1: number, y1: number, x2: number, y2: number): [number, number][] =>
    [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
  const zonesOf = (zones: Record<string, [number, number][]>) => computeLayout({
    surfaces: [{ url: "page.png", width: 2000, height: 2000 }],
    zones: Object.entries(zones).map(([id, points]) => ({ id, surface: 0, points })),
  }, 0).zones

  it("finds the room below a headline printed over the top of a picture", () => {
    const zones = zonesOf({ picture: rect(0, 0, 1000, 800), headline: rect(600, -20, 1100, 150) })
    expect(freeRect(zones.picture, Object.values(zones))).toEqual({ left: 0, top: 150, width: 1000, height: 650 })
  })

  it("keeps clear of a band set diagonally across a picture", () => {
    // the band runs between the lines x + y = 1000 and x + y = 1282
    const zones = zonesOf({
      picture: rect(0, 0, 1200, 1200),
      band: [[0, 1000], [1000, 0], [1141, 141], [141, 1141]],
    })
    const { left, top, width, height } = freeRect(zones.picture, Object.values(zones))!
    const sums = [left + top, left + width + top + height]
    expect(sums[0] >= 1282 || sums[1] <= 1000).toBe(true)
    expect(width * height).toBeGreaterThan(0.1 * 1200 * 1200)
  })

  it("is null where nothing covers the zone, or nearly all of it", () => {
    const apart = zonesOf({ picture: rect(0, 0, 1000, 800), text: rect(0, 900, 1000, 1200) })
    expect(freeRect(apart.picture, Object.values(apart))).toBeNull()
    const covered = zonesOf({ picture: rect(100, 100, 900, 700), text: rect(0, 0, 1000, 800) })
    expect(freeRect(covered.picture, Object.values(covered))).toBeNull()
  })
})
