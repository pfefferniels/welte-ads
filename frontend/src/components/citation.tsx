"use client"

import React, { useSyncExternalStore } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

const EDITOR = "Niels Pfeffer"
const EDITION = "Welte-Mignon Advertisements Collection"
const SITE_URL = "https://anz.welte225.org"

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
}

const Citation = ({ title, company, date, path }: Props) => {
  // the day of access is the reader's, so it is only known in the browser
  const accessed = useSyncExternalStore(subscribe, today, () => null)
  const url = SITE_URL + path
  // some titles are quotations already
  const bare = title.replace(/^"(.*)"$/, '$1')

  return (
    <Box component="section" sx={{ ml: 7, mt: 4 }}>
      <Typography variant="h6" component="h2">
        How to cite
      </Typography>
      <Typography variant="body2" component="p">
        {EDITOR} (ed.): “{bare}” ({company}, {date}). In: <i>{EDITION}</i>,{' '}
        <a href={url}>{url}</a>
        {accessed && ` (accessed ${accessed})`}.
      </Typography>
    </Box>
  )
}

export default Citation
