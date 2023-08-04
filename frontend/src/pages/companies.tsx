import React from 'react'
import Layout from "../components/layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container, Typography } from '@mui/material'

const Companies = () => {
    const data = useStaticQuery(graphql`
        query {
          allMetadata {
            nodes {
              dates
              company
            }
          }
        }
    `)

    const companies = data.allMetadata.nodes.map((node: any) => node.company)

    return (
        <Layout location="Companies" editionPage={false}>
            <Container component="main" maxWidth="md">
                <h2>Companies</h2>
                <Typography>
                    Different companies advertised for the Welte-Mignon.
                </Typography>

                {/* show world map */}

                <span>{companies.join(', ')}</span>
            </Container>
        </Layout>
    )
}

export default Companies
