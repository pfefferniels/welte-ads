import React, { useEffect, useRef, useState } from "react"
import Ceteicean, { Routes } from "gatsby-theme-ceteicean/src/components/Ceteicean"
import {
  Tei
} from "gatsby-theme-ceteicean/src/components/DefaultBehaviors"
import Layout from "../../components/layout"
import Container from "@mui/material/Container"
import Div from "./Div"
import Graphic from "./Graphic"
import Name from "./Name"
import Note from './Note'
import Seg from "./Seg"
import './style.css'
import { Box, Dialog, DialogContent, IconButton, Paper, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { Code, Download, LayersOutlined, Title } from "@mui/icons-material"
import { graphql, useStaticQuery } from "gatsby"
import Metadata from "./Metadata"

const withinBoundaries = (lower: number, suggested: number, upper: number) => {
  return Math.max(lower, Math.min(upper, suggested))
}

interface Props {
  pageContext: {
    name: string
    prefixed: string
    elements: string[]
  },
  location: string
}

const EditionCeteicean = ({ pageContext }: Props) => {
  const [mode, setMode] = useState<'layout' | 'text'>('text');

  const metadataRef = useRef<HTMLDivElement>(null)
  const [metadataOpen, setMetadataOpen] = useState(false)

  const [surfaceWidth, setSurfaceWidth] = useState(100)
  const [surfaceHeight, setSurfaceHeight] = useState(100)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const mouseStateRef = useRef({ down: false, lastPos: { x: 0, y: 0 } });

  const data = useStaticQuery(graphql`
  query {
    allCetei {
      nodes {
        parent {
          ... on File {
            name
          }
        }
        original
      }
    }
  }
  `)

  const original = data.allCetei.nodes.find((node: any) => node.parent.name === pageContext.name)?.original || ''

  const dom = new DOMParser().parseFromString(pageContext.prefixed, 'text/html')

  const getZoneById = (id: string) => {
    if (id.length === 0) return null

    const zone = dom.querySelector(id)
    if (!zone) return null

    return zone.getAttribute('points')
  }

  const layoutRoutes: Routes = {
    "tei-tei": Tei,
    "tei-graphic": props => (
      <Graphic
        teiNode={props.teiNode}
        setDimension={(width, height) => {
          setSurfaceWidth(width)
          setSurfaceHeight(height)
        }} />
    ),
    "tei-teiheader": props => <Metadata sink={metadataRef} {...props} />,
    "tei-div": props => <Div zoneGetter={getZoneById} {...props} />,
    "tei-persname": Name,
    "tei-orgname": Name,
    "tei-seg": Seg,
    "tei-note": Note
  }

  const textRoutes: Routes = {
    "tei-tei": Tei,
    "tei-teiheader": props => <Metadata sink={metadataRef} {...props} />,
    "tei-persname": Name,
    "tei-orgname": Name,
    "tei-seg": Seg,
    "tei-note": Note
  }

  const divRef = useRef<HTMLDivElement>(null)

  const factor = 0.05

  useEffect(() => {
    const div = divRef.current;
    if (!div) return

    const handleMouseDown = (e: MouseEvent) => {
      mouseStateRef.current = { down: true, lastPos: { x: e.clientX, y: e.clientY } };

      // disable text selection
      if (divRef.current) divRef.current.style.userSelect = 'none'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseStateRef.current.down) return;

      const newPos = { x: e.clientX, y: e.clientY };
      const diffPos = {
        x: newPos.x - mouseStateRef.current.lastPos.x,
        y: newPos.y - mouseStateRef.current.lastPos.y,
      };
      mouseStateRef.current.lastPos = newPos;

      setPos({
        x: pos.x + diffPos.x,
        y: pos.y + diffPos.y,
      });
    }

    const handleMouseUp = () => {
      mouseStateRef.current.down = false;

      if (divRef.current) divRef.current.style.userSelect = "";
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const zoomPoint = { x: e.clientX, y: e.clientY }

      let delta = e.deltaY ? e.deltaY / 40 : e.deltaX
      delta = -withinBoundaries(-1, delta, 1)

      const newZoom = withinBoundaries(0.1, zoom + delta * factor * zoom, 5)

      const zoomTarget = {
        x: (zoomPoint.x - pos.x) / zoom,
        y: (zoomPoint.y - pos.y) / zoom,
      }

      const newPos = {
        x: -zoomTarget.x * newZoom + zoomPoint.x,
        y: -zoomTarget.y * newZoom + zoomPoint.y,
      };

      setZoom(newZoom)
      setPos(newPos)
    }

    div.addEventListener('wheel', handleWheel, { passive: false });
    div.addEventListener('mousedown', handleMouseDown,);
    div.addEventListener('mousemove', handleMouseMove);
    div.addEventListener('mouseup', handleMouseUp);
    div.addEventListener('mouseleave', handleMouseUp);

    return () => {
      div.removeEventListener('wheel', handleWheel);
      div.removeEventListener('mousedown', handleMouseDown);
      div.removeEventListener('mousemove', handleMouseMove);
      div.removeEventListener('mouseup', handleMouseUp);
      div.removeEventListener('mouseleave', handleMouseUp);
    }
  }, [divRef, zoom, pos, factor, surfaceWidth, surfaceHeight])

  useEffect(() => {
    setZoom((window.innerHeight - 100) / surfaceHeight)
    setPos({ x: 10, y: 10 })
  }, [surfaceHeight, surfaceWidth])

  return (
    <Layout location="Edition" editionPage={true}>
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
            const a = window.document.createElement('a');
            a.href = window.URL.createObjectURL(new Blob([original], { type: 'application/xml' }));
            a.download = `${pageContext.name}.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
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

      <Container component="main" maxWidth="md">
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
                <Ceteicean pageContext={pageContext} routes={layoutRoutes} />
              </Paper>
            </div>)
          : (
            <Ceteicean pageContext={pageContext} routes={textRoutes} />
          )}
      </Container>
    </Layout>
  )

}

export default EditionCeteicean
