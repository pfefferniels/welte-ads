import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'
import { Facsimile, FacsSurface, FacsZone, Point, parsePoints } from './facsimile'
import { iiifService } from './iiif'

const TEI_NS = 'http://www.tei-c.org/ns/1.0'
const TEIEG_NS = 'http://www.tei-c.org/ns/Examples'

interface Namespace {
  uri: string
  prefix: string
}

const defaultNamespaces: Namespace[] = [
  { uri: TEI_NS, prefix: 'tei' },
  { uri: TEIEG_NS, prefix: 'teieg' },
]

function prefixElement(el: Element, namespaces: Namespace[], elements: Set<string>): void {
  // Find matching namespace for this element
  const nsUri = el.namespaceURI || ''
  const ns = namespaces.find(n => n.uri === nsUri)

  if (ns) {
    const newName = `${ns.prefix}-${el.localName}`
    elements.add(newName)

    // We can't rename elements in DOM, so we'll handle this during serialization
    // Store the new name as a data attribute
    el.setAttribute('data-origname', el.localName)

    const origAtts: string[] = []

    // Transform attributes
    const attsToRemove: string[] = []
    const attsToAdd: { name: string; value: string }[] = []

    for (let i = 0; i < el.attributes.length; i++) {
      const att = el.attributes[i]
      if (att.name.startsWith('data-')) continue

      origAtts.push(att.name)

      if (att.name.startsWith('xmlns')) {
        attsToRemove.push(att.name)
        attsToAdd.push({ name: `data-${att.name}`, value: att.value })
      } else if (att.name === 'xml:id') {
        attsToRemove.push(att.name)
        attsToAdd.push({ name: 'id', value: att.value })
      } else if (att.name === 'xml:lang') {
        attsToRemove.push(att.name)
        attsToAdd.push({ name: 'lang', value: att.value })
      } else if (att.name === 'rendition') {
        attsToRemove.push(att.name)
        // Strip # from rendition values for class names
        attsToAdd.push({ name: 'class', value: att.value.replace(/#/g, '') })
      }
    }

    if (origAtts.length > 0) {
      el.setAttribute('data-origatts', origAtts.join(' '))
    }

    if (el.childNodes.length === 0) {
      el.setAttribute('data-empty', '')
    }

    for (const name of attsToRemove) {
      el.removeAttribute(name)
    }
    for (const { name, value } of attsToAdd) {
      el.setAttribute(name, value)
    }
  }

  // Process child elements recursively
  for (let i = 0; i < el.children.length; i++) {
    prefixElement(el.children[i], namespaces, elements)
  }
}

function serializeWithPrefixes(doc: Document, namespaces: Namespace[]): string {
  function serializeNode(node: Node): string {
    if (node.nodeType === 3) {
      // Text node
      return escapeHtml(node.textContent || '')
    }
    if (node.nodeType === 8) {
      // Comment
      return `<!--${node.textContent}-->`
    }
    if (node.nodeType !== 1) return ''

    const el = node as Element
    const nsUri = el.namespaceURI || ''
    const ns = namespaces.find(n => n.uri === nsUri)
    const tagName = ns ? `${ns.prefix}-${el.localName}` : el.localName

    let attrs = ''
    for (let i = 0; i < el.attributes.length; i++) {
      const att = el.attributes[i]
      attrs += ` ${att.name}="${escapeAttr(att.value)}"`
    }

    if (el.childNodes.length === 0) {
      return `<${tagName}${attrs}></${tagName}>`
    }

    let children = ''
    for (let i = 0; i < el.childNodes.length; i++) {
      children += serializeNode(el.childNodes[i])
    }

    return `<${tagName}${attrs}>${children}</${tagName}>`
  }

  const root = doc.documentElement
  return serializeNode(root)
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function extractRenditionCSS(doc: Document, namespaces: Namespace[]): string {
  const renditions = doc.querySelectorAll('rendition[scheme="css"]')
  if (renditions.length === 0) return ''

  let css = ''
  renditions.forEach(r => {
    const selector = r.getAttribute('selector')
    const cssText = r.textContent || ''
    if (selector && cssText) {
      // Rewrite selectors to use prefixed element names
      let prefixedSelector = selector
      for (const ns of namespaces) {
        // Replace bare element names with prefixed versions
        prefixedSelector = prefixedSelector.replace(
          /(?:^|(?<=\s|,|>|\+|~))([a-z][a-zA-Z]*)/g,
          `${ns.prefix}-$1`
        )
      }
      css += `${prefixedSelector} { ${cssText} }\n`
    }
  })
  return css
}

const BLOCK_ELEMENTS = ['div', 'p', 'head', 'ab', 'figure']
const BLOCK_RENDITIONS = ['c', 'right', 'et', 'et2', 'et3']
// elements that show up as a label without containing text
const LABELLED_ELEMENTS = ['gap', 'space']

const isBlock = (el: Element) =>
  BLOCK_ELEMENTS.includes(el.localName) ||
  (el.getAttribute('rendition') || '')
    .split(/\s+/)
    .some(r => BLOCK_RENDITIONS.includes(r.replace(/^#/, '')))

/**
 * Marks every <lb/> that would open an empty line at the beginning of a
 * block (a div, a centred line …) or right after one. The layout view drops
 * these so that a zone holds exactly the lines of the original. A second
 * <lb/> after a line break still makes an empty line.
 */
export function markRedundantLineBreaks(doc: Document): void {
  const text = doc.getElementsByTagNameNS(TEI_NS, 'text')[0]
  if (!text) return

  let atLineStart = true
  const walk = (node: Node) => {
    node.childNodes.forEach(child => {
      if (child.nodeType === 3) {
        if (/\S/.test(child.textContent || '')) atLineStart = false
        return
      }
      if (child.nodeType !== 1) return

      const el = child as Element
      if (el.localName === 'lb') {
        if (atLineStart) el.setAttribute('data-redundant', '')
        atLineStart = false
      } else if (isBlock(el)) {
        atLineStart = true
        walk(el)
        atLineStart = true
      } else if (LABELLED_ELEMENTS.includes(el.localName)) {
        atLineStart = false
      } else {
        walk(el)
      }
    })
  }
  walk(text)
}

// a quotation mark only closes if no word follows it directly
const CLOSING = /^\s*(?:[,.;:!?)\]»]|["'”“’](?![A-Za-z\u00C0-\u024F\d]))/

const lastText = (node: Node): Text | null => {
  for (let child = node.lastChild; child; child = child.previousSibling) {
    if (child.nodeType === 3) return child as Text
    if (child.nodeType === 1) {
      const text = lastText(child)
      if (text) return text
    }
  }
  return null
}

/**
 * Removes the space that the indentation of the XML leaves between the end
 * of an element and the punctuation following it, e.g. in
 * `<seg>… Erfindung\n</seg>, und`, which would otherwise read
 * "Erfindung , und".
 */
export function tidySpaceBeforePunctuation(doc: Document): void {
  const text = doc.getElementsByTagNameNS(TEI_NS, 'text')[0]
  if (!text) return

  const walker = doc.createTreeWalker(text, 4 /* NodeFilter.SHOW_TEXT */)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)

  for (const node of nodes) {
    const previous = node.previousSibling
    if (!previous || previous.nodeType !== 1) continue
    if (!CLOSING.test(node.data)) continue

    node.data = node.data.replace(/^\s+/, '')
    const inner = lastText(previous)
    if (inner) inner.data = inner.data.replace(/\s+$/, '')
  }
}

function extractFacsimile(doc: Document): Facsimile {
  const surfaces: FacsSurface[] = []
  const zones: FacsZone[] = []
  const num = (value: string | null) => {
    const n = parseFloat(value || '')
    return Number.isFinite(n) && n > 0 ? n : null
  }

  doc.querySelectorAll('facsimile surface').forEach((surface, index) => {
    const graphic = surface.querySelector('graphic:not([type="IIIF"])')
    const iiif = surface.querySelector('graphic[type="IIIF"]')
    const service = iiifService(iiif?.getAttribute('url') || '')
    const iiifWidth = num(iiif?.getAttribute('width') ?? null)
    const iiifHeight = num(iiif?.getAttribute('height') ?? null)
    surfaces.push({
      url: graphic?.getAttribute('url') || '',
      width: num(graphic?.getAttribute('width') ?? null),
      height: num(graphic?.getAttribute('height') ?? null),
      iiif: service && iiifWidth && iiifHeight ? { service, width: iiifWidth, height: iiifHeight } : null,
    })

    surface.querySelectorAll('zone').forEach(zone => {
      const id = zone.getAttribute('xml:id') || zone.getAttribute('id')
      if (!id) return

      let points: Point[] = parsePoints(zone.getAttribute('points') || '')
      if (points.length < 3) {
        // eScriptorium's empty dummy zones have neither points nor corners
        const corners = ['ulx', 'uly', 'lrx', 'lry']
        if (!corners.every(a => zone.hasAttribute(a))) return
        const [ulx, uly, lrx, lry] = corners.map(a => Number(zone.getAttribute(a)))
        if (![ulx, uly, lrx, lry].every(Number.isFinite)) return
        points = [[ulx, uly], [lrx, uly], [lrx, lry], [ulx, lry]]
      }
      zones.push({ id, surface: index, points })
    })
  })

  return { surfaces, zones }
}

/**
 * The <text> of the prefixed TEI as HTML: the custom elements that the
 * stylesheet lays out, before the edition renders them in the browser. It
 * gives search engines, web archives and readers without JavaScript the
 * transcription.
 */
export function staticText(prefixed: string): string {
  const doc = new JSDOM(prefixed).window.document
  return doc.querySelector('tei-text')?.outerHTML || ''
}

function prefixTei(xmlString: string): { prefixed: string; elements: string[]; css: string; facsimile: Facsimile; textHtml: string } {
  const dom = new JSDOM(xmlString, { contentType: 'text/xml' })
  const doc = dom.window.document
  const elements = new Set<string>()

  const facsimile = extractFacsimile(doc)
  markRedundantLineBreaks(doc)
  tidySpaceBeforePunctuation(doc)
  prefixElement(doc.documentElement, defaultNamespaces, elements)

  const css = extractRenditionCSS(doc, defaultNamespaces)
  const prefixed = serializeWithPrefixes(doc, defaultNamespaces)

  return {
    prefixed,
    elements: Array.from(elements),
    css,
    facsimile,
    textHtml: staticText(prefixed),
  }
}

interface TopicSegment {
  id: string
  topic: string
  // the words of the passage, or what the picture shows
  text: string
  picture: boolean
  // who assigned the topic, e.g. "#claude"
  resp: string
}

// whether the editor has checked the ad against the scan
export type Status = 'checked' | 'unchecked'

// someone named in the title statement and what they did
interface Contributor {
  // e.g. "Transcription and encoding"
  role: string
  name: string
  // the xml:id that @resp and @who point to, e.g. "claude"
  id: string
}

interface AdMetadata {
  slug: string
  company: { name: string; link: string }
  title: string
  // the title and subtitle of the TEI file: where and when the ad appeared
  titleMain: string
  titleSub: string
  dates: string[]
  // the periodicals that printed the ad, each with the dates of its printings
  periodicals: { title: string; dates: string[] }[]
  mentions: string[]
  topicSegments: TopicSegment[]
  // the transcription as plain text, for searching
  fullText: string
  // the links to the digital images of the printing that is transcribed
  imageLinks: string[]
  // @status on <revisionDesc>
  status: Status
  // who transcribed, encoded, edited … the ad
  contributors: Contributor[]
}

interface AdData extends AdMetadata {
  prefixed: string
  elements: string[]
  facsimile: Facsimile
  // the text alone, as HTML that the page holds before the edition takes over
  textHtml: string
}

// a person's name as written in running text, e.g. "Niels Pfeffer"
const displayName = (el: Element) => {
  const part = (name: string) => (el.querySelector(name)?.textContent || '').trim()
  const full = [part('forename'), part('surname')].filter(Boolean).join(' ')
  return full || (el.textContent || '').replace(/\s+/g, ' ').trim()
}

export function extractMetadata(xmlString: string): Omit<AdMetadata, 'slug'> {
  const dom = new JSDOM(xmlString, { contentType: 'text/xml' })
  const doc = dom.window.document

  const company = {
    name: doc.querySelector('orgName[key]')?.getAttribute('key') || '',
    link: doc.querySelector('pubPlace[ref]')?.getAttribute('ref') || '',
  }
  const text = (selector: string) =>
    (doc.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim()
  const title = text('bibl')
  const titleMain = text('fileDesc > titleStmt > title[type="main"]')
  const titleSub = text('fileDesc > titleStmt > title[type="sub"]')
  // as precise as known, in ISO 8601 (1913, 1913-11 or 1913-11-15)
  const datesIn = (el: Document | Element) => Array.from(el.querySelectorAll('date[type="publication"]')).map(
    date => date.getAttribute('when') || date.textContent || ''
  )
  const dates = datesIn(doc)
  const sources = Array.from(doc.querySelectorAll('sourceDesc'))
  // the periodicals of the printings, in the order of the sources, each once
  // though it printed the ad on many days; a journal that the text quotes is
  // not one
  const byPeriodical = new Map<string, string[]>()
  for (const source of sources) {
    const periodical = (source.querySelector('title[level="j"]')?.textContent || '').replace(/\s+/g, ' ').trim()
    byPeriodical.set(periodical, [...(byPeriodical.get(periodical) || []), ...datesIn(source)])
  }
  const periodicals = Array.from(byPeriodical, ([title, list]) => ({ title, dates: list }))
  // the recording artists that the ad names, each once though the readings
  // of several printings name them
  const corresp = (el: Element) => el.getAttribute('corresp') || ''
  const mentions = Array.from(doc.querySelectorAll('persName[corresp][type="artist"]'))
    .filter(name => !repeatsShownReading(name, corresp))
    .map(name => name.getAttribute('corresp') || '')
  // topics are marked on text segments and on figures (what a picture shows)
  tidySpaceBeforePunctuation(doc)
  const topicSegments = Array.from(doc.querySelectorAll('seg[ana], figure[ana]'))
    .filter(seg => !repeatsShownReading(seg, el => el.getAttribute('ana') || ''))
    .flatMap(seg => {
      // without an xml:id, a segment can only be linked as part of its ad
      const id = seg.getAttribute('xml:id')
      const text = passageText(seg)
      return (seg.getAttribute('ana') || '').split(/\s+/).filter(Boolean).map(topic => ({
        id: id ? `#${id}` : '',
        topic,
        text: text || pictureDescription(seg),
        picture: !text,
        resp: seg.getAttribute('resp') || '',
      }))
    })

  // the printing that the text is transcribed from, or else the first
  const decls = (doc.querySelector('text')?.getAttribute('decls') || '').replace(/^#/, '')
  const transcribed = sources.find(source => source.getAttribute('xml:id') === decls) || sources[0]
  const imageLinks = Array.from(transcribed?.querySelectorAll('idno[type="URLImages"]') || [])
    .map(idno => (idno.textContent || '').trim())
    .filter(Boolean)

  // an ad that does not say counts as unchecked
  const status: Status = doc.querySelector('revisionDesc')?.getAttribute('status') === 'checked'
    ? 'checked'
    : 'unchecked'
  // who did what, as the title statement names them
  const contributors = Array.from(doc.querySelectorAll('fileDesc > titleStmt > respStmt')).flatMap(respStmt => {
    const role = (respStmt.querySelector('resp')?.textContent || '').replace(/\s+/g, ' ').trim()
    return Array.from(respStmt.children)
      .filter(child => ['persName', 'name', 'orgName'].includes(child.localName))
      .map(name => ({ role, name: displayName(name), id: name.getAttribute('xml:id') || '' }))
  })

  return {
    company, title, titleMain, titleSub, dates, periodicals, mentions, topicSegments,
    fullText: plainText(xmlString), imageLinks, status, contributors,
  }
}

/**
 * The text of an ad as one line of plain text: a word broken at the end of
 * a line with a hyphen is joined again ("reproduc-<lb/>tions"), so that a
 * search finds it.
 */
export function plainText(xmlString: string): string {
  const start = xmlString.indexOf('<text')
  const end = xmlString.lastIndexOf('</text>')
  if (start < 0 || end < 0) return ''
  const text = xmlParser().parseFromString(xmlString.slice(start, end + '</text>'.length), 'text/xml')
  return lineText(text.documentElement)
}

// of the readings of an <app>, the one that the text shows: the lemma, or
// else the first reading, which is that of the transcribed printing
const shownReading = (app: Element) => {
  const readings = Array.from(app.children)
  return readings.find(r => r.localName === 'lem') || readings.find(r => r.localName === 'rdg')
}

/**
 * Whether an element, in the reading of another printing, repeats what the
 * text shows: the shown reading of the same <app> has an element of the same
 * name and key (e.g. a person with the same @corresp). What only another
 * printing has repeats nothing.
 */
export function repeatsShownReading(el: Element, key: (el: Element) => string): boolean {
  for (let reading = el.closest('rdg, lem'); reading; reading = reading.parentElement?.closest('rdg, lem') ?? null) {
    const shown = reading.parentElement && shownReading(reading.parentElement)
    if (!shown || shown === reading) continue
    if (Array.from(shown.getElementsByTagName(el.localName)).some(other => key(other) === key(el))) return true
  }
  return false
}

/**
 * The words of a passage as they are printed, on one line: of several
 * readings only the one that the facsimile shows (the lemma, or else the
 * first reading), and without notes or descriptions of pictures. A
 * passage that is only a picture has none.
 */
export function passageText(passage: Element): string {
  const copy = passage.cloneNode(true) as Element
  for (const app of Array.from(copy.getElementsByTagName('app'))) {
    app.replaceWith(...Array.from(shownReading(app)?.childNodes || []))
  }
  copy.querySelectorAll('figure, desc, note').forEach(el => el.remove())
  return lineText(copy)
}

// what a picture shows, in the words of the editor
const pictureDescription = (figure: Element) =>
  Array.from(figure.getElementsByTagName('desc'))
    .map(desc => desc.textContent)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * The text of an element on one line. A hyphen at the end of a line, also
 * inside an element ("in-</hi><lb/>vention"), breaks a word that goes on
 * in the next line, unless a capital follows ("Welte-<lb/>Mignon") or the
 * line begins a new element. A dash after a space stays apart.
 */
function lineText(root: Element): string {
  let text = ''
  let lineBreak = false
  let opened = false
  const walker = root.ownerDocument.createTreeWalker(root, 0x1 | 0x4 /* elements and text */)
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node.nodeType === 1) {
      if ((node as Element).localName === 'lb') {
        lineBreak = true
        opened = false
      } else if (lineBreak) {
        opened = true
      }
      continue
    }

    let data = (node as Text).data
    if (lineBreak && data.trim()) {
      lineBreak = false
      if (/\S-\s*$/.test(text)) {
        text = text.trimEnd()
        if (!opened) {
          data = data.trimStart()
          if (data[0] !== data[0].toUpperCase()) text = text.slice(0, -1)
        }
      } else {
        text += ' '
      }
    }
    text += data
  }
  return text.replace(/\s+/g, ' ').trim()
}

// one parser for all the ads, as setting up a JSDOM for each is slow
let parser: DOMParser | undefined
const xmlParser = () => parser ??= new (new JSDOM().window.DOMParser)()

function getTeiDir(): string {
  return path.join(process.cwd(), '..', 'tei')
}

export interface Topic {
  label: string
  description?: string
}

/**
 * The topics as the shared encoding description defines them, keyed by
 * the pointer that @ana uses (e.g. "#faithful_reproduction").
 */
export function getTopics(): Record<string, Topic> {
  const xml = fs.readFileSync(path.join(getTeiDir(), 'shared', 'encoding.xml'), 'utf-8')
  const doc = new JSDOM(xml, { contentType: 'text/xml' }).window.document
  const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim()

  return Object.fromEntries(Array.from(doc.querySelectorAll('taxonomy > category')).map(category => {
    const id = category.getAttribute('xml:id') || ''
    const description = text(category.querySelector('desc'))
    return [`#${id}`, { label: text(category.querySelector('gloss')) || id, ...(description && { description }) }]
  }))
}

export function getAllAds(): AdData[] {
  const teiDir = getTeiDir()
  const files = fs.readdirSync(teiDir).filter(f => f.endsWith('.xml')).sort()

  return files.map(file => {
    const slug = file.replace('.xml', '')
    const xmlString = fs.readFileSync(path.join(teiDir, file), 'utf-8')
    const { prefixed, elements, facsimile, textHtml } = prefixTei(xmlString)
    const metadata = extractMetadata(xmlString)

    return {
      slug,
      ...metadata,
      prefixed,
      elements,
      facsimile,
      textHtml,
    }
  })
}

export function getAdBySlug(slug: string): AdData {
  const teiDir = getTeiDir()
  const xmlString = fs.readFileSync(path.join(teiDir, `${slug}.xml`), 'utf-8')
  const { prefixed, elements, facsimile, textHtml } = prefixTei(xmlString)
  const metadata = extractMetadata(xmlString)

  return {
    slug,
    ...metadata,
    prefixed,
    elements,
    facsimile,
    textHtml,
  }
}

// A build asks for the metadata of every ad on many pages, but the TEI
// files do not change while it runs. In development they may.
let allMetadata: AdMetadata[] | undefined

export function getAllMetadata(): AdMetadata[] {
  if (allMetadata) return [...allMetadata]

  const teiDir = getTeiDir()
  const files = fs.readdirSync(teiDir).filter(f => f.endsWith('.xml')).sort()

  const metadata = files.map(file => {
    const slug = file.replace('.xml', '')
    const xmlString = fs.readFileSync(path.join(teiDir, file), 'utf-8')
    const metadata = extractMetadata(xmlString)

    return { slug, ...metadata }
  })
  if (process.env.NODE_ENV === 'production') allMetadata = metadata
  return [...metadata]
}
