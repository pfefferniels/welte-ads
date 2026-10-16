"use client"

import React, { useState } from "react"
import { Box } from "@mui/material"
import theme from "../../theme"

interface Year {
  year: number
  ads: number
  mentions: number
}

interface ArtistYear {
  year: number
  mentions: number
  ads: number
}

export interface Artist {
  id: string
  name: string
  mentions: number
  years: ArtistYear[]
}

// what the area of a circle stands for: the mentions of an artist in a year,
// or their share of all mentions of artists in that year
export type Size = 'mentions' | 'share'

interface Props {
  years: Year[]
  artists: Artist[]
  // all artists, also those not shown, so that a circle keeps its size when
  // the selection changes
  scaleArtists: Artist[]
  size: Size
}

const WIDTH = 900
const LABELS = 200 // the names
const TOTALS = 48 // the column of totals
const TOP = 24
const ROW = 26
const MAX_R = 17
const BOTTOM = 70 // the axis and the counts per year

const GRID = '#ece6e0'
const MUTED = '#8a7f78'

const percent = (share: number) =>
  `${(100 * share).toLocaleString('en-GB', { maximumFractionDigits: share < 0.1 ? 1 : 0 })}%`

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

// earlier artists first: the mean year of their mentions
const meanYear = (artist: Artist) =>
  artist.years.reduce((sum, y) => sum + y.year * y.mentions, 0) / artist.mentions

