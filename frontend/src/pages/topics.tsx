import React, { useEffect, useRef, useState } from 'react'
import Layout from "../components/layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container, List, ListItem, Typography } from '@mui/material'
import * as d3 from 'd3'
import { names } from "./names"

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

interface Topic {
    name: string,
    count: number,
    year: number
}

const Topics = () => {
    const [selectedTopic, setSelectedTopic] = useState<Topic>()

    const topicsSvg = useRef<SVGSVGElement>(null)
    const data = useStaticQuery(graphql`
        query {
          allMetadata {
            nodes {
              dates
              topics
            }
          }
        }
    `)

    const allTopics = Array.from(new Set(data.allMetadata.nodes.map((node: any) => node.topics).flat()))

    useEffect(() => {
        if (!topicsSvg.current || !data) return

        topicsSvg.current.innerHTML = ''

        const topicsPerYear: Topic[] = data.allMetadata.nodes.reduce((acc: Topic[], curr: any) => {
            curr.dates.forEach((date: string) => {
                curr.topics.forEach((mention_: string) => {
                    const existingTopic = acc.find(mention => mention.name === mention_ && mention.year === Number(date))
                    if (existingTopic) {
                        existingTopic.count += 1
                    }
                    else {
                        acc.push({
                            name: mention_,
                            year: Number(date),
                            count: 1
                        } as Topic)
                    }
                })
            })
            return acc
        }, [] as Topic[]);

        const allArtists = Array.from(new Set(topicsPerYear.map(m => m.name)));

        const svgElement = d3.select(topicsSvg.current)

        // set the dimensions and margins of the graph
        const margin = { top: 10, right: 30, bottom: 30, left: 60 },
            width = 1000 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        svgElement
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                `translate(${margin.left}, ${margin.top})`);

        // Add X axis
        const x = d3.scaleLinear()
            .domain([1905, 1935])
            .range([0, width]);

        svgElement
            .append("g")
            .attr("transform", `translate(230, ${height})`)
            .call(d3
                .axisBottom(x)
                .tickFormat((d: any, i: number) => {
                    if (i % 2) return d;
                    else return null;
                }))

        const y = d3.scaleLinear()
            .domain([0, allArtists.length])
            .range([height - 20, 0]);

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
            .data(topicsPerYear)
            .join("circle")
            .attr('transform', `translate(230, 0)`)
            .attr("cx", (d: any) => x(d.year))
            .attr("cy", (d: any) => y(allArtists.indexOf(d.name)))
            .style("fill", (d: any) => stringToColour(d.name))
            .attr("r", (d: any) => d.count * 4)
            .on('mouseover', (_, data: any) => {
                setSelectedTopic(data)
            })
            .on('mouseout', () => setSelectedTopic(undefined))
    }, [])

    return (
        <Layout location="Topics" editionPage={false}>
            <Container component="main" maxWidth="md">
                <h2>Topics</h2>
                <Typography>
                    Topics are understood as recurring motifs,
                    such as the illustration of a half-transparent "ghost"
                    sitting at the piano.
                </Typography>

                <h3>Statistics</h3>
                <Typography>
                    The following illustration shows how the topics evolve over
                    time.
                </Typography>
                <svg ref={topicsSvg} />
            </Container>
        </Layout>
    )
}

export default Topics
