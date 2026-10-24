import React from "react"
import Link from "next/link"
import { Box, Container, Typography } from '@mui/material'
import { getPlaceRegister, PlaceEntry } from "../../lib/registers"
import { coordinates } from "../../labels/coordinates"
import { languages } from "../../labels/languages"
import { formatDate, yearFraction } from "../../lib/dates"
import { Marker, WorldMap } from "../../components/worldMap"
import { Initials, Letter, byInitial, count, entryStyle } from "../../components/register"
import { Chapter, StoryList } from "../../components/narrative"
import { adsOf, getChapters, placeFigures } from "../../lib/narratives"
import { getAllMetadata } from "../../lib/tei"

export const metadata = {
  title: 'Places',
}

type Printing = PlaceEntry['periodicals'][number]['printings'][number]

// "3" → "p. 3"; "backcover" stays as it is
const pagesOf = (pages: string) => /^\[?[\dIVXLC]+\]?$/.test(pages) ? `p. ${pages}` : pages

// the issue and page of a printing
const placeIn = (printing: Printing) => [printing.issue, pagesOf(printing.pages)].filter(Boolean).join(', ')

// "54 printings of 25 ads"
const printingsOf = (printings: number, ads: number) => `${count(printings, 'printing')} of ${count(ads, 'ad')}`

// "English", "English and French", "German, French and Swedish"
const andList = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0] ?? ''

// "in English and French"
const inLanguages = (codes: string[]) => `in ${andList(codes.map(code => languages[code] ?? code))}`

// The languages printed most often have a colour each; the others share a
// grey. On a map any two circles may meet, and no more than three colours
// stay apart for every pair, also for readers with a colour vision deficiency.
const COLOURED = [
  { key: 'en', color: '#2a78d6' },
  { key: 'de', color: '#eb6834' },
  { key: 'nl', color: '#1baf7a' },
]
const OTHER = 'other'
// the colour group of the languages of a place: that of the most frequent
const groupOf = (codes: string[]) => COLOURED.some(({ key }) => key === codes[0]) ? codes[0] : OTHER

const subheading = { fontWeight: 600, mt: 1.5, mb: 0.5 }
const list = { m: 0, pl: 2.5, fontSize: '1rem', listStyleType: 'disc', '& li': { mb: 0.25 } }

const Place = ({ place }: { place: PlaceEntry }) => (
  <Box component="li" id={place.id} sx={entryStyle}>
    <Typography variant="h6" component="h3" sx={{ lineHeight: 1.3 }}>
      {place.names.join(' / ')}
      <Box component="a" href="#map" aria-label="Back to the map" title="Back to the map"
        sx={{ ml: 1, fontSize: '0.9rem', textDecoration: 'none' }}>
        ↑ map
      </Box>
    </Typography>
    <Typography variant="body2" component="p" sx={{ color: 'text.secondary' }}>
      {place.ref && <><a href={place.ref}>GeoNames</a> · </>}
      {printingsOf(place.printings, place.ads)} {inLanguages(place.languages)}
    </Typography>

    <Typography variant="body2" component="h4" sx={subheading}>Periodicals</Typography>
    <Box component="ul" sx={list}>
      {place.periodicals.map(periodical => (
        <li key={periodical.title}>
          <i>{periodical.title}</i>
          <Box component="ul" sx={{ ...list, listStyleType: 'circle' }}>
            {periodical.printings.map(printing => (
              <li key={`${printing.ad.slug}-${printing.source}`}>
                {printing.dates.map(formatDate).join(', ')}:{' '}
                <Link href={`/${printing.ad.slug}`}>{printing.ad.title}</Link>
                {placeIn(printing) && ` (${placeIn(printing)})`}
                {printing.transcribed && <>{' · '}<em>transcribed</em></>}
              </li>
            ))}
          </Box>
        </li>
      ))}
    </Box>

    <Typography variant="body2" component="h4" sx={subheading}>Companies</Typography>
    <Box component="ul" sx={list}>
      {place.companies.map(company => (
        <li key={company.key}>
          {company.name} ({printingsOf(company.printings, company.ads.length)}):{' '}
          {company.ads.map((ad, i) => (
            <React.Fragment key={ad.slug}>
              {i > 0 && '; '}
              <Link href={`/${ad.slug}`}>{ad.title}</Link>
            </React.Fragment>
          ))}
        </li>
      ))}
    </Box>
  </Box>
)

