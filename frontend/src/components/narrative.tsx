"use client"

import React from "react"
import { Box, Button, Fade, IconButton } from "@mui/material"
import { Close } from "@mui/icons-material"

/** A chapter of the story, as a timeline shows it while it plays. */
export interface TimelineChapter {
  id: string
  from: number
  to: number
  // the chapter in a sentence or two, as HTML, read while the timeline plays
  caption: string
  // what the chapter is about, as the view knows it ("#place-5128581", a GND URI)
  focus: string[]
}

/** The chapter that a year belongs to, if any. */
export const chapterAt = <C extends TimelineChapter>(chapters: C[], year: number | null) =>
  year === null ? undefined : chapters.find(chapter => chapter.from <= year && year <= chapter.to)

interface StoryCardProps {
  chapter: TimelineChapter
  // the corner of the picture it stands in on a wide screen
  side?: 'left' | 'right'
  onHide: () => void
}

/**
 * The chapter of the time shown, in a top corner of the picture on a wide
 * screen and below it on a narrower one: its caption, short enough to be
 * read while the timeline plays on. Give it the chapter's id as a key, so
 * that it fades in anew with each chapter.
 */
export const StoryCard = ({ chapter, side = 'left', onHide }: StoryCardProps) => (
  <Fade in timeout={500}>
    <Box component="section" aria-label="Story" aria-live="polite" sx={{
      position: { xs: 'static', md: 'absolute' },
      top: { md: 60 },
      [side]: { md: 4 },
      width: { md: '24%' },
      mt: { xs: 1, md: 0 },
      px: 1.5,
      py: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: 1,
      borderColor: 'divider',
      borderRadius: 1,
      boxShadow: 1,
      fontSize: '0.95rem',
      lineHeight: 1.3,
      zIndex: 1,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Box sx={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: chapter.caption }} />
        <IconButton size="small" aria-label="Hide the story" title="Hide the story" onClick={onHide} sx={{ mt: -0.5, mr: -0.75 }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  </Fade>
)

/** Brings the story back once the reader has hidden it. */
export const ShowStory = ({ onShow }: { onShow: () => void }) => (
  <Button size="small" onClick={onShow} sx={{ mt: 0.5 }}>Show the story</Button>
)
