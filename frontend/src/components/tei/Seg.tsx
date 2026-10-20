import React, { useContext, useState } from "react"
import { Behavior } from "./Behavior"
import { TEINodes } from "react-teirouter"
import { Popover } from "@mui/material"
import { TopicsContext } from "./TopicsContext"
import Link from "next/link"
import { EDITOR } from "../../lib/site"

interface TEIProps {
  teiNode: Node
  availableRoutes?: string[]
}

const Seg = ({ teiNode, availableRoutes }: TEIProps) => {
  const seg = teiNode as Element
  // a segment can stand for several topics
  const topics = (seg.getAttribute("ana") || '').split(/\s+/).filter(Boolean)
  // who assigned the topics: the editor or Claude
  const resp = seg.getAttribute("resp")
  const annotator = resp === '#claude' ? 'Claude, an AI model' : resp === '#np' ? EDITOR.name : null
  const type = seg.getAttribute('type') || ''

  const definitions = useContext(TopicsContext)

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
          <span color='gray'>{type}: </span>
          {topics.map((topic, i) => (
            <React.Fragment key={topic}>
              {i > 0 && ', '}
              <Link href={`/topic/${topic}`}>
                {definitions[topic]?.label || topic}
              </Link>
            </React.Fragment>
          ))}
          {annotator && (
            <div style={{ color: '#6b6b6b', fontSize: '0.85em', marginTop: '0.5rem' }}>
              Assigned by {annotator}
            </div>
          )}
        </div>
      </Popover>
    </Behavior>
  )
}

export default Seg
