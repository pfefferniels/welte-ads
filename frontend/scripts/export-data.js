// Publishes the data with the site: copies the TEI files (the advertisements,
// the shared encoding description and the schema) to public/tei/, so that
// every file has a stable address, and packs them with the licence and the
// citation file into public/tei/welte-ads-tei.zip.
//
// Runs before every build (npm run build); needs the zip command.

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.join(__dirname, '..', '..')
const target = path.join(__dirname, '..', 'public', 'tei')
const archive = 'welte-ads-tei.zip'

fs.rmSync(target, { recursive: true, force: true })
fs.cpSync(path.join(root, 'tei'), target, { recursive: true })

execFileSync('zip', ['-q', '-r', path.join(target, archive), 'tei', 'LICENSE.md', 'CITATION.cff'], { cwd: root })

const files = fs.readdirSync(target).filter(file => file.endsWith('.xml')).length
console.log(`Copied ${files} advertisements to public/tei/ and packed them into ${archive}`)
