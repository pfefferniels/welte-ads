import React from 'react'
import { Container, Typography } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import { artistTimelines, bandwidth, headOf } from "../../lib/artists"
import { names } from "../../labels/names"
import { personLink } from "../../lib/anchors"
import ArtistsChart from "./ArtistsChart"

export const metadata = {
  title: 'Artists',
}

const format = (n: number) => n.toLocaleString('en-GB', { maximumFractionDigits: 1 })

export default function ArtistsPage() {
  const ads = getAllMetadata()
  const { years, artists } = artistTimelines(ads)
  const h = bandwidth(ads)
  const named = artists
    .map(artist => ({ ...artist, name: names[artist.id] || artist.id }))
    .sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name, 'en'))
  // the artists mentioned more often than the average one; all of them where
  // the distribution has no small head
  const head = headOf(named.map(artist => artist.mentions))
  const shown = head ? named.filter(artist => head.isHead(artist.mentions)) : named
  const others = named.filter(artist => !shown.includes(artist))

  return (
    <Container component="main" maxWidth="md">
      <h1>Mentioned Artists</h1>
      <Typography>
        How much of the advertising each artist received over time.
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Smoothed over neighbouring years (Gaussian kernel, σ = {h.toLocaleString('en-GB')} years,
        chosen by cross-validation).
        {head && <>
          {' '}Shown are the {shown.length} of {named.length} artists mentioned more often
          than average ({format(head.mean)} times;{' '}
          <a href="https://doi.org/10.1080/00330124.2012.700499">head/tail breaks</a>).
        </>}
      </Typography>

      <ArtistsChart years={years} artists={shown} h={h} />

      {others.length > 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
          Also mentioned:{' '}
          {others.map((artist, i) => (
            <React.Fragment key={artist.id}>
              {i > 0 && '; '}
              <a href={personLink(artist.id)}>{artist.name}</a> ({artist.mentions})
            </React.Fragment>
          ))}.
        </Typography>
      )}
    </Container>
  )
}
