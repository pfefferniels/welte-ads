import React, { useLayoutEffect, useRef } from "react"
import { Behavior } from "./Behavior"
import { TEINodes } from "react-teirouter"
import { PlacedZone } from "../../lib/facsimile"

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
const largestFitting = (
    el: HTMLElement, width: number, height: number, max: number,
    accept: () => boolean = () => true, min = 0.5
) => {
    let lo = min
    let hi = max
    for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) / 2
        el.style.fontSize = `${mid}px`
        if (fits(el, width, height) && accept()) lo = mid
        else hi = mid
    }
    return lo
}

// The number of rendered lines, counted from the boxes of the text.
const countLines = (el: HTMLElement) => {
    const range = document.createRange()
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const rects: DOMRect[] = []
    while (walker.nextNode()) {
        if (!/\S/.test(walker.currentNode.textContent || '')) continue
        range.selectNodeContents(walker.currentNode)
        rects.push(...Array.from(range.getClientRects()).filter(r => r.width > 0 && r.height > 0))
    }
    rects.sort((a, b) => a.top - b.top)

    let lines = 0
    let bottom = -Infinity
    for (const rect of rects) {
        if (rect.top + rect.height / 2 > bottom) {
            lines++
            bottom = rect.bottom
        }
        else {
            bottom = Math.max(bottom, rect.bottom)
        }
    }
    return lines
}

/**
 * Sizes the text so that it fills its zone the way it fills the region on
 * the original page. Line breaks are taken from the encoded <lb/>s; only if
 * that leaves the text much smaller than it could be (lines missing in the
 * encoding) is the text allowed to wrap.
 */
const fitText = (el: HTMLElement, zone: PlacedZone, max: number, keepLines: boolean) => {
    const overflow = el.style.overflow
    el.style.overflow = 'hidden'

    el.style.whiteSpace = 'normal'
    const wrapped = largestFitting(el, zone.width, zone.height, max)

    let size = wrapped
    let mode = 'wrap'
    if (keepLines) {
        let lines: number
        if (zone.floats) {
            // text flows around the shape, so lines may not be kept with
            // nowrap; instead allow no more lines than there are at a tiny
            // size. Whether a long line has to wrap depends on where it falls
            // relative to the shape, so search downwards rather than bisect.
            el.style.fontSize = '2px'
            const encoded = countLines(el)
            const accept = () => countLines(el) <= encoded
            lines = 0
            for (let size = wrapped; size >= 0.5 * wrapped; size *= 0.97) {
                el.style.fontSize = `${size}px`
                if (fits(el, zone.width, zone.height) && accept()) {
                    lines = largestFitting(el, zone.width, zone.height, size / 0.97, accept, size)
                    break
                }
            }
        }
        else {
            el.style.whiteSpace = 'nowrap'
            lines = largestFitting(el, zone.width, zone.height, max)
            el.style.whiteSpace = 'normal'
        }
        if (lines >= 0.5 * wrapped) {
            size = lines
            mode = 'lines'
            if (!zone.floats) el.style.whiteSpace = 'nowrap'
        }
    }

    el.style.fontSize = `${size}px`
    el.style.overflow = overflow
    el.dataset.fit = `${mode} ${Math.round(size)}px`
}

// Whether the div holds any transcribed text, as opposed to editorial
// descriptions of gaps and figures.
const hasPrintedText = (node: Node): boolean => {
    for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 3 && /\S/.test(child.textContent || '')) return true
        if (child.nodeType !== 1) continue
        const name = (child as Element).tagName.toLowerCase()
        if (name === 'tei-gap' || name === 'tei-figure') continue
        if (hasPrintedText(child)) return true
    }
    return false
}

const Div = ({ teiNode, availableRoutes, zoneGetter }: TEIProps & WithZoneGetter) => {
    const div = teiNode as Element
    const zone = zoneGetter((div.getAttribute('facs') || '').trim().replace(/^#/, ''))
    const isIllustration = div.getAttribute('type') === 'illustration'
    // a zone holding only a <gap/> or a figure, perhaps with a description
    const isPlaceholder = !hasPrintedText(div)
    const ref = useRef<HTMLDivElement>(null)

    // captions and placeholders should not grow to the size of the picture
    const caption = zone && Math.max(8, Math.min(zone.width / 10, zone.height / 10, zone.pageWidth / 60))

    useLayoutEffect(() => {
        const el = ref.current
        if (!el || !zone || !caption) return

        const max = isIllustration || isPlaceholder ? caption : Math.max(8, zone.height)
        // descriptions of illustrations and gaps are ours, not printed lines
        const fit = () => fitText(el, zone, max, !isIllustration && !isPlaceholder)
        fit()

        let cancelled = false
        document.fonts?.ready.then(() => {
            if (!cancelled) fit()
        })
        return () => {
            cancelled = true
        }
    }, [zone, caption, isIllustration, isPlaceholder])

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
                    transform: zone.rotation ? `rotate(${zone.rotation}deg)` : undefined,
                    // the size of a picture's description among the lines
                    ['--caption' as string]: `${caption}px`,
                }}
                data-zone={zone.id}
                className={`zone ${isIllustration ? 'illustration' : 'div'} ${div.getAttribute('class') || ''}`}>
                {(['left', 'right'] as const).map(side => {
                    const float = zone.floats?.[side]
                    return float && (
                        <span
                            key={side}
                            aria-hidden="true"
                            className="exclusion"
                            style={{
                                float: side,
                                width: float.width,
                                height: zone.height,
                                shapeOutside: polygon(float.polygon),
                            }} />
                    )
                })}
                <TEINodes
                    teiNodes={teiNode.childNodes}
                    availableRoutes={availableRoutes} />
            </div>
        </Behavior>
    )
}

export default Div
