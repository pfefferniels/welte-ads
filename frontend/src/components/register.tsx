import React from "react"
import { Box, Typography } from "@mui/material"

// "1 ad", "2 ads"
export const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

const letterAnchor = (initial: string) => `letter-${initial.toLowerCase()}`

/** The entries filed under each initial, in the order given. */
export function byInitial<T extends { initial: string }>(entries: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>()
  for (const entry of entries) {
    groups.set(entry.initial, [...(groups.get(entry.initial) || []), entry])
  }
  return Array.from(groups)
}

/** Links to the initials under which the entries are filed. */
export const Initials = ({ initials, children }: { initials: string[]; children?: React.ReactNode }) => (
  <Box component="nav" aria-label="Initials" sx={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.25rem 0.9rem',
    mb: 3,
    fontSize: '1.1rem',
  }}>
    {initials.map(initial => (
      <a key={initial} href={`#${letterAnchor(initial)}`}>{initial}</a>
    ))}
    {children}
  </Box>
)

/** The entries filed under one initial. */
export const Letter = ({ initial, children }: { initial: string; children: React.ReactNode }) => (
  <section>
    <Typography variant="h5" component="h2" id={letterAnchor(initial)}
      sx={{ mt: 3, mb: 1, borderBottom: 1, borderColor: 'divider' }}>
      {initial}
    </Typography>
    <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
      {children}
    </Box>
  </section>
)

interface EntryProps {
  // the anchor of the entry
  id: string
  heading: string
  // a line about the entry, below its heading
  about: React.ReactNode
  // the items listed, each an <li>
  children: React.ReactNode
}

// the style of an entry, which is highlighted when a link leads to it
export const entryStyle = {
  mb: 2,
  mx: -1,
  px: 1,
  py: 0.5,
  borderRadius: 1,
  scrollMarginTop: '1rem',
  '&:target': { bgcolor: 'action.selected' },
}

/** An entry of a register: a heading, a line about it and a list. */
export const Entry = ({ id, heading, about, children }: EntryProps) => (
  <Box component="li" id={id} sx={entryStyle}>
    <Typography variant="h6" component="h3" sx={{ lineHeight: 1.3 }}>
      {heading}
    </Typography>
    <Typography variant="body2" component="p" sx={{ color: 'text.secondary' }}>
      {about}
    </Typography>
    <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5, fontSize: '1rem', listStyleType: 'disc', '& li': { mb: 0.25 } }}>
      {children}
    </Box>
  </Box>
)
