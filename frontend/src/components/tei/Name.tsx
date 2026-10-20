import React, { useState } from "react"
import { Behavior } from "./Behavior"
import { TEINodes } from "react-teirouter"
import { Popover } from "@mui/material"
import { names } from "../../labels/names"
import { GND, artistLink } from "../../lib/anchors"

interface TEIProps {
  teiNode: Node
  availableRoutes?: string[]
}

const Name = ({ teiNode, availableRoutes }: TEIProps) => {
  const persName = teiNode as Element
  const target = persName.getAttribute("corresp")?.trim() || ""
  const written = (persName.textContent || "").replace(/\s+/g, " ").trim()
  // the artists that the text of an ad names have an entry on the Artists
  // page, unless only a note of the editor's names them
  const isArtist = persName.tagName.toLowerCase() === "tei-persname"
    && (persName.getAttribute("type") || "").split(/\s+/).includes("artist")
    && target.startsWith(GND)
    && !!persName.closest("tei-text") && !persName.closest('tei-note[type="editorial"]')

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handlePopoverClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  return (
    <Behavior node={teiNode}>
      <span
        className="name"
        aria-haspopup={true}
        onClick={handlePopoverOpen}>
        <TEINodes
          teiNodes={teiNode.childNodes}
          availableRoutes={availableRoutes} />
      </span>
      <Popover
        id='mouseover-popup'
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <div style={{ padding: '1rem' }}>
          {target.startsWith(GND)
            ? <a href={target} style={{ textDecoration: 'none' }}>→ GND</a>
            : <i color='gray'>no GND link</i>
          }
          {isArtist && (
            <div>
              <a href={artistLink(target)} style={{ textDecoration: 'none' }}>
                → All ads naming {names[target] || written}
              </a>
            </div>
          )}
        </div>
      </Popover>
    </Behavior>
  )
}

export default Name
