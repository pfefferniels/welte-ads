import React, { useState } from "react"
import { Behavior } from "gatsby-theme-ceteicean/src/components/Behavior"
import { Popover } from "@mui/material"
import { Comment } from "@mui/icons-material"

interface TEIProps {
  teiNode: Node
  availableRoutes?: string[]
}

const Interp = ({ teiNode }: TEIProps) => {
  const interp = teiNode as Element
  const topic = interp.textContent
  const resp = interp.getAttribute('resp') || '#unknown'
  const type = interp.getAttribute('type') || 'unknown'

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
        aria-aria-haspopup={true}
        onClick={handlePopoverOpen}>
        <Comment fontSize="small"/>
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

export default Interp