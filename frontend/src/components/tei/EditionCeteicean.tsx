"use client"

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import Renderer, { Routes } from "./Renderer"
import { Tei } from "./DefaultBehaviors"
import Div from "./Div"
import Name from "./Name"
import Note from "./Note"
import Seg from "./Seg"
import Figure from "./Figure"
import Metadata, { Change, SourceDesc } from "./Metadata"
import Ref from "./Ref"
import MsIdentifier from "./MsIdentifier"
import './style.css'
import { Box, Dialog, DialogContent, IconButton, Paper, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material"
import { Code, Download, ImageOutlined, LayersOutlined, Title } from "@mui/icons-material"
import { Facsimile, computeLayout } from "../../lib/facsimile"
import { iiifImageUrl, libraryOf } from "../../lib/iiif"
import type { Topic } from "../../lib/tei"
import { TopicsContext } from "./TopicsContext"

const Hidden = () => null

// the dialog renders the header and nothing else
const headerRoutes: Routes = {
  "tei-tei": Tei,
  "tei-teiheader": Metadata,
  "tei-change": Change,
  "tei-sourcedesc": SourceDesc,
  "tei-ref": Ref,
  "tei-facsimile": Hidden,
  "tei-text": Hidden,
  "tei-persname": Name,
  "tei-orgname": Name,
  "tei-note": Note,
  "tei-msidentifier": MsIdentifier
}

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
  topics: Record<string, Topic>
  // the links to the digital images of the transcribed printing
  imageLinks: string[]
  // the text as the server renders it, shown until the edition takes over
  children?: React.ReactNode
}

type Mode = 'layout' | 'text' | 'facsimile'

// the gap between pages side by side in the facsimile view, in image pixels
const pageGap = 40

