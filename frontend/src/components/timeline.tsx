"use client"

import React, { useEffect, useState } from "react"
import { Box, Button, IconButton, Slider, Tooltip } from "@mui/material"
import { Pause, PlayArrow } from "@mui/icons-material"

/**
 * The year that a chart shows, or null for all years at once. Playing
 * steps through the years from the first to the last, one every interval
 * (in milliseconds), and stops at the last.
 */
export function usePlayback(first: number, last: number, interval: number) {
  const [year, setYear] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing || year === null) return
    const timer = setTimeout(() => {
      if (year < last) setYear(year + 1)
      else setPlaying(false)
    }, interval)
    return () => clearTimeout(timer)
  }, [playing, year, last, interval])

  return {
    first,
    last,
    year,
    playing,
    // from where it was paused, or else from the first year
    play: () => {
      if (year === null || year >= last) setYear(first)
      setPlaying(true)
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
  const marks = Array.from({ length: last - first + 1 }, (_, i) => first + i)
    .filter(year => year % 5 === 0)
    .map(year => ({ value: year, label: String(year) }))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2, py: 0.5 }}>
      <Tooltip title={playing ? 'Pause' : 'Play the years'}>
        <IconButton aria-label={playing ? 'Pause' : 'Play the years'}
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
