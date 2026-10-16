import React from 'react'
import { Container, Typography } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import { artistShares, PERIODS } from "../../lib/artists"
import { names } from "../../labels/names"
import ArtistsTable from "./ArtistsTable"

export const metadata = {
  title: 'Artists',
}

export default function ArtistsPage() {
  const { rows, totals } = artistShares(getAllMetadata())

  return (
    <Container component="main" maxWidth="md">
      <h2>Mentioned Artists</h2>
      <Typography>
        How much of the advertising each artist received: their share of
        all mentions of artists in the advertisements of a period. An
        advertisement counts once, in the year of its first printing,
        however often it was printed; an artist it names twice counts twice.
        The shares are those of the advertisements in this collection,
        which is a selection.
      </Typography>

      <ArtistsTable
        rows={rows.map(row => ({ ...row, name: names[row.id] || row.id }))}
        columns={PERIODS.map((period, i) => ({ label: period.label, ...totals[i] }))}
      />
    </Container>
  )
}
