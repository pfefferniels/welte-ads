import { describe, expect, it } from "vitest"
import { artistTimelines, bandwidth, headOf, runsOf, smoothedMentions, smoothedShare } from "./artists"
import { getAllMetadata } from "./tei"

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

describe("smoothedShare", () => {
  const { years, artists } = artistTimelines([
    { dates: ["1910"], mentions: ["a", "b"] },
    { dates: ["1912"], mentions: ["b", "b"] },
  ])
  const a = artists.find(artist => artist.id === "a")!

  it("is the share of the year where the other years are far", () => {
    expect(smoothedShare(a, years, 0.1, 1910)).toBeCloseTo(0.5)
    expect(smoothedShare(a, years, 0.1, 1912)).toBeCloseTo(0)
  })

  it("draws on the years around", () => {
    const between = smoothedShare(a, years, 1, 1911)
    expect(between).toBeCloseTo(1 / 4)
    expect(smoothedShare(a, years, 1, 1910)).toBeGreaterThan(between)
  })
})

describe("smoothedMentions", () => {
  const { artists } = artistTimelines([
    { dates: ["1910"], mentions: ["a", "a", "a"] },
    { dates: ["1913"], mentions: ["a"] },
  ])
  const a = artists[0]

  it("spreads the mentions over the years around, keeping their number", () => {
    let sum = 0
    for (let t = 1890; t <= 1935; t += 0.01) sum += 0.01 * smoothedMentions(a, 2, t)
    expect(sum).toBeCloseTo(4, 3)
    expect(smoothedMentions(a, 2, 1910)).toBeGreaterThan(smoothedMentions(a, 2, 1913))
  })
})

describe("bandwidth", () => {
  const years = [1900, 1901, 1902, 1910, 1911, 1912]

  it("is narrower where the artists change than where they stay", () => {
    // first a, then b
    const changing = years.map((year, i) => ({ dates: [String(year)], mentions: i < 3 ? ["a", "a"] : ["b", "b"] }))
    // always a twice and b once
    const staying = years.map(year => ({ dates: [String(year)], mentions: ["a", "a", "b"] }))
    expect(bandwidth(changing)).toBeLessThan(bandwidth(staying))
  })

  it("is a few years for the collection", () => {
    const h = bandwidth(getAllMetadata())
    expect(h).toBeGreaterThanOrEqual(1)
    expect(h).toBeLessThanOrEqual(4)
  })
})

describe("runsOf", () => {
  it("breaks where three or more years have no ads", () => {
    const years = [1905, 1907, 1913, 1919, 1923].map(year => ({ year, ads: 1, mentions: 1 }))
    expect(runsOf(years)).toEqual([[1905, 1907], [1913, 1913], [1919, 1919], [1923, 1923]])
    expect(runsOf(years.slice(3))).toEqual([[1919, 1919], [1923, 1923]])
    expect(runsOf([1919, 1922].map(year => ({ year, ads: 1, mentions: 1 })))).toEqual([[1919, 1922]])
  })
})

describe("headOf", () => {
  it("keeps the values above the mean of a heavy-tailed distribution", () => {
    const head = headOf([1, 1, 1, 1, 1, 2, 2, 3, 8, 20])!
    expect(head.mean).toBe(4)
    expect([1, 3, 4, 5, 20].filter(head.isHead)).toEqual([5, 20])
  })

  it("refuses a distribution without a small head", () => {
    expect(headOf([1, 2, 3, 4])).toBeNull()
  })

  it("finds a head among the artists of the collection", () => {
    const counts = artistTimelines(getAllMetadata()).artists.map(a => a.mentions)
    const head = headOf(counts)!
    expect(head).not.toBeNull()
    expect(head.isHead(Math.max(...counts))).toBe(true)
    expect(head.isHead(1)).toBe(false)
  })
})
