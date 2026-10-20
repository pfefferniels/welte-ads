import React from "react"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import OrcidLink from "../../components/orcid"
import { EDITION, EDITOR } from "../../lib/site"

export const metadata = {
  title: 'Imprint',
}

export default function ImprintPage() {
  return (
    <Container component="main" maxWidth="md">
      <Typography variant="h3" component="p" gutterBottom={false}>
        {EDITION}
      </Typography>
      <Typography variant="h4" component="h1" gutterBottom>
        Imprint
      </Typography>

      <Typography variant="h6" component="h2">
        Editor and contact
      </Typography>
      <Typography variant="body1" component="p">
        {EDITOR.name}, {EDITOR.affiliation}
        <br />
        E-mail: <a href={`mailto:${EDITOR.email}`}>{EDITOR.email}</a>
        <br />
        ORCID:<OrcidLink id={EDITOR.orcid} showId />
      </Typography>

      <Typography variant="h6" component="h2">
        Licences
      </Typography>
      <Typography variant="body1" component="p">
        The TEI encodings of the advertisements are published under
        the <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">Creative
        Commons Attribution-NonCommercial-ShareAlike 4.0 International
        License</a>. The source code of the website is published under
        the MIT License. Both are available
        on <a href="https://github.com/pfefferniels/welte-ads">GitHub</a>.
      </Typography>
    </Container>
  )
}
