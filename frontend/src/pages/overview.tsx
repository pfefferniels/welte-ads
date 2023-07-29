import React from 'react'
import Layout from "../components/layout"
import { Link, graphql, useStaticQuery } from 'gatsby'

const Overview = () => {
    const data = useStaticQuery(graphql`
    query teifiles {
      allCetei {
        nodes {
          parent {
            ... on File {
              name
            }
          }
        }
      }
    }
  `);
    const teifiles = data.allCetei.nodes;
    const ids = teifiles
    for (const parent of teifiles) {
        ids.push(parent?.parent?.name || '')
    }

    return (
        <Layout location="/overview" editionPage={false}>
            <ul>
                {ids.map((id: string) => (
                    <li key={id}>
                        <Link to={"/" + id}>{id}</Link>
                    </li>
                ))}
            </ul>
        </Layout>
    )
}

export default Overview
