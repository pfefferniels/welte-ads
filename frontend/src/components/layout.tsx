import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import { ThemeProvider, Theme, StyledEngineProvider } from "@mui/material/styles";

import theme from "../theme"
import Header from "./header"
import Footer from "./footer"

import styled from '@emotion/styled'
import Head from "./head";


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

type Children = JSX.Element | JSX.Element[]

interface Props {
  location?: string
  editionPage?: boolean
  children?: Children
}

const Main = styled.div(() => ({
  minHeight: "65vh",
  "& h2, & h3": {
    paddingBottom: '1rem'
  }
}))

const Layout = ({ location, children, editionPage = false }: Props) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
          doi
          repository
          menuLinks {
            name
            link
          }
        }
      }
    }
  `)
  
  const { repository, title, menuLinks } = data.site.siteMetadata

  return (
    <div>
      <Head title={location || ""} />
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          
          <Header
            location={location || ''}
            siteTitle={title}
            menuLinks={menuLinks}
          />
          <Main>{children}</Main>
          <Footer repository={repository}/>
        </ThemeProvider>
      </StyledEngineProvider>
    </div>
  );
}

export default Layout
