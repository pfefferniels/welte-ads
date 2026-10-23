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
    periodicals: meta.periodicals,
    text: meta.fullText,
    status: meta.status,
  }))

  return (
    <Container component="main" maxWidth="md">
      <h1>Advertisements</h1>
      <OverviewClient rows={rows} />
    </Container>
  )
}
