import React from "react"
import { Behavior } from "./Behavior"
import { TEINodes } from "react-teirouter"

interface TEIProps {
    teiNode: Node
    availableRoutes?: string[]
}

// a link; one to another advertisement (e.g. "ad005.xml") leads to its page
const Ref = ({ teiNode, availableRoutes }: TEIProps) => {
    const target = (teiNode as Element).getAttribute('target') || ''
    const ad = target.match(/^(ad\d{3})\.xml$/)

    return (
        <Behavior node={teiNode}>
            <a href={ad ? `/${ad[1]}/` : target}>
                <TEINodes
                    teiNodes={teiNode.childNodes}
                    availableRoutes={availableRoutes} />
            </a>
        </Behavior>
    )
}

export default Ref
