"use client"

import React, { useState } from "react"
import { Box, MenuItem, TextField, Typography } from "@mui/material"
import ArtistsChart, { Artist } from "./ArtistsChart"
import type { YearTotal } from "../../lib/artists"

interface Props {
  years: YearTotal[]
  artists: Artist[]
  h: number
}

// the choices of the least number of mentions an artist needs to be shown
const THRESHOLDS = [1, 2, 3, 5, 10]

export default function ArtistsView({ years, artists, h }: Props) {
  const [least, setLeast] = useState(3)
  const shown = artists.filter(artist => artist.mentions >= least)

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mt: 3 }}>
        <TextField select size="small" label="Mentioned at least" value={least}
          onChange={event => setLeast(Number(event.target.value))}
          sx={{ minWidth: 170, '& .MuiInputBase-root': { fontSize: '1rem', pb: 0 } }}>
          {THRESHOLDS.map(n => (
            <MenuItem key={n} value={n}>{n === 1 ? 'once (all)' : `${n} times`}</MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {shown.length} of {artists.length} artists
          {least > 1 && `; ${artists.length - shown.length} mentioned fewer than ${least} times are left out`}.
        </Typography>
      </Box>

      <ArtistsChart years={years} artists={shown} scaleArtists={artists} h={h} />
    </>
  )
}
