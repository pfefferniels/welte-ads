import { describe, expect, it } from "vitest"
import { artistShares, artistTimelines, firstYear, periodOf } from "./artists"
import { getAllMetadata } from "./tei"

describe("artistShares", () => {
  const ads = [
    // printed twice, but counts once, in 1913
    { dates: ["1913-11-15", "1913-12-13"], mentions: ["a", "a", "b"] },
    { dates: ["1920"], mentions: ["b"] },
    { dates: ["1926-04"], mentions: [] },
  ]

  it("counts each mention once per ad, in the period of its first printing", () => {
    const { rows, totals } = artistShares(ads)
    expect(totals).toEqual([{ ads: 1, mentions: 3 }, { ads: 1, mentions: 1 }, { ads: 1, mentions: 0 }])
    const a = rows.find(row => row.id === "a")!
    expect(a.periods.map(p => p.mentions)).toEqual([2, 0, 0])
    expect(a.periods[0].share).toBeCloseTo(2 / 3)
    expect(a.total.share).toBeCloseTo(2 / 4)
  })

  it("puts every ad of the collection into a period", () => {
    const outside = getAllMetadata().filter(ad => periodOf(firstYear(ad)) < 0).map(ad => ad.slug)
    expect(outside).toEqual([])
  })
})

describe("artistTimelines", () => {
  it("counts the mentions and the ads of each artist per year of first printing", () => {
    const { years, artists } = artistTimelines([
      { dates: ["1913-12-13", "1913-11-15"], mentions: ["a", "a", "b"] },
      { dates: ["1913"], mentions: ["a"] },
      { dates: ["1920"], mentions: ["b"] },
    ])
    expect(years).toEqual([{ year: 1913, ads: 2, mentions: 4 }, { year: 1920, ads: 1, mentions: 1 }])
    expect(artists.find(a => a.id === "a")).toEqual({ id: "a", mentions: 3, years: [{ year: 1913, mentions: 3, ads: 2 }] })
    expect(artists.find(a => a.id === "b")!.years.map(y => y.year)).toEqual([1913, 1920])
  })
})
