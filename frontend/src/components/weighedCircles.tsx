import React from 'react'
import Link from 'next/link'
import { stringToColour } from '../helpers/stringToColour'
import { topicPath } from '../helpers/topicPath'
import { layoutBubbles, WeighedTerm } from '../lib/bubbles'
import "./weighedCircles.css"

interface TopicsCircleProps {
    data: WeighedTerm[]
}

// The circles are laid out when the page is built, so that the chart is
// part of the static page and every circle is a link.
export const WeighedCircles = ({ data }: TopicsCircleProps) => {
    const { bubbles, viewBox } = layoutBubbles(data)

    return (
        <svg className="weighed-circles" viewBox={viewBox.join(' ')} role="list" aria-label="Topics">
            {bubbles.map(bubble => (
                <g key={bubble.topic} transform={`translate(${bubble.x}, ${bubble.y})`} role="listitem">
                    <Link href={topicPath(bubble.topic)} className="circle-group">
                        <title>
                            {`${bubble.label}: ${bubble.weight} ${bubble.weight === 1 ? 'occurrence' : 'occurrences'}`}
                        </title>
                        <circle
                            className="weighted-circle"
                            r={bubble.r}
                            fill={stringToColour(bubble.topic)} />
                        <text className="circle-label" fontSize={bubble.fontSize}>
                            {bubble.lines.map((line, i) => (
                                <tspan key={i} x={0} y={`${(i - (bubble.lines.length - 1) / 2) * 1.1}em`}>
                                    {line}
                                </tspan>
                            ))}
                        </text>
                    </Link>
                </g>
            ))}
        </svg>
    )
}
