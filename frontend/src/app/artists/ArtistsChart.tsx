"use client"

import React, { useState } from "react"
import { Box } from "@mui/material"
import { area, curveMonotoneX } from "d3"
import theme from "../../theme"
import type { ArtistBand, YearGroup } from "../../lib/artists"

export interface Artist extends ArtistBand {
  name: string
}

interface Props {
  groups: YearGroup[]
  artists: Artist[]
  // all artists, also those not shown, so that a band keeps its thickness
  // when the selection changes
  scaleArtists: Artist[]
}

const WIDTH = 900
const LABELS = 200 // the names
const TOTALS = 48 // the column of totals
const HEADER = 30 // the years of the groups
const ROW = 26
// the bands are thicker than a row, so that they overlap
const MAX_THICKNESS = 60
const BOTTOM = 72 // the axis and the counts of the groups

const BAND = '#f7f2ed'
const GRID = '#e6ded6'
const MUTED = '#8a7f78'

const percent = (share: number) =>
  `${(100 * share).toLocaleString('en-GB', { maximumFractionDigits: share < 0.1 ? 1 : 0 })}%`

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

// "1905–1907", or "1912" for a group of one year
const span = (group: YearGroup) => group.from === group.to ? String(group.from) : `${group.from}–${group.to}`

// earlier artists first: the mean year of their mentions
const meanYear = (artist: Artist, groups: YearGroup[]) =>
  artist.groups.reduce((sum, g, i) => sum + g.mentions * groups[i].center, 0) / artist.mentions

// the groups between two gaps without ads
const runsOf = (groups: YearGroup[]) =>
  groups.reduce((runs: number[][], group, i) => {
    if (i === 0 || group.gapBefore) runs.push([i])
    else runs[runs.length - 1].push(i)
    return runs
  }, [])

