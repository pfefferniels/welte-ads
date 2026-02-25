"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import Grid from "@mui/material/Grid"
import Container from "@mui/material/Container"
import Button from "@mui/material/Button"

import theme from "../theme"

interface Links {
  name: string
  link: string
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
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Container maxWidth="md" sx={styles.nav}>
      <Grid container={true} component="nav">
        {menuLinks.map(link => {
          const isActive = pathname === link.link || pathname === link.link + '/'
            || (link.link === '/' && pathname === '/')

          const active = isActive ? {
            backgroundColor: theme.palette.primary.main + "18",
            color: theme.palette.primary.main,
            fontWeight: 600,
          } : {}

          const buttonStyle = {...styles.navBtn, ...active}

          return (
            <Grid item={true} key={link.name} xs={6} sm="auto" md="auto">
              <Button
                color="default"
                size="large"
                sx={buttonStyle}
                onClick={() => router.push(link.link)}
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
