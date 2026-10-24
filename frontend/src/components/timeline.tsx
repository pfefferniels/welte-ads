"use client"

import React, { useEffect, useState } from "react"
import { Box, Button, IconButton, Slider, Tooltip } from "@mui/material"
import { Pause, PlayArrow } from "@mui/icons-material"

const NO_STOPS: number[] = []

/**
 * The year that a chart shows, or null for all years at once. Playing
 * steps through the years from the first to the last, one every interval
 * (in milliseconds), and stops at the last; it also waits at each of the
 * stops (memoize them, or the timer starts anew with every render).
 */
export function usePlayback(first: number, last: number, interval: number, stops: number[] = NO_STOPS) {
  const [year, setYear] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing || year === null) return
    const timer = setTimeout(() => {
      if (year < last) setYear(year + 1)
      // at the last year, and where a stop begins, the timeline waits
      if (year + 1 >= last || stops.includes(year + 1)) setPlaying(false)
    }, interval)
    return () => clearTimeout(timer)
  }, [playing, year, last, interval, stops])

  return {
    first,
    last,
    year,
    playing,
    // from where it was paused, or else from the first year, which may be
    // a stop itself
    play: () => {
      if (year === null || year >= last) {
        setYear(first)
        setPlaying(!stops.includes(first))
      } else setPlaying(true)
    },
    pause: () => setPlaying(false),
    // a year, or null for all years
    show: (year: number | null) => {
      setPlaying(false)
      setYear(year)
    },
  }
}

type Playback = ReturnType<typeof usePlayback>

interface TimelineProps {
  playback: Playback
  // a line about the year shown, e.g. "57 printings in 6 places"
  about?: string
}

/** A button to play the years, a slider to choose one, and a button to
 * show all years again. */
export const Timeline = ({ playback, about }: TimelineProps) => {
  const { first, last, year, playing } = playback
  const action = playing ? 'Pause' : year !== null && year < last ? 'Continue' : 'Play the years'
  const marks = Array.from({ length: last - first + 1 }, (_, i) => first + i)
    .filter(year => year % 5 === 0)
    .map(year => ({ value: year, label: String(year) }))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2, py: 0.5 }}>
      <Tooltip title={action}>
        <IconButton aria-label={action}
          onClick={playing ? playback.pause : playback.play}>
          {playing ? <Pause /> : <PlayArrow />}
        </IconButton>
      </Tooltip>
      <Slider
        aria-label="Year"
        min={first}
        max={last}
        step={1}
        marks={marks}
        value={year ?? first}
        valueLabelDisplay="auto"
        onChange={(_, value) => playback.show(value as number)}
        // with all years shown, the slider waits to be moved
        sx={{ flex: '1 1 240px', mx: 1, '& .MuiSlider-thumb': { opacity: year === null ? 0.35 : 1 } }}
      />
      <Box aria-live={playing ? 'off' : 'polite'} sx={{ minWidth: '14rem', fontSize: '1rem' }}>
        <strong>{year ?? 'All years'}</strong>
        {year !== null && about && <> · {about}</>}
      </Box>
      <Button size="small" disabled={year === null} onClick={() => playback.show(null)}>
        All years
      </Button>
    </Box>
  )
}
