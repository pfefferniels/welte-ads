import React from "react"
import Link from "next/link"
import { Container } from '@mui/material'
import { getPeriodicalRegister, PeriodicalEntry } from "../../lib/registers"
import { formatDate } from "../../lib/dates"
import { Entry, Initials, Letter, byInitial, count } from "../../components/register"

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

  return (
    <Container component="main" maxWidth="md">
      <h1>Periodicals</h1>

      <Initials initials={byInitial(periodicals).map(([initial]) => initial)} />

      {byInitial(periodicals).map(([initial, entries]) => (
        <Letter key={initial} initial={initial}>
          {entries.map(periodical => <Periodical key={periodical.id} periodical={periodical} />)}
        </Letter>
      ))}
    </Container>
  )
}
