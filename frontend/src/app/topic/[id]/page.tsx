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
      resp: segment.resp,
      status: meta.status,
    })))
  const byModel = passages.filter(passage => passage.resp === '#claude').length

  return (
    <Container component="main" maxWidth="md">
      <h1>
        Topic &quot;{labelOf(id)}&quot;
      </h1>
      <div>
        <Typography>
          {description || 'no description available'}
        </Typography>
        {byModel > 0 && (
          <Typography variant="body2" component="p" sx={{ color: 'text.secondary' }}>
            Passages marked AI ({byModel} of {passages.length}) were assigned
            to this topic by a large language model.
          </Typography>
        )}

        <TopicPassages passages={passages} />
      </div>
    </Container>
  )
}
