import React from "react"
import Box from "@mui/material/Box"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import { getAllAds, getAdBySlug, getTopics } from "../../lib/tei"
import { names } from "../../labels/names"
import EditionCeteicean from "../../components/tei/EditionCeteicean"
import Citation from "../../components/citation"

export const dynamicParams = false

export async function generateStaticParams() {
  const ads = getAllAds()
  return ads.map(ad => ({ slug: ad.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ad = getAdBySlug(slug)
  return {
    title: ad.title || slug,
  }
}

export default async function AdPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ad = getAdBySlug(slug)
  const company = names[ad.company.name] || ad.company.name

  return (
    <Container component="main" maxWidth="md">
      <Box component="header" sx={{ ml: 7, mb: 3 }}>
        <Typography variant="h4" component="h1">
          {ad.title}
        </Typography>
        <Typography variant="subtitle1" component="p" sx={{ lineHeight: 1.4 }}>
          {company} · {ad.titleMain}, {ad.titleSub}
        </Typography>
      </Box>
      <EditionCeteicean
        name={ad.slug}
        prefixed={ad.prefixed}
        elements={ad.elements}
        facsimile={ad.facsimile}
        original={ad.original}
        topics={getTopics()}
        imageLinks={ad.imageLinks}
      />
      <Citation
        title={ad.title}
        company={company}
        date={ad.titleSub}
        path={`/${ad.slug}/`}
      />
    </Container>
  )
}
