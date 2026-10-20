"use client"

import React, { useSyncExternalStore } from 'react'
import { Chip, Container, IconButton, List, ListItem, Tooltip, Typography } from '@mui/material'
import { LinkRounded } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import type { Status, Topic } from '../../lib/tei'

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

interface Segment {
  link: string
  topic: string
  text: string
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

interface Props {
  segments: Segment[]
  topics: Record<string, Topic>
}

export default function TopicClient({ segments, topics }: Props) {
  const router = useRouter()
  const topic = useSyncExternalStore(subscribe, () => window.location.hash, () => '')

  const filtered = segments.filter(segment => segment.topic === topic)
  const byClaude = filtered.filter(segment => segment.resp === '#claude').length

  return (
    <Container component="main" maxWidth="md">
      <h2>
        Topic &quot;{topics[topic]?.label || topic}&quot;
      </h2>
      <div>
        <Typography>
          {topics[topic]?.description || 'no description available'}
        </Typography>
        {byClaude > 0 && (
          <Typography variant="body2" component="p" sx={{ color: 'text.secondary' }}>
            Passages marked AI ({byClaude} of {filtered.length}) were assigned
            to this topic by Claude, an AI model.
          </Typography>
        )}

        <List>
          {filtered.map((segment, i) => (
            <ListItem key={`segment${i}`}>
              <IconButton size='small' onClick={() => router.push(segment.link)}>
                <LinkRounded />
              </IconButton>
              <span color='gray'>...
                <i> {segment.text} </i>
                ...</span>
              {segment.resp === '#claude' && <ByClaude status={segment.status} />}
            </ListItem>
          ))}
        </List>
      </div>
    </Container>
  )
}
