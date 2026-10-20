import React from "react"
import Link from "next/link"
import { Container, Typography } from '@mui/material'
import { getPersonRegister, PersonEntry } from "../../lib/registers"
import { GND } from "../../lib/anchors"
import { formatDate } from "../../lib/dates"
import { Entry, Initials, Letter, RegisterNav, byInitial, count } from "../../components/register"

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
  const ads = new Set(persons.flatMap(person => person.ads.map(ad => ad.slug))).size

  return (
    <Container component="main" maxWidth="md">
      <RegisterNav current="/persons" />
      <h2>Persons</h2>
      <Typography>
        The persons named in the advertisements, with the ads that name
        them, linked to the GND, the authority file of the German National
        Library.
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {persons.length} persons, named in {ads} ads. Each ad is listed with
        the date of its first printing. Names that are not linked to the GND
        follow <a href="#unlinked">at the end</a>, as written.
      </Typography>

      <Initials initials={byInitial(persons).map(([initial]) => initial)}>
        <a href="#unlinked">Others</a>
      </Initials>

      {byInitial(persons).map(([initial, entries]) => (
        <Letter key={initial} initial={initial}>
          {entries.map(person => <Person key={person.id} person={person} />)}
        </Letter>
      ))}

      <section>
        <Typography variant="h5" component="h3" id="unlinked"
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
