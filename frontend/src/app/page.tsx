import React from "react"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import { getMarkdownContent } from "../lib/markdown"

export const metadata = {
  title: 'Introduction',
}

const htmlTitle = "Welte-Mignon Advertisements Collection"

const authors = [
  {
    first: "Niels",
    last: "Pfeffer",
    affiliations: ["University Tübingen"],
    orcid: "0000-0000-0000-0000",
  },
]

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

export default function HomePage() {
  const { html } = getMarkdownContent('introduction.md')

  return (
    <Container component="main" maxWidth="md">
      <Typography variant="h3" component="h2" gutterBottom={false}
        dangerouslySetInnerHTML={{ __html: htmlTitle }}
      />
      <Typography variant="h5" component="h4" gutterBottom={false}>
        Edited by{' '}
        {authors.map((a) => (
          <React.Fragment key={a.last}>
            {a.first} {a.last}, {a.affiliations.join(', ')}
            {a.orcid &&
              <a href={`https://orcid.org/${a.orcid}`} style={{ marginLeft: '.5rem' }}>
                <img src="/images/orcid.png" width={20} alt="ORCID logo" />
              </a>
            }
            <br />
          </React.Fragment>
        ))}
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
