import React from 'react'
import { Container, Typography } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import { artistTimelines, bandwidth } from "../../lib/artists"
import { names } from "../../labels/names"
import ArtistsView from "./ArtistsView"

export const metadata = {
  title: 'Artists',
}

export default function ArtistsPage() {
  const ads = getAllMetadata()
  const { years, artists } = artistTimelines(ads)
  const h = bandwidth(ads)

  return (
    <Container component="main" maxWidth="md">
      <h2>Mentioned Artists</h2>
      <Typography>
        How much of the advertising each artist received over time. The
        thickness of a band is the artist&apos;s share of all mentions of
        artists around a year; its colour, how often the artist is mentioned
        per year around then, from blue (seldom) to red (often). An advertisement counts once, in the year of
        its first printing, however often it was printed; an artist it names
        twice counts twice. The counts are those of the advertisements in this
        collection, which is a selection.
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Few advertisements appeared in some years, so a year alone says little.
        The share around a year therefore draws on the neighbouring years as
        well, the less the further away they are (a Gaussian kernel with a
        standard deviation of {h.toLocaleString('en-GB')} years). This width is
        the one with which the other advertisements best predict the artists
        that an advertisement names (leave-one-out cross-validation). The bands
        break where no advertisements appeared for several years.
      </Typography>

      <ArtistsView
        years={years}
        artists={artists.map(artist => ({ ...artist, name: names[artist.id] || artist.id }))}
        h={h}
      />
    </Container>
  )
}
