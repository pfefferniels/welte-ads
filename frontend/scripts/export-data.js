// Publishes the data with the site: copies the TEI files (the advertisements,
// the shared encoding description and the schema) to public/tei/, so that
// every file has a stable address, and packs them with the licence and the
// citation file into public/tei/welte-ads-tei.zip. The copies name the
// schema by its address on the site, so that a single downloaded file still
// finds it; the zip keeps the relative paths, since it holds the schema.
//
// Runs before every build (npm run build); needs the zip command.

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.join(__dirname, '..', '..')
const target = path.join(__dirname, '..', 'public', 'tei')
const archive = 'welte-ads-tei.zip'
const site = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'site.ts'), 'utf-8')
  .match(/SITE_URL = "([^"]+)"/)[1]

fs.rmSync(target, { recursive: true, force: true })
fs.cpSync(path.join(root, 'tei'), target, { recursive: true })

const absolute = (xml, prefix) => xml
  .replace(`<?xml-model href="${prefix}welte-ads.rng"`, `<?xml-model href="${site}/tei/schema/welte-ads.rng"`)
  .replace(`<schemaRef type="projectODD" url="${prefix}welte-ads.odd"`, `<schemaRef type="projectODD" url="${site}/tei/schema/welte-ads.odd"`)
for (const [dir, prefix] of [[target, 'schema/'], [path.join(target, 'shared'), '../schema/']]) {
  for (const file of fs.readdirSync(dir).filter(name => name.endsWith('.xml'))) {
    const xml = fs.readFileSync(path.join(dir, file), 'utf-8')
    fs.writeFileSync(path.join(dir, file), absolute(xml, prefix))
  }
}

execFileSync('zip', ['-q', '-r', path.join(target, archive), 'tei', 'LICENSE.md', 'CITATION.cff'], { cwd: root })

const files = fs.readdirSync(target).filter(file => file.endsWith('.xml')).length
console.log(`Copied ${files} advertisements to public/tei/ and packed them into ${archive}`)
