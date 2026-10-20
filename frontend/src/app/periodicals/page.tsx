import React from "react"
import Link from "next/link"
import { Container, Typography } from '@mui/material'
import { getPeriodicalRegister, PeriodicalEntry } from "../../lib/registers"
import { formatDate } from "../../lib/dates"
import { Entry, Initials, Letter, RegisterNav, byInitial, count } from "../../components/register"

export const metadata = {
  title: 'Periodicals',
}

type Printing = PeriodicalEntry['printings'][number]

// "3" → "p. 3"; "backcover" stays as it is
const pagesOf = (pages: string) => /^\[?[\dIVXLC]+\]?$/.test(pages) ? `p. ${pages}` : pages

// the issue and page of a printing
const placeIn = (printing: Printing) => [printing.issue, pagesOf(printing.pages)].filter(Boolean).join(', ')

const Periodical = ({ periodical }: { periodical: PeriodicalEntry }) => (
  <Entry
    id={periodical.id}
    heading={periodical.title}
    about={<>
      {periodical.placeRef
        ? <a href={periodical.placeRef}>{periodical.place}</a>
        : periodical.place}
      {' · '}{count(periodical.printings.length, 'printing')}
    </>}
  >
    {periodical.printings.map(printing => (
      <li key={`${printing.ad.slug}-${printing.source}`}>
        {printing.dates.map(formatDate).join(', ')}:{' '}
        <Link href={`/${printing.ad.slug}`}>{printing.ad.title}</Link>
        {placeIn(printing) && ` (${placeIn(printing)})`}
        {printing.transcribed && <>{' · '}<em>transcribed</em></>}
      </li>
    ))}
  </Entry>
)

export default function PeriodicalsPage() {
  const periodicals = getPeriodicalRegister()
  const printings = periodicals.reduce((sum, periodical) => sum + periodical.printings.length, 0)
  const ads = new Set(periodicals.flatMap(periodical => periodical.printings.map(p => p.ad.slug))).size

  return (
    <Container component="main" maxWidth="md">
      <RegisterNav current="/periodicals" />
      <h2>Periodicals</h2>
      <Typography>
        The newspapers and magazines in which the advertisements were
        printed, with each printing in the order of its date. An ad printed
        more than once is listed under each printing; the one its text is
        transcribed from is marked <em>transcribed</em>.
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {periodicals.length} periodicals, {printings} printings of {ads} ads.
        The titles are in alphabetical order, passing over a leading article.
      </Typography>

      <Initials initials={byInitial(periodicals).map(([initial]) => initial)} />

      {byInitial(periodicals).map(([initial, entries]) => (
        <Letter key={initial} initial={initial}>
          {entries.map(periodical => <Periodical key={periodical.id} periodical={periodical} />)}
        </Letter>
      ))}
    </Container>
  )
}
