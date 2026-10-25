"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from 'd3'
import { Box, IconButton, Stack, Tooltip } from "@mui/material"
import { Add, CenterFocusStrong, Remove } from "@mui/icons-material"
import { Timeline, usePlayback } from "./timeline"
import { ShowStory, StoryCard, TimelineChapter, chapterAt } from "./narrative"

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
    // the group that colours the circle, e.g. a language
    group?: string
    // the counts of the years that had any, each with a line about it and
    // the group of that year
    years?: { year: number; count: number; about: string; group?: string }[]
    // when the things counted happened, in years (1908.5 is mid-1908): in
    // a timeline, the circle grows and shrinks with them
    times?: number[]
}

interface WorldMapProps {
    markers: Marker[]
    // what the counts are, for the legend, e.g. "Printings"
    unit: string
    // the years to play, each with a line about it; without them, the map
    // shows all years at once only
    timeline?: { year: number; about: string }[]
    // the story that the timeline tells, its focus by the markers' hrefs
    chapters?: TimelineChapter[]
    // the groups that colour the circles, each with its name for the legend
    // and the family that the legend files it under, if any; a circle of no
    // group is black
    groups?: { key: string; label: string; color: string; family?: string }[]
}

const width = 900
const height = 500

// how long a circle takes to change its size between all years and a time,
// how fast the timeline plays (in years per second), and over how much time
// around it a circle gathers its counts (the width of a Gaussian kernel, in
// years)
const RESIZE = 400
const SPEED = 0.7
const SPREAD = 0.3

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

const NO_CHAPTERS: TimelineChapter[] = []
const NO_GROUPS: NonNullable<WorldMapProps['groups']> = []

