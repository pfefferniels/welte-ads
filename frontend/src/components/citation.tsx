"use client"

import React, { useState, useSyncExternalStore } from "react"
import Box from "@mui/material/Box"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Typography from "@mui/material/Typography"
import { Cited, Part, STYLES, Style } from "../lib/citation"

const subscribe = () => () => {}
// the reader's day, e.g. "2026-10-24"
const today = () => {
  const now = new Date()
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map(n => String(n).padStart(2, '0'))
    .join('-')
}

// the style that the reader chose last, on any ad page
const STORAGE_KEY = 'citation-style'
const storedStyle = (): Style | null => {
  try {
    const style = localStorage.getItem(STORAGE_KEY)
    return style && style in STYLES ? style as Style : null
  } catch {
    return null
  }
}

const Text = ({ parts }: { parts: Part[] }) => (
  <>
    {parts.map((part, i) => (
      <React.Fragment key={i}>
        {typeof part === 'string'
          ? part
          : 'italic' in part
            ? <i>{part.italic}</i>
            : <a href={part.link}>{part.text}</a>}
      </React.Fragment>
    ))}
  </>
)

const Citation = (cited: Cited) => {
  // the day of access and the stored style are the reader's, so they are
  // only known in the browser
  const accessed = useSyncExternalStore(subscribe, today, () => null)
  const stored = useSyncExternalStore(subscribe, storedStyle, () => null)
  const [chosen, setChosen] = useState<Style | null>(null)
  const style = chosen || stored || 'chicago'

  const choose = (next: Style) => {
    setChosen(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // the choice then lasts only as long as the page
    }
  }

  return (
    <Box component="section" sx={{ ml: 7, mt: 4 }}>
      <Typography variant="h6" component="h2">
        How to cite
      </Typography>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={style}
        onChange={(_, value) => value && choose(value as Style)}
        aria-label="Citation style"
        sx={{
          flexWrap: 'wrap',
          my: 1,
          '& .MuiToggleButton-root': { textTransform: 'none', fontSize: '1rem', py: 0.25 },
        }}
      >
        {Object.entries(STYLES).map(([id, { label }]) => (
          <ToggleButton key={id} value={id}>{label}</ToggleButton>
        ))}
      </ToggleButtonGroup>
      {STYLES[style].cite(cited, accessed).map(({ label, parts, code }, i) => (
        <React.Fragment key={i}>
          {label && (
            <Typography variant="body2" component="h3" sx={{ mt: 1, color: 'text.secondary' }}>
              {label}
            </Typography>
          )}
          {code
            ? (
              <Box component="pre" sx={{
                m: 0,
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}>
                <Text parts={parts} />
              </Box>
            )
            : (
              <Typography variant="body2" component="p" sx={{ overflowWrap: 'anywhere' }}>
                <Text parts={parts} />
              </Typography>
            )}
        </React.Fragment>
      ))}
    </Box>
  )
}

export default Citation
