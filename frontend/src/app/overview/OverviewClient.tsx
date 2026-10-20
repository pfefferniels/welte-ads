"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, Typography } from "@mui/material"
import { formatDate } from "../../lib/dates"

interface Row {
  slug: string
  company: string
  title: string
  dates: string[]
  newspapers: string[]
  text: string
}

type Column = 'company' | 'title' | 'date'

// lower case and without accents, so that "dohnanyi" finds "Dohnányi"
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// the passage around the first place where the text matches
const snippet = (text: string, query: string) => {
  const at = fold(text).indexOf(query)
  if (at < 0) return null
  const start = Math.max(0, text.lastIndexOf(' ', Math.max(0, at - 60)))
  const end = Math.min(text.length, at + query.length + 60)
  return (
    <>
      {start > 0 && '… '}
      {text.slice(start, at).trimStart()}
      <mark>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length, end)}
      {end < text.length && ' …'}
    </>
  )
}

export default function OverviewClient({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ by: Column; asc: boolean }>({ by: 'date', asc: true })

  const indexed = useMemo(() => rows.map(row => ({
    row,
    // the earliest printing decides the place of an ad in time
    first: [...row.dates].sort()[0] || '',
    about: fold([row.company, row.title, ...row.newspapers, ...row.dates].join(' ')),
    text: fold(row.text),
  })), [rows])

  const value = (entry: typeof indexed[number]) =>
    sort.by === 'date' ? entry.first : sort.by === 'company' ? entry.row.company : entry.row.title

  const q = fold(query.trim())
  const shown = indexed
    .filter(({ about, text }) => !q || about.includes(q) || text.includes(q))
    .sort((a, b) => (sort.asc ? 1 : -1) * value(a).localeCompare(value(b), 'en')
      // within one advertiser or name, earlier ads first
      || a.first.localeCompare(b.first))

  const header = (column: Column, label: string) => (
    <TableSortLabel
      active={sort.by === column}
      direction={sort.by === column && !sort.asc ? 'desc' : 'asc'}
      onClick={() => setSort(s => ({ by: column, asc: s.by === column ? !s.asc : true }))}
    >
      {label}
    </TableSortLabel>
  )

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 2, mb: 2 }}>
        <TextField
          id="search"
          label="Search the advertisements"
          placeholder="e.g. Paderewski, phantom, 1926, Vogue"
          value={query}
          onChange={e => setQuery(e.target.value)}
          size="small"
          // the theme pads all body text below, the input included
          sx={{ flex: '1 1 20rem', '& .MuiInputBase-root': { paddingBottom: 0 } }}
        />
        <Typography variant="body2" component="p" aria-live="polite">
          {shown.length === rows.length
            ? `${rows.length} advertisements`
            : `${shown.length} of ${rows.length} advertisements`}
        </Typography>
      </Box>
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>{header('company', 'Company')}</TableCell>
              <TableCell>{header('title', 'Name')}</TableCell>
              <TableCell>{header('date', 'Dates')}</TableCell>
              <TableCell>Newspapers</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map(({ row, about }) => (
              <TableRow key={row.slug}>
                <TableCell>{row.company}</TableCell>
                <TableCell>
                  <Link href={`/${row.slug}`}>{row.title}</Link>
                  {q && !about.includes(q) && (
                    <Typography variant="body2" component="div" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      {snippet(row.text, q)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {row.dates.map((date, j) => <div key={j}>{formatDate(date)}</div>)}
                </TableCell>
                <TableCell>
                  {row.newspapers.map((newspaper, j) => <div key={j}>{newspaper}</div>)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
