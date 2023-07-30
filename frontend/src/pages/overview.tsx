import React from 'react'
import Layout from "../components/layout"
import { Link, graphql, useStaticQuery } from 'gatsby'
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'

interface Metadata {
    company: string,
    title: string,
    dates: string[],
    newspapers: string[],
    path: string
}

const Overview = () => {
    const data = useStaticQuery(graphql`
        query {
          allMetadata {
            nodes {
              company
              dates
              title
              newspapers
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
        company: node.company,
        title: node.title,
        dates: node.dates,
        newspapers: node.newspapers,
        path: node.parent.name
    } as Metadata));

    return (
        <Layout location="/overview" editionPage={false}>
            <Container component="main" maxWidth="md">
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Company</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Dates</TableCell>
                                <TableCell>Newspapers</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {metadata.map((metadata, i) => (
                                <TableRow key={`metadata_${i}`}>
                                    <TableCell>
                                        {metadata.company}
                                    </TableCell>
                                    <TableCell>
                                        <Link to={"/" + metadata.path}>
                                            {metadata.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {metadata.dates.join(',')}
                                    </TableCell>
                                    <TableCell>
                                        {metadata.newspapers.join(',')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </Layout >
    )
}

export default Overview
