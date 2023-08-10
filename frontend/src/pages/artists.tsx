import React, { useEffect, useRef, useState } from 'react'
import Layout from "../components/layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container, Typography } from '@mui/material'
import * as d3 from 'd3'
import { names } from "../labels/names"

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

const Artists = () => {
    const [selectedMention, setSelectedMention] = useState<Mention>()

    const artistsSvg = useRef<SVGSVGElement>(null)
    const data = useStaticQuery(graphql`
        query {
          allMetadata {
            nodes {
              dates
              mentions
            }
          }
        }
    `)

    useEffect(() => {
        if (!artistsSvg.current || !data) return

        const mentionsPerYear: Mention[] = data.allMetadata.nodes.reduce((acc: Mention[], curr: any) => {
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
        }, [] as Mention[]);

        let allArtists = Array.from(new Set(mentionsPerYear.map(m => m.name)));
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

        // set the dimensions and margins of the graph
        const margin = { top: 30, right: 30, bottom: 30, left: 60 },
            width = 1000 - margin.left - margin.right,
            height = 1000 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        svgElement
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                `translate(${margin.left}, ${margin.top})`);

        // Scales
        const x = d3.scaleLinear()
            .domain([1905, 1935])
            .range([0, width]);

        const radiusScale = d3.scaleLinear()
            .domain([0, Math.max(...mentionsPerYear.map(mention => mention.count))])
            .range([0, 30])

        const y = d3.scaleLinear()
            .domain([0, allArtists.length])
            .range([height - 20, margin.top]);

        svgElement
            .append("g")
            .attr("transform", `translate(230, ${height})`)
            .call(d3
                .axisBottom(x)
                .tickFormat((d: any, i: number) => {
                    if (i % 2) return d;
                    else return null;
                }))

        svgElement.append('g')
            .selectAll('lines')
            .data(allArtists)
            .join('line')
            .attr('x1', 230)
            .attr('y1', (_, i) => y(i))
            .attr('x2', width + 230)
            .attr('y2', (_, i) => y(i))
            .attr('stroke-width', 0.5)
            .attr('stroke', 'black')

        svgElement.append('g')
            .selectAll('labels')
            .data(allArtists)
            .join('text')
            .attr('x', 10)
            .attr('y', (_, i) => y(i))
            .style('dominant-baseline', 'central')
            .text(d => names[d] || d)

        svgElement.append('g')
            .selectAll("dot")
            .data(mentionsPerYear)
            .join("circle")
            .attr('transform', `translate(230, 0)`)
            .attr("cx", (d: any) => x(d.year))
            .attr("cy", (d: any) => y(allArtists.indexOf(d.name)))
            .style("fill", (d: any) => stringToColour(d.name))
            .style("fill-opacity", 0.8)
            .attr("r", (d: any) => radiusScale(d.count))
            .on('mouseover', (_, data: any) => {
                setSelectedMention(data)
            })
            .on('mouseout', () => setSelectedMention(undefined))
    }, [])

    return (
        <Layout location="Artists" editionPage={false}>
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
        </Layout>
    )
}

export default Artists
