"use client"

import React from 'react'
import Link from 'next/link'
import { IconButton, List, ListItem, Typography } from '@mui/material'
import { LinkRounded } from '@mui/icons-material'

export interface Passage {
  // the passage within its ad
  link: string
  // the title of the ad
  ad: string
  // the words of the passage, or what the picture shows
  text: string
  picture: boolean
}

export default function TopicPassages({ passages }: { passages: Passage[] }) {
  return (
    <List>
      {passages.map((passage, i) => (
        <ListItem key={i} alignItems="flex-start">
          <IconButton
            size='small'
            component={Link}
            href={passage.link}
            aria-label={`Show in "${passage.ad}"`}
            sx={{ mr: 0.5 }}>
            <LinkRounded />
          </IconButton>
          <div>
            {passage.picture
              ? <span>Picture: {passage.text}</span>
              : <span>… <i>{passage.text}</i> …</span>}
            <Typography variant="body2" color="text.secondary">
              {passage.ad}
            </Typography>
          </div>
        </ListItem>
      ))}
    </List>
  )
}
