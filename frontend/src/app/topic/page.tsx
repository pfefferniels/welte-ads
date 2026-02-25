import React from 'react'
import { getAllMetadata } from "../../lib/tei"
import TopicClient from "./TopicClient"

export const metadata = {
  title: 'Topic',
}

export interface Segment {
  link: string
  topic: string
  text: string
}

export default function TopicPage() {
  const allMetadata = getAllMetadata()

  const segments: Segment[] = allMetadata.flatMap(meta =>
    meta.topicSegments.map(segment => ({
      link: `/${meta.slug}${segment.id}`,
      topic: segment.topic,
      text: segment.text,
    }))
  )

  return <TopicClient segments={segments} />
}
