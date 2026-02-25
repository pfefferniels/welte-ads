import React from 'react'
import { Container, Typography } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import TopicsClient from "./TopicsClient"

export const metadata = {
  title: 'Topics',
}

interface Segment {
  topic: string
}

export default function TopicsPage() {
  const allMetadata = getAllMetadata()

  const unorderedTopics = allMetadata
    .map(m => m.topicSegments as Segment[])
    .flat()
    .map((segment: Segment) => segment.topic)

  const counts = unorderedTopics.reduce((acc: Record<string, number>, value: string) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})

  const weighedTopics = Object.keys(counts).map(key => ({
    topic: key,
    weight: counts[key]
  }))

  return (
    <Container component="main" maxWidth="md">
      <h2>Topics</h2>
      <Typography>
        Topics are understood as recurring motifs,
        such as the illustration of a half-transparent &quot;ghost&quot;
        sitting at the piano.
      </Typography>

      <TopicsClient data={weighedTopics} />
    </Container>
  )
}
