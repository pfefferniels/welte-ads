import { describe, expect, it } from "vitest"
import { chapterProblems, getChapters, placeFigures } from "./narratives"
import type { ChapterSource } from "./narratives"
import { getArtistRegister, getPlaceRegister } from "./registers"
import { artistTimelines } from "./artists"
import { getAllMetadata } from "./tei"

const chapter = (id: string, from: number, to: number): ChapterSource =>
  ({ id, from, to, title: id, html: "<p>Text</p>", focus: [], ads: [], sources: [] })

describe("chapterProblems", () => {
  it("accepts chapters that follow each other within the timeline", () => {
    expect(chapterProblems([chapter("a", 1905, 1908), chapter("b", 1910, 1912)], 1905, 1912)).toEqual([])
  })

  it("finds chapters that overlap, lie outside the timeline or end before they begin", () => {
    expect(chapterProblems([chapter("a", 1905, 1910), chapter("b", 1910, 1914), chapter("c", 1916, 1915)], 1905, 1912))
      .toEqual(["b lies outside 1905–1912", "b overlaps a", "c lies outside 1905–1912", "c ends before it begins"])
  })
})

describe("the chapters of the collection", () => {
  const slugs = new Set(getAllMetadata().map(ad => ad.slug))
  const places = getPlaceRegister()
  const placeYears = places.flatMap(place => place.years.map(({ year }) => year))
  const { years } = artistTimelines(getAllMetadata())

  const views = [
    { view: "places" as const, first: Math.min(...placeYears), last: Math.max(...placeYears), keys: new Set(places.map(place => place.ref)) },
    { view: "artists" as const, first: years[0].year, last: years[years.length - 1].year, keys: new Set(getArtistRegister().map(artist => artist.uri)) },
  ]

  for (const { view, first, last, keys } of views) {
    const chapters = getChapters(view)

    it(`tell the story of the ${view} in order, each year in one chapter at most`, () => {
      expect(chapters.length).toBeGreaterThan(0)
      expect(chapterProblems(chapters, first, last)).toEqual([])
    })

    it(`name only ads, places and artists of the collection (${view})`, () => {
      expect(chapters.flatMap(chapter => chapter.ads.filter(slug => !slugs.has(slug)))).toEqual([])
      expect(chapters.flatMap(chapter => chapter.focus.filter(key => !keys.has(key)))).toEqual([])
    })
  }

  it("render the Markdown of the text", () => {
    const war = getChapters("places").find(chapter => chapter.id === "the-war")!
    expect(war.html).toMatch(/^<p>For three years/)
    expect(war.sources[0].url).toMatch(/^https:/)
  })
})

describe("placeFigures", () => {
  it("counts the printings of the years, and their ads and places", () => {
    const places = getPlaceRegister()
    expect(placeFigures(places, 1915, 1918)).toEqual({ printings: 15, ads: 7, places: 7 })
    const all = placeFigures(places, 1900, 1940)
    expect(all.printings).toBe(places.reduce((sum, place) => sum + place.printings, 0))
    expect(all.places).toBe(places.length)
  })
})
