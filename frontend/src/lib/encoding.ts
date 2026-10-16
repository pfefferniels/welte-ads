import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'

interface Section {
  heading: string
  paragraphs: string[]
}

interface EncodingDescription {
  selection: string[]
  principles: Section[]
  renditions: { id: string; css: string }[]
}

const HEADINGS: Record<string, string> = {
  p: 'Transcription',
  correction: 'Errors',
  normalization: 'Spelling',
  hyphenation: 'Hyphenation',
  segmentation: 'Regions and lines',
  interpretation: 'Annotation',
  stdVals: 'Dates',
}

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// the phrase-level markup of the encoding description as HTML
const inline = (node: Node): string => {
  if (node.nodeType === 3) return escape((node.textContent || '').replace(/\s+/g, ' '))
  if (node.nodeType !== 1) return ''
  const el = node as Element
  const inner = Array.from(el.childNodes).map(inline).join('')
  switch (el.localName) {
    case 'gi': return `<code>&lt;${inner}&gt;</code>`
    case 'att': return `<code>@${inner}</code>`
    case 'val': return `<code>${inner}</code>`
    default: return inner
  }
}

const paragraphs = (el: Element) =>
  Array.from(el.getElementsByTagName('p')).map(p => inline(p).trim())

/**
 * The principles of selection and transcription as the shared encoding
 * description (tei/shared/encoding.xml) states them.
 */
export function getEncodingDescription(): EncodingDescription {
  const file = path.join(process.cwd(), '..', 'tei', 'shared', 'encoding.xml')
  const doc = new JSDOM(fs.readFileSync(file, 'utf-8'), { contentType: 'text/xml' }).window.document

  const selection = paragraphs(doc.getElementsByTagName('samplingDecl')[0])

  const principles: Section[] = []
  for (const child of Array.from(doc.getElementsByTagName('editorialDecl')[0].children)) {
    const heading = HEADINGS[child.localName] || child.localName
    const texts = child.localName === 'p' ? [inline(child).trim()] : paragraphs(child)
    const last = principles[principles.length - 1]
    // the paragraphs directly in <editorialDecl> make one section
    if (last && last.heading === heading) last.paragraphs.push(...texts)
    else principles.push({ heading, paragraphs: texts })
  }

  const renditions = Array.from(doc.getElementsByTagName('rendition')).map(rendition => ({
    id: rendition.getAttribute('xml:id') || '',
    css: (rendition.textContent || '').trim(),
  }))

  return { selection, principles, renditions }
}
