"use client"

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react"
import Renderer, { Routes } from "./Renderer"
import { Tei } from "./DefaultBehaviors"
import Div from "./Div"
import Graphic from "./Graphic"
import Name from "./Name"
import Note from "./Note"
import Seg from "./Seg"
import Metadata from "./Metadata"
import MsIdentifier from "./MsIdentifier"
import './style.css'
import { Box, Dialog, DialogContent, IconButton, Paper, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { Code, Download, LayersOutlined, Title } from "@mui/icons-material"

const withinBoundaries = (lower: number, suggested: number, upper: number) => {
  return Math.max(lower, Math.min(upper, suggested))
}

interface Props {
  name: string
  prefixed: string
  elements: string[]
  original: string
}

const EditionCeteicean = ({ name, prefixed, elements, original }: Props) => {
  const [mode, setMode] = useState<'layout' | 'text'>('text')
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  useEffect(() => {
    if (!mounted) return
    const hash = window.location.hash
    if (!hash) return

    // Wait for TEI content to render, then scroll to target
    const timer = setTimeout(() => {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target.classList.add('highlight-target')
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [mounted])

  const metadataRef = useRef<HTMLDivElement>(null)
  const [metadataOpen, setMetadataOpen] = useState(false)

  const [surfaceWidth, setSurfaceWidth] = useState(100)
  const [surfaceHeight, setSurfaceHeight] = useState(100)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const mouseStateRef = useRef({ down: false, lastPos: { x: 0, y: 0 } })
  const [prevSurface, setPrevSurface] = useState({ width: surfaceWidth, height: surfaceHeight })


  const getZoneById = (id: string) => {
    if (typeof window === 'undefined' || id.length === 0) return null
    const dom = new DOMParser().parseFromString(prefixed, 'text/html')
    const zone = dom.querySelector(id)
    if (!zone) return null
    return zone.getAttribute('points')
  }

  const layoutRoutes: Routes = {
    "tei-tei": Tei,
    "tei-graphic": (props) => (
      <Graphic
        teiNode={props.teiNode}
        setDimension={(width, height) => {
          setSurfaceWidth(width)
          setSurfaceHeight(height)
        }} />
    ),
    "tei-teiheader": (props) => <Metadata sink={metadataRef} {...props} />,
    "tei-div": (props) => <Div zoneGetter={getZoneById} {...props} />,
    "tei-persname": Name,
    "tei-orgname": Name,
    "tei-seg": Seg,
    "tei-note": Note,
    "tei-msidentifier": MsIdentifier
  }

  const textRoutes: Routes = {
    "tei-tei": Tei,
    "tei-teiheader": (props) => <Metadata sink={metadataRef} {...props} />,
    "tei-persname": Name,
    "tei-orgname": Name,
    "tei-seg": Seg,
    "tei-note": Note,
    "tei-msidentifier": MsIdentifier
  }

  const divRef = useRef<HTMLDivElement>(null)

  const factor = 0.05

  useEffect(() => {
    const div = divRef.current
    if (!div) return

    const handleMouseDown = (e: MouseEvent) => {
      mouseStateRef.current = { down: true, lastPos: { x: e.clientX, y: e.clientY } }

      if (divRef.current) divRef.current.style.userSelect = 'none'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseStateRef.current.down) return

      const newPos = { x: e.clientX, y: e.clientY }
      const diffPos = {
        x: newPos.x - mouseStateRef.current.lastPos.x,
        y: newPos.y - mouseStateRef.current.lastPos.y,
      }
      mouseStateRef.current.lastPos = newPos

      setPos(prev => ({
        x: prev.x + diffPos.x,
        y: prev.y + diffPos.y,
      }))
    }

    const handleMouseUp = () => {
      mouseStateRef.current.down = false

      if (divRef.current) divRef.current.style.userSelect = ""
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const zoomPoint = { x: e.clientX, y: e.clientY }

      let delta = e.deltaY ? e.deltaY / 40 : e.deltaX
      delta = -withinBoundaries(-1, delta, 1)

      setZoom(prevZoom => {
        const newZoom = withinBoundaries(0.1, prevZoom + delta * factor * prevZoom, 5)

        setPos(prevPos => {
          const zoomTarget = {
            x: (zoomPoint.x - prevPos.x) / prevZoom,
            y: (zoomPoint.y - prevPos.y) / prevZoom,
          }

          return {
            x: -zoomTarget.x * newZoom + zoomPoint.x,
            y: -zoomTarget.y * newZoom + zoomPoint.y,
          }
        })

        return newZoom
      })
    }

    div.addEventListener('wheel', handleWheel, { passive: false })
    div.addEventListener('mousedown', handleMouseDown)
    div.addEventListener('mousemove', handleMouseMove)
    div.addEventListener('mouseup', handleMouseUp)
    div.addEventListener('mouseleave', handleMouseUp)

    return () => {
      div.removeEventListener('wheel', handleWheel)
      div.removeEventListener('mousedown', handleMouseDown)
      div.removeEventListener('mousemove', handleMouseMove)
      div.removeEventListener('mouseup', handleMouseUp)
      div.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [divRef, factor])

  if (
    prevSurface.width !== surfaceWidth ||
    prevSurface.height !== surfaceHeight
  ) {
    setPrevSurface({ width: surfaceWidth, height: surfaceHeight })
    setZoom((typeof window !== 'undefined' ? window.innerHeight - 100 : 100) / surfaceHeight)
    setPos({ x: 10, y: 10 })
  }

  if (!mounted) return null

  return (
    <>
      <Stack direction='column' position='absolute'>
        <ToggleButtonGroup
          size='small'
          value={mode}
          exclusive
          onChange={(_, value) => setMode(value as 'layout' | 'text')}
          aria-label="display mode"
        >
          <ToggleButton value="layout" aria-label="layout">
            <LayersOutlined />
          </ToggleButton>
          <ToggleButton value="text" aria-label="text">
            <Title />
          </ToggleButton>
        </ToggleButtonGroup>

        <Box mt={2}>
          <IconButton onClick={() => {
            const a = window.document.createElement('a')
            a.href = window.URL.createObjectURL(new Blob([original], { type: 'application/xml' }))
            a.download = `${name}.xml`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          }}>
            <Download />
          </IconButton>
        </Box>

        <Box mt={1}>
          <IconButton onClick={() => setMetadataOpen(true)}>
            <Code />
          </IconButton>
        </Box>
      </Stack>

      <Dialog keepMounted={true} open={metadataOpen} onClose={() => setMetadataOpen(false)}>
        <DialogContent>
          <div ref={metadataRef} />
        </DialogContent>
      </Dialog>

      {mode === 'layout'
        ? (
          <div
            ref={divRef}
            className='container'
            style={{
              width: '100%',
              height: '90vh',
              overflow: 'hidden'
            }}>
            <Paper
              className='paper'
              elevation={5}
              style={{
                position: 'relative',
                width: surfaceWidth,
                height: surfaceHeight,
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}>
              <Renderer prefixed={prefixed} elements={elements} routes={layoutRoutes} />
            </Paper>
          </div>)
        : (
          <Box sx={{ ml: 7 }}>
            <Renderer prefixed={prefixed} elements={elements} routes={textRoutes} />
          </Box>
        )}
    </>
  )
}

export default EditionCeteicean
