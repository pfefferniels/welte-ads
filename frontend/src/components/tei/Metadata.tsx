import React, { MutableRefObject } from "react"
import { createPortal } from "react-dom"
import { Behavior } from "./Behavior"
import { TEINodes } from "react-teirouter"

interface TEIProps {
    teiNode: Node
    availableRoutes?: string[]
}

interface WithSink {
    sink: MutableRefObject<HTMLDivElement | null>
}

const Metadata = ({ teiNode, availableRoutes, sink }: TEIProps & WithSink) => {
    return sink.current && createPortal((
        <Behavior node={teiNode}>
            <TEINodes
                teiNodes={teiNode.childNodes}
                availableRoutes={availableRoutes} />
        </Behavior>),
        sink.current!)
}

export default Metadata
