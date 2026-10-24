import { DOI, EDITION, EDITOR, SITE_URL } from "./site"
import type { Status } from "./tei"

/** A run of a citation: text, a title in italics or a link. */
export type Part = string | { italic: string } | { link: string; text: string }

/** What a citation says of an ad. */
export interface Cited {
  slug: string
  // e.g. "Mit dem Welte Mignon ist ..."; some titles are quotations already
  title: string
  // who advertised, e.g. "Alfred Schmid Nachf."
  company: string
  // when the ad appeared, as the subtitle of its file says, e.g. "October 6 and 9, 1908"
  date: string
  // an unchecked ad is cited as Claude's transcription
  status: Status
  // the year of the edition's current release, if it has one
  year: string | null
}

/** A citation as a style writes it in one place, e.g. in a note. */
interface Form {
  // e.g. "Note"
  label?: string
  parts: Part[]
  // BibTeX, which is set as code
  code?: boolean
}

const DOI_URL = `https://doi.org/${DOI}`
const pageUrl = (cited: Cited) => `${SITE_URL}/${cited.slug}/`
const link = (href: string, text = href): Part => ({ link: href, text })
const parts = (...items: (Part | false)[]) => items.filter((item): item is Part => item !== false)

const UNCHECKED = {
  en: 'transcribed by Claude (AI model), not yet checked by the editor',
  de: 'transkribiert von Claude (KI-Modell), noch nicht vom Herausgeber geprüft',
}

// the title without the quotation marks of a title that is a quotation, and
// with the given marks for the quotations inside it, e.g. Artistic ‘Welte’ Player
const bare = (title: string, open: string, close: string) =>
  title.replace(/^"(.*)"$/, '$1').replace(/"([^"]*)"/g, `${open}$1${close}`)

// a comma or full stop after a title, unless the title ends with a mark
// that does its work, e.g. "Special Announcement!"
const punctuate = (text: string, mark: ',' | '.') =>
  /[?!]$/.test(text) || (mark === '.' && /[.…]$/.test(text)) ? text : text + mark

// the day of access, given as "2026-10-24", in the forms of the styles
const american = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
// MLA abbreviates the names of more than four letters
const MLA_MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.']
const mlaDate = (iso: string) => {
  const [year, month, day] = iso.split('-')
  return `${Number(day)} ${MLA_MONTHS[Number(month) - 1]} ${year}`
}
const germanDay = (iso: string) => iso.split('-').reverse().join('.')

const GERMAN_MONTHS: Record<string, string> = {
  January: 'Januar', February: 'Februar', March: 'März', April: 'April', May: 'Mai', June: 'Juni',
  July: 'Juli', August: 'August', September: 'September', October: 'Oktober', November: 'November',
  December: 'Dezember',
}
const GERMAN_WEEKDAYS: Record<string, string> = {
  Monday: 'Montag', Tuesday: 'Dienstag', Wednesday: 'Mittwoch', Thursday: 'Donnerstag',
  Friday: 'Freitag', Saturday: 'Samstag', Sunday: 'Sonntag',
}
// a month, written out or abbreviated, with the days and the year that follow
// it, e.g. "November 14, 16, 23 and 28, 1913" or "Jun 3 1925"
const MONTH_DAYS = new RegExp(
  '\\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\b\\.?'
  + '(?: (\\d{1,2}(?!\\d)(?:(?:, | and | to )\\d{1,2}(?!\\d))*))?'
  + '(?:,? (\\d{4}))?',
  'g',
)

/**
 * When an ad appeared, as its subtitle says it in English, in German, e.g.
 * "October 6 and 9, 1908" → "6. und 9. Oktober 1908".
 */
export function germanDate(phrase: string): string {
  return phrase
    .replace(MONTH_DAYS, (_, month: string, days?: string, year?: string) => {
      const name = Object.keys(GERMAN_MONTHS).find(name => name.startsWith(month)) || month
      const dayList = days?.replace(/\d+/g, '$&.').replace(/ and /g, ' und ').replace(/ to /g, ' bis ')
      return [dayList, GERMAN_MONTHS[name], year].filter(Boolean).join(' ')
    })
    .replace(/\b[A-Z][a-z]+day\b/g, day => GERMAN_WEEKDAYS[day] || day)
    .replace(/ and /g, ' und ')
    .replace(/ to /g, ' bis ')
}

function chicago(cited: Cited, accessed: string | null): Form[] {
  const title = bare(cited.title, '‘', '’')
  const unchecked = cited.status === 'unchecked'
  const note = parts(
    `${EDITOR.name}, ed., “${punctuate(title, ',')}” advertisement by ${cited.company}, ${cited.date}`,
    unchecked && `, ${UNCHECKED.en}`,
    ', in ', { italic: EDITION }, ', ', link(DOI_URL), ', ',
    !!accessed && `accessed ${american(accessed)}, `,
    link(pageUrl(cited)), '.',
  )
  const bibliography = parts(
    `${EDITOR.surname}, ${EDITOR.forename}, ed. “${punctuate(title, '.')}” `,
    `Advertisement by ${cited.company}, ${punctuate(cited.date, '.')}`,
    unchecked && ` ${UNCHECKED.en[0].toUpperCase()}${UNCHECKED.en.slice(1)}.`,
    ' In ', { italic: EDITION }, '. ', link(DOI_URL), '. ',
    !!accessed && `Accessed ${american(accessed)}. `,
    link(pageUrl(cited)), '.',
  )
  return [{ label: 'Note', parts: note }, { label: 'Bibliography', parts: bibliography }]
}

