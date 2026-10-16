"use client"

import React, { useState } from "react"
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from "@mui/material"
import theme from "../../theme"

interface Share {
  mentions: number
  share: number
}

interface Row {
  id: string
  name: string
  periods: Share[]
  total: Share
}

interface Column {
  label: string
  ads: number
  mentions: number
}

interface Props {
  rows: Row[]
  columns: Column[]
}

// "name", a period's index, or "total"
type SortKey = 'name' | number | 'total'

const percent = (share: number) =>
  `${(100 * share).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

const Bar = ({ share, max, title }: { share: number; max: number; title: string }) => (
  <Box title={title} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '9rem' }}>
    <Box sx={{ width: '5.5rem', flex: 'none' }}>
      {share > 0 && (
        <Box sx={{
          height: 8,
          width: `${Math.max(2, 100 * share / max)}%`,
          background: theme.palette.primary.main,
          borderRadius: '0 4px 4px 0',
        }} />
      )}
    </Box>
    <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums', color: share > 0 ? 'text.primary' : 'text.disabled' }}>
      {share > 0 ? percent(share) : '–'}
    </Box>
  </Box>
)

export default function ArtistsTable({ rows, columns }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'total', asc: false })

  const value = (row: Row) =>
    sort.key === 'name' ? row.name : sort.key === 'total' ? row.total.share : row.periods[sort.key].share
  const sorted = [...rows].sort((a, b) => {
    const x = value(a), y = value(b)
    const order = typeof x === 'string' ? x.localeCompare(y as string, 'en') : (x as number) - (y as number)
    return (sort.asc ? 1 : -1) * order || a.name.localeCompare(b.name, 'en')
  })

  // one scale for every cell, so that the periods compare
  const max = Math.max(...rows.flatMap(row => row.periods.map(p => p.share)))

  const header = (key: SortKey, label: React.ReactNode) => (
    <TableSortLabel
      active={sort.key === key}
      direction={sort.key === key && sort.asc ? 'asc' : 'desc'}
      onClick={() => setSort(s => ({ key, asc: s.key === key ? !s.asc : key === 'name' }))}
    >
      {label}
    </TableSortLabel>
  )

  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell>{header('name', 'Artist')}</TableCell>
            {columns.map((column, i) => (
              <TableCell key={column.label}>
                {header(i, (
                  <span>
                    {column.label}
                    <Box component="span" sx={{ display: 'block', fontSize: '0.8em', color: 'text.secondary', fontWeight: 400 }}>
                      {column.ads} ads · {column.mentions} mentions
                    </Box>
                  </span>
                ))}
              </TableCell>
            ))}
            <TableCell>{header('total', 'All periods')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map(row => (
            <TableRow key={row.id} hover>
              <TableCell>
                <a href={row.id}>{row.name}</a>
              </TableCell>
              {row.periods.map((p, i) => (
                <TableCell key={i}>
                  <Bar share={p.share} max={max}
                    title={`${row.name}: ${p.mentions} of ${columns[i].mentions} mentions, ${columns[i].label}`} />
                </TableCell>
              ))}
              <TableCell>
                <Bar share={row.total.share} max={max}
                  title={`${row.name}: ${row.total.mentions} mentions in all`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
