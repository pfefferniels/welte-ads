import React from "react"
import { IGatsbyImageData } from "gatsby-plugin-image"
import { graphql, useStaticQuery } from "gatsby"
import Ceteicean, {Routes} from "gatsby-theme-ceteicean/src/components/Ceteicean"
import {
  Tei,
  TeiHeader
} from "gatsby-theme-ceteicean/src/components/DefaultBehaviors"
import Pb from "./Pb"
import Layout from "../../components/layout"
import Container from "@mui/material/Container"
import './style.css'
import Name from "./Name"

interface Props {
  pageContext: {
    name: string
    prefixed: string
    elements: string[]
  },
  location: string
}

export interface Fac {
  name: string
  childImageSharp: {
    gatsbyImageData: IGatsbyImageData
  }
}

const EditionCeteicean = ({pageContext}: Props) => {
  const queryData = useStaticQuery(graphql`
  query general {
    facs: allFile(filter: {relativeDirectory: {in: "facs"}}) {
      nodes {
        name
        childImageSharp {
          gatsbyImageData
        }
      }
    }
  }
`)
const facs: Fac[] = queryData.facs.nodes

  const routes: Routes = {
    "tei-tei": Tei,
    "tei-teiheader": TeiHeader,
    "tei-pb": (props) => <Pb facs={facs} {...props}/>,
    "tei-persname": Name,
    "tei-orgname": Name
  }

  return(
    <Layout location="Edition" editionPage={true}>
      <Container component="main" maxWidth="md">
        <Ceteicean pageContext={pageContext} routes={routes} />
      </Container>
    </Layout>
  )

}

export default EditionCeteicean
