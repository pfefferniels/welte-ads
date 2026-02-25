"use client"

import React from "react"
import { WorldMap, Marker } from "../../components/worldMap"

interface Props {
  markers: Marker[]
}

export default function CompaniesClient({ markers }: Props) {
  return <WorldMap markers={markers} />
}
