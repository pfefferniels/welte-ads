"use client"

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import Renderer, { Routes } from "./Renderer"
import { Tei } from "./DefaultBehaviors"
import Div from "./Div"
import Name from "./Name"
import Note from "./Note"
import Seg from "./Seg"
import Figure from "./Figure"
import Metadata from "./Metadata"
import MsIdentifier from "./MsIdentifier"
import './style.css'
import { Box, Dialog, DialogContent, IconButton, Paper, Stack, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material"
import { Code, Download, LayersOutlined, Title } from "@mui/icons-material"
import { Facsimile, computeLayout } from "../../lib/facsimile"

const withinBoundaries = (lower: number, suggested: number, upper: number) => {
  return Math.max(lower, Math.min(upper, suggested))
}

// zoom step per wheel tick
const factor = 0.05

interface Props {
  name: string
  prefixed: string
  elements: string[]
  facsimile: Facsimile
  original: string
}

const EditionCeteicean = ({ name, prefixed, elements, facsimile, original }: Props) => {
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

  const layout = useMemo(() => computeLayout(facsimile), [facsimile])
  const hasLayout = Object.keys(layout.zones).length > 0
  // ?debug outlines the zones and puts the facsimile (if it is found under
  // /facs/<ad>-<surface>.png) beneath the text; ?debug=facs shows only the
  // facsimile
  const debugParam = mounted ? new URLSearchParams(window.location.search).get('debug') : null
  const debug = debugParam !== null
  const facsOnly = debugParam === 'facs'

  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const mouseStateRef = useRef({ down: false, lastPos: { x: 0, y: 0 } })

  // stable routes, so that panning and zooming do not re-render the text
  const layoutRoutes: Routes = useMemo(() => ({
    "tei-tei": Tei,
    "tei-teiheader": (props) => <Metadata sink={metadataRef} {...props} />,
    "tei-div": (props) => <Div zoneGetter={id => layout.zones[id] || null} {...props} />,
    "tei-persname": Name,
    "tei-orgname": Name,
    "tei-seg": Seg,
    "tei-figure": Figure,
    "tei-note": Note,
    "tei-msidentifier": MsIdentifier
  }), [layout])

  const textRoutes: Routes = useMemo(() => ({
    "tei-tei": Tei,
    "tei-teiheader": (props) => <Metadata sink={metadataRef} {...props} />,
    "tei-persname": Name,
    "tei-orgname": Name,
    "tei-seg": Seg,
    "tei-figure": Figure,
    "tei-note": Note,
    "tei-msidentifier": MsIdentifier
  }), [])

  const divRef = useRef<HTMLDivElement>(null)

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

      const rect = div.getBoundingClientRect()
      const zoomPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }

      let delta = e.deltaY ? e.deltaY / 40 : e.deltaX
      delta = -withinBoundaries(-1, delta, 1)

      setZoom(prevZoom => {
        const newZoom = withinBoundaries(0.02, prevZoom + delta * factor * prevZoom, 5)

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
  }, [mode, mounted])

  // fit the whole advertisement into the view whenever the view opens
  useLayoutEffect(() => {
    const div = divRef.current
    if (mode !== 'layout' || !div || layout.width === 0 || layout.height === 0) return

    const padding = 10
    const fitted = Math.min(
      (div.clientWidth - 2 * padding) / layout.width,
      (div.clientHeight - 2 * padding) / layout.height)
    setZoom(fitted)
    setPos({
      x: (div.clientWidth - layout.width * fitted) / 2,
      y: padding,
    })
  }, [mode, layout, mounted])

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
          {/* the tooltips sit inside the buttons: the group passes its
              state to its direct children */}
          <ToggleButton value="layout" aria-label="Layout view" disabled={!hasLayout}>
            <Tooltip title="Layout view" placement="right">
              <LayersOutlined />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="text" aria-label="Text view">
            <Tooltip title="Text view" placement="right">
              <Title />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <Box mt={2}>
          <Tooltip title="Download TEI/XML" placement="right">
            <IconButton aria-label="Download TEI/XML" onClick={() => {
              const a = window.document.createElement('a')
              a.href = window.URL.createObjectURL(new Blob([original], { type: 'application/xml' }))
              a.download = `${name}.xml`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
            }}>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>

        <Box mt={1}>
          <Tooltip title="Sources and metadata" placement="right">
            <IconButton aria-label="Sources and metadata" onClick={() => setMetadataOpen(true)}>
              <Code />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>

      <Dialog keepMounted={true} open={metadataOpen} onClose={() => setMetadataOpen(false)}>
        <DialogContent>
          <div ref={metadataRef} />
        </DialogContent>
      </Dialog>

      {mode === 'layout'
        ? (
          <Box
            ref={divRef}
            className='container'
            sx={{ ml: 7 }}
            style={{
              height: '90vh',
              overflow: 'hidden'
            }}>
            <div
              className={`layout${debug ? ' debug' : ''}`}
              style={{
                position: 'relative',
                width: layout.width,
                height: layout.height,
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}>
              {layout.surfaces.map(surface => (
                <Paper
                  key={surface.index}
                  className='paper'
                  elevation={5}
                  square
                  data-surface={surface.index}
                  data-crop={[surface.crop.left, surface.crop.top, surface.crop.width, surface.crop.height].join(',')}
                  style={{
                    position: 'absolute',
                    left: surface.left,
                    top: surface.top,
                    width: surface.width,
                    height: surface.height,
                    overflow: 'hidden'
                  }}>
                  {debug && surface.full && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      src={`/facs/${name}-${surface.index}.png`}
                      onError={e => { e.currentTarget.style.display = 'none' }}
                      style={{
                        position: 'absolute',
                        left: surface.full.left - surface.left,
                        top: surface.full.top - surface.top,
                        width: surface.full.width,
                        height: surface.full.height,
                        opacity: facsOnly ? 1 : 0.45,
                        pointerEvents: 'none'
                      }} />
                  )}
                </Paper>
              ))}
              <div style={{ visibility: facsOnly ? 'hidden' : 'visible' }}>
                <Renderer prefixed={prefixed} elements={elements} routes={layoutRoutes} />
              </div>
              {debug && !facsOnly && (
                <svg
                  width={layout.width}
                  height={layout.height}
                  style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
                  {Object.values(layout.zones).map(zone => (
                    <g key={zone.id}>
                      <rect
                        x={zone.left}
                        y={zone.top}
                        width={zone.width}
                        height={zone.height}
                        fill="none"
                        stroke="red"
                        strokeWidth={Math.max(1, layout.width / 800)} />
                      {zone.shape && (
                        <polygon
                          points={zone.shape.map(([x, y]) => `${x + zone.left},${y + zone.top}`).join(' ')}
                          fill="none"
                          stroke="blue"
                          strokeDasharray="6 4"
                          strokeWidth={Math.max(1, layout.width / 800)} />
                      )}
                      <text
                        x={zone.left + 2}
                        y={zone.top - 4}
                        fill="red"
                        fontSize={Math.max(10, layout.width / 90)}>
                        {zone.id.replace(/^eSc_textblock_/, '')}
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </Box>)
        : (
          <Box sx={{ ml: 7 }}>
            <Renderer prefixed={prefixed} elements={elements} routes={textRoutes} />
          </Box>
        )}
    </>
  )
}

export default EditionCeteicean
