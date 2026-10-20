// "1913-11-15" → "15 November 1913", "1913-11" → "November 1913"
export const formatDate = (iso: string) => {
  const [year, month, day] = iso.split('-')
  if (!month) return year
  const name = new Date(Date.UTC(Number(year), Number(month) - 1))
    .toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })
  return [day && String(Number(day)), name, year].filter(Boolean).join(' ')
}

const DAY = 24 * 60 * 60 * 1000
// a full date as a number of milliseconds; a month or year alone gives NaN
const dayOf = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso) ? Date.parse(iso) : NaN

// "1908-02-02", "1908-02-22" → "2–22 February 1908"
const formatRun = (from: string, to: string) => {
  if (from === to) return formatDate(from)
  const [day, month] = formatDate(from).split(' ')
  if (from.slice(0, 7) === to.slice(0, 7)) return `${day}–${formatDate(to)}`
  if (from.slice(0, 4) === to.slice(0, 4)) return `${day} ${month} – ${formatDate(to)}`
  return `${formatDate(from)} – ${formatDate(to)}`
}

/**
 * Dates as a list in which days in a row make one range, e.g.
 * "28 January – 1 February 1908, 3–22 February 1908".
 */
export const formatDates = (dates: string[]) => {
  const runs: [string, string][] = []
  for (const date of Array.from(new Set(dates)).sort()) {
    const last = runs[runs.length - 1]
    if (last && dayOf(date) - dayOf(last[1]) === DAY) last[1] = date
    else runs.push([date, date])
  }
  return runs.map(([from, to]) => formatRun(from, to)).join(', ')
}
