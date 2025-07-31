const basePath = "/ads"
const title = "Welte Ads"
const htmlTitle = "Welte-Mignon Advertisements Collection"

module.exports = {
  pathPrefix: basePath,
  trailingSlash: `always`,
  siteMetadata: {
    title,
    htmlTitle,
    description: `A collection of Welte Advertisements. Edited by Niels Pfeffer.`,
    authors: [
      {
        "first": "Niels",
        "last": "Pfeffer",
        "affiliations": [
          "University Tübingen"
        ],
        orcid:"0000-0000-0000-0000"
      }
    ],
    repository: "https://github.com/pfefferniels/welte-ads",
    menuLinks: [
      {
        name: 'introduction',
        link: '/'
      },
      {
        name: 'Advertisements',
        link: '/overview'
      },
      {
        name: 'Companies',
        link: '/companies'
      },
      {
        name: 'Artists',
        link: '/artists'
      },
      {
        name: 'Topics',
        link: '/topics'
      },
    ]
  },
  plugins: [
    `gatsby-plugin-emotion`,
    `gatsby-theme-ceteicean`,
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `../images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `../tei`,
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
        icon: `src/images/se-icon.png`,
      },
    },
  ],
}
