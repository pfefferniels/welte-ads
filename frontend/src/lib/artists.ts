interface Ad {
  dates: string[]
  // one entry per mention of an artist, so an artist named twice is in it twice
  mentions: string[]
}

// the year an ad was first printed
const firstYear = (ad: Ad) =>
  Math.min(...ad.dates.map(date => Number(date.slice(0, 4))).filter(Boolean))

export interface YearTotal {
  year: number
  ads: number
  mentions: number
}

interface ArtistYear {
  year: number
  mentions: number
  // the ads of the year that name the artist
  ads: number
}

export interface ArtistTimeline {
  id: string
  mentions: number
  years: ArtistYear[]
}

/**
 * The ads and mentions of each year, and the mentions of each artist per
 * year. An ad counts once, in the year of its first printing; an artist it
 * names twice counts twice.
 */
export function artistTimelines(ads: Ad[]): { years: YearTotal[]; artists: ArtistTimeline[] } {
  const years = new Map<number, YearTotal>()
  const artists = new Map<string, Map<number, ArtistYear>>()

  for (const ad of ads) {
    const year = firstYear(ad)
    if (!Number.isFinite(year)) continue
    const total = years.get(year) ?? { year, ads: 0, mentions: 0 }
    total.ads += 1
    total.mentions += ad.mentions.length
    years.set(year, total)

    ad.mentions.forEach((id, i) => {
      if (!artists.has(id)) artists.set(id, new Map())
      const perYear = artists.get(id)!
      const entry = perYear.get(year) ?? { year, mentions: 0, ads: 0 }
      entry.mentions += 1
      if (ad.mentions.indexOf(id) === i) entry.ads += 1
      perYear.set(year, entry)
    })
  }

  return {
    years: Array.from(years.values()).sort((a, b) => a.year - b.year),
    artists: Array.from(artists, ([id, perYear]) => {
      const list = Array.from(perYear.values()).sort((a, b) => a.year - b.year)
      return { id, mentions: list.reduce((sum, y) => sum + y.mentions, 0), years: list }
    }),
  }
}

// the weight of a year at a distance d, for a Gaussian kernel of width h
const kernel = (d: number, h: number) => Math.exp(-0.5 * (d / h) ** 2)

/**
 * An artist's share of all mentions of artists around a year: the mentions
 * of every year count, the less the further they are from it.
 */
export function smoothedShare(artist: ArtistTimeline, years: YearTotal[], h: number, at: number): number {
  const mine = artist.years.reduce((sum, y) => sum + kernel(at - y.year, h) * y.mentions, 0)
  const all = years.reduce((sum, y) => sum + kernel(at - y.year, h) * y.mentions, 0)
  return all ? mine / all : 0
}

// the widths tried, in years
const WIDTHS = Array.from({ length: 19 }, (_, i) => 0.5 + i * 0.25)

/**
 * The width of the kernel with which the other ads best predict the artists
 * that an ad mentions (leave-one-out cross-validation of the log-likelihood).
 * A Jeffreys prior, half a mention for every artist, keeps an artist whom
 * the other ads never name around a year from being impossible.
 */
export function bandwidth(ads: Ad[]): number {
  const data = ads
    .map(ad => ({ year: firstYear(ad), mentions: ad.mentions }))
    .filter(ad => ad.mentions.length && Number.isFinite(ad.year))
  const artists = new Set(data.flatMap(ad => ad.mentions)).size

  const fit = (h: number) => data.reduce((ll, ad, j) => {
    const counts = new Map<string, number>()
    let total = 0
    data.forEach((other, i) => {
      if (i === j) return
      const w = kernel(ad.year - other.year, h)
      for (const id of other.mentions) counts.set(id, (counts.get(id) ?? 0) + w)
      total += w * other.mentions.length
    })
    return ll + ad.mentions.reduce((sum, id) =>
      sum + Math.log(((counts.get(id) ?? 0) + 0.5) / (total + 0.5 * artists)), 0)
  }, 0)

  const fits = WIDTHS.map(fit)
  return WIDTHS[fits.indexOf(Math.max(...fits))]
}

/** The spans of years with ads, broken where three or more years passed
 * without an ad. */
export function runsOf(years: YearTotal[]): [number, number][] {
  const runs: [number, number][] = []
  for (const { year } of years) {
    const run = runs[runs.length - 1]
    if (run && year - run[1] <= 3) run[1] = year
    else runs.push([year, year])
  }
  return runs
}
