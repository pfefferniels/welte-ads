import React from "react"
import { TEINodes } from "react-teirouter"
import { Behavior } from "./Behavior"
import Seg from "./Seg"

interface TEIProps {
  teiNode: Node
  availableRoutes?: string[]
}

// A figure annotated with a topic (@ana) behaves like a topic segment.
const Figure = ({ teiNode, availableRoutes }: TEIProps) => {
  if ((teiNode as Element).hasAttribute('ana')) {
    return <Seg teiNode={teiNode} availableRoutes={availableRoutes} />
  }

  return (
    <Behavior node={teiNode}>
      <TEINodes teiNodes={teiNode.childNodes} availableRoutes={availableRoutes} />
    </Behavior>
  )
}

export default Figure
