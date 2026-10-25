import React from "react"
import Link from "next/link"
import Box from "@mui/material/Box"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import { getAllAds, getAdBySlug, getTopics } from "../../lib/tei"
import { names } from "../../labels/names"
import { authorityOf } from "../../lib/anchors"
import { EDITOR } from "../../lib/site"
import { currentRelease } from "../../lib/release"
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
  // the editor of the collection edits every ad, though the older files
  // name him only as their transcriber
  const contributors = ad.contributors.some(c => c.role === 'Editor')
    ? ad.contributors
    : [{ role: 'Editor', name: EDITOR.name }, ...ad.contributors]

  return (
    <Container component="main" maxWidth="md">
      <Box component="header" sx={{ ml: 7, mb: 3 }}>
        <Typography variant="h4" component="h1">
          {ad.title}
        </Typography>
        <Typography variant="subtitle1" component="p" sx={{ lineHeight: 1.4 }}>
          {ad.company.uri
            ? <a href={ad.company.uri} title={authorityOf(ad.company.uri) ?? undefined}>{company}</a>
            : company} · {ad.titleMain}, {ad.titleSub}
        </Typography>
        <Typography variant="body2" component="p" sx={{ mt: 1, color: 'text.secondary' }}>
          {contributors.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && ' · '}
              {c.role}: {c.name}
            </React.Fragment>
          ))}
        </Typography>
        {ad.status === 'unchecked' && (
          <Box role="note" sx={{
            mt: 2,
            px: 2,
            py: 1,
            borderLeft: 3,
            borderColor: 'primary.main',
          }}>
            <Typography variant="body2" component="p">
              Transcribed, encoded and annotated by Claude, an AI model. Not
              yet checked against the scan by the editor
              (see the <Link href="/guidelines/">guidelines</Link>).
            </Typography>
          </Box>
        )}
      </Box>
      <EditionCeteicean
        name={ad.slug}
        prefixed={ad.prefixed}
        elements={ad.elements}
        facsimile={ad.facsimile}
        topics={getTopics()}
        imageLinks={ad.imageLinks}
      >
        <div dangerouslySetInnerHTML={{ __html: ad.textHtml }} />
      </EditionCeteicean>
      <Citation
        slug={ad.slug}
        title={ad.title}
        company={company}
        date={ad.titleSub}
        status={ad.status}
        year={currentRelease().date?.slice(0, 4) || null}
      />
    </Container>
  )
}