export default function PlacesPage() {
  const places = getPlaceRegister()
  // a place without known coordinates would end up at 0°/0°
  const markers: Marker[] = places.flatMap(place => coordinates[place.ref] ? [{
    coordinate: coordinates[place.ref],
    href: `#${place.id}`,
    label: place.names.join(' / '),
    count: place.printings,
    about: `${printingsOf(place.printings, place.ads)} in ${count(place.periodicals.length, 'periodical')}, ${inLanguages(place.languages)}`,
    group: groupOf(place.languages),
    times: place.periodicals.flatMap(periodical => periodical.printings)
      .map(printing => yearFraction([...printing.dates].sort()[0])),
    years: place.years.map(({ year, printings, languages }) => ({
      year,
      count: printings,
      about: `${count(printings, 'printing')} in ${year}, ${inLanguages(languages)}`,
      group: groupOf(languages),
    })),
  }] : [])
  const others = new Set(places.flatMap(place => place.languages).filter(code => groupOf([code]) === OTHER))
  const groups = [
    ...COLOURED.map(({ key, color }) => ({ key, label: languages[key], color })),
    { key: OTHER, label: `the ${others.size} other languages`, color: '#8a8a8a' },
  ]
  // every year from the first printing to the last, those without any too
  const years = places.flatMap(place => place.years.map(({ year }) => year))
  const first = Math.min(...years)
  const timeline = Array.from({ length: Math.max(...years) - first + 1 }, (_, i) => {
    const inYear = places.flatMap(place => place.years.filter(({ year }) => year === first + i))
    const printings = inYear.reduce((sum, year) => sum + year.printings, 0)
    return {
      year: first + i,
      about: printings ? `${count(printings, 'printing')} in ${count(inYear.length, 'place')}` : 'no printings in the collection',
    }
  })
  // the story, with the places it is about as the map links them
  const idOf = new Map(places.map(place => [place.ref, place.id]))
  const ads = getAllMetadata()
  const chapters: Chapter[] = getChapters('places').map(chapter => {
    const figures = placeFigures(places, chapter.from, chapter.to)
    return {
      ...chapter,
      focus: chapter.focus.map(ref => `#${idOf.get(ref)}`),
      figures: figures.printings
        ? `${printingsOf(figures.printings, figures.ads)} in ${count(figures.places, 'place')}`
        : 'no printings in the collection',
      ads: adsOf(chapter.ads, ads),
    }
  })

  return (
    <Container component="main" maxWidth="md">
      <h1>Places</h1>

      <Box id="map" sx={{ scrollMarginTop: '1rem' }}>
        <WorldMap markers={markers} unit="Printings" timeline={timeline} chapters={chapters} groups={groups} />
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mb: 2 }}>
        A circle&apos;s size shows how many printings appeared in a place, its colour the language
        printed there most often; click it for the place below. Play the years to see where the ads
        were printed year by year. With the story on, the timeline stops at each chapter and tells
        what the map shows. The map shows where this collection found ads, and that depends on what
        is digitised: many Australian, Dutch and Swedish papers are, few German ones.
      </Typography>

      <StoryList chapters={chapters} />

      <Initials initials={byInitial(places).map(([initial]) => initial)} />

      {byInitial(places).map(([initial, entries]) => (
        <Letter key={initial} initial={initial}>
          {entries.map(place => <Place key={place.id} place={place} />)}
        </Letter>
      ))}
    </Container>
  )
}
