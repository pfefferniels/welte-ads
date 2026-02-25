"use client"

import React from "react"
import { WeighedCircles } from "../../components/weighedCircles"

interface Props {
  data: { topic: string; weight: number }[]
}

export default function TopicsClient({ data }: Props) {
  return <WeighedCircles data={data} />
}
