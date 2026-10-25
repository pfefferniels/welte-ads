"use client"

import React, { useEffect, useRef, useState } from "react"
import { Box, Button, IconButton, Slider, Tooltip } from "@mui/material"
import { Pause, PlayArrow } from "@mui/icons-material"

const MONTH = 1 / 12
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December']

// a time as its month: 1908.25 → "April 1908"
const monthOf = (time: number) => {
  const months = Math.round(time * 12)
  return `${MONTHS[((months % 12) + 12) % 12]} ${Math.floor(months / 12)}`
}

/**
 * The time that a chart shows, in years (1908.5 is the middle of 1908), or
 * null for all years at once, and the year of that time. Playing runs the
 * time on from the start (by default, the start of the first year) to the
 * last month of the last year, frame by frame, at a speed in years per
 * second.
 */
export function usePlayback(first: number, last: number, speed: number, start = first) {
  const end = last + 1 - MONTH
  const [time, setTime] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  // the time as the frames know it, ahead of the next render
  const timeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let previous: number | null = null
    const tick = (now: number) => {
      // the first frame only sets the clock, and a frame never goes back
      const elapsed = previous === null ? 0 : Math.max(0, now - previous)
      previous = now
      const next = Math.min((timeRef.current ?? start) + elapsed / 1000 * speed, end)
      timeRef.current = next
      setTime(next)
      if (next >= end) setPlaying(false)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, start, end, speed])

  const jump = (to: number | null) => {
    timeRef.current = to
    setTime(to)
  }

  return {
    first,
    end,
    time,
    year: time === null ? null : Math.floor(time),
    playing,
    // from where it was paused, or else from the start
    play: () => {
      if (time === null || time >= end) jump(start)
      setPlaying(true)
    },
    pause: () => setPlaying(false),
    // a time, or null for all years
    show: (to: number | null) => {
      setPlaying(false)
      jump(to)
    },
  }
}

type Playback = ReturnType<typeof usePlayback>

interface TimelineProps {
  playback: Playback
  // a line about the year shown, e.g. "57 printings in 6 places"
  about?: string
}

/** A button to play the years, a slider to choose a month, and a button
 * to show all years again. */
export const Timeline = ({ playback, about }: TimelineProps) => {
  const { first, end, time, year, playing } = playback
  const action = playing ? 'Pause' : time !== null && time < end ? 'Continue' : 'Play the years'
  const marks = Array.from({ length: Math.floor(end) - first + 1 }, (_, i) => first + i)
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
        max={end}
        // a month with the arrow keys, a year with shift
        step={MONTH}
        shiftStep={1}
        marks={marks}
        value={time ?? first}
        valueLabelDisplay="auto"
        valueLabelFormat={monthOf}
        getAriaValueText={monthOf}
        onChange={(_, value) => playback.show(value as number)}
        // with all years shown, the slider waits to be moved; while playing,
        // the thumb follows the time without its own transition, which
        // would start anew with every frame and never get anywhere
        sx={{
          flex: '1 1 240px',
          mx: 1,
          '& .MuiSlider-thumb': { opacity: time === null ? 0.35 : 1 },
          '& .MuiSlider-thumb, & .MuiSlider-track': playing ? { transition: 'none' } : {},
        }}
      />
      <Box aria-live={playing ? 'off' : 'polite'} sx={{ minWidth: '14rem', fontSize: '1rem' }}>
        <strong>{year ?? 'All years'}</strong>
        {year !== null && about && <> · {about}</>}
      </Box>
      <Button size="small" disabled={time === null} onClick={() => playback.show(null)}>
        All years
      </Button>
    </Box>
  )
}
