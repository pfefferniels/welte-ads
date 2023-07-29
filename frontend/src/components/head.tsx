import React from "react"
import { useStaticQuery, graphql } from "gatsby"

interface Props {
  description?: string
  lang?: string
  meta?: []
  title?: string
}

const Head = ({ description, lang, title }: Props) => {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            issue {
              full
            }
            title
            description
            authors {
              first
              last
            }
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description
  const fullTitle = `${title} | ${site.siteMetadata.title} | ${site.siteMetadata.issue.full} | Scholarly Editing` 

  return (
    <>
      <html lang={lang} />
      <body/>
      <title>{fullTitle}</title>
      <link
        href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap"
        rel="stylesheet"/>
      <meta name="description" content={metaDescription} />
      <meta name="og:title" content={fullTitle} />
      <meta name="og:description" content={metaDescription} />
      <meta name="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:creator" content={`${site.siteMetadata.authors[0].first} ${site.siteMetadata.authors[0].last}`} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
    </>
  )
}

export default Head
