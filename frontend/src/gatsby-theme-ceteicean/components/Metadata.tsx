import { Behavior } from "gatsby-theme-ceteicean/src/components/Behavior"
import React, { MutableRefObject, RefObject, useEffect } from "react"
import { createPortal } from "react-dom"
import { TEINodes } from "react-teirouter"

interface TEIProps {
    teiNode: Node
    availableRoutes?: string[]
}

interface WithSink {
    sink: MutableRefObject<HTMLDivElement | null>
}

const Metadata = ({ teiNode, availableRoutes, sink }: TEIProps & WithSink) => {
    console.log(sink.current)
    
    return sink.current && createPortal((
        <Behavior node={teiNode}>
            <TEINodes
                teiNodes={teiNode.childNodes}
                availableRoutes={availableRoutes} />
        </Behavior>),
        sink.current!)
}

export default Metadata