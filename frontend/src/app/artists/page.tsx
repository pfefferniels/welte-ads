"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Container, Typography } from '@mui/material'
import * as d3 from 'd3'
import { names } from "../../labels/names"

const stringToColour = (str: string) => {
    let hash = 0;
    str.split('').forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let colour = '#'
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        colour += value.toString(16).padStart(2, '0')
    }
    return colour
}

interface Mention {
    name: string,
    count: number,
    year: number
}

interface ArtistMetadata {
    dates: string[]
    mentions: string[]
}

export default function ArtistsPage() {
    const [selectedMention, setSelectedMention] = useState<Mention>()
    const [data, setData] = useState<ArtistMetadata[] | null>(null)
    const artistsSvg = useRef<SVGSVGElement>(null)

    useEffect(() => {
        fetch('/api/artists-data.json')
            .then(res => res.json())
            .then(setData)
            .catch(() => setData([]))
    }, [])

    useEffect(() => {
        if (!artistsSvg.current || !data) return

        // Clear previous render
        d3.select(artistsSvg.current).selectAll('*').remove()

        const mentionsPerYear: Mention[] = data.reduce((acc: Mention[], curr: ArtistMetadata) => {
            curr.dates.forEach((date: string) => {
                curr.mentions.forEach((mention_: string) => {
                    const existingMention = acc.find(mention => mention.name === mention_ && mention.year === Number(date))
                    if (existingMention) {
                        existingMention.count += 1
                    }
                    else {
                        acc.push({
                            name: mention_,
                            year: Number(date),
                            count: 1
                        } as Mention)
                    }
                })
            })
            return acc
        }, [] as Mention[])

        let allArtists = Array.from(new Set(mentionsPerYear.map(m => m.name)))
        const mentionsPerArtist = allArtists
            .map(artist => {
                const mentions = mentionsPerYear
                    .filter(mention => mention.name === artist)

                return {
                    name: artist,
                    count: mentions.reduce((acc, cur) => acc + cur.count, 0),
                    avarageYear: mentions.reduce((acc, cur) => acc + cur.year, 0) / mentions.length
                }
            })
            .sort((a, b) => (b.avarageYear - a.avarageYear) || (a.count - b.count))
        allArtists = mentionsPerArtist.map(artist => artist.name)

        const svgElement = d3.select(artistsSvg.current)

        const margin = { top: 30, right: 30, bottom: 30, left: 60 },
            width = 1000 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom

        svgElement
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                `translate(${margin.left}, ${margin.top})`)

        const x = d3.scaleLinear()
            .domain([1905, 1935])
            .range([0, width])

        const radiusScale = d3.scaleLinear()
            .domain([0, Math.max(...mentionsPerYear.map(mention => mention.count))])
            .range([0, 30])

        const y = (artist: string) => {
            let value = 0
            for (const mention of mentionsPerArtist) {
                if (mention.name === artist) {
                    value += radiusScale(mention.count) / 2
                    break
                }
                value += radiusScale(mention.count)
            }

            return height - value
        }

        svgElement
            .append("g")
            .attr("transform", `translate(230, ${height})`)
            .call(d3
                .axisBottom(x)
                .tickFormat((d: d3.NumberValue, i: number) => {
                    if (i % 2) return String(d)
                    return ""
                }))

        svgElement.append('g')
            .selectAll('lines')
            .data(allArtists)
            .join('line')
            .attr('x1', 230)
            .attr('y1', d => y(d))
            .attr('x2', width + 230)
            .attr('y2', d => y(d))
            .attr('stroke-width', d => radiusScale(
                mentionsPerArtist.find(mention => mention.name === d)?.count ?? 0) / 150
            )
            .attr('stroke', 'black')

        svgElement.append('g')
            .selectAll('labels')
            .data(allArtists)
            .join('text')
            .attr('x', 10)
            .attr('y', d => y(d))
            .style('dominant-baseline', 'central')
            .attr('font-size', d =>
                radiusScale(
                    mentionsPerArtist.find(mention => mention.name === d)?.count ?? 0) / 2.7
            )
            .text(d => names[d] || d)

        svgElement.append('g')
            .selectAll("dot")
            .data(mentionsPerYear)
            .join("circle")
            .attr('transform', `translate(230, 0)`)
            .attr("cx", (d: Mention) => x(d.year))
            .attr("cy", (d: Mention) => y(d.name))
            .style("fill", (d: Mention) => stringToColour(d.name))
            .style("fill-opacity", 0.8)
            .attr("r", (d: Mention) => radiusScale(d.count))
            .on('mouseover', (_, data: Mention) => {
                setSelectedMention(data)
            })
            .on('mouseout', () => setSelectedMention(undefined))
    }, [data])

    return (
        <Container component="main" maxWidth="md">
            <h2>Mentioned Artists</h2>
            <Typography>
                The following plot shows, how often artists
                were mentioned in the advertisements per year.
            </Typography>

            <svg ref={artistsSvg} />
            {selectedMention && (
                <div>
                    In {selectedMention.year}, {names[selectedMention.name] || selectedMention.name} was
                    mentioned {selectedMention.count} times.
                </div>
            )}
        </Container>
    )
}
