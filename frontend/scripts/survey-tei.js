// Surveys the markup of the TEI files: which elements occur, which attributes
// each of them carries and which values these take. The project ODD
// (tei/schema/welte-ads.odd) admits what this survey finds; run it to see
// whether the ODD still covers the files, e.g. after encoding a new kind of
// advertisement: npm run survey-tei
//
// Attributes with few distinct values list them all, the others give their
// number and a few examples. Pointer attributes (ana, rendition, ...) are
// counted by their single pointers. Options:
//   --max=N             list up to N distinct values (default 30)
//   element@attribute   list all values of this attribute, e.g. persName@corresp

const fs = require('fs')
const path = require('path')
const { JSDOM } = require('jsdom')

const TEI = 'http://www.tei-c.org/ns/1.0'
const teiDir = path.join(__dirname, '..', '..', 'tei')

const args = process.argv.slice(2)
const max = Number((args.find(arg => arg.startsWith('--max=')) || '--max=30').slice(6))
const full = new Set(args.filter(arg => arg.includes('@')))

// attributes that hold a list of pointers or keys
const lists = new Set(['ana', 'corresp', 'decls', 'facs', 'rendition', 'resp', 'source', 'target', 'wit'])

const files = [
  ...fs.readdirSync(teiDir).filter(file => /^ad\d+\.xml$/.test(file)).sort(),
  path.join('shared', 'encoding.xml'),
]

const elements = new Map()
const count = (map, key) => map.set(key, (map.get(key) || 0) + 1)

for (const file of files) {
  const xml = fs.readFileSync(path.join(teiDir, file), 'utf-8')
  const doc = new JSDOM(xml, { contentType: 'text/xml' }).window.document
  for (const el of Array.from(doc.getElementsByTagName('*'))) {
    const name = el.namespaceURI === TEI ? el.localName : `{${el.namespaceURI}}${el.localName}`
    if (!elements.has(name)) elements.set(name, { count: 0, files: new Set(), attributes: new Map() })
    const entry = elements.get(name)
    entry.count++
    entry.files.add(file)
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('xmlns')) continue
      if (!entry.attributes.has(attr.name)) entry.attributes.set(attr.name, { count: 0, values: new Map() })
      const attribute = entry.attributes.get(attr.name)
      attribute.count++
      const values = lists.has(attr.name) ? attr.value.split(/\s+/).filter(Boolean) : [attr.value]
      values.forEach(value => count(attribute.values, value))
    }
  }
}

const quote = value => JSON.stringify(value)
const byCount = map => [...map.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))

console.log(`${files.length} files, ${elements.size} elements\n`)
for (const [name, entry] of [...elements.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`${name}  ${entry.count}× in ${entry.files.size} files`)
  for (const [att, attribute] of [...entry.attributes.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const values = byCount(attribute.values)
    const all = full.has(`${name}@${att}`)
    const shown = all || values.length <= max ? values : values.slice(0, 5)
    const list = shown.map(([value, n]) => `${quote(value)} ${n}`).join(', ')
    const more = shown.length < values.length ? `, … (${values.length} distinct)` : ''
    console.log(`  @${att}  ${attribute.count}×: ${list}${more}`)
  }
}
