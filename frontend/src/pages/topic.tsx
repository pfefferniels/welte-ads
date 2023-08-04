import React from 'react'
import Layout from "../components/layout"
import { PageProps, graphql, useStaticQuery } from 'gatsby'
import { Container, List, ListItem } from '@mui/material'
import { topicLabels } from '../labels/topicLabels'
import { topicDescriptions } from '../labels/topicDescriptions'

export interface Segment {
    id: string 
    topic: string 
    text: string
}

const Topics = ({ location }: PageProps) => {
    const topic = location.hash
    const data = useStaticQuery(graphql`
        query {
          allMetadata {
            nodes {
              dates
              topicSegments {
                id
                topic 
                text
              }
            }
          }
        }
    `)

    const segments =
        data.allMetadata.nodes.map((node: any) => node.topicSegments as Segment[]).flat()
        .filter((segment: Segment) => segment.topic === topic)

    return (
        <Layout location="Topics" editionPage={false}>
            <Container component="main" maxWidth="md">
                <h2>
                    Topic "{topicLabels[topic] || location.hash}"
                </h2>
                <div>
                    {topicDescriptions[topic] || 'no description available'}

                    <List>
                    {segments.map((segment) => (
                        <ListItem key={segment.id}>{segment.text}</ListItem>
                    ))}
                    </List>

                    {/* show violin plot? */}
                </div>
            </Container>
        </Layout>
    )
}

export default Topics
