import React from "react"
import { Container } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import { names } from "../../labels/names"
import OverviewClient from "./OverviewClient"

export const metadata = {
  title: 'Advertisements',
}

export default function OverviewPage() {
  const rows = getAllMetadata().map(meta => ({
    slug: meta.slug,
    company: names[meta.company.name] || meta.company.name,
    title: meta.title,
    dates: meta.dates,
    newspapers: meta.newspapers,
    text: meta.fullText,
  }))

  return (
    <Container component="main" maxWidth="md">
      <OverviewClient rows={rows} />
    </Container>
  )
}
