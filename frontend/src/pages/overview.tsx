import React from 'react'
import Layout from "../components/layout"
import { Link, graphql, useStaticQuery } from 'gatsby'
import { Container } from '@mui/material'

interface Metadata {
    title: string,
    date: string,
    path: string
}

const Overview = () => {
    const data = useStaticQuery(graphql`
        query {
          allMetadata {
            nodes {
              date
              title
              parent {
                ... on File {
                  name
                }
              }
            }
          }
        }
    `)

    const metadata: Metadata[] = data.allMetadata.nodes.map((node: any) => ({
        date: node.date,
        title: node.title,
        path: node.parent.name
    } as Metadata));

    return (
        <Layout location="/overview" editionPage={false}>
            <Container component="main" maxWidth="md">
                <ul>
                    {metadata.map((metadata, i) => (
                        <li key={`metadata_${i}`}>
                            <Link to={"/" + metadata.path}>
                                {metadata.title} –
                                {metadata.date}
                            </Link>
                        </li>
                    ))}
                </ul>
            </Container>
        </Layout>
    )
}

export default Overview
