import { describe, expect, it } from "vitest"
import { chapterProblems, getChapters, inlineHtml } from "./narratives"
import type { ChapterSource } from "./narratives"
import { getArtistRegister, getPlaceRegister } from "./registers"
import { artistTimelines } from "./artists"
import { getAllMetadata, getTopics } from "./tei"

const chapter = (id: string, from: number, to: number): ChapterSource =>
  ({ id, from, to, caption: "A short caption.", focus: [], ads: [], sources: [] })

describe("chapterProblems", () => {
  it("accepts chapters that follow each other within the timeline", () => {
    expect(chapterProblems([chapter("a", 1905, 1908), chapter("b", 1910, 1912)], 1905, 1912)).toEqual([])
  })

  it("finds chapters without a caption or with one too long to read in passing", () => {
    const long = { ...chapter("a", 1905, 1908), caption: "word ".repeat(21).trim() }
    expect(chapterProblems([long, { ...chapter("b", 1909, 1910), caption: "" }], 1905, 1912))
      .toEqual(["a has a caption of more than 20 words", "b has no caption"])
  })

  it("counts the words of a caption, not the markup of its links", () => {
    const linked = { ...chapter("a", 1905, 1908), caption: inlineHtml(`${"word ".repeat(19)}[word](/topic/immortality/)`) }
    expect(chapterProblems([linked], 1905, 1912)).toEqual([])
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

    it(`name only ads, places, artists and topics of the collection (${view})`, () => {
      expect(chapters.flatMap(chapter => chapter.ads.filter(slug => !slugs.has(slug)))).toEqual([])
      expect(chapters.flatMap(chapter => chapter.focus.filter(key => !keys.has(key)))).toEqual([])
      const topics = getTopics()
      const linked = chapters.flatMap(chapter => Array.from(chapter.caption.matchAll(/href="\/topic\/([^/"]+)\/?"/g), match => match[1]))
      expect(linked.filter(topic => !topics[`#${topic}`])).toEqual([])
    })
  }

  it("render the Markdown of the caption, and give the sources", () => {
    expect(inlineHtml("The ads promise [immortality](/topic/immortality/)."))
      .toBe('The ads promise <a href="/topic/immortality/">immortality</a>.')
    const war = getChapters("places").find(chapter => chapter.id === "the-war")!
    expect(war.caption).toMatch(/^No printing for three years/)
    expect(war.sources[0].url).toMatch(/^https:/)
  })
})
