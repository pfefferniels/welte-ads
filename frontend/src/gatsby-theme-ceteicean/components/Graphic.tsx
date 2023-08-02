import React, { useEffect } from "react"

interface TEIProps {
    teiNode: Node
}

interface WithDimensionSetter {
    setDimension: (width: number, height: number) => void
}

const Graphic = ({ teiNode, setDimension }: TEIProps & WithDimensionSetter) => {
    console.log('graphic=', teiNode)
    useEffect(() => {
        const graphic = teiNode as Element

        setDimension(
            Number(graphic.getAttribute('width') || 800),
            Number(graphic.getAttribute('height') || 1000))
    }, [teiNode])

    return null
}

export default Graphic