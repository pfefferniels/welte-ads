import React from "react"
import { Behavior } from "gatsby-theme-ceteicean/src/components/Behavior"
import { TEINodes } from "react-teirouter"

interface TEIProps {
    teiNode: Node
    availableRoutes?: string[]
}

interface WithZoneGetter {
    zoneGetter: (id: string) => string | null
}

interface Box {
    top: number 
    left: number
    width: number 
    height?: number
}

const calcBox = (points_: string | null, includeHeight: boolean) => {
    if (!points_) return null

    const points = points_.split(' ').map(point => point.split(',').map(x => Number(x)))
    const sums = points.map(point => point[0] + point[1])

    const best = Math.min(...sums)
    const bestPoint = points[sums.indexOf(best)]

    const mostRight = Math.max(...points.map(point => point[0]))
    const mostBottom = Math.max(...points.map(points => points[1]))

    const xScale = 1
    const yScale = 1

    const result: Box = {
        top: bestPoint[1] * yScale,
        left: bestPoint[0] * xScale,
        width: (mostRight - bestPoint[0]) * xScale
    }

    if (includeHeight) {
        result.height = (mostBottom * yScale) - result.top
    }

    return result
}

const Div = ({ teiNode, availableRoutes, zoneGetter }: TEIProps & WithZoneGetter) => {
    const div = teiNode as Element
    const points = (zoneGetter(div.getAttribute('facs') || '') || '')
    const isIllustration = div.getAttribute('type') === 'illustration'
    const box = calcBox(points, isIllustration)

    return (
        <Behavior node={teiNode}>
            <div style={
                box ? {
                    position: 'absolute',
                    ...box
                } : {}}
                className={`${isIllustration ? 'illustration' : 'div'}`}>
                <TEINodes
                    teiNodes={teiNode.childNodes}
                    availableRoutes={availableRoutes} />
            </div>
        </Behavior>
    )
}

export default Div