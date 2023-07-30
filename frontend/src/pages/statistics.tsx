import React, { useEffect, useRef, useState } from 'react'
import Layout from "../components/layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container } from '@mui/material'
import * as d3 from 'd3'

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

const Statistics = () => {
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

        const mentionsPerYear = data.allMetadata.nodes.reduce((acc: Mention[], curr: any) => {
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

        console.log(mentionsPerYear)

        const svgElement = d3.select(artistsSvg.current)

        // set the dimensions and margins of the graph
        const margin = { top: 10, right: 30, bottom: 30, left: 60 },
            width = 700 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        svgElement
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                `translate(${margin.left}, ${margin.top})`);

        // Add X axis
        const x = d3.scaleLinear()
            .domain([1900, 1930])
            .range([0, width]);

        svgElement
            .append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3
                .axisBottom(x)
                .tickFormat((d: any, i: number) => {
                    if (i % 2) return d;
                    else return null;
                }))

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([0, 10])
            .range([height, 0]);

        svgElement
            .append("g")
            .call(d3.axisLeft(y))

        svgElement.append('g')
            .selectAll("dot")
            .data(mentionsPerYear)
            .join("circle")
            .attr("cx", (d: any) => x(d.year))
            .attr("cy", (d: any) => y(d.count))
            .style("fill", (d: any) => stringToColour(d.name))
            .attr("r", (d: any) => d.count * 2) // or 5
            .on('mouseover', (_, data: any) => {
                setSelectedMention(data)
            })
            .on('mouseout', () => setSelectedMention(undefined))
    }, [])

    return (
        <Layout location="/statistics" editionPage={false}>
            <Container component="main" maxWidth="md">
                <h2>Mentioned Artists</h2>
                <svg ref={artistsSvg} />
                {selectedMention && (
                    <div>
                        In {selectedMention.year}, {selectedMention.name} was
                        mentioned {selectedMention.count} times.
                    </div>
                )}
            </Container>
        </Layout>
    )
}

export default Statistics