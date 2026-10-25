"use client"

import React from "react"
import Link from "next/link"
import { Box, Button, Fade, IconButton, Typography } from "@mui/material"
import { Close } from "@mui/icons-material"

/** A chapter of the story, as a timeline shows it. */
export interface Chapter {
  id: string
  from: number
  to: number
  title: string
  // one short sentence, read while the timeline plays
  caption: string
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

/** The text of a chapter, its figures, its ads and its sources. */
const ChapterBody = ({ chapter }: { chapter: Chapter }) => (
  <>
    <Box sx={{ '& p': { m: 0, mb: 1 } }} dangerouslySetInnerHTML={{ __html: chapter.html }} />
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
  // the corner of the picture it stands in on a wide screen
  side?: 'left' | 'right'
  onHide: () => void
}

/**
 * The chapter of the time shown, in a top corner of the picture on a wide
 * screen and below it on a narrower one: its title and caption, short
 * enough to be read while the timeline plays on, and a link to its text in
 * the list of chapters. Give it the chapter's id as a key, so that it fades
 * in anew with each chapter.
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
        <Box sx={{ flex: 1, fontWeight: 600 }}>{yearsOf(chapter)} · {chapter.title}</Box>
        <IconButton size="small" aria-label="Hide the story" title="Hide the story" onClick={onHide} sx={{ mt: -0.5, mr: -0.75 }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ mt: 0.5 }}>
        {chapter.caption} <a href={`#chapter-${chapter.id}`}>More</a>
      </Box>
    </Box>
  </Fade>
)

/** Brings the story back once the reader has hidden it. */
export const ShowStory = ({ onShow }: { onShow: () => void }) => (
  <Button size="small" onClick={onShow} sx={{ mt: 0.5 }}>Show the story</Button>
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
