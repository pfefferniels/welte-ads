import React, { useState } from "react"
import { Behavior } from "./Behavior"
import { TEINodes } from "react-teirouter"
import { Popover } from "@mui/material"
import { names } from "../../labels/names"
import { GND, personLink } from "../../lib/anchors"

interface TEIProps {
  teiNode: Node
  availableRoutes?: string[]
}

const Name = ({ teiNode, availableRoutes }: TEIProps) => {
  const persName = teiNode as Element
  const target = persName.getAttribute("corresp")?.trim() || ""
  const written = (persName.textContent || "").replace(/\s+/g, " ").trim()
  // every person that the text of an ad names has an entry in the register,
  // unless only a note of the editor's names them
  const inRegister = persName.tagName.toLowerCase() === "tei-persname"
    && !!persName.closest("tei-text") && !persName.closest('tei-note[type="editorial"]')
    && !!(target || written)

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
          {inRegister && (
            <div>
              <a href={personLink(target, written)} style={{ textDecoration: 'none' }}>
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
