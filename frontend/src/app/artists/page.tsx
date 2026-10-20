import React from 'react'
import Link from "next/link"
import { Container, Typography } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import { artistTimelines, bandwidth, headOf } from "../../lib/artists"
import { getArtistRegister, PersonEntry } from "../../lib/registers"
import { GND } from "../../lib/anchors"
import { formatDate } from "../../lib/dates"
import { names } from "../../labels/names"
import { Entry, Initials, Letter, byInitial } from "../../components/register"
import ArtistsChart from "./ArtistsChart"

export const metadata = {
  title: 'Artists',
}

const format = (n: number) => n.toLocaleString('en-GB', { maximumFractionDigits: 1 })

const times = (n: number) => n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`

// "named once", "named twice in one ad", "named 92 times in 78 ads"
const howOften = (artist: PersonEntry) => `named ${times(artist.mentions)}`
  + (artist.mentions > 1 ? ` in ${artist.ads.length === 1 ? 'one ad' : `${artist.ads.length} ads`}` : '')

const Artist = ({ artist }: { artist: PersonEntry }) => (
  <Entry
    id={artist.id}
    heading={artist.name}
    about={<>
      {artist.uri && <><a href={artist.uri}>GND {artist.uri.replace(GND, '')}</a> · </>}
      {howOften(artist)}
    </>}
  >
    {artist.ads.map(ad => (
      <li key={ad.slug}>
        <Link href={`/${ad.slug}`}>{ad.title}</Link>, {formatDate(ad.date)}
      </li>
    ))}
  </Entry>
)

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
  const register = byInitial(getArtistRegister())

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

      <Typography variant="h5" component="h2" sx={{ mt: 5, mb: 1 }}>
        All artists
      </Typography>
      <Initials initials={register.map(([initial]) => initial)} />
      {register.map(([initial, artists]) => (
        <Letter key={initial} initial={initial}>
          {artists.map(artist => <Artist key={artist.id} artist={artist} />)}
        </Letter>
      ))}
    </Container>
  )
}