export const WorldMap = ({ markers, unit, timeline, chapters = NO_CHAPTERS, groups = NO_GROUPS }: WorldMapProps) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>(null)
    // the marker pointed at, what it shows and where it is on the map
    const [active, setActive] = useState<{ label: string; about: string; x: number; y: number; r: number } | null>(null)
    // told, the story shows the chapter of the time on a card
    const [story, setStory] = useState(true)
    const first = timeline?.[0]?.year ?? 0
    // playing starts at the first thing counted, so that the map is not empty
    const start = useMemo(() => {
        const times = markers.flatMap(marker => marker.times ?? [])
        return times.length ? Math.max(first, Math.min(...times)) : first
    }, [first, markers])
    const playback = usePlayback(first, timeline?.[timeline.length - 1]?.year ?? 0, SPEED, start)
    const chapter = story ? chapterAt(chapters, playback.year) : undefined
    // sizes the circles for a time, or for all years, once the map is drawn
    const showTimeRef = useRef<(time: number | null) => void>(null)
    const timeRef = useRef<number | null>(null)
    // outlines the markers that the chapter is about, once the map is drawn
    const showFocusRef = useRef<(focus: Set<string>) => void>(null)
    const focusRef = useRef(new Set<string>())

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

            // Scales for bubble size: logarithmic, so that the few markers
            // with large counts do not bury the many with only one or two.
            // A time has a scale of its own, the same for every time: what
            // a marker counts around it, each count the less the further
            // from it, so that a circle grows and shrinks as time goes by.
            const scale = (max: number) => d3.scaleLog()
                .domain([1, Math.max(max, 2)])
                .range([3, 24])
            const around = (times: number[] = [], time: number) =>
                times.reduce((sum, at) => sum + Math.exp(-0.5 * ((time - at) / SPREAD) ** 2), 0)
            const maxCount = d3.max(markers, marker => marker.count) ?? 1
            // the most a marker counts around any time, which is about one of its own
            const maxAround = d3.max(markers, marker => d3.max(marker.times ?? [], at => around(marker.times, at))) ?? 1
            const sizes = { all: scale(maxCount), time: scale(maxAround) }

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

            // Add a circle for every marker, each a link. The circles are
            // positioned rather than scaled when zooming, so that they keep
            // their size and the legend stays valid. Their radius and the
            // line about them depend on the year shown.
            const points = markers.map(marker => {
                const [x, y] = projection([marker.coordinate.long, marker.coordinate.lat])!
                return { ...marker, x, y, r: 0, now: marker.about, colour: '' }
            })
            const show = (d: typeof points[number]) =>
                setActive({ label: d.label, about: d.now, x: transform.applyX(d.x), y: transform.applyY(d.y), r: d.r })
            const links = svg.append("g")
                .selectAll("a")
                .data(points)
                .join("a")
                .attr("href", d => d.href)
                .on("mouseenter focus", (_, d) => show(d))
                .on("mouseleave blur", () => setActive(null))
            const circles = links.append("circle")

            const legend = svg.append("g")
            const drawLegend = (size: d3.ScaleLogarithmic<number, number>, max: number, title: string) => {
                legend.selectAll("*").remove()

                // Add legend: values evenly spaced on the logarithmic scale
                const valuesToShow = legendValues(max)
                const largest = size(valuesToShow[valuesToShow.length - 1])
                const xCircle = 40
                const xLabel = 80
                const yBase = height - 10
                legend
                    .append("text")
                    .attr("x", xCircle - largest)
                    .attr("y", yBase - 2 * largest - 10)
                    .text(title)
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

                // Add legend: a background as large as what it holds
                const box = legend.node()!.getBBox()
                legend
                    .insert("rect", ":first-child")
                    .attr("x", box.x - 8)
                    .attr("y", box.y - 6)
                    .attr("width", box.width + 16)
                    .attr("height", box.height + 12)
                    .attr("fill", "white")
                    .attr("fill-opacity", .8)
            }

            // Size and colour the circles for a time, or for all years. A
            // marker that counts less than one around the time shrinks
            // towards nothing and is hidden below a trace; the line about it
            // and its colour are those of the year nearest to the time. The
            // smaller circles lie on top.
            const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            const colourOf = (group?: string) => groups.find(g => g.key === group)?.color ?? '#000'
            let shown: 'all' | 'time' | null = null
            const showTime = (time: number | null) => {
                const size = time === null ? sizes.all : sizes.time
                for (const point of points) {
                    if (time === null) {
                        point.r = size(point.count)
                        point.now = point.about
                        point.colour = colourOf(point.group)
                        continue
                    }
                    const count = around(point.times, time)
                    const near = d3.least(point.years ?? [], y => Math.abs(time - y.year - 0.5))
                    point.r = count >= 1 ? size(count) : count >= 0.03 ? size(1) * count : 0
                    point.now = near?.about ?? ''
                    point.colour = colourOf(near?.group ?? point.group)
                }
                links
                    .sort((a, b) => b.r - a.r)
                    .attr("visibility", d => d.r ? null : "hidden")
                    .attr("aria-label", d => `${d.label}: ${d.now}`)
                circles
                    .attr("fill", d => d.colour)
                    .attr("stroke", d => d.colour)
                // from a time to all years the circles change in a moment;
                // in a timeline they follow the time frame by frame
                if (time === null && shown === 'time' && !still) circles.transition().duration(RESIZE).attr("r", d => d.r)
                else circles.interrupt().attr("r", d => d.r)
                const mode = time === null ? 'all' : 'time'
                // in a timeline the circles need no legend: they grow and
                // fade with what happens around the time
                if (mode !== shown) {
                    if (time === null) drawLegend(size, maxCount, unit)
                    else legend.selectAll("*").remove()
                }
                shown = mode
                setActive(null)
            }
            showTime(timeRef.current)
            showTimeRef.current = showTime
            const showFocus = (focus: Set<string>) => links.classed("focus", d => focus.has(d.href))
            showFocus(focusRef.current)
            showFocusRef.current = showFocus

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
            showTimeRef.current = null
            showFocusRef.current = null
        }
    }, [markers, unit, groups])

    useEffect(() => {
        timeRef.current = playback.time
        showTimeRef.current?.(playback.time)
    }, [playback.time])

    useEffect(() => {
        focusRef.current = new Set(chapter?.focus)
        showFocusRef.current?.(focusRef.current)
    }, [chapter])

    const zoomBy = (factor: number) => {
        if (!svgRef.current || !zoomRef.current) return
        d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, factor)
    }

    // the groups of the legend, those of a family together
    const families = groups.reduce<{ family?: string; members: typeof groups }[]>((list, group) => {
        const previous = list[list.length - 1]
        if (group.family && previous?.family === group.family) previous.members.push(group)
        else list.push({ family: group.family, members: [group] })
        return list
    }, [])

    const resetZoom = () => {
        if (!svgRef.current || !zoomRef.current) return
        d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity)
    }

    return (<>
        <Box sx={{ position: 'relative' }}>
            <Box sx={{
                position: 'relative',
                // the label of a marker must not widen the page
                overflow: 'hidden',
                '& a circle': {
                    fillOpacity: 0.45,
                    strokeWidth: 1,
                    cursor: 'pointer',
                },
                '& a:hover circle, & a:focus circle': {
                    fillOpacity: 0.8,
                },
                '& a.focus circle': {
                    stroke: '#000',
                    strokeWidth: 2,
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
                        <strong>{active.label}</strong>
                        <br />
                        {active.about}
                    </Box>
                )}
                {playback.year !== null && (
                    <Box aria-hidden="true" sx={{
                        position: 'absolute',
                        left: 12,
                        top: 4,
                        pointerEvents: 'none',
                        fontSize: 'clamp(1.5rem, 6vw, 3rem)',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1,
                    }}>
                        {playback.year}
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
            {chapter && (
                <StoryCard key={chapter.id} chapter={chapter}
                    onHide={() => setStory(false)} />
            )}
        </Box>
        {groups.length > 0 && (
            <Box component="ul" aria-label="Colours of the circles" sx={{
                display: 'flex', flexWrap: 'wrap', gap: '0.25rem 1rem',
                listStyle: 'none', p: 0, m: 0, mt: 0.5, fontSize: '0.95rem',
            }}>
                {families.map(({ family, members }) => (
                    <Box component="li" key={members[0].key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {family && <Box component="span" sx={{ color: 'text.secondary' }}>{family}:</Box>}
                        {members.map(group => (
                            <React.Fragment key={group.key}>
                                <Box component="span" aria-hidden="true" sx={{
                                    width: 12, height: 12, borderRadius: '50%', border: 1, ml: family ? 0.25 : 0,
                                    borderColor: group.color, backgroundColor: group.color, opacity: 0.75,
                                }} />
                                {group.label}
                            </React.Fragment>
                        ))}
                    </Box>
                ))}
            </Box>
        )}
        {timeline && (
            <Timeline playback={playback} about={timeline.find(entry => entry.year === playback.year)?.about} />
        )}
        {chapters.length > 0 && !story && <ShowStory onShow={() => setStory(true)} />}
    </>)
}
