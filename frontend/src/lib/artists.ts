interface Ad {
  dates: string[]
  // one entry per mention of an artist, so an artist named twice is in it twice
  mentions: string[]
}

// the year an ad was first printed
const firstYear = (ad: Ad) =>
  Math.min(...ad.dates.map(date => Number(date.slice(0, 4))).filter(Boolean))

interface Point {
  value: number
  weight: number
}

// the sum of squared deviations from the mean of points[i..j]
const deviation = (points: Point[], i: number, j: number) => {
  let w = 0, s = 0, q = 0
  for (let k = i; k <= j; k++) {
    w += points[k].weight
    s += points[k].weight * points[k].value
    q += points[k].weight * points[k].value ** 2
  }
  return w ? q - s * s / w : 0
}

/**
 * Fisher's optimal grouping ("Jenks natural breaks"): the division of the
 * sorted, weighted points into k consecutive groups with the least sum of
 * squared deviations within the groups. Returns the first and last index of
 * each group and that sum.
 */
export function naturalBreaks(points: Point[], k: number): { groups: [number, number][]; within: number } {
  const n = points.length
  const cost = Array.from({ length: k + 1 }, () => new Array<number>(n).fill(Infinity))
  const start = Array.from({ length: k + 1 }, () => new Array<number>(n).fill(0))
  for (let j = 0; j < n; j++) cost[1][j] = deviation(points, 0, j)
  for (let g = 2; g <= k; g++) {
    for (let j = g - 1; j < n; j++) {
      for (let i = g - 1; i <= j; i++) {
        const c = cost[g - 1][i - 1] + deviation(points, i, j)
        if (c < cost[g][j]) {
          cost[g][j] = c
          start[g][j] = i
        }
      }
    }
  }

  const groups: [number, number][] = []
  for (let g = k, j = n - 1; g >= 1; g--) {
    const i = start[g][j]
    groups.unshift([i, j])
    j = i - 1
  }
  return { groups, within: cost[k][n - 1] }
}

// a further group has to explain at least this share of the variance
const MIN_GAIN = 0.01

export interface YearGroup {
  // the first and last year with a mention
  from: number
  to: number
  // the mean year of its mentions
  center: number
  ads: number
  mentions: number
  // between the group before and this one lie three or more years in which
  // no ad appeared
  gapBefore: boolean
}

/**
 * The years grouped by Fisher's optimal grouping of the years of all
 * mentions. The number of groups is the smallest beyond which a further
 * group would explain less than one per cent more of the variance of the
 * years (the "goodness of variance fit").
 */
export function groupYears(ads: Ad[]): YearGroup[] {
  const weights = new Map<number, number>()
  for (const ad of ads) {
    if (!ad.mentions.length) continue
    const year = firstYear(ad)
    weights.set(year, (weights.get(year) ?? 0) + ad.mentions.length)
  }
  const points = Array.from(weights, ([value, weight]) => ({ value, weight }))
    .sort((a, b) => a.value - b.value)

  const total = deviation(points, 0, points.length - 1)
  const fit = (within: number) => (total ? 1 - within / total : 1)
  let best = naturalBreaks(points, 1)
  for (let k = 2; k <= points.length; k++) {
    const next = naturalBreaks(points, k)
    if (fit(next.within) - fit(best.within) < MIN_GAIN) break
    best = next
  }

  const adYears = new Set(ads.map(firstYear))
  // the longest run of years between a and b in which no ad appeared
  const silence = (a: number, b: number) => {
    let run = 0, longest = 0
    for (let year = a + 1; year < b; year++) {
      run = adYears.has(year) ? 0 : run + 1
      longest = Math.max(longest, run)
    }
    return longest
  }

  return best.groups.map(([i, j], g) => {
    const from = points[i].value
    const to = points[j].value
    const part = points.slice(i, j + 1)
    const mentions = part.reduce((sum, p) => sum + p.weight, 0)
    const previous = g > 0 ? points[best.groups[g - 1][1]].value : from
    return {
      from,
      to,
      center: part.reduce((sum, p) => sum + p.value * p.weight, 0) / mentions,
      ads: ads.filter(ad => firstYear(ad) >= from && firstYear(ad) <= to).length,
      mentions,
      gapBefore: silence(previous, from) >= 3,
    }
  })
}

interface ArtistInGroup {
  mentions: number
  ads: number
  // of all mentions of artists in the group
  share: number
}

export interface ArtistBand {
  id: string
  mentions: number
  groups: ArtistInGroup[]
}

/**
 * Each artist's mentions in each group of years. An ad counts once, in the
 * year of its first printing; an artist it names twice counts twice.
 */
export function artistBands(ads: Ad[], groups: YearGroup[]): ArtistBand[] {
  const bands = new Map<string, ArtistBand>()
  for (const ad of ads) {
    const year = firstYear(ad)
    const g = groups.findIndex(group => year >= group.from && year <= group.to)
    if (g < 0) continue
    ad.mentions.forEach((id, i) => {
      if (!bands.has(id)) {
        bands.set(id, { id, mentions: 0, groups: groups.map(() => ({ mentions: 0, ads: 0, share: 0 })) })
      }
      const band = bands.get(id)!
      band.mentions += 1
      band.groups[g].mentions += 1
      if (ad.mentions.indexOf(id) === i) band.groups[g].ads += 1
    })
  }
  const list = Array.from(bands.values())
  for (const band of list) {
    band.groups.forEach((group, g) => { group.share = group.mentions / groups[g].mentions })
  }
  return list
}
