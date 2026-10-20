import React from 'react'
import { getAllMetadata, getTopics } from "../../lib/tei"
import type { Status } from "../../lib/tei"
import TopicClient from "./TopicClient"

export const metadata = {
  title: 'Topic',
}

export interface Segment {
  link: string
  topic: string
  text: string
  resp: string
  status: Status
}

export default function TopicPage() {
  const allMetadata = getAllMetadata()

  const segments: Segment[] = allMetadata.flatMap(meta =>
    meta.topicSegments.map(segment => ({
      link: `/${meta.slug}${segment.id}`,
      topic: segment.topic,
      text: segment.text,
      resp: segment.resp,
      status: meta.status,
    }))
  )

  return <TopicClient segments={segments} topics={getTopics()} />
}
