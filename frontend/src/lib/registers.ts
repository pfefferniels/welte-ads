import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'
import { getAllMetadata, inOtherReading } from './tei'
import { names } from '../labels/names'
import { anchorOf, nameAnchor, personAnchor } from './anchors'

// the text of an element on one line
const textOf = (el: Element | null | undefined) =>
  (el?.textContent || '').replace(/\s+/g, ' ').trim()

// a person as the text of an ad names them
interface Naming {
  // the GND URI (@corresp), if any
  uri: string
  // what the ad names the person as (@type), e.g. "artist"
  type: string
  written: string
}

// a note of the editor's in the text, which is not part of the ad
const EDITORIAL_NOTE = 'note[type="editorial"]'

/**
 * The persons that the text of an ad names, in the order of the text,
 * leaving out those that only the editor's notes or the readings of other
 * printings name.
 */
export function namingsIn(doc: Document): Naming[] {
  const text = doc.querySelector('text')
  const persNames = Array.from(text?.querySelectorAll('persName') || [])
  return persNames.filter(name => !name.closest(EDITORIAL_NOTE) && !inOtherReading(name)).map(name => ({
    uri: (name.getAttribute('corresp') || '').trim(),
    type: name.getAttribute('type') || '',
    written: textOf(name),
  }))
}

// a printing of an ad, as a source in the header of its file describes it
interface Printing {
  // the xml:id of the source
  source: string
  periodical: string
  place: string
  // the place in GeoNames
  placeRef: string
  // as precise as known, in ISO 8601; a few sources give several
  dates: string[]
  issue: string
  pages: string
  // whether the text of the ad is transcribed from this printing
  transcribed: boolean
}

/** The printings of an ad: one for each source in the header. */
export function printingsIn(doc: Document): Printing[] {
  const decls = (doc.querySelector('text')?.getAttribute('decls') || '')
    .split(/\s+/).filter(Boolean).map(decl => decl.replace(/^#/, ''))
  const sources = Array.from(doc.querySelectorAll('sourceDesc'))
  // the printing that the text is transcribed from, or else the first
  const transcribed = sources.find(source => decls.includes(source.getAttribute('xml:id') || ''))
    || sources[0]
  const all = (source: Element, selector: string) =>
    Array.from(source.querySelectorAll(selector)).map(textOf).filter(Boolean)

  return sources.map(source => {
    const place = source.querySelector('publicationStmt > pubPlace')
    return {
      source: source.getAttribute('xml:id') || '',
      periodical: textOf(source.querySelector('seriesStmt > title[level="j"]')),
      place: textOf(place),
      placeRef: place?.getAttribute('ref') || '',
      dates: Array.from(source.querySelectorAll('date[type="publication"]'))
        .map(date => date.getAttribute('when') || textOf(date)),
      issue: all(source, 'seriesStmt > biblScope[unit="issue"]').join('; '),
      pages: all(source, 'seriesStmt > biblScope[unit="pages"]').join('; '),
      transcribed: source === transcribed,
    }
  })
}

/** An ad as the registers list it. */
interface AdEntry {
  slug: string
  // as the list of ads gives it
  title: string
  // the first printing, in ISO 8601
  date: string
}

interface RegisterAd extends AdEntry {
  namings: Naming[]
  printings: Printing[]
}

export interface PersonEntry {
  // the anchor of the entry in the register
  id: string
  name: string
  // the GND URI; empty for a name without one
  uri: string
  // the letter under which the entry is filed
  initial: string
  // what the ads name the person as, e.g. "artist"
  roles: string[]
  // how often the ads name the person
  mentions: number
  // the ads that name the person, earliest first
  ads: AdEntry[]
}

const initialOf = (text: string) => anchorOf(text).charAt(0).toUpperCase()

// in capitals, as many ads set names
const isCapitals = (text: string) => text === text.toUpperCase() && text !== text.toLowerCase()

// the form of a name to list: the most frequent one not set in capitals,
// without the comma that may follow it
const preferredForm = (forms: string[]) => {
  const counts = new Map<string, number>()
  for (const form of forms.map(form => form.replace(/[\s,;:]+$/, '')).filter(Boolean)) {
    counts.set(form, (counts.get(form) ?? 0) + 1)
  }
  return Array.from(counts)
    .sort(([a, m], [b, n]) => Number(isCapitals(a)) - Number(isCapitals(b)) || n - m)[0]?.[0] || ''
}

const byDate = (a: AdEntry, b: AdEntry) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug)
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'en')

