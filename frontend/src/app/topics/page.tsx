import React from 'react'
import { Container, Typography } from '@mui/material'
import { getAllMetadata, getTopics } from "../../lib/tei"
import { WeighedCircles } from "../../components/weighedCircles"
import Footnote from "../../components/footnote"

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
      <h1>Topics</h1>
      <Typography>
        Topics are the recurring arguments and motifs of the advertisements,
        such as the promise that the great pianists play in your own home,
        or the phantom hands at the keyboard. They were found by a large
        language model in four blind readings of all advertisements
        <Footnote mark="1">
          The readings were done similarly to TopicGPT: Chau Minh Pham,
          Alexander Hoyle, Simeng Sun, Philip Resnik and Mohit Iyyer,
          &ldquo;TopicGPT: A Prompt-based Topic Modeling Framework&rdquo;,
          in <i>Proceedings of the 2024 Conference of the North American
          Chapter of the Association for Computational Linguistics: Human
          Language Technologies</i>, vol. 1, Mexico City 2024,
          pp. 2956&ndash;2984,{' '}
          <a href="https://doi.org/10.18653/v1/2024.naacl-long.164">doi:10.18653/v1/2024.naacl-long.164</a>.
        </Footnote>
        {' '}and then assigned by it; the editor has not yet checked them. The area
        of each circle grows with the number of passages and pictures
        marked with its topic.
      </Typography>

      <WeighedCircles data={weighedTopics} />
    </Container>
  )
}
