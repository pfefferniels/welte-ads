"use client"

import React, { useSyncExternalStore } from 'react'
import { Container, IconButton, List, ListItem } from '@mui/material'
import { LinkRounded } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { topicLabels } from '../../labels/topicLabels'
import { topicDescriptions } from '../../labels/topicDescriptions'

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
}

export default function TopicClient({ segments }: Props) {
  const router = useRouter()
  const topic = useSyncExternalStore(subscribe, () => window.location.hash, () => '')

  const filtered = segments.filter(segment => segment.topic === topic)

  return (
    <Container component="main" maxWidth="md">
      <h2>
        Topic &quot;{topicLabels[topic] || topic}&quot;
      </h2>
      <div>
        {topicDescriptions[topic] || 'no description available'}

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