/**
 * The persons that the ads name, each with the ads that name them. A person
 * with a GND URI is listed under the name the labels give (or else as most
 * often written); the names without one are listed apart, as written, with
 * the forms that differ only in case and punctuation taken together.
 */
export function personRegister(ads: RegisterAd[]): { persons: PersonEntry[]; unlinked: PersonEntry[] } {
  const entries = new Map<string, { uri: string; forms: string[]; roles: Set<string>; mentions: number; ads: AdEntry[] }>()

  for (const ad of ads) {
    for (const naming of ad.namings) {
      const key = naming.uri || nameAnchor(naming.written)
      if (key === nameAnchor('')) continue

      const entry = entries.get(key) ?? { uri: naming.uri, forms: [], roles: new Set(), mentions: 0, ads: [] }
      entry.forms.push(naming.written)
      if (naming.type) entry.roles.add(naming.type)
      entry.mentions += 1
      if (entry.ads[entry.ads.length - 1]?.slug !== ad.slug) {
        entry.ads.push({ slug: ad.slug, title: ad.title, date: ad.date })
      }
      entries.set(key, entry)
    }
  }

  const list = Array.from(entries, ([key, entry]) => {
    const name = (entry.uri && names[entry.uri]) || preferredForm(entry.forms) || entry.uri
    return {
      id: entry.uri ? personAnchor(entry.uri) : key,
      name,
      uri: entry.uri,
      initial: initialOf(name),
      roles: Array.from(entry.roles).sort(),
      mentions: entry.mentions,
      ads: entry.ads.sort(byDate),
    }
  })

  return {
    persons: list.filter(person => person.uri).sort(byName),
    unlinked: list.filter(person => !person.uri).sort(byName),
  }
}

// the leading articles, which the order of the titles passes over
const ARTICLE = /^(the|a|an|der|die|das|de|het|le|la|les|el|los|las)\s+/i
const filingTitle = (title: string) => title.replace(ARTICLE, '')

// what comes before the first letter of a name ("'s-Gravenhage")
const LEADING = new RegExp('^[^\\p{L}\\p{N}]+', 'u')
const filingName = (name: string) => name.replace(LEADING, '')

const firstDate = (printing: Printing) => [...printing.dates].sort()[0] || ''

// the forms given, the most frequent first
const byFrequency = (forms: string[]) => {
  const counts = new Map<string, number>()
  for (const form of forms.filter(Boolean)) counts.set(form, (counts.get(form) ?? 0) + 1)
  return Array.from(counts).sort(([, m], [, n]) => n - m).map(([form]) => form)
}

// "place-5128581" for https://www.geonames.org/5128581
const placeAnchor = (ref: string, name: string) => {
  const geonames = ref.match(/(\d+)\/?$/)
  return `place-${geonames ? geonames[1] : anchorOf(name)}`
}

// a printing with the ad that it is a printing of
type PlacedPrinting = Printing & { ad: AdEntry }

interface PlaceAd extends AdEntry {
  // the key of the company that the ad is by (orgName/@key)
  company: string
  printings: Printing[]
}

