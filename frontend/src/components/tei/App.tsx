import React, { useState } from "react"
import { Behavior } from "./Behavior"
import { TEINodes } from "react-teirouter"
import { Popover } from "@mui/material"
import { Difference } from "@mui/icons-material"
import { formatDates } from "../../lib/dates"

interface TEIProps {
  teiNode: Node
  availableRoutes?: string[]
}

const textOf = (el: Element | null | undefined) =>
  (el?.textContent || '').replace(/\s+/g, ' ').trim()

// the printings that a reading cites, by periodical, e.g.
// "Обозрѣніе театровъ, 2–22 February 1908"
const printingsOf = (reading: Element) => {
  const byPeriodical = new Map<string, string[]>()
  for (const ref of (reading.getAttribute('source') || '').split(/\s+/).filter(Boolean)) {
    const source = reading.ownerDocument.getElementById(ref.replace(/^#/, ''))
    if (!source) continue
    const periodical = textOf(source.querySelector('tei-title[level="j"]'))
    const dates = Array.from(source.querySelectorAll('tei-date[type="publication"]'))
      .map(date => date.getAttribute('when') || textOf(date))
    byPeriodical.set(periodical, [...(byPeriodical.get(periodical) || []), ...dates])
  }
  return Array.from(byPeriodical, ([periodical, dates]) =>
    [periodical, formatDates(dates)].filter(Boolean).join(', ')).join('; ')
}

// the readings of the printings: the text shows the lemma, or else the first
// reading, which is that of the transcribed printing; the others are a click
// away
const App = ({ teiNode, availableRoutes }: TEIProps) => {
  const readings = Array.from((teiNode as Element).children)
    .filter(child => child.localName === 'tei-lem' || child.localName === 'tei-rdg')
  const shown = readings.find(reading => reading.localName === 'tei-lem') || readings[0]

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  if (!shown) return null

  return (
    <Behavior node={teiNode}>
      <span className="variant">
        <TEINodes teiNodes={shown.childNodes} availableRoutes={availableRoutes} />
      </span>
      <button
        type="button"
        className="variant-marker"
        aria-label="Readings of the printings"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={event => setAnchorEl(event.currentTarget)}>
        <Difference fontSize="inherit" />
      </button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <div style={{ padding: '1rem', maxWidth: 360 }}>
          {readings.map((reading, i) => {
            const printings = printingsOf(reading)
            return (
              <p key={i} style={{ margin: i ? '0.5rem 0 0' : 0 }}>
                {reading.childNodes.length
                  ? <TEINodes teiNodes={reading.childNodes} availableRoutes={availableRoutes} />
                  : <i>nothing</i>}
                {printings && (
                  <span style={{ color: '#6b6b6b', fontSize: '0.85em' }}>
                    {' '}— {printings}{reading === shown && ' (transcribed)'}
                  </span>
                )}
              </p>
            )
          })}
        </div>
      </Popover>
    </Behavior>
  )
}

export default App
