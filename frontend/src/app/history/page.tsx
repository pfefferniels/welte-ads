import React from "react"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import { getMarkdownContent } from "../../lib/markdown"

export const metadata = {
  title: 'History',
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
  "& .footnote-backref": {
    marginLeft: ".75rem",
  },
}

export default function HistoryPage() {
  const { html } = getMarkdownContent('history.md')

  return (
    <Container component="main" maxWidth="md">
      <Typography variant="h3" component="h2" gutterBottom={false}>
        Welte-Mignon Advertisements Collection
      </Typography>
      <Typography variant="h4" component="h3" gutterBottom={false}>
        History
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
