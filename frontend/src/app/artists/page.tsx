import React from 'react'
import { Container, Typography } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import { artistShares, artistTimelines, PERIODS } from "../../lib/artists"
import { names } from "../../labels/names"
import ArtistsView from "./ArtistsView"

export const metadata = {
  title: 'Artists',
}

export default function ArtistsPage() {
  const ads = getAllMetadata()
  const { rows, totals } = artistShares(ads)
  const { years, artists } = artistTimelines(ads)
  const name = (id: string) => names[id] || id

  return (
    <Container component="main" maxWidth="md">
      <h2>Mentioned Artists</h2>
      <Typography>
        How often the advertisements mention an artist, by the year in which
        an advertisement was first printed. An advertisement counts once,
        however often it was printed; an artist it names twice counts twice.
        The circles can also show an artist&apos;s share of all mentions of
        artists in a year, and the table their share in three periods. The
        counts are those of the advertisements in this collection, which is
        a selection.
      </Typography>

      <ArtistsView
        years={years}
        artists={artists.map(artist => ({ ...artist, name: name(artist.id) }))}
        periods={rows.map(row => ({ ...row, name: name(row.id) }))}
        columns={PERIODS.map((period, i) => ({ label: period.label, ...totals[i] }))}
      />
    </Container>
  )
}
