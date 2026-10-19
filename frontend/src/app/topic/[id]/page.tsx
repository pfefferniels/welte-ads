import React from 'react'
import { Container, Typography } from '@mui/material'
import { getAllMetadata, getTopics } from "../../../lib/tei"
import TopicPassages, { Passage } from "./TopicPassages"

interface Props {
  params: Promise<{ id: string }>
}

export const dynamicParams = false

// the topics as they are defined, and any that an ad marks without a definition
export async function generateStaticParams() {
  const marked = getAllMetadata().flatMap(meta => meta.topicSegments.map(segment => segment.topic))
  const topics = new Set([...Object.keys(getTopics()), ...marked].map(topic => topic.replace(/^#/, '')))
  return Array.from(topics, id => ({ id }))
}

const labelOf = (id: string) => getTopics()[`#${id}`]?.label || id

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  return {
    title: `Topic "${labelOf(id)}"`,
  }
}

export default async function TopicPage({ params }: Props) {
  const { id } = await params
  const description = getTopics()[`#${id}`]?.description

  const passages: Passage[] = getAllMetadata().flatMap(meta => meta.topicSegments
    .filter(segment => segment.topic === `#${id}`)
    .map(segment => ({
      link: `/${meta.slug}${segment.id}`,
      ad: meta.title,
      text: segment.text,
      picture: segment.picture,
    })))

  return (
    <Container component="main" maxWidth="md">
      <h2>
        Topic &quot;{labelOf(id)}&quot;
      </h2>
      <div>
        <Typography>
          {description || 'no description available'}
        </Typography>

        <TopicPassages passages={passages} />
      </div>
    </Container>
  )
}
