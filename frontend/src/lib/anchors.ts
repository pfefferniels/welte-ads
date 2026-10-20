// the prefix of the URIs of the GND, the authority file of the German National Library
export const GND = 'https://d-nb.info/gnd/'

// any run of characters that are neither letters nor digits
const SEPARATORS = new RegExp('[^\\p{L}\\p{N}]+', 'gu')

/**
 * A text as a fragment identifier: in lower case, without accents, its
 * words joined by hyphens ("Neue Zürcher Zeitung" → "neue-zurcher-zeitung").
 */
export function anchorOf(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(SEPARATORS, '-').replace(/^-+|-+$/g, '')
}

/** The anchor of a person in the register: "gnd-118986724" for a GND URI. */
export function personAnchor(uri: string): string {
  return uri.startsWith(GND) ? `gnd-${uri.slice(GND.length)}` : anchorOf(uri)
}

/** The anchor of a name without a GND URI in the register, from the name as written. */
export function nameAnchor(written: string): string {
  return `name-${anchorOf(written)}`
}

/** The link to an artist's entry on the Artists page, by the GND URI. */
export function artistLink(uri: string): string {
  return `/artists/#${personAnchor(uri)}`
}
