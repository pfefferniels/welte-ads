"use client"

import React, { useSyncExternalStore } from 'react'
import { Container, IconButton, List, ListItem, Typography } from '@mui/material'
import { LinkRounded } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import type { Topic } from '../../lib/tei'

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

interface Segment {
  link: string
  topic: string
  text: string
}

interface Props {
  segments: Segment[]
  topics: Record<string, Topic>
}

export default function TopicClient({ segments, topics }: Props) {
  const router = useRouter()
  const topic = useSyncExternalStore(subscribe, () => window.location.hash, () => '')

  const filtered = segments.filter(segment => segment.topic === topic)

  return (
    <Container component="main" maxWidth="md">
      <h2>
        Topic &quot;{topics[topic]?.label || topic}&quot;
      </h2>
      <div>
        <Typography>
          {topics[topic]?.description || 'no description available'}
        </Typography>

        <List>
          {filtered.map((segment, i) => (
            <ListItem key={`segment${i}`}>
              <IconButton size='small' onClick={() => router.push(segment.link)}>
                <LinkRounded />
              </IconButton>
              <span color='gray'>...
                <i> {segment.text} </i>
                ...</span>
            </ListItem>
          ))}
        </List>
      </div>
    </Container>
  )
}
