import React, { useState } from "react"
import { Behavior } from "gatsby-theme-ceteicean/src/components/Behavior"
import { TEINodes } from "react-teirouter"
import { Popover } from "@mui/material"

interface TEIProps {
  teiNode: Node
  availableRoutes?: string[]
}

const Name = ({ teiNode, availableRoutes }: TEIProps) => {
  const persName = teiNode as Element
  const target = persName.getAttribute("corresp")

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

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
          {target
            ? <a href={target} style={{ textDecoration: 'none' }}>→ GND</a>
            : <i color='gray'>no link specified</i>
          }
        </div>
      </Popover>
    </Behavior>
  )
}

export default Name