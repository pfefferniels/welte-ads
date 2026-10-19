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
  // the earliest printing decides the place of an ad in time
  const first = (dates: string[]) => [...dates].sort()[0] || ''
  const allMetadata = getAllMetadata()
    .sort((a, b) => first(a.dates).localeCompare(first(b.dates)))

  const markers = allMetadata.reduce((acc, meta) => {
    const { company } = meta
    // a place without known coordinates would end up at 0°/0°
    const coord = coordinates[company.link]
    if (!coord) return acc

    const ad = {
      slug: meta.slug,
      title: meta.title,
      when: meta.titleSub,
      newspapers: Array.from(new Set(meta.newspapers)),
    }

    const existingMarker = acc.find(marker =>
      marker.companyName === company.name
      && marker.coordinate.lat === coord.lat
      && marker.coordinate.long === coord.long)
    if (existingMarker) {
      existingMarker.ads.push(ad)
      return acc
    }

    acc.push({
      coordinate: coord,
      companyName: company.name,
      label: names[company.name] ?? company.name,
      ads: [ad]
    })

    return acc
  }, [] as Marker[])

  return (
    <Container component="main" maxWidth="md">
      <h2>Companies</h2>
      <Typography>
        Different companies advertised for the Welte-Mignon all
        over the world. Each circle stands for a company in one
        place, and its size grows with the logarithm of the number
        of ads. Scroll or use the buttons to zoom, drag to pan, point
        at a circle to see which company it is and click it to list
        its ads.
      </Typography>

      <CompaniesClient markers={markers} />
    </Container>
  )
}
