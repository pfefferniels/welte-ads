import React from "react"
import { Container, Typography } from '@mui/material'
import { getAllMetadata } from "../../lib/tei"
import { coordinates } from "../../labels/coordinates"
import { names } from "../../labels/names"
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
      label: names[curr.name] ?? curr.name,
      adCount: 1
    })

    return acc
  }, [] as Marker[])

  return (
    <Container component="main" maxWidth="md">
      <h1>Companies</h1>
      <Typography>
        Different companies advertised for the Welte-Mignon all
        over the world. Each circle stands for a company in one
        place, and its size grows with the logarithm of the number
        of ads. Scroll or use the buttons to zoom, drag to pan and
        point at a circle to see which company it is.
      </Typography>

      <CompaniesClient markers={markers} />
    </Container>
  )
}
