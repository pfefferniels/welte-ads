import React from "react"
import Link from "next/link"
import { Container, Typography } from "@mui/material"
import { getAllMetadata } from "../../lib/tei"
import { currentRelease, publishedSize } from "../../lib/release"
import { DATA_ARCHIVE, DATA_LICENCE, datasetJsonLd } from "../../lib/dataset"
import JsonLd from "../../components/jsonld"
import { DOI } from "../../lib/site"

export const metadata = {
  title: 'Data',
}

const REPOSITORY = 'https://github.com/pfefferniels/welte-ads'

export default function DataPage() {
  const ads = getAllMetadata()
  const size = publishedSize(DATA_ARCHIVE)
  const { version, date } = currentRelease()

  return (
    <Container component="main" maxWidth="md">
      <JsonLd data={datasetJsonLd(ads.length)} />
      <h1>Data</h1>
      <Typography>
        Every advertisement is a TEI P5 file, which describes its own
        markup and sources. <a href={DATA_ARCHIVE} download>Download all {ads.length} files</a>{' '}
        (zip{size && `, ${size}`}), with the shared encoding description, the
        licence and the citation file. Each file also has its own
        address, e.g. <a href="/tei/ad008.xml">/tei/ad008.xml</a>, and can
        be downloaded from its page. How the files are encoded is described in
        the <Link href="/guidelines/">Guidelines</Link>; they are valid against
        the project&apos;s schema (<a href="/tei/schema/welte-ads.rng">RELAX NG</a>),
        generated from its <a href="/tei/schema/welte-ads.odd">ODD</a>, and against
        tei_all.
      </Typography>
      <Typography>
        The data are published under
        the <a href={DATA_LICENCE}>Creative Commons Attribution 4.0 International
        License</a>, the code of the website under the
        MIT License.
      </Typography>
      <Typography>
        {version
          ? <>This is version {version}{date && `, released on ${date}`}. </>
          : <>The collection is still growing and has no numbered release yet. </>}
        Every release is archived on Zenodo, which gives it a DOI of its own;
        the DOI of the collection, <a href={`https://doi.org/${DOI}`}>{DOI}</a>,
        always leads to the newest version. The releases and the history of
        the files are also kept in the <a href={`${REPOSITORY}/releases`}>repository
        on GitHub</a>. Each advertisement page suggests how to cite it, in the
        styles of Chicago, MLA and APA, in German style and as BibTeX; the
        collection as a whole is cited as
        its <a href={`${REPOSITORY}/blob/main/CITATION.cff`}>citation file</a> says.
      </Typography>
    </Container>
  )
}
