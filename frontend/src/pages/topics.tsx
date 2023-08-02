import React, { useEffect, useRef, useState } from 'react'
import Layout from "../components/layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container, Typography } from '@mui/material'
import * as d3 from 'd3'
import { WeighedCircles } from '../components/weighedCircles'
import { topicLabels } from '../labels/topicLabels'
import { stringToColour } from '../helpers/stringToColour'

interface Topic {
    name: string,
    count: number,
    year: number
}

const Topics = () => {
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

    const unorderedTopics = data.allMetadata.nodes.map((node: any) => node.topics).flat()

    const counts = unorderedTopics.reduce((acc: any, value: any) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    const weighedTopics = Object.keys(counts).map(key => ({
        topic: key,
        weight: counts[key]
    }));

    return (
        <Layout location="Topics" editionPage={false}>
            <Container component="main" maxWidth="md">
                <h2>Topics</h2>
                <Typography>
                    Topics are understood as recurring motifs,
                    such as the illustration of a half-transparent "ghost"
                    sitting at the piano.
                </Typography>

                <WeighedCircles data={weighedTopics} />
            </Container>
        </Layout>
    )
}

export default Topics
