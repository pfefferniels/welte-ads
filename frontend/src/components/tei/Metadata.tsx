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

// a source; the one that the text is transcribed from says so
export const SourceDesc = ({ teiNode, availableRoutes }: TEIProps) => {
    const el = teiNode as Element
    const decls = el.ownerDocument.querySelector('tei-text')?.getAttribute('decls') || ''
    const transcribed = decls.split(/\s+/).includes(`#${el.getAttribute('id')}`)

    // without Behavior's hidden copy of the source, which the style of the
    // header would show (every child of a source is a block)
    return React.createElement(
        el.tagName.toLowerCase(),
        { id: el.getAttribute('id') || undefined },
        transcribed && <i>The text is transcribed from this printing.</i>,
        <TEINodes
            key="content"
            teiNodes={teiNode.childNodes}
            availableRoutes={availableRoutes} />
    )
}
