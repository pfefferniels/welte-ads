"use client"

import React, { useMemo, useState } from "react"
import { Box } from "@mui/material"
import { area } from "d3"
import theme from "../../theme"
import { runsOf, smoothedShare } from "../../lib/artists"
import type { ArtistTimeline, YearTotal } from "../../lib/artists"

export interface Artist extends ArtistTimeline {
  name: string
}

interface Props {
  years: YearTotal[]
  artists: Artist[]
  // all artists, also those not shown, so that a band keeps its thickness
  // when the selection changes
  scaleArtists: Artist[]
  // the width of the kernel, in years
  h: number
}

const WIDTH = 900
const LABELS = 200 // the names
const TOTALS = 48 // the column of totals
const HEADER = 24
const ROW = 26
// the bands are thicker than a row, so that they overlap
const MAX_THICKNESS = 60
const BOTTOM = 72 // the axis and the counts of the years
const STEP = 0.1 // of the curves, in years

const BAND = '#f7f2ed'
const GRID = '#e6ded6'
const MUTED = '#8a7f78'

const percent = (share: number) =>
  `${(100 * share).toLocaleString('en-GB', { maximumFractionDigits: share < 0.1 ? 1 : 0 })}%`

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

// earlier artists first: the mean year of their mentions
const meanYear = (artist: Artist) =>
  artist.years.reduce((sum, y) => sum + y.year * y.mentions, 0) / artist.mentions

