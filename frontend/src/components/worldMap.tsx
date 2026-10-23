"use client"

import React, { useEffect, useRef, useState } from "react"
import * as d3 from 'd3'
import { Box, IconButton, Stack, Tooltip } from "@mui/material"
import { Add, CenterFocusStrong, Remove } from "@mui/icons-material"

export interface Coordinate {
    lat: number
    long: number
}

export interface Marker {
    coordinate: Coordinate
    // where the circle leads, e.g. "#place-5128581"
    href: string
    label: string
    // what the size of the circle shows
    count: number
    // a line about the marker, shown when pointing at it
    about: string
}

interface WorldMapProps {
    markers: Marker[]
    // what the counts are, for the legend, e.g. "Printings"
    unit: string
}

const width = 900
const height = 500

// the values that the legend shows: 1, the largest round number up to the
// largest count, and one halfway between them on the logarithmic scale
const ROUND = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]
const legendValues = (max: number) => {
    const top = ROUND.filter(n => n <= max).pop() || 1
    const half = Math.log(top) / 2
    const middle = ROUND.reduce((best, n) =>
        Math.abs(Math.log(n) - half) < Math.abs(Math.log(best) - half) ? n : best)
    return Array.from(new Set([1, middle, top]))
}

export const WorldMap = ({ markers, unit }: WorldMapProps) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>(null)
    // the marker pointed at, and where it is on the map
    const [active, setActive] = useState<{ marker: Marker; x: number; y: number; r: number } | null>(null)

    useEffect(() => {
        if (!svgRef.current) return

        svgRef.current.innerHTML = ''
        let cancelled = false
        let transform = d3.zoomIdentity

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

            // Scale for bubble size: logarithmic, so that the few markers
            // with large counts do not bury the many with only one or two
            const maxCount = d3.max(markers, marker => marker.count) ?? 1
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

            // Add a circle for every marker, the smaller ones on top, each a
            // link. The circles are positioned rather than scaled when
            // zooming, so that they keep their size and the legend stays valid.
            const points = [...markers]
                .sort((a, b) => b.count - a.count)
                .map(marker => {
                    const [x, y] = projection([marker.coordinate.long, marker.coordinate.lat])!
                    return { ...marker, x, y }
                })
            const show = (d: typeof points[number]) =>
                setActive({ marker: d, x: transform.applyX(d.x), y: transform.applyY(d.y), r: size(d.count) })
            const links = svg.append("g")
                .selectAll("a")
                .data(points)
                .join("a")
                .attr("href", d => d.href)
                .attr("aria-label", d => `${d.label}: ${d.about}`)
                .on("mouseenter focus", (_, d) => show(d))
                .on("mouseleave blur", () => setActive(null))
            const circles = links
                .append("circle")
                .attr("r", d => size(d.count))

            // Add legend: values evenly spaced on the logarithmic scale
            const valuesToShow = legendValues(maxCount)
            const largest = size(valuesToShow[valuesToShow.length - 1])
            const xCircle = 40
            const xLabel = 80
            const yBase = height - 10
            const legend = svg.append("g")
            legend
                .append("rect")
                .attr("x", xCircle - largest - 8)
                .attr("y", yBase - 2 * largest - 22)
                .attr("width", xLabel - xCircle + largest + 24)
                .attr("height", 2 * largest + 30)
                .attr("fill", "white")
                .attr("fill-opacity", .8)
            legend
                .append("text")
                .attr("x", xCircle - largest)
                .attr("y", yBase - 2 * largest - 10)
                .text(unit)
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
                .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
                    transform = event.transform
                    map.attr("transform", transform.toString())
                    circles
                        .attr("cx", d => transform.applyX(d.x))
                        .attr("cy", d => transform.applyY(d.y))
                    setActive(null)
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
    }, [markers, unit])

    const zoomBy = (factor: number) => {
        if (!svgRef.current || !zoomRef.current) return
        d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, factor)
    }

    const resetZoom = () => {
        if (!svgRef.current || !zoomRef.current) return
        d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity)
    }

    return (
        <Box sx={{
            position: 'relative',
            // the label of a marker must not widen the page
            overflow: 'hidden',
            '& a circle': {
                fill: '#000',
                fillOpacity: 0.15,
                stroke: '#000',
                strokeWidth: 0.75,
                cursor: 'pointer',
            },
            '& a:hover circle, & a:focus circle': {
                fillOpacity: 0.45,
            },
        }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                style={{ display: 'block', maxWidth: '100%', height: 'auto', cursor: 'grab' }}
            />
            {active && (
                <Box role="status" sx={{
                    position: 'absolute',
                    left: `${100 * active.x / width}%`,
                    top: `${100 * (active.y - active.r) / height}%`,
                    // near an edge, the label extends away from it
                    transform: `translate(${active.x < width / 3 ? '-12px' : active.x > 2 * width / 3 ? 'calc(-100% + 12px)' : '-50%'}, calc(-100% - 6px))`,
                    pointerEvents: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    boxShadow: 1,
                    px: 1,
                    py: 0.5,
                    fontSize: '0.9rem',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                }}>
                    <strong>{active.marker.label}</strong>
                    <br />
                    {active.marker.about}
                </Box>
            )}
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
