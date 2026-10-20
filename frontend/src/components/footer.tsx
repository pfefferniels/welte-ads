import React from "react"
import Link from "next/link"
import { Box } from "@mui/material"
import { EDITOR } from "../lib/site"

const Footer = () => (
  <Box component="footer" sx={{ padding: "2rem 0 1rem", fontSize: "0.9rem", color: "#6b6b6b", textAlign: "center" }}>
    © {new Date().getFullYear()} {EDITOR.name} · <Link href="/imprint" style={{ color: "inherit" }}>Imprint and contact</Link> · <Link href="/data" style={{ color: "inherit" }}>Data</Link> · Source code on <a href="https://github.com/pfefferniels/welte-ads" style={{ color: "inherit" }}>GitHub</a>
  </Box>
)

export default Footer
