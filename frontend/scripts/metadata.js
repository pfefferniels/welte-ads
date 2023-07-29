#!/usr/bin/env node

const fs = require('fs')
const config = require('../gatsby-config')

function slugify(text) {
  return text.toLowerCase()
    .replace(/<[^>]+>/g, '') // remove html tags
    .replace(/ /g,'-') // spaces become -
    .replace(/-+/g, '-') // no repeated -
    .replace(/[^\w-]+/g,'') // remove all non word or - characters
}

const metadata = {
  title: config.siteMetadata.title,
  htmlTitle: config.siteMetadata.htmlTitle,
  slug: slugify(config.siteMetadata.title),
  subtitle: config.siteMetadata.subtitle  || '',
  authors: config.siteMetadata.authors,
  authors_struct: config.siteMetadata.authors_struct,
  doi: config.siteMetadata.doi,
}

fs.writeFile('public/metadata.json', JSON.stringify(metadata, null, 2), (err) => {
  if (err) {
    throw err
  }
})