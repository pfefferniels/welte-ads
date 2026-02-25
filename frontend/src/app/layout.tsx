import React from "react"
import type { Metadata } from "next"
import ThemeRegistry from "./ThemeRegistry"
import Header from "../components/header"
import Footer from "../components/footer"

export const metadata: Metadata = {
  title: {
    template: '%s | Welte Ads',
    default: 'Welte-Mignon Advertisements Collection',
  },
  description: 'A collection of Welte Advertisements. Edited by Niels Pfeffer.',
  openGraph: {
    title: 'Welte-Mignon Advertisements Collection',
    description: 'A collection of Welte Advertisements. Edited by Niels Pfeffer.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    creator: 'Niels Pfeffer',
  },
}

const menuLinks = [
  { name: 'Introduction', link: '/' },
  { name: 'Advertisements', link: '/overview' },
  { name: 'Companies', link: '/companies' },
  { name: 'Artists', link: '/artists' },
  { name: 'Topics', link: '/topics' },
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
              siteTitle="Welte Ads"
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
