// Pre-generates artists data as a static JSON file for the client-side artists page.
// This runs before the Next.js build so client components can fetch the data.

const fs = require('fs')
const path = require('path')
const { JSDOM } = require('jsdom')

const teiDir = path.join(__dirname, '..', '..', 'tei')
const outputDir = path.join(__dirname, '..', 'public', 'api')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const files = fs.readdirSync(teiDir).filter(f => f.endsWith('.xml')).sort()

const data = files.map(file => {
  const xmlString = fs.readFileSync(path.join(teiDir, file), 'utf-8')
  const dom = new JSDOM(xmlString, { contentType: 'text/xml' })
  const doc = dom.window.document

  const dates = Array.from(doc.querySelectorAll('date[type="publication"]'))
    .map(date => date.innerHTML)
  const mentions = Array.from(doc.querySelectorAll('persName[corresp]'))
    .map(name => name.getAttribute('corresp') || '')

  return { dates, mentions }
})

fs.writeFileSync(
  path.join(outputDir, 'artists-data.json'),
  JSON.stringify(data)
)

console.log('Generated artists-data.json')
