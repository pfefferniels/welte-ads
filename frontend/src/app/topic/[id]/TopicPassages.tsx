"use client"

import React from 'react'
import Link from 'next/link'
import { Chip, IconButton, List, ListItem, Tooltip, Typography } from '@mui/material'
import { LinkRounded } from '@mui/icons-material'
import type { Status } from '../../../lib/tei'

export interface Passage {
  // the passage within its ad
  link: string
  // the title of the ad
  ad: string
  // the words of the passage, or what the picture shows
  text: string
  picture: boolean
  // who assigned the topic, e.g. "#claude"
  resp: string
  // whether the editor has checked the ad
  status: Status
}

// the mark of a passage that Claude assigned to the topic
const ByClaude = ({ status }: { status: Status }) => (
  <Tooltip title={status === 'unchecked'
    ? 'Annotated by Claude, an AI model; not yet checked by the editor'
    : 'Annotated by Claude, an AI model'}>
    <Chip component="span" label="AI" size="small" variant="outlined" sx={{ ml: 1, height: 20 }} />
  </Tooltip>
)

export default function TopicPassages({ passages }: { passages: Passage[] }) {
  return (
    <List>
      {passages.map((passage, i) => (
        <ListItem key={i} alignItems="flex-start">
          <IconButton
            size='small'
            component={Link}
            href={passage.link}
            aria-label={`Show in "${passage.ad}"`}
            sx={{ mr: 0.5 }}>
            <LinkRounded />
          </IconButton>
          <div>
            {passage.picture
              ? <span>Picture: {passage.text}</span>
              : <span>… <i>{passage.text}</i> …</span>}
            <Typography variant="body2" color="text.secondary">
              {passage.ad}
              {passage.resp === '#claude' && <ByClaude status={passage.status} />}
            </Typography>
          </div>
        </ListItem>
      ))}
    </List>
  )
}
