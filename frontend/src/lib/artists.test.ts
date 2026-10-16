import { describe, expect, it } from "vitest"
import { artistBands, groupYears, naturalBreaks } from "./artists"
import { getAllMetadata } from "./tei"

const points = (...values: number[]) => values.map(value => ({ value, weight: 1 }))

describe("naturalBreaks", () => {
  it("finds the groups with the least deviation within them", () => {
    const { groups, within } = naturalBreaks(points(1, 2, 3, 10, 11, 20), 3)
    expect(groups).toEqual([[0, 2], [3, 4], [5, 5]])
    expect(within).toBeCloseTo(2 + 0.5)
  })

  it("weighs the points", () => {
    const { groups } = naturalBreaks([{ value: 1, weight: 1 }, { value: 5, weight: 9 }, { value: 6, weight: 9 }], 2)
    expect(groups).toEqual([[0, 0], [1, 2]])
  })
})

describe("groupYears", () => {
  const ads = [
    { dates: ["1905"], mentions: ["a", "b"] },
    { dates: ["1906"], mentions: ["a"] },
    { dates: ["1913"], mentions: [] },
    { dates: ["1920"], mentions: ["b", "c"] },
    { dates: ["1921-03", "1919-05"], mentions: ["a"] },
  ]

  it("groups the years of the mentions and finds the gaps without ads", () => {
    const groups = groupYears(ads)
    expect(groups.map(g => [g.from, g.to, g.ads, g.mentions, g.gapBefore])).toEqual([
      [1905, 1906, 2, 3, false],
      [1919, 1920, 2, 3, true],
    ])
    expect(groups[0].center).toBeCloseTo((2 * 1905 + 1906) / 3)
  })

  it("gives each artist's share of the mentions of a group", () => {
    const groups = groupYears(ads)
    const a = artistBands(ads, groups).find(band => band.id === "a")!
    expect(a.mentions).toBe(3)
    expect(a.groups.map(g => g.mentions)).toEqual([2, 1])
    expect(a.groups[0].share).toBeCloseTo(2 / 3)
  })

  it("puts every mention of the collection into a group", () => {
    const all = getAllMetadata()
    const groups = groupYears(all)
    const counted = artistBands(all, groups).reduce((sum, band) => sum + band.mentions, 0)
    expect(counted).toBe(all.reduce((sum, ad) => sum + ad.mentions.length, 0))
    expect(groups.reduce((sum, g) => sum + g.mentions, 0)).toBe(counted)
  })
})
