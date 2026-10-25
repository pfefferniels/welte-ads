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
          <p>
            The readings were made in October 2026 by the model (Claude, by
            Anthropic), working as an agent that reads files and runs
            scripts, not through a scripted pipeline with a fixed prompt.
            Each reading saw the 195 advertisements as the edition
            transcribes them, in their twelve languages and with the
            editor&apos;s descriptions of the pictures, but neither the
            editor&apos;s earlier taxonomy and annotations nor the other
            readings. The first read the advertisements in the order of
            their files, the other three each in its own shuffled order.
          </p>
          <p>
            Each reading proceeded in the manner of TopicGPT. It kept a
            running list of topics, adding one only where none fitted; it
            then merged near-duplicates, dropped topics found in fewer than
            three advertisements, set purely informational content such as
            prices, addresses and dealers apart, and wrote a coding rule for
            every topic; it assigned the topics to the advertisements and
            checked them by searching all texts for keywords in every
            language. The readings found 39 to 41 topics each.
          </p>
          <p>
            The topics of the four readings were matched by the
            advertisements they had been assigned to: by the Jaccard index
            of the two sets, and, where one reading split a topic that
            another kept whole, by the share of the smaller set that lies
            in the larger. The 36 topics that at least three readings found
            make up the taxonomy, each with its coding rule as its
            description. The model then marked the passages and pictures
            that express a topic in every advertisement, taking the topics
            that the readings had given it as suggestions, and a script
            checked that the transcription was left unchanged and that
            every file was still valid against the schema.
          </p>
        </Footnote>
        {' '}and then assigned by it; the editor has not yet checked them. The area
        of each circle grows with the number of passages and pictures
        marked with its topic.
      </Typography>

      <WeighedCircles data={weighedTopics} />
    </Container>
  )
}
