import React from 'react'
import { Container, Typography } from '@mui/material'
import { getAllMetadata, getTopics } from "../../lib/tei"
import { WeighedCircles } from "../../components/weighedCircles"

export const metadata = {
  title: 'Topics',
}

export default function TopicsPage() {
  // how often each topic is marked, on a passage or on a picture
  const counts = new Map<string, number>()
  for (const { topicSegments } of getAllMetadata()) {
    for (const { topic } of topicSegments) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1)
    }
  }

  const topics = getTopics()
  const weighedTopics = Array.from(counts, ([topic, weight]) => ({
    topic,
    label: topics[topic]?.label || topic,
    weight,
  }))

  return (
    <Container component="main" maxWidth="md">
      <h2>Topics</h2>
      <Typography>
        Topics are understood as recurring motifs,
        such as the illustration of a half-transparent &quot;ghost&quot;
        sitting at the piano. The area of each circle grows with
        the number of passages and pictures marked with its topic.
      </Typography>

      <WeighedCircles data={weighedTopics} />
    </Container>
  )
}
