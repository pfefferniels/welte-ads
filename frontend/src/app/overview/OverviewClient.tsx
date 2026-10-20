"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { Box, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material"
import type { Status } from "../../lib/tei"

interface Row {
  slug: string
  company: string
  title: string
  dates: string[]
  newspapers: string[]
  text: string
  status: Status
}

type Column = 'company' | 'title' | 'date'

// which ads the table shows: all, or only the checked or unchecked ones
type Filter = 'all' | Status

const UNCHECKED = 'Transcribed, encoded and annotated by Claude, an AI model; not yet checked against the scan by the editor'

// the mark of an ad that the editor has not yet checked
const Unchecked = () => (
  <Chip component="span" label="unchecked" size="small" variant="outlined" sx={{ height: 20, verticalAlign: 'text-bottom' }} />
)

// "1913-11-15" → "15 November 1913", "1913-11" → "November 1913"
const formatDate = (iso: string) => {
  const [year, month, day] = iso.split('-')
  if (!month) return year
  const name = new Date(Date.UTC(Number(year), Number(month) - 1))
    .toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })
  return [day && String(Number(day)), name, year].filter(Boolean).join(' ')
}

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
  const [filter, setFilter] = useState<Filter>('all')

  const counts: Record<Filter, number> = {
    all: rows.length,
    checked: rows.filter(row => row.status === 'checked').length,
    unchecked: rows.filter(row => row.status === 'unchecked').length,
  }

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
    .filter(({ row }) => filter === 'all' || row.status === filter)
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={filter}
          onChange={(_, value) => value && setFilter(value as Filter)}
          aria-label="Show advertisements"
          sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontSize: '1rem', py: 0.25 } }}
        >
          <ToggleButton value="all">All ({counts.all})</ToggleButton>
          <ToggleButton value="checked">Checked ({counts.checked})</ToggleButton>
          <ToggleButton value="unchecked">Unchecked ({counts.unchecked})</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" component="p" sx={{ flex: '1 1 20rem', color: 'text.secondary' }}>
          Ads marked <Unchecked /> were transcribed, encoded and annotated by
          Claude, an AI model, and are not yet checked against the scan by the
          editor (see the <Link href="/guidelines/">guidelines</Link>).
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
                  {row.status === 'unchecked' && (
                    <>
                      {' '}
                      <Tooltip title={UNCHECKED}>
                        <span><Unchecked /></span>
                      </Tooltip>
                    </>
                  )}
                  {q && !about.includes(q) && (
                    <Typography variant="body2" component="div" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      {snippet(row.text, q)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {row.dates.map((date, j) => <Box key={j} sx={{ whiteSpace: 'nowrap' }}>{formatDate(date)}</Box>)}
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
