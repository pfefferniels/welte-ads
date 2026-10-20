// Copies the shared encoding description (tei/shared/encoding.xml) into the
// <encodingDesc> of every advertisement: the project description, the
// principles of selection and transcription, the reference to the project ODD
// (<schemaRef>), and those renditions and topics that the advertisement uses,
// so that each file explains its own markup. Also points every advertisement
// to the project schema, as the shared file does, in its xml-model processing
// instruction. Paths in these are relative to the file, so they are adjusted
// from tei/shared/ to tei/.
//
// Run it after changing tei/shared/encoding.xml, or after using a new
// rendition or topic in an advertisement: npm run sync-tei

const fs = require('fs')
const path = require('path')

const teiDir = path.join(__dirname, '..', '..', 'tei')
const sharedDir = path.join(teiDir, 'shared')
const shared = fs.readFileSync(path.join(sharedDir, 'encoding.xml'), 'utf-8')

// a reference relative to the shared file, made relative to the advertisements
const relocate = reference => /^[a-z][a-z0-9+.-]*:/i.test(reference)
  ? reference
  : path.relative(teiDir, path.resolve(sharedDir, reference)).split(path.sep).join('/')

const relocateAttribute = (text, attribute) =>
  text.replace(new RegExp(`\\b${attribute}="([^"]*)"`), (_, value) => `${attribute}="${relocate(value)}"`)

const schema = relocateAttribute(shared.match(/<\?xml-model[^>]*\?>/)[0], 'href')

// an element of the shared file with the indentation of its first line
const block = name => {
  const match = shared.match(new RegExp(`^([ \\t]*)<${name}[\\s>][\\s\\S]*?</${name}>`, 'm'))
  if (!match) throw new Error(`no <${name}> in the shared encoding description`)
  return { indent: match[1], text: match[0] }
}

const declarations = pattern => {
  const result = new Map()
  for (const match of shared.matchAll(pattern)) {
    result.set(match[2], { indent: match[1], text: match[0] })
  }
  return result
}

const projectDesc = block('projectDesc')
const samplingDecl = block('samplingDecl')
const editorialDecl = block('editorialDecl')
const schemaRef = (() => {
  const match = shared.match(/^([ \t]*)(<schemaRef\b[^>]*\/>|<schemaRef\b[\s\S]*?<\/schemaRef>)/m)
  if (!match) throw new Error('no <schemaRef> in the shared encoding description')
  return { indent: match[1], text: match[1] + relocateAttribute(match[2], 'url') }
})()
const taxonomyDesc = shared.match(/<taxonomy[^>]*>\s*\n([ \t]*)(<desc>[\s\S]*?<\/desc>)/)
const renditions = declarations(/^([ \t]*)<rendition xml:id="([^"]+)"[\s\S]*?<\/rendition>/gm)
const categories = declarations(/^([ \t]*)<category xml:id="([^"]+)">[\s\S]*?<\/category>/gm)

// moves a block of lines from one indentation to another
const reindent = ({ indent, text }, to) => text
  .split('\n')
  .map((line, i) => i === 0
    ? to + line.slice(indent.length)
    : line.startsWith(indent) ? to + line.slice(indent.length) : line)
  .join('\n')

// the values of an attribute that holds pointers, e.g. rendition="#c #uc"
const pointers = (xml, attribute) => {
  const values = new Set()
  for (const match of xml.matchAll(new RegExp(`\\b${attribute}="([^"]*)"`, 'g'))) {
    match[1].split(/\s+/).filter(Boolean).forEach(value => values.add(value.replace(/^#/, '')))
  }
  return values
}

const used = (declared, values, file, what) => {
  const unknown = [...values].filter(value => !declared.has(value))
  if (unknown.length) {
    throw new Error(`${file} uses ${what} that tei/shared/encoding.xml does not declare: ${unknown.join(', ')}`)
  }
  // in the order of the shared file
  return [...declared.keys()].filter(key => values.has(key))
}

const encodingDesc = (xml, file) => {
  const fileDesc = xml.match(/^([ \t]*)<fileDesc>\n([ \t]*)/m)
  if (!fileDesc) throw new Error(`${file} has no <fileDesc>`)
  const base = fileDesc[1]
  const step = fileDesc[2].slice(base.length) || '   '
  const at = depth => base + step.repeat(depth)

  const lines = [
    `${at(0)}<encodingDesc>`,
    reindent(projectDesc, at(1)),
    reindent(samplingDecl, at(1)),
    reindent(editorialDecl, at(1)),
    reindent(schemaRef, at(1)),
  ]

  const usedRenditions = used(renditions, pointers(xml, 'rendition'), file, 'renditions')
  if (usedRenditions.length) {
    lines.push(`${at(1)}<tagsDecl>`)
    usedRenditions.forEach(id => lines.push(reindent(renditions.get(id), at(2))))
    lines.push(`${at(1)}</tagsDecl>`)
  }

  const usedCategories = used(categories, pointers(xml, 'ana'), file, 'topics')
  if (usedCategories.length) {
    lines.push(`${at(1)}<classDecl>`)
    lines.push(`${at(2)}<taxonomy xml:id="topics">`)
    lines.push(reindent({ indent: taxonomyDesc[1], text: taxonomyDesc[1] + taxonomyDesc[2] }, at(3)))
    usedCategories.forEach(id => lines.push(reindent(categories.get(id), at(3))))
    lines.push(`${at(2)}</taxonomy>`)
    lines.push(`${at(1)}</classDecl>`)
  }

  lines.push(`${at(0)}</encodingDesc>`)
  return lines.join('\n') + '\n'
}

const files = fs.readdirSync(teiDir).filter(f => f.endsWith('.xml')).sort()
let changed = 0

for (const file of files) {
  const filePath = path.join(teiDir, file)
  const original = fs.readFileSync(filePath, 'utf-8')

  let xml = original.replace(/^[ \t]*<encodingDesc>[\s\S]*?<\/encodingDesc>\n/m, '')
  xml = xml.includes('<?xml-model')
    ? xml.replace(/<\?xml-model[^>]*\?>/, () => schema)
    : xml.replace(/^(<\?xml[^>]*\?>\n)?/, `$1${schema}\n`)

  const end = xml.match(/^[ \t]*<\/fileDesc>\n/m)
  const at = end.index + end[0].length
  xml = xml.slice(0, at) + encodingDesc(xml, file) + xml.slice(at)

  if (xml !== original) {
    fs.writeFileSync(filePath, xml)
    changed++
  }
}

console.log(`Synchronised the encoding description of ${files.length} advertisements (${changed} changed)`)
