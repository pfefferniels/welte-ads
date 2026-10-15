import React from "react"
import { Behavior } from "./Behavior"
import { TEINodes } from "react-teirouter"

interface TEIProps {
    teiNode: Node
    availableRoutes?: string[]
}

const Metadata = ({ teiNode, availableRoutes }: TEIProps) => (
    <Behavior node={teiNode}>
        <TEINodes
            teiNodes={teiNode.childNodes}
            availableRoutes={availableRoutes} />
    </Behavior>
)

export default Metadata

// a revision: its date, then what changed
export const Change = ({ teiNode, availableRoutes }: TEIProps) => (
    <Behavior node={teiNode}>
        {(teiNode as Element).getAttribute('when')}:{' '}
        <TEINodes
            teiNodes={teiNode.childNodes}
            availableRoutes={availableRoutes} />
    </Behavior>
)
