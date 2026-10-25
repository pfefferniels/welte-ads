"use client"

import React, { useState } from "react"
import { ClickAwayListener, Tooltip } from "@mui/material"

interface Props {
  // the mark in the text, e.g. "1"
  mark: string
  children: React.ReactNode
}

// A footnote that opens when its mark is hovered, focused or tapped. Opened
// by hover or focus, it closes when the pointer or the focus leaves; opened
// by a click or a tap, it stays until the reader clicks or taps elsewhere or
// presses Escape. The span around it holds the tooltip too, so that a tap
// inside the note keeps it open.
const Footnote = ({ mark, children }: Props) => {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)

  const close = () => {
    setOpen(false)
    setPinned(false)
  }

  return (
    <ClickAwayListener onClickAway={close}>
      <span>
        <Tooltip
          title={children}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={event => {
            if (!pinned || event.type === 'keydown') close()
          }}
          disableTouchListener
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: 'background.default',
                color: 'text.primary',
                border: '1px solid',
                borderRadius: 0,
                fontSize: '1rem',
                lineHeight: 1.4,
                maxWidth: 480,
                p: 1.5,
                '& p': { m: 0 },
                '& p + p': { mt: 1 },
              },
            },
          }}>
          <sup>
            <button
              type="button"
              aria-label={`Footnote ${mark}`}
              onClick={() => {
                setOpen(true)
                setPinned(true)
              }}
              style={{ background: 'none', border: 0, padding: '0 .15em', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>
              {mark}
            </button>
          </sup>
        </Tooltip>
      </span>
    </ClickAwayListener>
  )
}

export default Footnote
