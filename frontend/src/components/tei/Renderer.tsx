"use client"

import React from "react"
import { TEIRender, TEIRoute } from "react-teirouter"
import { define } from "./define"
import { Tei, TeiHeader } from "./DefaultBehaviors"

export type Routes = {
  [key: string]: React.ComponentType<{ teiNode: Node; availableRoutes?: string[] }>
}

interface RendererProps {
  prefixed: string
  elements: string[]
  routes?: Routes
}

const Renderer = ({ prefixed, elements, routes = {} }: RendererProps) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Register custom elements
  define(elements)

  // Parse the prefixed HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(prefixed, 'text/html')

  // Default routes
  const defaultRoutes: Routes = {
    "tei-tei": Tei,
    "tei-teiheader": TeiHeader,
  }

  // Merge default routes with custom routes (custom takes precedence)
  const mergedRoutes: Routes = { ...defaultRoutes, ...routes }
  const availableRoutes = Object.keys(mergedRoutes)

  return (
    <TEIRender data={doc.body.firstElementChild || doc.body}>
      {availableRoutes.map(el => (
        <TEIRoute key={el} el={el} component={mergedRoutes[el]} />
      ))}
    </TEIRender>
  )
}

export default Renderer
