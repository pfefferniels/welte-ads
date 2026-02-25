"use client"

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

const Wrapper = styled.header(() => ({
  background: theme.palette.secondary.main,
  marginBottom: "1.45rem",
  padding: "0.5rem 0",
  borderBottom: "1px solid #e8e4e0",
}))

const Header = ({ menuLinks }: Props) => (
    <Wrapper>
      <Nav menuLinks={menuLinks} />
    </Wrapper>
)

export default Header
