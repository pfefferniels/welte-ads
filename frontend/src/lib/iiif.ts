// IIIF images of the pages, as the TEI gives them in <graphic type="IIIF">.
// Kept free of Node imports so it can run in the browser.

export interface IIIFImage {
  // the image service, to which a IIIF request (region/size/rotation/quality)
  // is appended
  service: string
  width: number
  height: number
}

// the libraries whose IIIF services the collection uses; `site` is the host
// of the library's own pages where it differs from that of its images
const LIBRARIES: { host: string; name: string; site?: string }[] = [
  { host: 'digitale-sammlungen.de', name: 'Bayerische Staatsbibliothek' },
  { host: 'loc.gov', name: 'Library of Congress' },
  { host: 'archive.org', name: 'Internet Archive' },
  { host: 'dedieletemps.cybor.ch', name: 'Le Temps archives', site: 'letempsarchives.ch' },
  { host: 'eluxemburgensia.lu', name: 'Bibliothèque nationale du Luxembourg' },
  { host: 'nb.no', name: 'Nasjonalbiblioteket' },
  { host: 'europeana.eu', name: 'National Library of Latvia (Europeana)' },
  { host: 'canadiana.ca', name: 'Canadiana' },
]

const isOn = (host: string, domain: string) => host === domain || host.endsWith('.' + domain)

const hostname = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

/** The image service of a full-image request such as
 * ".../bsb00130861_00335/full/full/0/default.jpg" (IIIF 2) or
 * ".../full/max/0/default.jpg" (IIIF 3). */
export function iiifService(url: string): string | null {
  const match = url.match(/^(https?:\/\/.+)\/full\/(?:full|max)\/0\/default\.(?:jpg|png)$/)
  return match ? match[1] : null
}

// the Internet Archive's IIIF service names a page by the encoded path of its
// file, e.g. ".../3/item%2Fitem_jp2.zip%2Fitem_jp2%2Fitem_0025.jp2"
const archivePage = /^https:\/\/iiif\.archive\.org\/image\/iiif\/3\/([^%/]+)%2F.*_(\d+)\.jp2$/i

/** A request for the whole image, at most `width` pixels wide. */
export function iiifImageUrl(image: IIIFImage, width: number): string {
  const size = Math.min(width, image.width)
  // In a browser, the Internet Archive's IIIF server answered these requests
  // with 404 (other clients get the image); its own page images load
  // everywhere, and "leaf" counts the files the same way.
  const archive = image.service.match(archivePage)
  if (archive) return `https://archive.org/download/${archive[1]}/page/leaf${Number(archive[2])}_w${size}.jpg`
  return `${image.service}/full/${size},/0/default.jpg`
}

/** The library that serves an image, and the link to its page among the
 * links of the printing. */
export function libraryOf(service: string, links: string[]): { name: string; url: string | null } | null {
  const host = hostname(service)
  const library = LIBRARIES.find(l => isOn(host, l.host))
  if (!library) return null
  const url = links.find(link => isOn(hostname(link), library.site || library.host)) || null
  return { name: library.name, url }
}
