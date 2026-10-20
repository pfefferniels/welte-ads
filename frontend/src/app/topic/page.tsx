import React from 'react'
import Link from 'next/link'
import { Container, Typography } from '@mui/material'
import TopicRedirect from "./TopicRedirect"

export const metadata = {
  title: 'Topic',
}

// Each topic has its own page now; this one only keeps the links working
// that told the topics apart by the fragment (/topic/#home).
export default function TopicIndexPage() {
  return (
    <Container component="main" maxWidth="md">
      <TopicRedirect />
      <h1>Topic</h1>
      <Typography>
        See the <Link href="/topics">overview of the topics</Link>.
      </Typography>
    </Container>
  )
}
