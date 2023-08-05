import React from 'react'
import Layout from "../components/layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container, Typography } from '@mui/material'
import { Marker, WorldMap } from '../components/WorldMap'
import { coordinates } from '../labels/coordinates'

const Companies = () => {
    const data = useStaticQuery(graphql`
        query {
          allMetadata {
            nodes {
              dates
              company {
                name 
                link
              }
            }
          }
        }
    `)

    const companies = data.allMetadata.nodes.map((node: any) => node.company) as { name: string, link: string}[]
    console.log('companies=', companies)
    const markers = companies.reduce((acc, curr) => {
      const coord = coordinates[curr.link] || { lat: 0, long: 0 }
      const existingMarker = acc.find(marker =>
          marker.companyName === curr.name
          && marker.coordinate.lat === coord.lat
          && marker.coordinate.long === coord.long)
      if (existingMarker) {
        existingMarker.adCount += 1
        return acc
      }

      acc.push({
        coordinate: coord,
        companyName: curr.name,
        adCount: 1
      })

      return acc
    }, [] as Marker[])

    console.log('markers=', markers)

    return (
        <Layout location="Companies" editionPage={false}>
            <Container component="main" maxWidth="md">
                <h2>Companies</h2>
                <Typography>
                    Different companies advertised for the Welte-Mignon.
                </Typography>

                <WorldMap markers={markers} />
            </Container>
        </Layout>
    )
}

export default Companies
