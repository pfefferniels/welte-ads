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

  // an ad counts once, in the year of its first printing, however often it
  // was printed
  const years = Array.from(doc.querySelectorAll('date[type="publication"]'))
    .map(date => Number((date.getAttribute('when') || date.textContent || '').slice(0, 4)))
    .filter(Boolean)
  const year = Math.min(...years)
  // only the recording artists, not composers or other persons mentioned
  const mentions = Array.from(doc.querySelectorAll('persName[corresp][type="artist"]'))
    .map(name => name.getAttribute('corresp') || '')

  return { year, mentions }
})

fs.writeFileSync(
  path.join(outputDir, 'artists-data.json'),
  JSON.stringify(data)
)

console.log('Generated artists-data.json')
