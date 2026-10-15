import React from "react"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import { getMarkdownContent } from "../lib/markdown"
import { EDITION, EDITOR } from "../lib/site"
import OrcidLink from "../components/orcid"

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
  const { html } = getMarkdownContent('introduction.md')

  return (
    <Container component="main" maxWidth="md">
      <Typography variant="h3" component="h2" gutterBottom={false}>
        {EDITION}
      </Typography>
      <Typography variant="h5" component="h4" gutterBottom={false}>
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
