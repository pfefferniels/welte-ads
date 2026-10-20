import React from "react"
import Link from "next/link"
import { Box, Typography } from "@mui/material"

const REGISTERS = [
  { name: 'Persons', link: '/persons' },
  { name: 'Periodicals', link: '/periodicals' },
]

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

/** The switch between the registers, above each of them. */
export const RegisterNav = ({ current }: { current: string }) => (
  <Box component="nav" aria-label="Registers" sx={{
    display: 'flex',
    gap: 3,
    borderBottom: '1px solid #e8e4e0',
    '& a, & a:visited': {
      color: 'default.main',
      textDecoration: 'none',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontSize: '0.85rem',
      py: 1,
      borderBottom: '2px solid transparent',
      marginBottom: '-1px',
    },
    '& a[aria-current="page"]': {
      color: 'primary.main',
      borderBottomColor: 'primary.main',
      fontWeight: 600,
    },
  }}>
    {REGISTERS.map(register => (
      <Link key={register.link} href={register.link}
        aria-current={register.link === current ? 'page' : undefined}>
        {register.name}
      </Link>
    ))}
  </Box>
)

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
    <Typography variant="h5" component="h3" id={letterAnchor(initial)}
      sx={{ mt: 3, mb: 1, borderBottom: '1px solid #e8e4e0' }}>
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

/** An entry of a register: a heading, a line about it and a list. */
export const Entry = ({ id, heading, about, children }: EntryProps) => (
  <Box component="li" id={id} sx={{
    mb: 2,
    mx: -1,
    px: 1,
    py: 0.5,
    borderRadius: 1,
    scrollMarginTop: '1rem',
    // the entry that a link leads to
    '&:target': { backgroundColor: 'rgba(139, 94, 60, 0.08)' },
  }}>
    <Typography variant="h6" component="h4" sx={{ lineHeight: 1.3 }}>
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
