"use client"

import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { topicLabels } from '../labels/topicLabels'
import { stringToColour } from '../helpers/stringToColour'
import "./weighedCircles.css"
import { useRouter } from 'next/navigation'

interface WeighedTerm extends d3.SimulationNodeDatum {
    topic: string
    weight: number
}

interface TopicsCircleProps {
    data: WeighedTerm[]
}

export const WeighedCircles = ({ data }: TopicsCircleProps) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const router = useRouter()

    useEffect(() => {
        if (!svgRef.current) return

        // reset
        svgRef.current.innerHTML = ''

        const width = 1000, height = 800;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Scales the weight of a term to the radius
        // of the circle representing it
        const radiusScale = d3.scaleLinear()
            .domain([0, d3.max(data, (d: WeighedTerm) => d.weight) ?? 0])
            .range([0, 150]);

        const simulation = d3.forceSimulation(data)
            .force('charge', d3.forceManyBody().strength(7))
            .force('collide', d3.forceCollide().radius(d => radiusScale((d as WeighedTerm).weight) + 1))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('radial', d3.forceRadial((d: WeighedTerm) => radiusScale(d.weight), width / 2, height / 2));

        const node = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(data)
            .enter()
            .append('g')

        // Draw the circles
        node.attr('class', 'circle-group')
            .on('click', (_, d) => {
                router.push(`/topic/${d.topic}`)
            })
        
        node
            .append('circle')
            .attr('class', 'weighted-circle')
            .attr('r', d => radiusScale(d.weight))
            .style("fill", (d: WeighedTerm) => stringToColour(d.topic))

        // Draw the labels
        node.append("text")
            .attr('class', 'circle-label')
            .style('font-size', d => 0.25 * radiusScale(d.weight) + 'px')
            .text(d => topicLabels[d.topic] || d.topic)

        // Update the positions in each tick
        simulation.nodes(data)
            .on('tick', () => {
                node
                    .attr('transform', d => `translate(${d.x}, ${d.y})`)
            });
    }, [data, router])

    return (
        <svg width={900} height={700} ref={svgRef} />
    )
}
