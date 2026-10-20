import fs from "fs"
import path from "path"
import type { MetadataRoute } from "next"
import { getAllMetadata, getTopics } from "../lib/tei"
import { SITE_URL } from "../lib/site"
import { topicPath } from "../helpers/topicPath"

export const dynamic = 'force-static'

// the pages besides the advertisements
const PAGES = ['', 'overview', 'places', 'artists', 'topics', 'guidelines', 'data', 'imprint']

// the date of an advertisement's newest change, from its revision history
const lastChange = (slug: string): Date | undefined => {
  const xml = fs.readFileSync(path.join(process.cwd(), '..', 'tei', `${slug}.xml`), 'utf-8')
  const dates = Array.from(xml.matchAll(/<change\b[^>]*\bwhen="(\d{4}-\d{2}-\d{2})"/g), match => match[1])
  return dates.length ? new Date(dates.sort().reverse()[0]) : undefined
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGES.map(page => ({ url: `${SITE_URL}/${page ? page + '/' : ''}` })),
    ...Object.keys(getTopics()).map(topic => ({ url: `${SITE_URL}${topicPath(topic)}/` })),
    ...getAllMetadata().map(ad => ({
      url: `${SITE_URL}/${ad.slug}/`,
      lastModified: lastChange(ad.slug),
    })),
  ]
}
