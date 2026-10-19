import React, { useContext, useState } from "react"
import { Behavior } from "./Behavior"
import { TEINodes } from "react-teirouter"
import { Popover } from "@mui/material"
import { TopicsContext } from "./TopicsContext"
import Link from "next/link"
import { topicPath } from "../../helpers/topicPath"

interface TEIProps {
  teiNode: Node
  availableRoutes?: string[]
}

const Seg = ({ teiNode, availableRoutes }: TEIProps) => {
  const seg = teiNode as Element
  // a segment can stand for several topics
  const topics = (seg.getAttribute("ana") || '').split(/\s+/).filter(Boolean)
  const resp = seg.getAttribute("resp") || 'unknown'
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
              <Link href={topicPath(topic)}>
                {definitions[topic]?.label || topic}
              </Link>
            </React.Fragment>
          ))}
          <sup>{resp}</sup>
        </div>
      </Popover>
    </Behavior>
  )
}

export default Seg