export default function ArtistsChart({ years, artists, scaleArtists, size }: Props) {
  const [active, setActive] = useState<{ artist: Artist; year: ArtistYear } | null>(null)

  const totalOf = new Map(years.map(y => [y.year, y]))
  const value = (y: ArtistYear) =>
    size === 'mentions' ? y.mentions : y.mentions / (totalOf.get(y.year)?.mentions || 1)
  const max = Math.max(...scaleArtists.flatMap(a => a.years.map(value)))
  // the area, not the radius, is proportional to the value; the smallest
  // circles are kept visible
  const radius = (v: number) => Math.max(2.5, MAX_R * Math.sqrt(v / max))

  const rows = [...artists].sort((a, b) => meanYear(a) - meanYear(b) || b.mentions - a.mentions)

  const first = years[0].year
  const last = years[years.length - 1].year
  const allYears = Array.from({ length: last - first + 1 }, (_, i) => first + i)
  const left = LABELS + MAX_R
  const right = WIDTH - TOTALS - MAX_R
  const x = (year: number) => left + (year - first) / Math.max(1, last - first) * (right - left)
  const y = (row: number) => TOP + row * ROW + ROW / 2
  const axis = TOP + rows.length * ROW + 6
  const height = axis + BOTTOM

  const describe = (artist: Artist, year: ArtistYear) => {
    const total = totalOf.get(year.year)!
    return `${artist.name}, ${year.year}: ${plural(year.mentions, 'mention')} in ${plural(year.ads, 'ad')}, ` +
      `${percent(year.mentions / total.mentions)} of the ${total.mentions} mentions of the year`
  }

  return (
    <Box sx={{ overflowX: 'auto', my: 2 }}>
      <Box sx={{ position: 'relative', minWidth: 720 }}>
        <svg viewBox={`0 0 ${WIDTH} ${height}`} width="100%" role="group"
          aria-label="Mentions of artists per year" style={{ display: 'block', fontFamily: 'inherit' }}>
          {/* the years */}
          {allYears.filter(year => year % 5 === 0).map(year => (
            <line key={year} x1={x(year)} x2={x(year)} y1={TOP} y2={axis} stroke={GRID} />
          ))}
          <line x1={left - MAX_R} x2={right + MAX_R} y1={axis} y2={axis} stroke={MUTED} />
          {allYears.map(year => (
            <g key={year} fontSize={11} textAnchor="middle" fill={totalOf.has(year) ? MUTED : GRID}>
              <line x1={x(year)} x2={x(year)} y1={axis} y2={axis + 4} stroke="currentColor" style={{ color: MUTED }} />
              <text x={x(year)} y={axis + 16}>{year}</text>
            </g>
          ))}
          <g fontSize={11} fill={MUTED}>
            <text x={LABELS - 10} y={axis + 38} textAnchor="end">ads</text>
            <text x={LABELS - 10} y={axis + 54} textAnchor="end">mentions</text>
            {years.map(year => (
              <g key={year.year} textAnchor="middle">
                <text x={x(year.year)} y={axis + 38}>{year.ads}</text>
                <text x={x(year.year)} y={axis + 54}>{year.mentions}</text>
              </g>
            ))}
          </g>
          <text x={WIDTH - 4} y={TOP - 8} fontSize={11} fill={MUTED} textAnchor="end">all</text>

          {rows.map((artist, i) => (
            <g key={artist.id}>
              <line x1={left - MAX_R} x2={right + MAX_R} y1={y(i)} y2={y(i)} stroke={GRID} />
              <a href={artist.id}>
                <text x={LABELS - 10} y={y(i)} fontSize={14} textAnchor="end" dominantBaseline="central"
                  fill={theme.palette.text.primary}
                  fontWeight={active?.artist === artist ? 700 : 400}>
                  {artist.name}
                </text>
              </a>
              <text x={WIDTH - 4} y={y(i)} fontSize={12} textAnchor="end" dominantBaseline="central"
                fill={MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {artist.mentions}
              </text>
            </g>
          ))}

          {/* the circles of a row are drawn after all rows, so that a large one
              lies over the line of the next row */}
          {rows.map((artist, i) => artist.years.map(year => {
            const r = radius(value(year))
            const on = active?.artist === artist && active.year === year
            return (
              <g key={`${artist.id}-${year.year}`}>
                <circle cx={x(year.year)} cy={y(i)} r={r}
                  fill={theme.palette.primary.main} fillOpacity={on ? 1 : 0.75}
                  stroke={on ? theme.palette.text.primary : '#fff'} strokeWidth={on ? 2 : 1.5} />
                <circle cx={x(year.year)} cy={y(i)} r={Math.max(r + 3, 10)} fill="transparent"
                  tabIndex={0} aria-label={describe(artist, year)} style={{ cursor: 'default', outline: 'none' }}
                  onMouseEnter={() => setActive({ artist, year })} onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive({ artist, year })} onBlur={() => setActive(null)} />
              </g>
            )
          }))}
        </svg>

        {active && (
          <Box role="status" sx={{
            position: 'absolute',
            left: `${100 * x(active.year.year) / WIDTH}%`,
            top: `${100 * y(rows.indexOf(active.artist)) / height}%`,
            // towards the edges, the tooltip opens inwards
            transform: `translate(${x(active.year.year) > 0.7 * WIDTH ? 'calc(-100% + 24px)' : '-50%'}, calc(-100% - 22px))`,
            pointerEvents: 'none',
            background: '#fff',
            border: `1px solid ${GRID}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            borderRadius: 1,
            px: 1.5, py: 0.75,
            fontSize: '0.95rem',
            lineHeight: 1.35,
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}>
            <strong>{active.artist.name}</strong>, {active.year.year}
            <br />
            {plural(active.year.mentions, 'mention')} in {plural(active.year.ads, 'ad')}
            <br />
            {percent(active.year.mentions / totalOf.get(active.year.year)!.mentions)} of
            the {totalOf.get(active.year.year)!.mentions} mentions of the year
          </Box>
        )}
      </Box>

      <Legend max={max} radius={radius} size={size} />
    </Box>
  )
}

// three circles of the scale: the largest value, a third and a ninth of it
function Legend({ max, radius, size }: { max: number; radius: (v: number) => number; size: Size }) {
  const values = size === 'mentions'
    ? Array.from(new Set([1, Math.round(max / 3), max])).filter(v => v >= 1)
    : [max / 9, max / 3, max]
  const label = (v: number) => size === 'mentions' ? String(v) : percent(v)
  let at = 0
  const placed = values.map(v => {
    const r = radius(v)
    const cx = at + r
    at = cx + r + 30
    return { v, r, cx }
  })

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, ml: { sm: `${100 * (LABELS - 120) / WIDTH}%` }, color: MUTED, fontSize: '0.95rem' }}>
      <span>Area of a circle:</span>
      <svg width={at} height={2 * MAX_R + 2} aria-hidden="true">
        {placed.map(({ v, r, cx }) => (
          <g key={v}>
            <circle cx={cx} cy={MAX_R + 1} r={r} fill={theme.palette.primary.main} fillOpacity={0.75} />
            <text x={cx + r + 4} y={MAX_R + 1} fontSize={12} dominantBaseline="central" fill={MUTED}>{label(v)}</text>
          </g>
        ))}
      </svg>
      <span>{size === 'mentions' ? 'mentions in a year' : 'of the mentions of a year'}</span>
    </Box>
  )
}
