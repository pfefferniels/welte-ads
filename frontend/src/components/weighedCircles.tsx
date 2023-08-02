import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { topicLabels } from '../labels/topicLabels'
import { stringToColour } from '../helpers/stringToColour'

interface WeighedTerm extends d3.SimulationNodeDatum {
    topic: string
    weight: number
}

interface TopicsCircleProps {
    data: WeighedTerm[]
}

export const WeighedCircles = ({ data }: TopicsCircleProps) => {
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (!svgRef.current) return

        // Define width, height and margin
        const width = 800, height = 800;

        // Define the svg where we will draw the circles
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Define the radius scale
        const radiusScale = d3.scaleLinear()
            .domain([0, d3.max(data, (d: any) => d.weight)])
            .range([0, 150]);

        // Define the force simulation
        let simulation = d3.forceSimulation(data)
            .force('charge', d3.forceManyBody().strength(7))  // adjust this value to make circles closer or further apart
            .force('collide', d3.forceCollide().radius(d => radiusScale((d as WeighedTerm).weight) + 1))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('radial', d3.forceRadial((d: WeighedTerm) => radiusScale(d.weight), width / 2, height / 2));

        // Define the nodes
        const node = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(data)
            .enter().append('g');

        // Draw the circles
        node.append('circle')
            .attr('r', d => radiusScale(d.weight))
            .style("fill", (d: any) => stringToColour(d.topic))
            .style("fill-opacity", 0.5)


        // Draw the labels
        node.append("text")
            .text(d => topicLabels[d.topic] || d.topic)
            .style('font-family', 'EB Garamond')
            .style('font-weight', 400)
            .style('font-size', d => 0.2 * radiusScale(d.weight) + 'px')
            .style('text-anchor', 'middle')
            .style('dominante-baseline', 'central')

        // Update the positions in each tick
        simulation.nodes(data)
            .on('tick', () => {
                node
                    .attr('transform', d => `translate(${d.x}, ${d.y})`)
            });

    }, [])

    return (
        <svg width={600} height={600} ref={svgRef} />
    )
}