export interface PlaceEntry {
  // the anchor of the entry: "place-" and the GeoNames number
  id: string
  // the place in GeoNames
  ref: string
  // the names that the sources give the place, the most frequent first
  names: string[]
  // the letter under which the entry is filed
  initial: string
  printings: number
  ads: number
  // the periodicals printed there, each with its printings, earliest first
  periodicals: { title: string; printings: PlacedPrinting[] }[]
  // the companies whose ads were printed there, each with those ads
  companies: { key: string; name: string; printings: number; ads: AdEntry[] }[]
}

/**
 * The places where the ads were printed, by name, each with its
 * periodicals and their printings in the order of their dates, and the
 * companies whose ads were printed there. A place is the GeoNames record
 * of the sources; it may go by several names (С.-Петербургъ, Петроград).
 */
export function placeRegister(ads: PlaceAd[]): PlaceEntry[] {
  type Place = {
    ref: string
    forms: string[]
    printings: PlacedPrinting[]
    companies: Map<string, { printings: number; ads: AdEntry[] }>
  }
  const places = new Map<string, Place>()

  for (const ad of ads) {
    const entry = { slug: ad.slug, title: ad.title, date: ad.date }
    for (const printing of ad.printings) {
      const key = printing.placeRef || printing.place
      if (!key) continue

      const place: Place = places.get(key) ?? { ref: printing.placeRef, forms: [], printings: [], companies: new Map() }
      place.forms.push(printing.place)
      place.printings.push({ ...printing, ad: entry })
      const company = place.companies.get(ad.company) ?? { printings: 0, ads: [] }
      company.printings += 1
      if (company.ads[company.ads.length - 1]?.slug !== ad.slug) company.ads.push(entry)
      place.companies.set(ad.company, company)
      places.set(key, place)
    }
  }

  return Array.from(places.values(), place => {
    const forms = byFrequency(place.forms)
    const printings = place.printings.sort((a, b) =>
      firstDate(a).localeCompare(firstDate(b)) || a.ad.slug.localeCompare(b.ad.slug)
      || a.source.localeCompare(b.source, 'en', { numeric: true }))

    const periodicals = new Map<string, PlacedPrinting[]>()
    for (const printing of printings) {
      periodicals.set(printing.periodical, [...(periodicals.get(printing.periodical) || []), printing])
    }

    return {
      id: placeAnchor(place.ref, forms[0]),
      ref: place.ref,
      names: forms,
      initial: initialOf(forms[0]),
      printings: printings.length,
      ads: new Set(printings.map(printing => printing.ad.slug)).size,
      periodicals: Array.from(periodicals, ([title, list]) => ({ title, printings: list }))
        .sort((a, b) => filingTitle(a.title).localeCompare(filingTitle(b.title), 'en')),
      companies: Array.from(place.companies, ([key, company]) => ({
        key,
        name: names[key] || key,
        printings: company.printings,
        ads: company.ads.sort(byDate),
      })).sort(byName),
    }
  }).sort((a, b) => filingName(a.names[0]).localeCompare(filingName(b.names[0]), 'en'))
}

// the ads of the collection with what the registers need of them
function registerAds(): (RegisterAd & PlaceAd)[] {
  const teiDir = path.join(process.cwd(), '..', 'tei')

  return getAllMetadata().map(meta => {
    const xml = fs.readFileSync(path.join(teiDir, `${meta.slug}.xml`), 'utf-8')
    const doc = new JSDOM(xml, { contentType: 'text/xml' }).window.document
    return {
      slug: meta.slug,
      title: meta.title,
      date: [...meta.dates].sort()[0] || '',
      company: meta.company.name,
      namings: namingsIn(doc),
      printings: printingsIn(doc),
    }
  })
}

// a naming of a person as an artist (@type "artist")
const asArtist = (naming: Naming) => naming.type.split(/\s+/).includes('artist')

/** The artists that the ads name with a GND URI, each with the ads that
 * name them as an artist. */
export const getArtistRegister = () => personRegister(registerAds()
  .map(ad => ({ ...ad, namings: ad.namings.filter(asArtist) }))).persons

export const getPlaceRegister = () => placeRegister(registerAds())
