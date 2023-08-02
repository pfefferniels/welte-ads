import React from 'react'
import Layout from "../components/layout"
import { PageProps, graphql, useStaticQuery } from 'gatsby'
import { Container, IconButton, Typography } from '@mui/material'
import { WeighedCircles } from '../components/weighedCircles'
import { topicLabels } from '../labels/topicLabels'
import { ArrowCircleLeftOutlined, ArrowCircleRight } from '@mui/icons-material'
import { topicDescriptions } from '../labels/topicDescriptions'

const Topics = ({ location }: PageProps) => {
    const topic = location.hash
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

    return (
        <Layout location="Topics" editionPage={false}>
            <Container component="main" maxWidth="md">
                <h2>
                    Topic "{topicLabels[topic] || location.hash}"
                </h2>
                <div>
                    {topicDescriptions[topic] || 'no description available'}
                </div>
            </Container>
        </Layout>
    )
}

export default Topics
