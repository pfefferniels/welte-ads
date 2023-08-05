import { Behavior } from "gatsby-theme-ceteicean/src/components/Behavior"
import React, { } from "react"

interface TEIProps {
    teiNode: Node
}

const MsIdentifier = ({ teiNode }: TEIProps) => {
    const el = teiNode as Element

    const repository = el.querySelector('tei-repository')?.textContent
    const imagesUrl = el.querySelector('tei-idno[type="URLImages"]')?.textContent

    return (
        <Behavior node={teiNode}>
            <div>
                <a href={imagesUrl || ''}>Digital Images in {repository}</a>
            </div>
        </Behavior>
    )
}

export default MsIdentifier
