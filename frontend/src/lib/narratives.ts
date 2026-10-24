import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import gfm from 'remark-gfm'
import html from 'remark-html'
import type { PlaceEntry } from './registers'

/** A chapter of the story that a timeline tells, as its file gives it. */
export interface ChapterSource {
  // the anchor of the chapter: its file name without the year ("the-war")
  id: string
  // the first and the last year of the chapter
  from: number
  to: number
  title: string
  // the text, as HTML
  html: string
  // what the chapter is about: places by their GeoNames URI, artists by
  // their GND URI
  focus: string[]
  // the ads that show it, by their slugs
  ads: string[]
  // where its explanations come from
  sources: { title: string; url: string }[]
}

type View = 'places' | 'artists'

/**
 * The chapters of the story of a view, in the order of their years: one
 * Markdown file each in src/narratives/<view>/, its years, title, focus,
 * ads and sources in the front matter.
 */
export function getChapters(view: View): ChapterSource[] {
  const dir = path.join(process.cwd(), 'src', 'narratives', view)
  return fs.readdirSync(dir).filter(file => file.endsWith('.md')).map(file => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, file), 'utf8'))
    return {
      id: file.replace(/^\d+-/, '').replace(/\.md$/, ''),
      from: Number(data.from),
      to: Number(data.to),
      title: String(data.title ?? ''),
      html: remark().use(gfm).use(html).processSync(content).toString(),
      focus: data.focus ?? [],
      ads: data.ads ?? [],
      sources: data.sources ?? [],
    }
  }).sort((a, b) => a.from - b.from)
}

/**
 * What is wrong with the chapters of a timeline from the first year to the
 * last: chapters without a title or text, outside the timeline, ending
 * before they begin, or overlapping the one before.
 */
export function chapterProblems(chapters: ChapterSource[], first: number, last: number): string[] {
  return chapters.flatMap((chapter, i) => [
    !chapter.title && `${chapter.id} has no title`,
    !chapter.html.trim() && `${chapter.id} has no text`,
    (chapter.from < first || chapter.to > last) && `${chapter.id} lies outside ${first}–${last}`,
    chapter.to < chapter.from && `${chapter.id} ends before it begins`,
    i > 0 && chapter.from <= chapters[i - 1].to && `${chapter.id} overlaps ${chapters[i - 1].id}`,
  ].filter((problem): problem is string => Boolean(problem)))
}

// the year of a printing or an ad: that of its first date
const yearOf = (dates: string[]) => Number([...dates].sort()[0]?.slice(0, 4))

/** The ads of a chapter, each by the periodical and the year of its first printing. */
export function adsOf(slugs: string[], ads: { slug: string; dates: string[]; periodicals: { title: string }[] }[]) {
  return slugs.flatMap(slug => ads.filter(ad => ad.slug === slug)).map(ad => ({
    slug: ad.slug,
    periodical: ad.periodicals[0]?.title ?? '',
    year: yearOf(ad.dates),
  }))
}

/** The printings in the years of a chapter, and how many ads and places they are of. */
export function placeFigures(places: PlaceEntry[], from: number, to: number) {
  const inYears = places.map(place => place.periodicals
    .flatMap(periodical => periodical.printings)
    .filter(printing => from <= yearOf(printing.dates) && yearOf(printing.dates) <= to))
  const printings = inYears.flat()
  return {
    printings: printings.length,
    ads: new Set(printings.map(printing => printing.ad.slug)).size,
    places: inYears.filter(list => list.length).length,
  }
}
