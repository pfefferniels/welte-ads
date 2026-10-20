import React from "react"
import Link from "next/link"
import { Container, Typography } from "@mui/material"
import { getAllMetadata } from "../../lib/tei"
import { currentRelease, publishedSize } from "../../lib/release"
import { DATA_ARCHIVE, DATA_LICENCE, datasetJsonLd } from "../../lib/dataset"
import JsonLd from "../../components/jsonld"

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
        the <Link href="/guidelines/">Guidelines</Link>.
      </Typography>
      <Typography>
        The data are published under
        the <a href={DATA_LICENCE}>Creative Commons Attribution-NonCommercial-ShareAlike
        4.0 International License</a>, the code of the website under the
        MIT License.
      </Typography>
      <Typography>
        {version
          ? <>This is version {version}{date && `, released on ${date}`}. </>
          : <>The collection is still growing and has no numbered release yet. </>}
        Releases are archived in the <a href={`${REPOSITORY}/releases`}>repository
        on GitHub</a>, where the files and their history are also kept. Each
        advertisement page suggests how to cite it; the collection as a whole is
        cited as its <a href={`${REPOSITORY}/blob/main/CITATION.cff`}>citation
        file</a> says.
      </Typography>
    </Container>
  )
}
