import React, { useEffect, useRef } from "react"
import * as d3 from 'd3'
import { Box, IconButton, Stack, Tooltip } from "@mui/material"
import { Add, CenterFocusStrong, Remove } from "@mui/icons-material"
import { stringToColour } from "../helpers/stringToColour"

export interface Coordinate {
    lat: number
    long: number
}

export interface Marker {
    coordinate: Coordinate
    companyName: string
    label: string
    adCount: number
}

interface WorldMapProps {
    markers: Marker[]
}

const width = 900
const height = 500

export const WorldMap = ({ markers }: WorldMapProps) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>(null)

    useEffect(() => {
        if (!svgRef.current) return

        svgRef.current.innerHTML = ''
        let cancelled = false

        // The svg
        const svg = d3.select(svgRef.current)

        // Map and projection
        const projection = d3.geoMercator()
            .center([0, 20])                // GPS of location to zoom on
            .scale(99)                       // This is like the zoom
            .translate([width / 2, height / 2])

        const fetchMap = async () => {
            const worldMap = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
            const dataGeo = await worldMap.json()
            if (cancelled) return

            // Scale for bubble size: logarithmic, so that the few companies
            // with many ads do not bury the many with only one or two
            const maxCount = d3.max(markers, marker => marker.adCount) ?? 1
            const size = d3.scaleLog()
                .domain([1, Math.max(maxCount, 2)])
                .range([3, 24])

            // Draw the map
            const map = svg.append("g")
            map
                .selectAll("path")
                .data(dataGeo.features)
                .join("path")
                .attr("fill", "#b8b8b8")
                .attr("d", d => d3.geoPath().projection(projection)(d as d3.GeoPermissibleObjects))
                .style("stroke", "none")
                .style("opacity", .3)

            // Add a circle for every marker, the smaller ones on top.
            // The circles are positioned rather than scaled when zooming,
            // so that they keep their size and the legend stays valid.
            const points = [...markers]
                .sort((a, b) => b.adCount - a.adCount)
                .map(marker => {
                    const [x, y] = projection([marker.coordinate.long, marker.coordinate.lat])!
                    return { ...marker, x, y }
                })
            const circles = svg.append("g")
                .selectAll("circle")
                .data(points)
                .join("circle")
                .attr("r", d => size(d.adCount))
                .style("fill", d => stringToColour(d.companyName))
                .attr("fill-opacity", .3)
                .attr('stroke', 'black')
                .attr('stroke-width', 0.5)
            circles
                .append("title")
                .text(d => `${d.label}: ${d.adCount} ${d.adCount === 1 ? 'ad' : 'ads'}`)

            // Add legend: values evenly spaced on the logarithmic scale
            const valuesToShow = [1, 3, 10]
            const xCircle = 40
            const xLabel = 80
            const yBase = height - 10
            const legend = svg.append("g")
            legend
                .append("rect")
                .attr("x", xCircle - size(10) - 8)
                .attr("y", yBase - 2 * size(10) - 22)
                .attr("width", xLabel - xCircle + size(10) + 24)
                .attr("height", 2 * size(10) + 30)
                .attr("fill", "white")
                .attr("fill-opacity", .8)
            legend
                .append("text")
                .attr("x", xCircle - size(10))
                .attr("y", yBase - 2 * size(10) - 10)
                .text("Ads")
                .style("font-size", 10)
            legend
                .selectAll("circle")
                .data(valuesToShow)
                .join("circle")
                .attr("cx", xCircle)
                .attr("cy", d => yBase - size(d))
                .attr("r", d => size(d))
                .style("fill", "none")
                .attr("stroke", "black")

            // Add legend: segments
            legend
                .selectAll("line")
                .data(valuesToShow)
                .join("line")
                .attr('x1', xCircle)
                .attr('x2', xLabel)
                .attr('y1', d => yBase - 2 * size(d))
                .attr('y2', d => yBase - 2 * size(d))
                .attr('stroke', 'black')
                .style('stroke-dasharray', ('2,2'))

            // Add legend: labels
            legend
                .selectAll("text.value")
                .data(valuesToShow)
                .join("text")
                .attr("class", "value")
                .attr('x', xLabel + 2)
                .attr('y', d => yBase - 2 * size(d))
                .text(d => d)
                .style("font-size", 10)
                .attr('alignment-baseline', 'middle')

            // Zoom with the wheel, by pinching or with the buttons; pan by dragging
            const zoom = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([1, 30])
                .translateExtent([[0, 0], [width, height]])
                .on("zoom", ({ transform }: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
                    map.attr("transform", transform.toString())
                    circles
                        .attr("cx", d => transform.applyX(d.x))
                        .attr("cy", d => transform.applyY(d.y))
                })
            svg.call(zoom).call(zoom.transform, d3.zoomIdentity)
            zoomRef.current = zoom
        }

        fetchMap()

        return () => {
            cancelled = true
            svg.on(".zoom", null)
            zoomRef.current = null
        }
    }, [markers])

    const zoomBy = (factor: number) => {
        if (!svgRef.current || !zoomRef.current) return
        d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, factor)
    }

    const resetZoom = () => {
        if (!svgRef.current || !zoomRef.current) return
        d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity)
    }

    return (
        <Box sx={{ position: 'relative' }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                style={{ maxWidth: '100%', height: 'auto', cursor: 'grab' }}
            />
            <Stack sx={{ position: 'absolute', top: 8, right: 8 }}>
                <Tooltip title="Zoom in" placement="left">
                    <IconButton size="small" aria-label="Zoom in" onClick={() => zoomBy(2)}>
                        <Add fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Zoom out" placement="left">
                    <IconButton size="small" aria-label="Zoom out" onClick={() => zoomBy(0.5)}>
                        <Remove fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Show the whole world" placement="left">
                    <IconButton size="small" aria-label="Show the whole world" onClick={resetZoom}>
                        <CenterFocusStrong fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Box>
    )
}
