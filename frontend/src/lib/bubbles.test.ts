import { describe, expect, it } from "vitest"
import { fitLabel, layoutBubbles } from "./bubbles"

describe("fitLabel", () => {
  it("sets a short label on one line at a quarter of the radius", () => {
    expect(fitLabel("Home", 80)).toEqual({ lines: ["Home"], fontSize: 20 })
  })

  it("breaks a long label in a small circle where the lines are most even", () => {
    const { lines, fontSize } = fitLabel("Distinction from Mechanical", 40)
    expect(lines).toEqual(["Distinction", "from Mechanical"])
    expect(fontSize).toBeLessThan(10)
  })

  it("keeps a label on one line if two would barely make it larger", () => {
    expect(fitLabel("Exact Reproduction", 150).lines).toEqual(["Exact Reproduction"])
  })
})

describe("layoutBubbles", () => {
  // the weights of the topics as they are marked in the collection
  const weights = [118, 65, 62, 54, 49, 46, 32, 29, 27, 26, 24, 21, 17, 13, 12, 11, 10, 10, 9, 9, 8, 7, 7, 7, 6, 6, 4, 3, 2, 1, 1, 1]
  const terms = weights.map((weight, i) => ({ topic: `#topic${i}`, label: `Topic ${i}`, weight }))
  const { bubbles, viewBox: [left, top, width, height] } = layoutBubbles(terms)

  it("gives each circle an area in proportion to its weight", () => {
    const [heaviest, ...rest] = bubbles
    expect(heaviest.r).toBe(150)
    for (const bubble of rest) {
      expect(bubble.r ** 2 / heaviest.r ** 2).toBeCloseTo(bubble.weight / heaviest.weight)
    }
  })

  it("lets no circles overlap", () => {
    for (const a of bubbles) {
      for (const b of bubbles) {
        if (a === b) continue
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r)
      }
    }
  })

  it("encloses all circles in the view box", () => {
    for (const { x, y, r } of bubbles) {
      expect(x - r).toBeGreaterThanOrEqual(left)
      expect(y - r).toBeGreaterThanOrEqual(top)
      expect(x + r).toBeLessThanOrEqual(left + width)
      expect(y + r).toBeLessThanOrEqual(top + height)
    }
  })

  it("lays out the same terms the same way", () => {
    expect(layoutBubbles(terms)).toEqual(layoutBubbles([...terms].reverse()))
  })

  it("lays out nothing without terms", () => {
    expect(layoutBubbles([]).bubbles).toEqual([])
  })
})
