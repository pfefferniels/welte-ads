import React from "react"
import type { Metadata } from "next"
import ThemeRegistry from "./ThemeRegistry"
import Header from "../components/header"
import Footer from "../components/footer"
import { EDITION, EDITOR } from "../lib/site"

const DESCRIPTION = `Print advertisements for the Welte-Mignon reproducing piano, 1905–1930, edited in TEI by ${EDITOR.name}.`

export const metadata: Metadata = {
  title: {
    template: `%s | ${EDITION}`,
    default: EDITION,
  },
  description: DESCRIPTION,
  openGraph: {
    title: EDITION,
    description: DESCRIPTION,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    creator: EDITOR.name,
  },
}

const menuLinks = [
  { name: 'Introduction', link: '/' },
  { name: 'Advertisements', link: '/overview' },
  { name: 'Companies', link: '/companies' },
  { name: 'Artists', link: '/artists' },
  { name: 'Topics', link: '/topics' },
  { name: 'Periodicals', link: '/periodicals' },
  { name: 'Guidelines', link: '/guidelines' },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeRegistry>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header
              location=""
              siteTitle={EDITION}
              menuLinks={menuLinks}
            />
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <Footer />
          </div>
        </ThemeRegistry>
      </body>
    </html>
  )
}
