const basePath = "/se-microedition-template"
const title = "Micro-Edition Template"
const htmlTitle = "Micro-Edition <em>Template</em>"

module.exports = {
  pathPrefix: basePath,
  trailingSlash: `always`,
  siteMetadata: {
    issue: {
      full: "Example Volume",
      short: "Vol XX",
      path: "/issues/path"
    },
    doi: '10.55520/TBA',
    group_order: 1, // Oder of this micro-edition in the volume's micro-edition section.
    title,
    htmlTitle,
    description: `A Scholarly Editing micro-edition. ${title}. Edited by AUTHORS.`,
    authors: [
      {
        "first": "First",
        "middle": "M. N.",
        "last": "Last",
        "affiliations": [
          "Institution"
        ],
        orcid:"0000-0000-0000-0000"
      }
    ],
    repository: "https://gitlab.com/scholarly-editing/se-microedition-template",
    menuLinks: [
      {
        name: 'introduction',
        link: '/'
      },
      {
        name: 'edition',
        link: '/ad001' // This needs to match the filename of the TEI
      },
    ]
  },
  plugins: [
    `gatsby-plugin-emotion`,
    `gatsby-theme-ceteicean`,
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/images/`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `static/tei`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `introduction`,
        path: `src/introduction`,
      },
    },
    `gatsby-transformer-remark`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Scholarly Editing`,
        short_name: `Scholarly Editing`,
        start_url: `/`,
        icon: `src/images/se-icon.png`, // This path is relative to the root of the site.
      },
    },
  ],
}
