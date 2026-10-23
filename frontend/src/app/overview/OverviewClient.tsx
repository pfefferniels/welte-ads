"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { Box, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material"
import { dateList } from "../../lib/dates"
import type { Status } from "../../lib/tei"

interface Row {
  slug: string
  company: string
  title: string
  periodicals: { title: string; dates: string[] }[]
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

  const indexed = useMemo(() => rows.map(row => {
    const dates = row.periodicals.flatMap(periodical => periodical.dates)
    return {
      row,
      // the earliest printing decides the place of an ad in time
      first: [...dates].sort()[0] || '',
      about: fold([row.company, row.title, ...row.periodicals.map(periodical => periodical.title), ...dates].join(' ')),
      text: fold(row.text),
    }
  }), [rows])

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
            {shown.map(({ row, about }) => row.periodicals.map((periodical, j) => {
              // each periodical has a row of its own, so that its dates stay
              // beside it; the company and name of the ad span them all
              const last = j === row.periodicals.length - 1
              const printing = {
                ...(j > 0 && { pt: 0.5 }),
                ...(!last && { pb: 0.5, borderBottom: 'none' }),
              }
              return (
                <TableRow key={`${row.slug}-${j}`}>
                  {j === 0 && (
                    <>
                      <TableCell rowSpan={row.periodicals.length}>{row.company}</TableCell>
                      <TableCell rowSpan={row.periodicals.length}>
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
                    </>
                  )}
                  <TableCell sx={printing}>
                    {/* the line breaks between the items, not within one */}
                    {dateList(periodical.dates).map((item, k) => (
                      <React.Fragment key={k}>
                        {k > 0 && ', '}
                        <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{item}</Box>
                      </React.Fragment>
                    ))}
                  </TableCell>
                  <TableCell sx={printing}>{periodical.title}</TableCell>
                </TableRow>
              )
            }))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
