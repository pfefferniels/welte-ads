import { DOI, EDITION, EDITOR, SITE_URL } from "./site"
import { currentRelease } from "./release"

export const DATA_ARCHIVE = '/tei/welte-ads-tei.zip'
export const DATA_LICENCE = 'https://creativecommons.org/licenses/by/4.0/'

/** The collection as a schema.org Dataset. */
export function datasetJsonLd(ads: number) {
  const { version, date } = currentRelease()
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: EDITION,
    description: `A TEI edition of ${ads} print advertisements for the Welte-Mignon `
      + 'reproducing piano, 1905–1930: transcriptions with the layout of their '
      + 'originals, descriptions of their printings, persons linked to the GND, '
      + 'and an annotation of recurring motifs.',
    url: SITE_URL,
    identifier: `https://doi.org/${DOI}`,
    creator: {
      '@type': 'Person',
      name: EDITOR.name,
      affiliation: EDITOR.affiliation,
      sameAs: `https://orcid.org/${EDITOR.orcid}`,
    },
    license: DATA_LICENCE,
    isAccessibleForFree: true,
    temporalCoverage: '1905/1930',
    keywords: ['Welte-Mignon', 'reproducing piano', 'advertising', 'TEI', 'digital edition'],
    ...(version && { version }),
    ...(date && { datePublished: date }),
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/zip',
      contentUrl: SITE_URL + DATA_ARCHIVE,
    },
  }
}