export default function ArtistsChart({ groups, artists, scaleArtists }: Props) {
  const [active, setActive] = useState<{ artist: Artist; group: number } | null>(null)

  const max = Math.max(...scaleArtists.flatMap(a => a.groups.map(g => g.share)))
  // the thickness of a band is proportional to the share
  const half = (share: number) => MAX_THICKNESS / 2 * share / max

  const rows = [...artists].sort((a, b) => meanYear(a, groups) - meanYear(b, groups) || b.mentions - a.mentions)
  const runs = runsOf(groups)

  const first = groups[0].from - 0.5
  const last = groups[groups.length - 1].to + 0.5
  const left = LABELS + 4
  const right = WIDTH - TOTALS - 4
  const x = (year: number) => left + (year - first) / (last - first) * (right - left)
  // room for the bands of the first and the last row
  const overhang = (artist?: Artist) =>
    artist ? Math.max(0, ...artist.groups.map(g => half(g.share) - ROW / 2)) : 0
  const TOP = HEADER + overhang(rows[0])
  const y = (row: number) => TOP + row * ROW + ROW / 2
  const axis = TOP + rows.length * ROW + overhang(rows[rows.length - 1]) + 6
  const height = axis + BOTTOM
  const years = Array.from({ length: last - first }, (_, i) => first + 0.5 + i)

  // each run of groups is one smooth band, through the share of each group at
  // the mean year of its mentions, and level to the edges of the run
  const bands = (artist: Artist, row: number) => runs.map(run => {
    const g0 = groups[run[0]], g1 = groups[run[run.length - 1]]
    const points: [number, number][] = [
      [x(g0.from - 0.5), half(artist.groups[run[0]].share)],
      ...run.map((g): [number, number] => [x(groups[g].center), half(artist.groups[g].share)]),
      [x(g1.to + 0.5), half(artist.groups[run[run.length - 1]].share)],
    ]
    if (points.every(([, h]) => h === 0)) return null
    return area<[number, number]>()
      .x(([px]) => px)
      .y0(([, h]) => y(row) - h)
      .y1(([, h]) => y(row) + h)
      .curve(curveMonotoneX)(points)
  })

  const describe = (artist: Artist, g: number) => {
    const group = groups[g], mine = artist.groups[g]
    return `${artist.name}, ${span(group)}: ${mine.mentions} of ${group.mentions} mentions ` +
      `(${percent(mine.share)}), in ${mine.ads} of ${plural(group.ads, 'ad')}`
  }

  const tooltipAt = active && x((groups[active.group].from + groups[active.group].to) / 2)

  return (
    <Box sx={{ overflowX: 'auto', my: 2 }}>
      <Box sx={{ position: 'relative', minWidth: 720 }}>
        <svg viewBox={`0 0 ${WIDTH} ${height}`} width="100%" role="group"
          aria-label="Share of the mentions of artists, by groups of years" style={{ display: 'block', fontFamily: 'inherit' }}>
          {/* the groups of years */}
          {groups.map((group, g) => (
            <g key={g}>
              <rect x={x(group.from - 0.5)} width={x(group.to + 0.5) - x(group.from - 0.5)}
                y={HEADER} height={axis - HEADER} fill={BAND} />
              <text x={x((group.from + group.to) / 2)} y={HEADER - 10} fontSize={12} textAnchor="middle"
                fill={theme.palette.text.primary}>
                {span(group)}
              </text>
              {group.gapBefore && (
                <Gap from={groups[g - 1].to + 1} to={group.from - 1}
                  left={x(groups[g - 1].to + 0.5)} right={x(group.from - 0.5)} top={HEADER} bottom={axis} />
              )}
            </g>
          ))}
          <text x={WIDTH - 4} y={HEADER - 10} fontSize={11} fill={MUTED} textAnchor="end">all</text>

          {/* the axis */}
          <line x1={left} x2={right} y1={axis} y2={axis} stroke={MUTED} />
          {years.map(year => (
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
            {groups.map((group, g) => (
              <g key={g}>
                <text x={x((group.from + group.to) / 2)} y={axis + 38}>{group.ads}</text>
                <text x={x((group.from + group.to) / 2)} y={axis + 54}>{group.mentions}</text>
              </g>
            ))}
          </g>

          {/* the lines of the rows, interrupted where no ads appeared */}
          {rows.map((artist, i) => runs.map(run => (
            <line key={`${artist.id}-${run[0]}`} y1={y(i)} y2={y(i)} stroke={GRID} strokeWidth={0.75}
              x1={x(groups[run[0]].from - 0.5)} x2={x(groups[run[run.length - 1]].to + 0.5)} />
          )))}
          {active && (
            <rect x={x(groups[active.group].from - 0.5)} y={y(rows.indexOf(active.artist)) - ROW / 2}
              width={x(groups[active.group].to + 0.5) - x(groups[active.group].from - 0.5)} height={ROW}
              fill={theme.palette.primary.main} fillOpacity={0.08} />
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
              {groups.map((group, g) => (
                <rect key={g} x={x(group.from - 0.5)} y={y(i) - ROW / 2}
                  width={x(group.to + 0.5) - x(group.from - 0.5)} height={ROW} fill="transparent"
                  tabIndex={0} aria-label={describe(artist, g)} style={{ outline: 'none' }}
                  onMouseEnter={() => setActive({ artist, group: g })} onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive({ artist, group: g })} onBlur={() => setActive(null)} />
              ))}
            </g>
          ))}
        </svg>

        {active && tooltipAt !== null && (
          <Box role="status" sx={{
            position: 'absolute',
            left: `${100 * tooltipAt / WIDTH}%`,
            top: `${100 * (y(rows.indexOf(active.artist)) - ROW / 2) / height}%`,
            // towards the right edge, the tooltip opens inwards
            transform: `translate(${tooltipAt > 0.7 * WIDTH ? 'calc(-100% + 24px)' : '-50%'}, calc(-100% - 6px))`,
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
            <strong>{active.artist.name}</strong>, {span(groups[active.group])}
            <br />
            {active.artist.groups[active.group].mentions} of the {groups[active.group].mentions} mentions
            ({percent(active.artist.groups[active.group].share)})
            <br />
            in {active.artist.groups[active.group].ads} of {plural(groups[active.group].ads, 'ad')}
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
      <span>of the mentions in a group of years</span>
    </Box>
  )
}
