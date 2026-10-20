import React from "react"
import Link from "next/link"
import { Container, Typography } from '@mui/material'
import { getPersonRegister, PersonEntry } from "../../lib/registers"
import { GND } from "../../lib/anchors"
import { formatDate } from "../../lib/dates"
import { Entry, Initials, Letter, byInitial, count } from "../../components/register"

export const metadata = {
  title: 'Persons',
}

const times = (n: number) => n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`

// "named once", "named twice in one ad", "named 93 times in 79 ads"
const named = (person: PersonEntry) => `named ${times(person.mentions)}`
  + (person.mentions > 1 ? ` in ${person.ads.length === 1 ? 'one ad' : `${person.ads.length} ads`}` : '')

const Person = ({ person }: { person: PersonEntry }) => (
  <Entry
    id={person.id}
    heading={person.name}
    about={<>
      {person.uri && <><a href={person.uri}>GND {person.uri.replace(GND, '')}</a> · </>}
      {person.roles.length > 0 && `${person.roles.join(' and ')} · `}
      {named(person)}
    </>}
  >
    {person.ads.map(ad => (
      <li key={ad.slug}>
        <Link href={`/${ad.slug}`}>{ad.title}</Link>, {formatDate(ad.date)}
      </li>
    ))}
  </Entry>
)

export default function PersonsPage() {
  const { persons, unlinked } = getPersonRegister()

  return (
    <Container component="main" maxWidth="md">
      <h1>Persons</h1>

      <Initials initials={byInitial(persons).map(([initial]) => initial)}>
        <a href="#unlinked">Others</a>
      </Initials>

      {byInitial(persons).map(([initial, entries]) => (
        <Letter key={initial} initial={initial}>
          {entries.map(person => <Person key={person.id} person={person} />)}
        </Letter>
      ))}

      <section>
        <Typography variant="h5" component="h2" id="unlinked"
          sx={{ mt: 4, mb: 1, borderBottom: '1px solid #e8e4e0' }}>
          Names not linked to the GND
        </Typography>
        <Typography variant="body2" component="p" sx={{ color: 'text.secondary', mb: 2 }}>
          {count(unlinked.length, 'name')} as the ads write them, taking
          together only forms that differ in case or punctuation. One person
          may be listed under several forms.
        </Typography>
        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
          {unlinked.map(person => <Person key={person.id} person={person} />)}
        </ul>
      </section>
    </Container>
  )
}