const EditionCeteicean = ({ name, prefixed, elements, facsimile, original, topics, imageLinks, children }: Props) => {
  const [mode, setMode] = useState<Mode>('text')
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

  const [metadataOpen, setMetadataOpen] = useState(false)

  const layout = useMemo(() => computeLayout(facsimile), [facsimile])
  const hasLayout = Object.keys(layout.zones).length > 0

  // the pages that their libraries serve through IIIF, side by side
  const pages = useMemo(() => {
    const served = facsimile.surfaces.flatMap((surface, index) => surface.iiif ? [{
      index,
      image: surface.iiif,
      // the zones fit where the library's image is the scan they were drawn on
      zonesFit: surface.width === surface.iiif.width && surface.height === surface.iiif.height,
    }] : [])
    return served.map((page, i) => ({
      ...page,
      left: served.slice(0, i).reduce((sum, before) => sum + before.image.width + pageGap, 0),
    }))
  }, [facsimile])
  const pagesWidth = pages.length ? pages[pages.length - 1].left + pages[pages.length - 1].image.width : 0
  const pagesHeight = Math.max(0, ...pages.map(page => page.image.height))
  const library = pages.length ? libraryOf(pages[0].image.service, imageLinks) : null
  // ?debug outlines the zones and puts the facsimile (if it is found under
  // /facs/<ad>-<surface>.png) beneath the text; ?debug=facs shows only the
  // facsimile
  const debugParam = mounted ? new URLSearchParams(window.location.search).get('debug') : null
  const debug = debugParam !== null
  const facsOnly = debugParam === 'facs'

  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const mouseStateRef = useRef({ down: false, lastPos: { x: 0, y: 0 } })

  // stable routes, so that panning and zooming do not re-render the text;
  // the header is shown in the dialog only
  const layoutRoutes: Routes = useMemo(() => ({
    "tei-tei": Tei,
    "tei-teiheader": Hidden,
    "tei-div": (props) => <Div zoneGetter={id => layout.zones[id] || null} {...props} />,
    "tei-persname": Name,
    "tei-orgname": Name,
    "tei-seg": Seg,
    "tei-figure": Figure,
    "tei-note": Note,
    "tei-ref": Ref,
    "tei-msidentifier": MsIdentifier
  }), [layout])

  const textRoutes: Routes = useMemo(() => ({
    "tei-tei": Tei,
    "tei-teiheader": Hidden,
    "tei-persname": Name,
    "tei-orgname": Name,
    "tei-seg": Seg,
    "tei-figure": Figure,
    "tei-note": Note,
    "tei-ref": Ref,
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

  // fit the whole advertisement (or its pages) into the view whenever the
  // view opens
  useLayoutEffect(() => {
    const div = divRef.current
    const [width, height] = mode === 'layout' ? [layout.width, layout.height]
      : mode === 'facsimile' ? [pagesWidth, pagesHeight] : [0, 0]
    if (!div || width === 0 || height === 0) return

    const padding = 10
    const fitted = Math.min(
      (div.clientWidth - 2 * padding) / width,
      (div.clientHeight - 2 * padding) / height)
    setZoom(fitted)
    setPos({
      x: (div.clientWidth - width * fitted) / 2,
      y: padding,
    })
  }, [mode, layout, pagesWidth, pagesHeight, mounted])

  if (!mounted) return <Box sx={{ ml: 7 }} className="static-text">{children}</Box>

  return (
    <TopicsContext.Provider value={topics}>
      <Stack direction='column' position='absolute'>
        <ToggleButtonGroup
          size='small'
          value={mode}
          exclusive
          onChange={(_, value) => value && setMode(value as Mode)}
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
          <ToggleButton value="facsimile" aria-label="Facsimile" disabled={pages.length === 0}>
            <Tooltip title="Facsimile" placement="right">
              <ImageOutlined />
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
          <Renderer prefixed={prefixed} elements={elements} routes={headerRoutes} />
        </DialogContent>
      </Dialog>

      {mode === 'facsimile' && (
        <>
          <Box
            ref={divRef}
            className='container'
            sx={{ ml: 7 }}
            style={{ height: '90vh', overflow: 'hidden' }}>
            <div
              style={{
                position: 'relative',
                width: pagesWidth,
                height: pagesHeight,
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}>
              {pages.map(page => (
                <Paper
                  key={page.index}
                  elevation={5}
                  square
                  style={{
                    position: 'absolute',
                    left: page.left,
                    top: 0,
                    width: page.image.width,
                    height: page.image.height,
                    overflow: 'hidden'
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={iiifImageUrl(page.image, 2000)}
                    alt={`Page ${page.index + 1} of the advertisement as printed`}
                    draggable={false}
                    style={{ display: 'block', width: '100%', height: '100%' }} />
                  {page.zonesFit && (
                    <svg
                      viewBox={`0 0 ${page.image.width} ${page.image.height}`}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      {facsimile.zones.filter(zone => zone.surface === page.index).map(zone => (
                        <polygon
                          key={zone.id}
                          points={zone.points.map(point => point.join(',')).join(' ')}
                          fill="none"
                          stroke="#8b5e3c"
                          strokeOpacity={0.7}
                          strokeWidth={Math.max(2, page.image.width / 600)} />
                      ))}
                    </svg>
                  )}
                </Paper>
              ))}
            </div>
          </Box>
          <Typography variant="body2" component="p" sx={{ ml: 7, mt: 1, color: 'text.secondary' }}>
            Image: {library?.url ? <a href={library.url}>{library.name}</a> : library?.name}.
            {pages.some(page => page.zonesFit)
              ? ' The outlines are the regions of the transcription.'
              : ' The regions of the transcription were drawn on another scan, so they are not shown.'}
          </Typography>
        </>
      )}

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
        : mode === 'text' && (
          <Box sx={{ ml: 7 }}>
            <Renderer prefixed={prefixed} elements={elements} routes={textRoutes} />
          </Box>
        )}
    </TopicsContext.Provider>
  )
}

export default EditionCeteicean
