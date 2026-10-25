"use client"

import React, { useState } from "react"
import { Box } from "@mui/material"
import { CLOUD_WIDTH, fontSize, namedAround, rateAt } from "../../lib/cloud"
import type { CloudName } from "../../lib/cloud"
import type { YearTotal } from "../../lib/artists"
import { artistLink } from "../../lib/anchors"
import { Timeline, usePlayback } from "../../components/timeline"
import { ShowStory, StoryCard, TimelineChapter, chapterAt } from "../../components/narrative"

interface Props {
  names: CloudName[]
  // the height of the cloud, in its units
  height: number
  years: YearTotal[]
  // the width of the kernel that smooths the mentions, in years
  h: number
  chapters: TimelineChapter[]
}

const SPEED = 0.8 // how fast the timeline plays, in years per second
// the grey of a name that no ad around the time names (138 of 255)
const MUTED = 138

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const rateOf = (rate: number) => rate.toLocaleString('en-GB', { maximumFractionDigits: 1 })

/**
 * The names of the artists, each in its place, as large as the ads named
 * the artist around the time shown, or in all years together; black where
 * an ad of the year names the artist, grey where only the years around do,
 * and in between as the time comes near such a year or leaves it.
 */
export default function ArtistsCloud({ names, height, years, h, chapters }: Props) {
  const first = years[0].year
  const last = years[years.length - 1].year
  const [story, setStory] = useState(true)
  const playback = usePlayback(first, last, SPEED)
  const { time, year } = playback
  const chapter = story ? chapterAt(chapters, year) : undefined
  const focus = new Set(chapter?.focus)

  const total = year === null ? undefined : years.find(y => y.year === year)
  const about = year === null ? undefined
    : total ? `${plural(total.ads, 'ad')}, ${plural(total.mentions, 'mention')}` : 'no ads'

  // the card stands in the top corner that hides fewer of the names the
  // chapter is about; it covers about a quarter of the width
  const focused = names.filter(name => focus.has(name.id))
  const under = (left: boolean) => focused.filter(name =>
    left ? name.x < 0.27 * CLOUD_WIDTH : name.x > 0.73 * CLOUD_WIDTH).length
  const side = under(true) <= under(false) ? 'left' : 'right'

  const shown = (name: CloudName) => {
    const rate = time === null ? name.all : rateAt(name, h, time)
    const shade = Math.round(MUTED * (1 - (time === null ? 1 : namedAround(name, time))))
    const named = year !== null && name.years.some(y => y.year === year)
    const dead = name.died !== null && (time ?? last + 1) >= name.died + 1
    const about = year === null
      ? `named ${plural(name.mentions, 'time')} in ${plural(name.ads, 'ad')}`
      : `${rateOf(rate)} mentions a year around ${year}${named ? `, named in an ad of ${year}` : ''}`
    return { rate, shade, dead, about: `${name.name}: ${about}${dead ? `, died ${name.died}` : ''}` }
  }

  return (
    <Box sx={{
      my: 2,
      // while the timeline plays, the names follow it frame by frame
      '& text': { transition: playback.playing ? 'none' : 'font-size 0.6s ease, fill 0.6s ease, opacity 0.6s ease' },
      '& a:hover text, & a:focus text': { textDecoration: 'underline' },
      '@media (prefers-reduced-motion: reduce)': { '& text': { transition: 'none' } },
    }}>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ position: 'relative', minWidth: 640 }}>
            <svg viewBox={`0 0 ${CLOUD_WIDTH} ${height}`} width="100%" role="group"
              aria-label="The artists that the ads name" style={{ display: 'block', fontFamily: 'inherit' }}>
              {names.map(name => {
                const { rate, shade, dead, about } = shown(name)
                return (
                  <a key={name.id} href={artistLink(name.id)} aria-label={about}>
                    <text x={name.x} y={name.y} textAnchor="middle" dominantBaseline="central"
                      style={{
                        fontSize: fontSize(rate),
                        fill: `rgb(${shade}, ${shade}, ${shade})`,
                        opacity: focus.size && !focus.has(name.id) ? 0.3 : 1,
                      }}>
                      <title>{about}</title>
                      {dead ? `${name.label} †` : name.label}
                    </text>
                  </a>
                )
              })}
            </svg>
            {year !== null && (
              <Box aria-hidden="true" sx={{
                position: 'absolute',
                left: 12,
                top: 4,
                pointerEvents: 'none',
                fontSize: 'clamp(1.5rem, 6vw, 3rem)',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}>
                {year}
              </Box>
            )}
          </Box>
        </Box>
        {chapter && (
          <StoryCard key={chapter.id} chapter={chapter}
            side={side} onHide={() => setStory(false)} />
        )}
      </Box>
      <Timeline playback={playback} about={about} />
      {chapters.length > 0 && !story && <ShowStory onShow={() => setStory(true)} />}
    </Box>
  )
}
