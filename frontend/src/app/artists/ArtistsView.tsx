"use client"

import React, { useState } from "react"
import { Box, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import ArtistsChart, { Artist, Size } from "./ArtistsChart"
import ArtistsTable from "./ArtistsTable"

type TableProps = React.ComponentProps<typeof ArtistsTable>

interface Props {
  years: React.ComponentProps<typeof ArtistsChart>['years']
  artists: Artist[]
  periods: TableProps['rows']
  columns: TableProps['columns']
}

type View = 'chart' | 'table'

// the choices of the least number of mentions an artist needs to be shown
const THRESHOLDS = [1, 2, 3, 5, 10]

export default function ArtistsView({ years, artists, periods, columns }: Props) {
  const [view, setView] = useState<View>('chart')
  const [size, setSize] = useState<Size>('mentions')
  const [least, setLeast] = useState(3)

  const shown = artists.filter(artist => artist.mentions >= least)
  const ids = new Set(shown.map(artist => artist.id))

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mt: 3 }}>
        <ToggleButtonGroup size="small" exclusive value={view} aria-label="View"
          onChange={(_, value) => value && setView(value as View)}>
          <ToggleButton value="chart">Chart</ToggleButton>
          <ToggleButton value="table">Table by period</ToggleButton>
        </ToggleButtonGroup>
        {view === 'chart' && (
          <ToggleButtonGroup size="small" exclusive value={size} aria-label="Size of the circles"
            onChange={(_, value) => value && setSize(value as Size)}>
            <ToggleButton value="mentions">Mentions</ToggleButton>
            <ToggleButton value="share">Share of the year</ToggleButton>
          </ToggleButtonGroup>
        )}
        <TextField select size="small" label="Mentioned at least" value={least}
          onChange={event => setLeast(Number(event.target.value))} sx={{ minWidth: 170, '& .MuiInputBase-root': { fontSize: '1rem', pb: 0 } }}>
          {THRESHOLDS.map(n => (
            <MenuItem key={n} value={n}>{n === 1 ? 'once (all)' : `${n} times`}</MenuItem>
          ))}
        </TextField>
      </Box>
      <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
        {shown.length} of {artists.length} artists
        {least > 1 && `; ${artists.length - shown.length} mentioned fewer than ${least} times are left out`}.
      </Typography>

      {view === 'chart'
        ? <ArtistsChart years={years} artists={shown} scaleArtists={artists} size={size} />
        : <ArtistsTable rows={periods.filter(row => ids.has(row.id))} columns={columns} />}
    </>
  )
}
