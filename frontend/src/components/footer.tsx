import React from "react"
import { Box } from "@mui/material"

const Footer = () => (
  <Box component="footer" sx={{ padding: "2rem 0 1rem", fontSize: "0.9rem", color: "#999", textAlign: "center" }}>
    © {new Date().getFullYear()} Niels Pfeffer · Source code on <a href="https://github.com/pfefferniels/welte-ads" style={{ color: "inherit" }}>GitHub</a>
  </Box>
)

export default Footer
