"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Box, Chip, FormControlLabel, IconButton, Switch, Typography } from "@mui/material"
import { Close } from "@mui/icons-material"

/** A chapter of the story, as a timeline shows it. */
export interface Chapter {
  id: string
  from: number
  to: number
  title: string
  // the text, as HTML
  html: string
  // what the chapter is about, as the view knows it ("#place-5128581", a GND URI)
  focus: string[]
  // the figures of the chapter's years, e.g. "15 printings of 7 ads in 7 places"
  figures: string
  ads: { slug: string; periodical: string; year: number }[]
  sources: { title: string; url: string }[]
}

/** The chapter that a year belongs to, if any. */
export const chapterAt = (chapters: Chapter[], year: number | null) =>
  year === null ? undefined : chapters.find(chapter => chapter.from <= year && year <= chapter.to)

const yearsOf = (chapter: Chapter) =>
  chapter.from === chapter.to ? String(chapter.from) : `${chapter.from}–${chapter.to}`

// the text of a chapter
const ChapterText = ({ chapter }: { chapter: Chapter }) => (
  <Box sx={{ '& p': { m: 0, mb: 1 } }} dangerouslySetInnerHTML={{ __html: chapter.html }} />
)

/** The text of a chapter, its figures, its ads and its sources. */
const ChapterBody = ({ chapter }: { chapter: Chapter }) => (
  <>
    <ChapterText chapter={chapter} />
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{chapter.figures}</Typography>
    {chapter.ads.length > 0 && (
      <Typography variant="body2">
        Ads:{' '}
        {chapter.ads.map((ad, i) => (
          <React.Fragment key={ad.slug}>
            {i > 0 && '; '}
            <Link href={`/${ad.slug}`}><i>{ad.periodical}</i>, {ad.year}</Link>
          </React.Fragment>
        ))}
      </Typography>
    )}
    {chapter.sources.length > 0 && (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Sources:{' '}
        {chapter.sources.map((source, i) => (
          <React.Fragment key={source.url}>
            {i > 0 && '; '}
            <a href={source.url}>{source.title}</a>
          </React.Fragment>
        ))}
      </Typography>
    )}
  </>
)

interface StoryCardProps {
  chapter: Chapter
  // a card opens while the timeline waits and folds to its title while it
  // plays; the reader can open or fold it either way
  playing: boolean
  // the corner of the picture it stands in on a wide screen
  side?: 'left' | 'right'
  onHide: () => void
}

/**
 * The chapter of the year shown, in a top corner of the picture on a wide
 * screen and below it on a narrower one; its ads and sources are in
 * the list of chapters. Give it a key of the chapter and whether the
 * timeline plays, so that it opens and folds with them.
 */
export const StoryCard = ({ chapter, playing, side = 'left', onHide }: StoryCardProps) => {
  const [open, setOpen] = useState(!playing)
  return (
    <Box component="section" aria-label="Story" sx={{
      position: { xs: 'static', md: 'absolute' },
      top: { md: 60 },
      [side]: { md: 4 },
      width: { md: '24%' },
      maxHeight: { md: 'calc(100% - 64px)' },
      overflowY: 'auto',
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
        <Box component="button" aria-expanded={open} onClick={() => setOpen(!open)} sx={{
          all: 'unset',
          flex: 1,
          cursor: 'pointer',
          fontWeight: 600,
          '&:focus-visible': { outline: '2px solid', outlineOffset: 2 },
        }}>
          {yearsOf(chapter)} · {chapter.title}
        </Box>
        <IconButton size="small" aria-label="Hide the story" title="Hide the story" onClick={onHide} sx={{ mt: -0.5, mr: -0.75 }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      {open && (
        <Box sx={{ mt: 0.5 }}>
          <ChapterText chapter={chapter} />
          <Box sx={{ color: 'text.secondary' }}>
            {chapter.figures} · <a href={`#chapter-${chapter.id}`}>ads and sources</a>
          </Box>
        </Box>
      )}
    </Box>
  )
}

interface StoryChipsProps {
  chapters: Chapter[]
  current?: Chapter
  onPick: (chapter: Chapter) => void
  // whether the timeline tells the story: stops at each chapter and shows its card
  story: boolean
  onStory: (story: boolean) => void
}

/** A switch for the story, and the chapters to jump to. */
export const StoryChips = ({ chapters, current, onPick, story, onStory }: StoryChipsProps) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
    <FormControlLabel label="Story" sx={{ mr: 0.5 }}
      control={<Switch size="small" checked={story} onChange={event => onStory(event.target.checked)} />} />
    {chapters.map(chapter => (
      <Chip key={chapter.id} size="small" clickable
        label={`${chapter.from} · ${chapter.title}`}
        variant={chapter === current ? 'filled' : 'outlined'}
        onClick={() => onPick(chapter)} />
    ))}
  </Box>
)

/** All chapters as text, for reading, citing and finding without the timeline. */
export const StoryList = ({ chapters }: { chapters: Chapter[] }) => (
  <Box component="section" sx={{ mb: 3 }}>
    <Typography variant="h5" component="h2" sx={{ mt: 3, mb: 1 }}>The story</Typography>
    {chapters.map(chapter => (
      <Box key={chapter.id} id={`chapter-${chapter.id}`} sx={{ mb: 2, fontSize: '1.1rem' }}>
        <Typography variant="h6" component="h3" sx={{ lineHeight: 1.3, mb: 0.5 }}>
          {yearsOf(chapter)} · {chapter.title}
        </Typography>
        <ChapterBody chapter={chapter} />
      </Box>
    ))}
  </Box>
)
