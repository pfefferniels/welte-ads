import React from "react"
import Link from "next/link"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material"
import { getMarkdownContent } from "../../lib/markdown"
import { getEncodingDescription } from "../../lib/encoding"
import { getTopics } from "../../lib/tei"
import { EDITION } from "../../lib/site"

export const metadata = {
  title: 'Guidelines',
}

const contentStyles = {
  "& code": {
    fontSize: "0.9em",
  },
}

const Paragraphs = ({ paragraphs }: { paragraphs: string[] }) => (
  <>
    {paragraphs.map((html, i) => (
      <Typography key={i} variant="body1" component="p" sx={contentStyles}
        dangerouslySetInnerHTML={{ __html: html }} />
    ))}
  </>
)

export default function GuidelinesPage() {
  const { selection, principles, renditions } = getEncodingDescription()
  const topics = Object.entries(getTopics())
  const { html: example } = getMarkdownContent('guidelines.md')

  return (
    <Container component="main" maxWidth="md">
      <Typography variant="h3" component="h2" gutterBottom={false}>
        {EDITION}
      </Typography>
      <Typography variant="h4" component="h3" gutterBottom>
        Guidelines
      </Typography>
      <Typography variant="body1" component="p">
        The principles below are those that every TEI file of the collection
        states in its <code>&lt;encodingDesc&gt;</code>.
      </Typography>
      <Typography variant="body1" component="p" sx={contentStyles}>
        The files follow the project schema, <code>tei/schema/welte-ads.rng</code>,
        which is generated from the ODD{' '}
        <a href="https://github.com/pfefferniels/welte-ads/blob/main/tei/schema/welte-ads.odd"><code>tei/schema/welte-ads.odd</code></a>:
        a customisation of TEI P5 4.12.0 that admits only the elements the
        collection uses and documents how it uses them. The files are also
        valid against <code>tei_all</code>.
      </Typography>

      <Typography variant="h5" component="h3">Selection</Typography>
      <Paragraphs paragraphs={selection} />

      {principles.map(section => (
        <React.Fragment key={section.heading}>
          <Typography variant="h5" component="h3">{section.heading}</Typography>
          <Paragraphs paragraphs={section.paragraphs} />
        </React.Fragment>
      ))}

      <Typography variant="h5" component="h3">Typography</Typography>
      <Typography variant="body1" component="p">
        The values of <code>@rendition</code> are defined in CSS:
      </Typography>
      <Table size="small" sx={{ mb: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell>Value</TableCell>
            <TableCell>Meaning (CSS)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {renditions.map(({ id, css }) => (
            <TableRow key={id}>
              <TableCell><code>#{id}</code></TableCell>
              <TableCell><code>{css}</code></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography variant="h5" component="h3">Topics</Typography>
      <Typography variant="body1" component="p">
        The topics are:{' '}
        {topics.map(([key, topic], i) => (
          <React.Fragment key={key}>
            {i > 0 && ', '}
            <Link href={`/topic/${key}`}>{topic.label}</Link>
          </React.Fragment>
        ))}.
      </Typography>

      <Typography
        sx={contentStyles}
        variant="body1"
        gutterBottom
        component="div"
        dangerouslySetInnerHTML={{ __html: example }}
      />
    </Container>
  )
}
