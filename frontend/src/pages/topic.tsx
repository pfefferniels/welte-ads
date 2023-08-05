import React from 'react'
import Layout from "../components/layout"
import { PageProps, graphql, navigate, useStaticQuery } from 'gatsby'
import { Container, IconButton, List, ListItem } from '@mui/material'
import { topicLabels } from '../labels/topicLabels'
import { topicDescriptions } from '../labels/topicDescriptions'
import { LinkRounded } from '@mui/icons-material'

export interface Segment {
    link: string
    topic: string
    text: string
}

const Topics = ({ location }: PageProps) => {
    const topic = location.hash
    const data = useStaticQuery(graphql`
        query {
          allMetadata {
            nodes {
              parent {
                ... on File {
                  name
                }
              }
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
        data.allMetadata.nodes.map((node: any) => node.topicSegments.map((segment: any) => ({
            link: `/${node.parent.name + segment.id}`,
            topic: segment.topic,
            text: segment.text
        } as Segment))).flat()
            .filter((segment: Segment) => segment.topic === topic) as Segment[]

    return (
        <Layout location="Topics" editionPage={false}>
            <Container component="main" maxWidth="md">
                <h2>
                    Topic "{topicLabels[topic] || location.hash}"
                </h2>
                <div>
                    {topicDescriptions[topic] || 'no description available'}

                    <List>
                        {segments.map((segment, i) => (
                            <ListItem key={`segment${i}`}>
                                    <IconButton size='small' onClick={() => navigate(segment.link)}>
                                        <LinkRounded />
                                    </IconButton>
                                    <span color='gray'>...
                                    <i> {segment.text} </i>
                                    ...</span>
                            </ListItem>
                        ))}
                    </List>

                    {/* show violin plot? */}
                </div>
            </Container>
        </Layout>
    )
}

export default Topics
