import React from 'react'
import { Container, Typography } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import { artistTimelines, bandwidth, headOf } from "../../lib/artists"
import { names } from "../../labels/names"
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
      <h2>Mentioned Artists</h2>
      <Typography>
        How much of the advertising each artist received over time. The
        thickness of a band is the artist&apos;s share of all mentions of
        artists around a year; its colour, how often the artist is mentioned
        per year around then, from blue (seldom) to red (often). An
        advertisement counts once, in the year of its first printing, however
        often it was printed; an artist it names twice counts twice. The
        counts are those of the advertisements in this collection, which is a
        selection.
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Few advertisements appeared in some years, so a year alone says little.
        The share around a year therefore draws on the neighbouring years as
        well, the less the further away they are (a Gaussian kernel with a
        standard deviation of {h.toLocaleString('en-GB')} years). This width is the one with
        which the other advertisements best predict the artists that an
        advertisement names (leave-one-out cross-validation). The bands break
        where no advertisements appeared for several years.
        {head && <>
          {' '}Most artists are named only once or twice, a few very often. The
          chart shows the {shown.length} of {named.length} artists who are
          mentioned more often than the average artist ({format(head.mean)} times):
          the head of the distribution, as head/tail breaks divide it (Bin Jiang,
          {' '}<a href="https://doi.org/10.1080/00330124.2012.700499">&ldquo;Head/Tail Breaks: A New
          Classification Scheme for Data with a Heavy-Tailed Distribution&rdquo;</a>,
          {' '}<i>The Professional Geographer</i> 65, 2013, 482–494).
        </>}
      </Typography>

      <ArtistsChart years={years} artists={shown} h={h} />

      {others.length > 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
          Also mentioned:{' '}
          {others.map((artist, i) => (
            <React.Fragment key={artist.id}>
              {i > 0 && '; '}
              <a href={artist.id}>{artist.name}</a> ({artist.mentions})
            </React.Fragment>
          ))}.
        </Typography>
      )}
    </Container>
  )
}
