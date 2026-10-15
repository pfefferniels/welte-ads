import React, { useLayoutEffect, useRef } from "react"
import { Behavior } from "./Behavior"
import { TEINodes } from "react-teirouter"
import { PlacedZone, exclusions } from "../../lib/facsimile"

interface TEIProps {
    teiNode: Node
    availableRoutes?: string[]
}

interface WithZoneGetter {
    zoneGetter: (id: string) => PlacedZone | null
}

const fits = (el: HTMLElement, width: number, height: number) =>
    el.scrollWidth <= width + 1 && el.scrollHeight <= height + 1

// The largest font size (in px) at which the content stays inside the box.
const largestFitting = (el: HTMLElement, width: number, height: number, max: number) => {
    let lo = 0.5
    let hi = max
    for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) / 2
        el.style.fontSize = `${mid}px`
        if (fits(el, width, height)) lo = mid
        else hi = mid
    }
    return lo
}

/**
 * Sizes the text so that it fills its zone the way it fills the region on
 * the original page. Line breaks are taken from the encoded <lb/>s; only if
 * that leaves the text much smaller than it could be (lines missing in the
 * encoding) or the zone is not rectangular is the text allowed to wrap.
 */
const fitText = (el: HTMLElement, zone: PlacedZone, max: number) => {
    const overflow = el.style.overflow
    el.style.overflow = 'hidden'

    el.style.whiteSpace = 'normal'
    const wrapped = largestFitting(el, zone.width, zone.height, max)

    let size = wrapped
    let mode = 'wrap'
    if (!zone.shape) {
        el.style.whiteSpace = 'nowrap'
        const lines = largestFitting(el, zone.width, zone.height, max)
        if (lines >= 0.5 * wrapped) {
            size = lines
            mode = 'lines'
        }
        else {
            el.style.whiteSpace = 'normal'
        }
    }

    el.style.fontSize = `${size}px`
    el.style.overflow = overflow
    el.dataset.fit = `${mode} ${Math.round(size)}px`
}

const Div = ({ teiNode, availableRoutes, zoneGetter }: TEIProps & WithZoneGetter) => {
    const div = teiNode as Element
    const zone = zoneGetter((div.getAttribute('facs') || '').trim().replace(/^#/, ''))
    const isIllustration = div.getAttribute('type') === 'illustration'
    const ref = useRef<HTMLDivElement>(null)

    useLayoutEffect(() => {
        const el = ref.current
        if (!el || !zone) return

        // captions in illustrations should not grow to the size of the picture
        const max = isIllustration
            ? Math.max(8, Math.min(zone.width, zone.height) / 10)
            : Math.max(8, zone.height)
        const fit = () => fitText(el, zone, max)
        fit()

        let cancelled = false
        document.fonts?.ready.then(() => {
            if (!cancelled) fit()
        })
        return () => {
            cancelled = true
        }
    }, [zone, isIllustration])

    if (!zone) {
        return (
            <Behavior node={teiNode}>
                <div className={isIllustration ? 'illustration' : 'div'}>
                    <TEINodes
                        teiNodes={teiNode.childNodes}
                        availableRoutes={availableRoutes} />
                </div>
            </Behavior>
        )
    }

    const { left, right } = zone.shape
        ? exclusions(zone.shape, zone.width, zone.height)
        : { left: null, right: null }
    const polygon = (points: [number, number][]) =>
        `polygon(${points.map(([x, y]) => `${x}px ${y}px`).join(', ')})`

    return (
        <Behavior node={teiNode}>
            <div
                ref={ref}
                style={{
                    position: 'absolute',
                    left: zone.left,
                    top: zone.top,
                    width: zone.width,
                    height: zone.height,
                }}
                data-zone={zone.id}
                className={`zone ${isIllustration ? 'illustration' : 'div'}`}>
                {left && (
                    <span
                        aria-hidden="true"
                        className="exclusion"
                        style={{
                            float: 'left',
                            width: left.width,
                            height: zone.height,
                            shapeOutside: polygon(left.polygon),
                        }} />
                )}
                {right && (
                    <span
                        aria-hidden="true"
                        className="exclusion"
                        style={{
                            float: 'right',
                            width: right.width,
                            height: zone.height,
                            shapeOutside: polygon(right.polygon),
                        }} />
                )}
                <TEINodes
                    teiNodes={teiNode.childNodes}
                    availableRoutes={availableRoutes} />
            </div>
        </Behavior>
    )
}

export default Div
