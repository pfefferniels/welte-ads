import React from "react"
import { Container, Typography } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import { coordinates } from "../../labels/coordinates"
import { Marker } from "../../components/worldMap"
import CompaniesClient from "./CompaniesClient"

export const metadata = {
  title: 'Companies',
}

export default function CompaniesPage() {
  const allMetadata = getAllMetadata()

  const companies = allMetadata.map(m => m.company) as { name: string; link: string }[]
  const markers = companies.reduce((acc, curr) => {
    // a place without known coordinates would end up at 0°/0°
    const coord = coordinates[curr.link]
    if (!coord) return acc

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

  return (
    <Container component="main" maxWidth="md">
      <h2>Companies</h2>
      <Typography>
        Different companies advertised for the Welte-Mignon all
        over the world.
      </Typography>

      <CompaniesClient markers={markers} />
    </Container>
  )
}
