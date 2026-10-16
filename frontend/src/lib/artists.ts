interface Period {
  label: string
  from: number
  to: number
}

// the phases of the advertising: M. Welte & Söhne and its dealers before the
// war, the American companies after it, the campaigns of the Auto Pneumatic
// Action Co.
export const PERIODS: Period[] = [
  { label: '1905–1914', from: 1905, to: 1914 },
  { label: '1919–1923', from: 1919, to: 1923 },
  { label: '1924–1928', from: 1924, to: 1928 },
]

interface Ad {
  dates: string[]
  // one entry per mention of an artist, so an artist named twice is in it twice
  mentions: string[]
}

interface Share {
  mentions: number
  share: number
}

interface ArtistRow {
  id: string
  periods: Share[]
  total: Share
}

interface PeriodTotal {
  ads: number
  mentions: number
}

// the year an ad was first printed
export const firstYear = (ad: Ad) =>
  Math.min(...ad.dates.map(date => Number(date.slice(0, 4))).filter(Boolean))

export const periodOf = (year: number) =>
  PERIODS.findIndex(period => year >= period.from && year <= period.to)

/**
 * Each artist's share of all mentions of artists in the ads of a period. An
 * ad counts once, in the year of its first printing, however often it was
 * printed.
 */
export function artistShares(ads: Ad[]): { rows: ArtistRow[]; totals: PeriodTotal[]; all: PeriodTotal } {
  const totals: PeriodTotal[] = PERIODS.map(() => ({ ads: 0, mentions: 0 }))
  const counts = new Map<string, number[]>()

  for (const ad of ads) {
    const p = periodOf(firstYear(ad))
    if (p < 0) continue
    totals[p].ads += 1
    totals[p].mentions += ad.mentions.length
    for (const id of ad.mentions) {
      if (!counts.has(id)) counts.set(id, PERIODS.map(() => 0))
      counts.get(id)![p] += 1
    }
  }

  const all = {
    ads: totals.reduce((sum, t) => sum + t.ads, 0),
    mentions: totals.reduce((sum, t) => sum + t.mentions, 0),
  }
  const share = (n: number, of: number) => (of ? n / of : 0)

  const rows = Array.from(counts, ([id, perPeriod]) => {
    const mentions = perPeriod.reduce((sum, n) => sum + n, 0)
    return {
      id,
      periods: perPeriod.map((n, p) => ({ mentions: n, share: share(n, totals[p].mentions) })),
      total: { mentions, share: share(mentions, all.mentions) },
    }
  })

  return { rows, totals, all }
}