function mla(cited: Cited, accessed: string | null): Form[] {
  const title = bare(cited.title, '‘', '’')
  const url = pageUrl(cited)
  return [{
    label: 'Works cited',
    parts: parts(
      `${EDITOR.surname}, ${EDITOR.forename}, editor. “${punctuate(title, '.')}” `,
      `Advertisement by ${cited.company}, ${cited.date}`,
      cited.status === 'unchecked' && `, ${UNCHECKED.en}`,
      '. ', { italic: EDITION }, ', ',
      !!cited.year && `${cited.year}, `,
      // MLA leaves out the protocol of a URL, but not of a DOI
      link(DOI_URL), ', ', link(url, url.replace(/^https:\/\//, '')), '.',
      !!accessed && ` Accessed ${mlaDate(accessed)}.`,
    ),
  }]
}

function apa(cited: Cited, accessed: string | null): Form[] {
  const initials = EDITOR.forename.split(/[\s-]+/).map(name => `${name[0]}.`).join(' ')
  return [{
    label: 'Reference list',
    parts: parts(
      `${EDITOR.surname}, ${initials} (Ed.). (${cited.year || 'n.d.'}). `,
      `${bare(cited.title, '“', '”')} [Advertisement by ${cited.company}, ${cited.date}`,
      cited.status === 'unchecked' && `; ${UNCHECKED.en}`,
      ']. In ', { italic: EDITION }, '. ', link(DOI_URL), '. ',
      !!accessed && `Retrieved ${american(accessed)}, from `,
      link(pageUrl(cited)),
    ),
  }]
}

// the German humanities style, after the editor's name as a note or a
// bibliography gives it
function german(cited: Cited, accessed: string | null, editor: string): Part[] {
  return parts(
    `${editor} „${bare(cited.title, '‚', '‘')}“, Anzeige von ${cited.company}, ${germanDate(cited.date)}`,
    cited.status === 'unchecked' && `, ${UNCHECKED.de}`,
    ', in: ', { italic: EDITION }, ', ', link(DOI_URL), ', ', link(pageUrl(cited)),
    !!accessed && ` (Zugriff am ${germanDay(accessed)})`, '.',
  )
}

function germanNotes(cited: Cited, accessed: string | null): Form[] {
  return [
    { label: 'Footnote', parts: german(cited, accessed, `${EDITOR.name} (Hrsg.),`) },
    { label: 'Bibliography', parts: german(cited, accessed, `${EDITOR.surname}, ${EDITOR.forename} (Hrsg.),`) },
  ]
}

// the author–date system names the year of the edition after the editor
function germanAuthorDate(cited: Cited, accessed: string | null): Form[] {
  const editor = `${EDITOR.surname}, ${EDITOR.forename} (Hrsg.) (${cited.year || 'o. J.'}):`
  return [{ label: 'Bibliography', parts: german(cited, accessed, editor) }]
}

// what TeX reads as commands, escaped
const tex = (text: string) => text.replace(/[\\{}&%$#_~^]/g, char => ({
  '\\': '\\textbackslash{}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
})[char] || `\\${char}`)

function bibtex(cited: Cited, accessed: string | null): Form[] {
  const note = `Advertisement by ${cited.company}, ${cited.date}`
    + (cited.status === 'unchecked' ? `; ${UNCHECKED.en}` : '')
  const fields: [string, string | null][] = [
    ['editor', `${EDITOR.surname}, ${EDITOR.forename}`],
    // the inner braces keep the capitals of the title
    ['title', `{${tex(bare(cited.title, '“', '”'))}}`],
    ['booktitle', EDITION],
    ['year', cited.year],
    ['doi', DOI],
    ['url', pageUrl(cited)],
    ['urldate', accessed],
    ['note', tex(note)],
  ]
  const key = `${EDITOR.surname.toLowerCase()}${cited.year || ''}${cited.slug}`
  const lines = fields
    .filter(([, value]) => value)
    .map(([name, value]) => `  ${name.padEnd(9)} = {${value}},`)
  return [{ code: true, parts: [`@incollection{${key},\n${lines.join('\n')}\n}`] }]
}

type Cite = (cited: Cited, accessed: string | null) => Form[]

/** The styles in which an ad page offers its citation. */
export const STYLES = {
  chicago: { label: 'Chicago', cite: chicago },
  mla: { label: 'MLA', cite: mla },
  apa: { label: 'APA', cite: apa },
  'german-notes': { label: 'German, footnotes', cite: germanNotes },
  'german-author-date': { label: 'German, author–date', cite: germanAuthorDate },
  bibtex: { label: 'BibTeX', cite: bibtex },
} satisfies Record<string, { label: string; cite: Cite }>

export type Style = keyof typeof STYLES

/** A citation as plain text. */
export const plain = (parts: Part[]) =>
  parts.map(part => typeof part === 'string' ? part : 'italic' in part ? part.italic : part.text).join('')
