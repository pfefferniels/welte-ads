import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'
import { v4 } from 'uuid'
import { Facsimile, FacsSurface, FacsZone, Point, parsePoints } from './facsimile'

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
 * Marks every <lb/> that would start an empty line when rendered: one at the
 * very beginning of a block (a div, a centered line …) or directly after
 * another line break. The layout view drops these so that a zone holds
 * exactly the lines of the original.
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
        atLineStart = true
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

function extractFacsimile(doc: Document): Facsimile {
  const surfaces: FacsSurface[] = []
  const zones: FacsZone[] = []
  const num = (value: string | null) => {
    const n = parseFloat(value || '')
    return Number.isFinite(n) && n > 0 ? n : null
  }

  doc.querySelectorAll('facsimile surface').forEach((surface, index) => {
    const graphic = surface.querySelector('graphic')
    surfaces.push({
      url: graphic?.getAttribute('url') || '',
      width: num(graphic?.getAttribute('width') ?? null),
      height: num(graphic?.getAttribute('height') ?? null),
    })

    surface.querySelectorAll('zone').forEach(zone => {
      const id = zone.getAttribute('xml:id') || zone.getAttribute('id')
      if (!id) return

      let points: Point[] = parsePoints(zone.getAttribute('points') || '')
      if (points.length < 3) {
        const [ulx, uly, lrx, lry] = ['ulx', 'uly', 'lrx', 'lry'].map(a => Number(zone.getAttribute(a)))
        if (![ulx, uly, lrx, lry].every(Number.isFinite)) return
        points = [[ulx, uly], [lrx, uly], [lrx, lry], [ulx, lry]]
      }
      zones.push({ id, surface: index, points })
    })
  })

  return { surfaces, zones }
}

function prefixTei(xmlString: string): { prefixed: string; elements: string[]; css: string; facsimile: Facsimile } {
  const dom = new JSDOM(xmlString, { contentType: 'text/xml' })
  const doc = dom.window.document
  const elements = new Set<string>()

  const facsimile = extractFacsimile(doc)
  markRedundantLineBreaks(doc)
  prefixElement(doc.documentElement, defaultNamespaces, elements)

  const css = extractRenditionCSS(doc, defaultNamespaces)
  const prefixed = serializeWithPrefixes(doc, defaultNamespaces)

  return {
    prefixed,
    elements: Array.from(elements),
    css,
    facsimile,
  }
}

interface TopicSegment {
  id: string
  topic: string
  text: string
}

interface AdMetadata {
  slug: string
  company: { name: string; link: string }
  title: string
  dates: string[]
  newspapers: string[]
  mentions: string[]
  topicSegments: TopicSegment[]
}

interface AdData extends AdMetadata {
  prefixed: string
  elements: string[]
  facsimile: Facsimile
  original: string
}

function extractMetadata(xmlString: string): Omit<AdMetadata, 'slug'> {
  const dom = new JSDOM(xmlString, { contentType: 'text/xml' })
  const doc = dom.window.document

  const company = {
    name: doc.querySelector('orgName[key]')?.getAttribute('key') || '',
    link: doc.querySelector('pubPlace[ref]')?.getAttribute('ref') || '',
  }
  const title = doc.querySelector('bibl')?.innerHTML || ''
  const dates = Array.from(doc.querySelectorAll('date[type="publication"]')).map(
    date => date.innerHTML
  )
  const newspapers = Array.from(doc.querySelectorAll('title[level="j"]')).map(
    title => title.innerHTML
  )
  const mentions = Array.from(doc.querySelectorAll('persName[corresp]')).map(
    name => name.getAttribute('corresp') || ''
  )
  const topicSegments = Array.from(doc.querySelectorAll('seg[ana]'))
    .map(seg => {
      const ana = seg.getAttribute('ana')
      if (!ana) return []

      return ana.split(' ').map(a => ({
        id: `#${seg.getAttribute('xml:id') || v4()}`,
        topic: a,
        text: seg.textContent || '',
      }))
    })
    .flat()

  return { company, title, dates, newspapers, mentions, topicSegments }
}

function getTeiDir(): string {
  return path.join(process.cwd(), '..', 'tei')
}

export function getAllAds(): AdData[] {
  const teiDir = getTeiDir()
  const files = fs.readdirSync(teiDir).filter(f => f.endsWith('.xml')).sort()

  return files.map(file => {
    const slug = file.replace('.xml', '')
    const xmlString = fs.readFileSync(path.join(teiDir, file), 'utf-8')
    const { prefixed, elements, facsimile } = prefixTei(xmlString)
    const metadata = extractMetadata(xmlString)

    return {
      slug,
      ...metadata,
      prefixed,
      elements,
      facsimile,
      original: xmlString,
    }
  })
}

export function getAdBySlug(slug: string): AdData {
  const teiDir = getTeiDir()
  const xmlString = fs.readFileSync(path.join(teiDir, `${slug}.xml`), 'utf-8')
  const { prefixed, elements, facsimile } = prefixTei(xmlString)
  const metadata = extractMetadata(xmlString)

  return {
    slug,
    ...metadata,
    prefixed,
    elements,
    facsimile,
    original: xmlString,
  }
}

export function getAllMetadata(): AdMetadata[] {
  const teiDir = getTeiDir()
  const files = fs.readdirSync(teiDir).filter(f => f.endsWith('.xml')).sort()

  return files.map(file => {
    const slug = file.replace('.xml', '')
    const xmlString = fs.readFileSync(path.join(teiDir, file), 'utf-8')
    const metadata = extractMetadata(xmlString)

    return { slug, ...metadata }
  })
}
