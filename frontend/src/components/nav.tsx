"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Grid from "@mui/material/Grid"
import Container from "@mui/material/Container"
import Button from "@mui/material/Button"

import theme from "../theme"

interface Links {
  name: string
  link: string
  // further pages that the entry stands for
  also?: string[]
}

interface Props {
  menuLinks: Links[]
}

const styles = {
  nav: {
    "& div": {
      padding: "0 0.5rem 0 0",
    },
  },
  navBtn: {
    borderRadius: "2rem",
    boxShadow: "none",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontSize: "0.8rem",
    fontWeight: 500,
    padding: "0.4rem 1.2rem",
    transition: "all 0.3s ease",
    backgroundColor: "transparent",
    "&:hover, &:focus": {
      backgroundColor: theme.palette.primary.main + "12",
      color: theme.palette.primary.main,
    },
  },
}

const Nav = ({ menuLinks }: Props) => {
  const pathname = usePathname()

  return (
    <Container maxWidth="md" sx={styles.nav}>
      <Grid container={true} component="nav">
        {menuLinks.map(link => {
          const isActive = [link.link, ...(link.also || [])]
            .some(path => pathname === path || pathname === path + '/')

          const active = isActive ? {
            backgroundColor: theme.palette.primary.main + "18",
            color: theme.palette.primary.main,
            fontWeight: 600,
          } : {}

          // the links must not take the colour of the site's visited links
          const color = isActive ? theme.palette.primary.main : theme.palette.default.main
          const buttonStyle = {"&, &:visited": { color }, ...styles.navBtn, ...active}

          return (
            <Grid item={true} key={link.name} xs={6} sm="auto" md="auto">
              <Button
                color="default"
                size="large"
                sx={buttonStyle}
                component={Link}
                href={link.link}
              >
                {link.name}
              </Button>
            </Grid>
          )
        })}
      </Grid>
    </Container>
  )
}

export default Nav
