const jsdom = require("jsdom");
const { JSDOM } = jsdom;

function shouldOnCreateNode({ node }) {
  // We only care about XML content.
  return [`application/xml`, `text/xml`].includes(node.internal.mediaType)
}

async function onCreateNode({
  node,
  actions,
  loadNodeContent,
  createNodeId,
  createContentDigest,
}) {
  const { createNode, createParentChildLink } = actions

  const rawXml = await loadNodeContent(node)
  const { document } = (new JSDOM(rawXml)).window

  const company = document.querySelector('orgName[key]')?.getAttribute('key') || ''
  const title = document.querySelector('bibl')?.innerHTML || ''
  const dates = [...document.querySelectorAll('date[type="publication"]')]
    .map(date => date.innerHTML)
  const newspapers = [...document.querySelectorAll('title[level="j"]')]
    .map(title => title.innerHTML)
  const mentions = [...document.querySelectorAll('persName[corresp]')]
    .map(name => name.getAttribute('corresp'))
  const topics = [...document.querySelectorAll('interp[type="topic"]')]
    .map(name => name.textContent)

  const metadataNode = {
    company,
    title,
    newspapers,
    dates,
    mentions,
    topics,
    id: createNodeId(`${node.id}-metadata`),
    children: [],
    parent: node.id,
    internal: {
      content: title,
      contentDigest: createContentDigest({ title }),
      type: `metadata`,
    }
  }
  createNode(metadataNode)
  createParentChildLink({ parent: node, child: metadataNode })
}

exports.shouldOnCreateNode = shouldOnCreateNode
exports.onCreateNode = onCreateNode

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions
  await makeIntroduction(createPage, reporter, graphql)
}

async function makeIntroduction(createPage, reporter, graphql) {
  const component = require.resolve(`./src/templates/introduction.tsx`)

  const result = await graphql(`
    query {
      allMarkdownRemark {
        edges {
          node {
            html
            frontmatter {
              path
              title
            }
          }
        }
      }
    }
  `)
  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`)
    return
  }
  result.data.allMarkdownRemark.edges.forEach(({ node }) => {
    createPage({
      path: node.frontmatter.path,
      component,
      context: {
        html: node.html,
        title: node.frontmatter.title
      }
    })
  })
}