export default function ArtistsChart({ years, artists, scaleArtists, h }: Props) {
  const [active, setActive] = useState<{ artist: Artist; year: number } | null>(null)

  const runs = useMemo(() => runsOf(years), [years])
  const totalOf = new Map(years.map(y => [y.year, y]))

  // the smoothed shares of every artist, from the start of each run to its end
  const curves = useMemo(() => new Map(scaleArtists.map(artist => [artist.id, runs.map(([from, to]) => {
    const points: [number, number][] = []
    for (let t = from - 0.5; t <= to + 0.5 + 1e-9; t += STEP) points.push([t, smoothedShare(artist, years, h, t)])
    return points
  })])), [scaleArtists, runs, years, h])

  const max = Array.from(curves.values()).flat(2)
    .reduce((m, [, share]) => Math.max(m, share), 0)
  // the thickness of a band is proportional to the share
  const half = (share: number) => MAX_THICKNESS / 2 * share / max

  const rows = [...artists].sort((a, b) => meanYear(a) - meanYear(b) || b.mentions - a.mentions)

  const first = runs[0][0] - 0.5
  const last = runs[runs.length - 1][1] + 0.5
  const left = LABELS + 4
  const right = WIDTH - TOTALS - 4
  const x = (year: number) => left + (year - first) / (last - first) * (right - left)
  // room for the bands of the first and the last row
  const overhang = (artist?: Artist) => artist
    ? Math.max(0, ...curves.get(artist.id)!.flat().map(([, share]) => half(share) - ROW / 2))
    : 0
  const TOP = HEADER + overhang(rows[0])
  const y = (row: number) => TOP + row * ROW + ROW / 2
  const axis = TOP + rows.length * ROW + overhang(rows[rows.length - 1]) + 6
  const height = axis + BOTTOM
  const ticks = Array.from({ length: last - first }, (_, i) => first + 0.5 + i)

  const bands = (artist: Artist, row: number) => curves.get(artist.id)!.map(points =>
    points.every(([, share]) => share === 0) ? null : area<[number, number]>()
      .x(([t]) => x(t))
      .y0(([, share]) => y(row) - half(share))
      .y1(([, share]) => y(row) + half(share))(points))

  const facts = (artist: Artist, year: number) => {
    const total = totalOf.get(year)!
    const mine = artist.years.find(y => y.year === year)
    return {
      year: total.mentions
        ? `${mine?.mentions ?? 0} of the ${total.mentions} mentions of the year, in ${mine?.ads ?? 0} of ${plural(total.ads, 'ad')}`
        : `the ${plural(total.ads, 'ad')} of the year name no artists`,
      around: `around ${year}: ${percent(smoothedShare(artist, years, h, year))} of the mentions`,
    }
  }

  const activeRow = active ? rows.indexOf(active.artist) : -1
  const activeFacts = active && facts(active.artist, active.year)

  return (
    <Box sx={{ overflowX: 'auto', my: 2 }}>
      <Box sx={{ position: 'relative', minWidth: 720 }}>
        <svg viewBox={`0 0 ${WIDTH} ${height}`} width="100%" role="group"
          aria-label="Share of the mentions of artists over time" style={{ display: 'block', fontFamily: 'inherit' }}>
          {/* the spans of years with ads, and the gaps between them */}
          {runs.map(([from, to], r) => (
            <g key={from}>
              <rect x={x(from - 0.5)} width={x(to + 0.5) - x(from - 0.5)} y={HEADER} height={axis - HEADER} fill={BAND} />
              {r > 0 && (
                <Gap from={runs[r - 1][1] + 1} to={from - 1}
                  left={x(runs[r - 1][1] + 0.5)} right={x(from - 0.5)} top={HEADER} bottom={axis} />
              )}
            </g>
          ))}
          <text x={WIDTH - 4} y={HEADER - 8} fontSize={11} fill={MUTED} textAnchor="end">all</text>

          {/* the axis */}
          <line x1={left} x2={right} y1={axis} y2={axis} stroke={MUTED} />
          {ticks.map(year => (
            <g key={year}>
              <line x1={x(year)} x2={x(year)} y1={axis} y2={axis + 4} stroke={MUTED} />
              {year % 5 === 0 && (
                <text x={x(year)} y={axis + 16} fontSize={11} textAnchor="middle" fill={MUTED}>{year}</text>
              )}
            </g>
          ))}
          <g fontSize={11} fill={MUTED} textAnchor="middle">
            <text x={LABELS - 10} y={axis + 38} textAnchor="end">ads</text>
            <text x={LABELS - 10} y={axis + 54} textAnchor="end">mentions</text>
            {years.map(year => (
              <g key={year.year}>
                <text x={x(year.year)} y={axis + 38}>{year.ads}</text>
                <text x={x(year.year)} y={axis + 54}>{year.mentions}</text>
              </g>
            ))}
          </g>

          {/* the lines of the rows, interrupted where no ads appeared */}
          {rows.map((artist, i) => runs.map(([from, to]) => (
            <line key={`${artist.id}-${from}`} y1={y(i)} y2={y(i)} stroke={GRID} strokeWidth={0.75}
              x1={x(from - 0.5)} x2={x(to + 0.5)} />
          )))}
          {active && (
            <rect x={x(active.year - 0.5)} y={y(activeRow) - ROW / 2} width={x(1) - x(0)} height={ROW}
              fill={theme.palette.primary.main} fillOpacity={0.12} />
          )}

          {/* the bands overlap; the one pointed at stands out */}
          {rows
            .map((artist, i) => ({ artist, i }))
            .sort((a, b) => Number(a.artist === active?.artist) - Number(b.artist === active?.artist))
            .map(({ artist, i }) => bands(artist, i).map((d, r) => d && (
              <path key={`${artist.id}-${r}`} d={d} fill={theme.palette.primary.main}
                fillOpacity={active?.artist === artist ? 0.8 : 0.35}
                stroke={theme.palette.primary.main} strokeOpacity={0.8} strokeWidth={0.75} />
            )))}

          {rows.map((artist, i) => (
            <g key={artist.id}>
              <a href={artist.id}>
                <text x={LABELS - 10} y={y(i)} fontSize={14} textAnchor="end" dominantBaseline="central"
                  fill={theme.palette.text.primary} fontWeight={active?.artist === artist ? 700 : 400}>
                  {artist.name}
                </text>
              </a>
              <text x={WIDTH - 4} y={y(i)} fontSize={12} textAnchor="end" dominantBaseline="central"
                fill={MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {artist.mentions}
              </text>
              {years.map(({ year }) => {
                const f = facts(artist, year)
                return (
                  <rect key={year} x={x(year - 0.5)} y={y(i) - ROW / 2} width={x(1) - x(0)} height={ROW}
                    fill="transparent" tabIndex={0} style={{ outline: 'none' }}
                    aria-label={`${artist.name}, ${year}: ${f.year}; ${f.around}`}
                    onMouseEnter={() => setActive({ artist, year })} onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive({ artist, year })} onBlur={() => setActive(null)} />
                )
              })}
            </g>
          ))}
        </svg>

        {active && activeFacts && (
          <Box role="status" sx={{
            position: 'absolute',
            left: `${100 * x(active.year) / WIDTH}%`,
            top: `${100 * (y(activeRow) - ROW / 2) / height}%`,
            // towards the right edge, the tooltip opens inwards
            transform: `translate(${x(active.year) > 0.7 * WIDTH ? 'calc(-100% + 24px)' : '-50%'}, calc(-100% - 6px))`,
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
            <strong>{active.artist.name}</strong>, {active.year}
            <br />
            {activeFacts.year}
            <br />
            <Box component="span" sx={{ color: 'text.secondary' }}>{activeFacts.around}</Box>
          </Box>
        )}
      </Box>

      <Legend max={max} half={half} />
    </Box>
  )
}

interface GapProps {
  from: number
  to: number
  left: number
  right: number
  top: number
  bottom: number
}

// years without ads, in square brackets
function Gap({ from, to, left, right, top, bottom }: GapProps) {
  const inset = 10, serif = 6
  const l = left + inset, r = right - inset
  const height = bottom - top - 8
  const long = `${from}–${to}: no advertisements published`
  // the text runs upwards; the short one where the rows are few
  const text = long.length * 6.5 < height - 24 ? long : `${from}–${to}: no ads`
  return (
    <g stroke={MUTED} strokeWidth={1.25} fill="none">
      <path d={`M ${l + serif} ${top + 4} H ${l} V ${bottom - 4} H ${l + serif}`} />
      <path d={`M ${r - serif} ${top + 4} H ${r} V ${bottom - 4} H ${r - serif}`} />
      <text transform={`translate(${(l + r) / 2}, ${(top + bottom) / 2}) rotate(-90)`}
        textAnchor="middle" dominantBaseline="central" stroke="none" fill={MUTED}
        fontSize={13} fontStyle="italic" letterSpacing="0.04em">
        {text}
      </text>
    </g>
  )
}

// bands of round shares up to the largest one
function Legend({ max, half }: { max: number; half: (share: number) => number }) {
  const shares = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5].filter(share => share <= max).slice(-3)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, ml: { sm: `${100 * (LABELS - 120) / WIDTH}%` }, color: MUTED, fontSize: '0.95rem' }}>
      <span>Thickness of a band:</span>
      <svg width={shares.length * 76} height={MAX_THICKNESS + 2} aria-hidden="true">
        {shares.map((share, i) => (
          <g key={share}>
            <rect x={i * 76} y={MAX_THICKNESS / 2 + 1 - half(share)} width={28} height={2 * half(share)}
              fill={theme.palette.primary.main} fillOpacity={0.35}
              stroke={theme.palette.primary.main} strokeOpacity={0.8} strokeWidth={0.75} />
            <text x={i * 76 + 34} y={MAX_THICKNESS / 2 + 1} fontSize={12} dominantBaseline="central" fill={MUTED}>
              {percent(share)}
            </text>
          </g>
        ))}
      </svg>
      <span>of the mentions around a year</span>
    </Box>
  )
}
