import React, { useState } from "react"
import { Behavior } from "gatsby-theme-ceteicean/src/components/Behavior"
import { TEINodes } from "react-teirouter"
import { IconButton, Popover } from "@mui/material"
import { Comment } from "@mui/icons-material"

interface TEIProps {
    teiNode: Node
    availableRoutes?: string[]
}

const Note = ({ teiNode, availableRoutes }: TEIProps) => {
    const resp = (teiNode as Element).getAttribute('resp')
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
            <IconButton onClick={handlePopoverOpen}>
                <Comment />
            </IconButton>
            <Popover
                id='mouseover-popup'
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}>
                <div style={{ padding: '1rem', maxWidth: 300 }}>
                    {resp && `[${resp}]`}
                    <TEINodes
                        teiNodes={teiNode.childNodes}
                        availableRoutes={availableRoutes} />
                </div>
            </Popover>
        </Behavior >
    )
}

export default Note