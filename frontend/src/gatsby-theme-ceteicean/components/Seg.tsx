import React, { useState } from "react"
import { Behavior } from "gatsby-theme-ceteicean/src/components/Behavior"
import { TEINodes } from "react-teirouter"
import { Popover } from "@mui/material"

interface TEIProps {
  teiNode: Node
  availableRoutes?: string[]
}

const Seg = ({ teiNode, availableRoutes }: TEIProps) => {
  const seg = teiNode as Element
  const topic = seg.getAttribute("ana")
  const resp = seg.getAttribute("resp") || 'unknown'
  const type = seg.getAttribute('type') || ''

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
        className="seg"
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
          <span color='gray'>{type}</span>: <i>{topic}</i><sup>{resp}</sup>
        </div>
      </Popover>
    </Behavior>
  )
}

export default Seg