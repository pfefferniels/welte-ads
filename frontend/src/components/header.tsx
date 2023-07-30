import React from "react"
import Nav from "./nav"
import theme from "../theme"

import styled from '@emotion/styled'

interface Links {
  name: string
  link: string
}

interface Props {
  location: string
  siteTitle: string
  menuLinks: Links[]
}

// Styled components

const Wrapper = styled.header(() => ({
  background: theme.palette.secondary.main,
  marginBottom: "1.45rem",
}))

// Main Component

const Header = ({ location, menuLinks }: Props) => (
    <Wrapper>
      <Nav location={location} menuLinks={menuLinks} />
    </Wrapper>
)

export default Header
