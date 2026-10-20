import React from "react"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import { getMarkdownContent } from "../lib/markdown"
import { getAllMetadata } from "../lib/tei"
import { EDITION, EDITOR } from "../lib/site"
import OrcidLink from "../components/orcid"
import JsonLd from "../components/jsonld"
import { datasetJsonLd } from "../lib/dataset"

export const metadata = {
  title: 'Introduction',
}

const contentStyles = {
  "& p": {
    textIndent: "2rem",
  },
  "& p:first-of-type, & h2 + p, & h3 + p, & h4 + p, & h5 + p, & h6 + p, & .noindent p": {
    textIndent: "0",
  },
  "& blockquote": {
    marginLeft: "5rem",
  },
  "& .data-footnote-backref": {
    marginLeft: ".75rem",
  },
}

export default function HomePage() {
  const ads = getAllMetadata()
  const printings = ads.flatMap(ad => ad.dates)
  const years = printings.map(date => Number(date.slice(0, 4)))
  const size = `At present, the collection holds ${ads.length} advertisements `
    + `in ${printings.length} printings from ${Math.min(...years)} to ${Math.max(...years)}.`
  const html = getMarkdownContent('introduction.md').html.replace('{{size}}', size)

  return (
    <Container component="main" maxWidth="md">
      <JsonLd data={datasetJsonLd(ads.length)} />
      <Typography variant="h3" component="h1" gutterBottom={false}>
        {EDITION}
      </Typography>
      <Typography variant="h5" component="p" gutterBottom={false}>
        Edited by {EDITOR.name}, {EDITOR.affiliation}
        <OrcidLink id={EDITOR.orcid} />
      </Typography>
      <Typography
        sx={contentStyles}
        variant="body1"
        gutterBottom
        component="div"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Container>
  )
}
