import React from 'react'
import { Container, Typography } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import { artistBands, groupYears } from "../../lib/artists"
import { names } from "../../labels/names"
import ArtistsView from "./ArtistsView"

export const metadata = {
  title: 'Artists',
}

export default function ArtistsPage() {
  const ads = getAllMetadata()
  const groups = groupYears(ads)
  const artists = artistBands(ads, groups)

  return (
    <Container component="main" maxWidth="md">
      <h2>Mentioned Artists</h2>
      <Typography>
        How much of the advertising each artist received over time. The
        thickness of a band is the artist&apos;s share of all mentions of
        artists in a group of years. An advertisement counts once, in the
        year of its first printing, however often it was printed; an artist
        it names twice counts twice. The counts are those of the
        advertisements in this collection, which is a selection.
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        The years are grouped by Fisher&apos;s optimal grouping (&ldquo;Jenks
        natural breaks&rdquo;) of the years of all mentions, which keeps the
        variance of the years within the groups as small as possible. There
        are {groups.length} groups, because a further one would explain less
        than one per cent more of the variance. Between the groups, the bands
        are smoothed; they break where no advertisements appeared for several
        years.
      </Typography>

      <ArtistsView
        groups={groups}
        artists={artists.map(artist => ({ ...artist, name: names[artist.id] || artist.id }))}
      />
    </Container>
  )
}
