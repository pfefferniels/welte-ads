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
  const date = document.querySelectorAll('date')[0].innerHTML
  const title = document.querySelectorAll('title')[0].innerHTML

  console.log('date, title', date, title, date.innerHTML, title.innerHTML)

  if (!date || !title) return

  const metadataNode = {
    date,
    title,
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
