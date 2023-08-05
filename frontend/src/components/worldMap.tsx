import React, { useEffect, useRef } from "react"
import * as d3 from 'd3'
import { stringToColour } from "../helpers/stringToColour"

export interface Coordinate {
    lat: number
    long: number
}

export interface Marker {
    coordinate: Coordinate
    companyName: string
    adCount: number
}

interface WorldMapProps {
    markers: Marker[]
}

export const WorldMap = ({ markers }: WorldMapProps) => {
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (!svgRef.current) return

        svgRef.current.innerHTML = ''

        // The svg
        const svg = d3.select(svgRef.current),
            width = +svg.attr("width"),
            height = +svg.attr("height");

        // Map and projection
        const projection = d3.geoMercator()
            .center([0, 20])                // GPS of location to zoom on
            .scale(99)                       // This is like the zoom
            .translate([width / 2, height / 2])

        const fetchMap = async () => {
            const worldMap = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
            const dataGeo = await worldMap.json()

            // Scale for bubble size
            const valueExtent = d3.extent(markers, marker => marker.adCount) as [number, number]
            const size = d3.scaleSqrt()
                .domain(valueExtent)
                .range([1, 50])

            // Draw the map
            svg.append("g")
                .selectAll("path")
                .data(dataGeo.features)
                .join("path")
                .attr("fill", "#b8b8b8")
                .attr("d", d3.geoPath()
                    .projection(projection) as any)
                .style("stroke", "none")
                .style("opacity", .3)

            // Add a circle for every marker
            svg
                .selectAll("circles")
                .data(markers.sort((a: Marker, b: Marker) => b.adCount - a.adCount))
                .join("circle")
                .attr("cx", (d: Marker) => projection([d.coordinate.long, d.coordinate.lat])![0])
                .attr("cy", (d: Marker) => projection([d.coordinate.long, d.coordinate.lat])![1])
                .attr("r", (d: Marker) => size(+d.adCount))
                .style("fill", (d: Marker) => stringToColour(d.companyName))
                .attr("fill-opacity", .3)
                .attr('stroke', 'black')
                .attr('stroke-width', 0.5)

            // Add legend: circles
            const valuesToShow = [5, 10, 20]
            const xCircle = 40
            const xLabel = 90
            svg
                .selectAll("legend")
                .data(valuesToShow)
                .join("circle")
                .attr("cx", xCircle)
                .attr("cy", d => height - size(d))
                .attr("r", d => size(d))
                .style("fill", "none")
                .attr("stroke", "black")

            // Add legend: segments
            svg
                .selectAll("legend")
                .data(valuesToShow)
                .join("line")
                .attr('x1', d => xCircle + size(d))
                .attr('x2', xLabel)
                .attr('y1', d => height - size(d))
                .attr('y2', d => height - size(d))
                .attr('stroke', 'black')
                .style('stroke-dasharray', ('2,2'))

            // Add legend: labels
            svg
                .selectAll("legend")
                .data(valuesToShow)
                .join("text")
                .attr('x', xLabel)
                .attr('y', d => height - size(d))
                .text(d => d)
                .style("font-size", 10)
                .attr('alignment-baseline', 'middle')
        }

        fetchMap()
    }, [markers])

    return (
        <>
            <svg ref={svgRef} width={900} height={500} />
        </>
    )
}