"use client"

import React, { useSyncExternalStore } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { DOI, EDITION, EDITOR, SITE_URL } from "../lib/site"
import type { Status } from "../lib/tei"

const subscribe = () => () => {}
const today = () => new Date().toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

interface Props {
  title: string
  company: string
  date: string
  path: string
  // an unchecked ad is cited as Claude's transcription
  status: Status
}

const Citation = ({ title, company, date, path, status }: Props) => {
  // the day of access is the reader's, so it is only known in the browser
  const accessed = useSyncExternalStore(subscribe, today, () => null)
  const url = SITE_URL + path
  // some titles are quotations already
  const bare = title.replace(/^"(.*)"$/, '$1')
  const transcription = status === 'unchecked'
    ? ', transcribed by Claude (AI model), not yet checked by the editor'
    : ''

  return (
    <Box component="section" sx={{ ml: 7, mt: 4 }}>
      <Typography variant="h6" component="h2">
        How to cite
      </Typography>
      <Typography variant="body2" component="p">
        {EDITOR.name} (ed.): “{bare}” ({company}, {date}){transcription}. In: <i>{EDITION}</i>,{' '}
        doi: <a href={`https://doi.org/${DOI}`}>{DOI}</a>, <a href={url}>{url}</a>
        {accessed && ` (accessed ${accessed})`}.
      </Typography>
    </Box>
  )
}

export default Citation
