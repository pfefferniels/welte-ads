import React from "react"
import Container from "@mui/material/Container"
import { getAllAds, getAdBySlug } from "../../lib/tei"
import EditionCeteicean from "../../components/tei/EditionCeteicean"

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

  return (
    <Container component="main" maxWidth="md">
      <EditionCeteicean
        name={ad.slug}
        prefixed={ad.prefixed}
        elements={ad.elements}
        original={ad.original}
      />
    </Container>
  )
}
