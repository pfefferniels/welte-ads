import { smoothedMentions } from './artists'
import type { ArtistTimeline, YearTotal } from './artists'

// the width of the cloud, in its own units
export const CLOUD_WIDTH = 900
// the band above the names, for the year and the folded story
export const CLOUD_TOP = 64
// the space between two names and around the cloud
const PAD = 4
const MARGIN = 8

/**
 * The font size of a name at a rate of mentions per year: its area grows
 * with the rate, and the floor keeps every name readable.
 */
export const fontSize = (rate: number) => 13 + 14 * Math.sqrt(rate)

/**
 * The name to show: the surname, with the particle that belongs before it
 * ("Albert, Eugen d'" → "d'Albert", "Dohnányi, Ernst von" → "Dohnányi").
 */
export function surnameOf(name: string): string {
  const [surname, given = ''] = name.split(', ')
  return given.endsWith(" d'") ? `d'${surname}` : surname
}

interface CloudItem {
  id: string
  label: string
  // the mean year of the mentions, which decides how far right the name stands
  meanYear: number
  // the largest rate at which the name is shown
  maxRate: number
  // whether a dagger follows the name in some year
  dagger: boolean
}

/**
 * The box of a name at its largest: Crimson Pro averages 0.45 em per
 * character, and the rest covers capitals and the dagger.
 */
const boxOf = (item: CloudItem) => {
  const size = fontSize(item.maxRate)
  return { w: size * (0.47 * item.label.length + 0.4 + (item.dagger ? 0.7 : 0)), h: size * 1.15 }
}

/**
 * One place for every name, the same in every year: the largest names are
 * placed first, each as near as there is room to the point that its mean
 * year gives it (early names left, late names right), on a spiral around
 * that point, so that no two names meet at their largest. The same names
 * always give the same cloud.
 */
export function layoutCloud(items: CloudItem[]): { places: Map<string, { x: number; y: number }>; height: number } {
  const lo = Math.min(...items.map(item => item.meanYear))
  const hi = Math.max(...items.map(item => item.meanYear))
  const placed: { x: number; y: number; w: number; h: number }[] = []
  const places = new Map<string, { x: number; y: number }>()

  const order = [...items].sort((a, b) => b.maxRate - a.maxRate || a.label.localeCompare(b.label))
  for (const item of order) {
    const { w, h } = boxOf(item)
    const x0 = 120 + (hi > lo ? (item.meanYear - lo) / (hi - lo) : 0.5) * (CLOUD_WIDTH - 240)
    const y0 = CLOUD_TOP + 150
    const free = (x: number, y: number) => y - h / 2 >= CLOUD_TOP && placed.every(other =>
      Math.abs(x - other.x) >= (w + other.w) / 2 + PAD || Math.abs(y - other.y) >= (h + other.h) / 2 + PAD)
    for (let t = 0; ; t += 0.05) {
      const x = Math.min(Math.max(x0 + 2.4 * t * Math.cos(t), w / 2 + MARGIN), CLOUD_WIDTH - w / 2 - MARGIN)
      const y = y0 + t * Math.sin(t)
      if (free(x, y)) {
        placed.push({ x, y, w, h })
        places.set(item.id, { x: Math.round(x), y: Math.round(y) })
        break
      }
    }
  }
  return { places, height: Math.ceil(Math.max(...placed.map(box => box.y + box.h / 2))) + MARGIN }
}

/** A name in the cloud, with what it shows at any time. */
export interface CloudName extends ArtistTimeline {
  label: string
  // the name as the register gives it, e.g. "Paderewski, Ignacy Jan"
  name: string
  x: number
  y: number
  // the rate at which the name is shown for all years at once: the share
  // of its mentions, scaled so that the most named artist is shown as large
  // as any name at any time
  all: number
  died: number | null
  ads: number
}

/**
 * The mentions per year around a time, in years (1908.5 is mid-1908): the
 * mentions of an ad count in the middle of the year of its first printing.
 */
export const rateAt = (artist: ArtistTimeline, h: number, time: number) => smoothedMentions(artist, h, time - 0.5)

/**
 * How near a time is to a year in which an ad named the artist: 1 in the
 * middle of such a year, fading to 0 within half a year or so.
 */
export const namedAround = (artist: ArtistTimeline, time: number) =>
  Math.max(0, ...artist.years.map(y => Math.exp(-0.5 * ((time - y.year - 0.5) / 0.3) ** 2)))

/** The highest rate of an artist at any time of a timeline, looked at four times a year. */
export const peakRate = (artist: ArtistTimeline, h: number, first: number, last: number) =>
  Math.max(...Array.from({ length: 4 * (last - first + 1) + 1 }, (_, i) => rateAt(artist, h, first + i / 4)))

/** The names of the artists in the cloud, placed, with what they need to show any time of the timeline. */
export function artistCloud(
  artists: (ArtistTimeline & { name: string })[],
  years: YearTotal[],
  h: number,
  deaths: Record<string, number>,
): { names: CloudName[]; height: number } {
  const first = years[0].year
  const last = years[years.length - 1].year
  const peaks = artists.map(artist => peakRate(artist, h, first, last))
  const top = Math.max(...peaks)
  const most = Math.max(...artists.map(artist => artist.mentions))

  const names = artists.map(artist => ({
    id: artist.id,
    mentions: artist.mentions,
    years: artist.years,
    label: surnameOf(artist.name),
    name: artist.name,
    all: Math.round(100 * top * artist.mentions / most) / 100,
    died: deaths[artist.id] ?? null,
    ads: artist.years.reduce((sum, y) => sum + y.ads, 0),
  }))
  const meanYear = (artist: ArtistTimeline) =>
    artist.years.reduce((sum, y) => sum + y.year * y.mentions, 0) / artist.mentions
  const { places, height } = layoutCloud(names.map((name, i) => ({
    id: name.id,
    label: name.label,
    meanYear: meanYear(artists[i]),
    maxRate: Math.max(name.all, peaks[i]),
    dagger: name.died !== null && name.died < last,
  })))
  return { names: names.map(name => ({ ...name, ...places.get(name.id)! })), height }
}
