// Facsimile model shared between the build step (lib/tei.ts) and the
// layout view. Kept free of Node imports so it can run in the browser.

import type { IIIFImage } from './iiif'

export type Point = [number, number]

export interface FacsSurface {
  // the scan that the zones were drawn on
  url: string
  width: number | null
  height: number | null
  // the page as its library serves it through IIIF
  iiif?: IIIFImage | null
}

export interface FacsZone {
  id: string
  surface: number
  points: Point[]
}

export interface Facsimile {
  surfaces: FacsSurface[]
  zones: FacsZone[]
}

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

interface PlacedSurface extends Rect {
  index: number
  url: string
  // the part of the surface that is shown, in surface coordinates
  crop: Rect
  // the full surface, in canvas coordinates (for a background facsimile)
  full: Rect | null
}

export interface PlacedZone extends Rect {
  id: string
  // width of the (cropped) page the zone is on
  pageWidth: number
  // polygon relative to the zone's bounding box and the floats that make
  // text follow it, present only when the zone is noticeably not a rectangle
  shape: Point[] | null
  floats: Floats | null
  // the angle in degrees (clockwise) of a zone drawn as a slanted
  // rectangle, by the smaller turn, as a picture set at an angle is turned;
  // its left, top, width and height are those of the rectangle before it is
  // turned about its centre. 0 for every other zone
  rotation: number
}

interface Layout {
  width: number
  height: number
  surfaces: PlacedSurface[]
  zones: Record<string, PlacedZone>
}

export const parsePoints = (points: string): Point[] =>
  points
    .trim()
    .split(/\s+/)
    .map(pair => pair.split(',').map(Number))
    .filter(pair => pair.length === 2 && pair.every(Number.isFinite))
    .map(([x, y]) => [x, y] as Point)

const boundingBox = (points: Point[]): Rect => {
  const xs = points.map(p => p[0])
  const ys = points.map(p => p[1])
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  return {
    left,
    top,
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
  }
}

const polygonArea = (points: Point[]) => {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area) / 2
}

// eScriptorium writes many near-rectangles as polygons with a few extra
// points; only zones that leave a real gap in their bounding box (an L-shape
// around an illustration, for instance) get a shape.
const isShaped = (points: Point[], box: Rect) =>
  points.length > 4 && polygonArea(points) < 0.93 * box.width * box.height

const degrees = ([x, y]: Point) => Math.atan2(y, x) * 180 / Math.PI

// how far a line is turned from the nearest axis, in degrees
const tilt = (side: Point) => {
  const angle = ((degrees(side) % 90) + 90) % 90
  return Math.min(angle, 90 - angle)
}

// an angle as the turn of a line, between -90° and 90°
const turn = (angle: number) => angle > 90 ? angle - 180 : angle <= -90 ? angle + 180 : angle

/**
 * A zone drawn as a rectangle turned by more than a few degrees, such as a
 * picture set at an angle: its centre, its angle by the smaller turn, and
 * its size along and across the side so turned. Null for any other zone,
 * including the near-rectangles of an automatic segmentation with one
 * sloping side.
 */
function slantedRect(points: Point[], minTilt = 5) {
  if (points.length !== 4) return null
  const sides = points.map(([x, y], i) => {
    const [nextX, nextY] = points[(i + 1) % 4]
    return [nextX - x, nextY - y] as Point
  })
  if (sides.some(side => tilt(side) < minTilt)) return null

  const [a, b, c, d] = sides.map(([x, y]) => Math.hypot(x, y))
  const similar = (u: number, v: number) => Math.abs(u - v) <= 0.1 * Math.max(u, v)
  const [first, second] = sides
  const cos = (first[0] * second[0] + first[1] * second[1]) / (a * b)
  if (!similar(a, c) || !similar(b, d) || Math.abs(cos) > Math.sin(minTilt * Math.PI / 180)) return null

  const [firstTurn, secondTurn] = [turn(degrees(first)), turn(degrees(second))]
  const firstIsLevel = Math.abs(firstTurn) <= Math.abs(secondTurn)
  return {
    centre: [points.reduce((sum, [x]) => sum + x, 0) / 4, points.reduce((sum, [, y]) => sum + y, 0) / 4] as Point,
    width: firstIsLevel ? (a + c) / 2 : (b + d) / 2,
    height: firstIsLevel ? (b + d) / 2 : (a + c) / 2,
    rotation: firstIsLevel ? firstTurn : secondTurn,
  }
}

/**
 * A slanted zone turned so that its lines run along its longer side, as
 * those of a band of text set diagonally do, and read from left to right.
 * Any other zone as it is.
 */
export function alongLongerSide(zone: PlacedZone): PlacedZone {
  if (!zone.rotation || zone.height <= zone.width) return zone
  return {
    ...zone,
    left: zone.left + (zone.width - zone.height) / 2,
    top: zone.top + (zone.height - zone.width) / 2,
    width: zone.height,
    height: zone.width,
    rotation: turn(zone.rotation - 90),
  }
}

// the outline of a placed zone on the canvas
const outlineOf = (zone: PlacedZone): Point[] => {
  if (zone.shape) return zone.shape.map(([x, y]) => [zone.left + x, zone.top + y] as Point)
  const [cos, sin] = [Math.cos(zone.rotation * Math.PI / 180), Math.sin(zone.rotation * Math.PI / 180)]
  return ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as Point[]).map(([sx, sy]) => {
    const [x, y] = [sx * zone.width / 2, sy * zone.height / 2]
    return [zone.left + zone.width / 2 + x * cos - y * sin, zone.top + zone.height / 2 + x * sin + y * cos] as Point
  })
}

const isInside = ([x, y]: Point, polygon: Point[]) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if ((yi > y) !== (yj > y) && x < xi + (y - yi) / (yj - yi) * (xj - xi)) inside = !inside
  }
  return inside
}

/**
 * The room that the other zones leave in a zone, relative to it: the
 * largest rectangle that none of them covers, preferring one that is not
 * narrower than it is high, as lines of text are. It is where the
 * description of a picture goes when text is printed over the picture.
 * Null when no other zone covers any of the zone (the whole zone is free),
 * or when hardly any room is left. The zone must not be slanted.
 */
export function freeRect(zone: PlacedZone, zones: PlacedZone[], minShare = 0.05, steps = 12): Rect | null {
  const { width, height } = zone
  const covering = zones
    .filter(other => other.id !== zone.id)
    .map(other => outlineOf(other).map(([x, y]) => [x - zone.left, y - zone.top] as Point))

  // a grid along the edges of the other zones and a few lines between,
  // each cell taken or free
  const lines = (values: number[], size: number) => Array.from(new Set([
    0, size,
    ...values.filter(value => value > 0 && value < size),
    ...Array.from({ length: steps - 1 }, (_, i) => (i + 1) * size / steps),
  ])).sort((a, b) => a - b)
  const xs = lines(covering.flat().map(([x]) => x), width)
  const ys = lines(covering.flat().map(([, y]) => y), height)
  // a cell is taken when another zone covers its middle, a corner or the
  // middle of a side, just within the cell
  const samples = (from: number, to: number) => [from + 1e-3 * (to - from), (from + to) / 2, to - 1e-3 * (to - from)]
  const taken = ys.slice(1).map((bottom, row) => xs.slice(1).map((right, column) =>
    samples(xs[column], right).some(x => samples(ys[row], bottom).some(y =>
      covering.some(polygon => isInside([x, y], polygon))))))
  if (!taken.flat().some(Boolean)) return null

  let best: Rect | null = null
  let bestScore = 0
  for (let first = 0; first < xs.length - 1; first++) {
    // the rows that are free from the first column to the last so far
    const free = taken.map(() => true)
    for (let last = first; last < xs.length - 1; last++) {
      taken.forEach((cells, row) => { free[row] = free[row] && !cells[last] })
      const w = xs[last + 1] - xs[first]
      let start = 0
      for (let row = 0; row <= free.length; row++) {
        if (row < free.length && free[row]) continue
        const h = ys[row] - ys[start]
        if (h > 0 && w * Math.min(w, h) > bestScore) {
          bestScore = w * Math.min(w, h)
          best = { left: xs[first], top: ys[start], width: w, height: h }
        }
        start = row + 1
      }
    }
  }
  return best && best.width * best.height >= minShare * width * height ? best : null
}

const union = (rects: Rect[]): Rect => {
  const left = Math.min(...rects.map(r => r.left))
  const top = Math.min(...rects.map(r => r.top))
  const right = Math.max(...rects.map(r => r.left + r.width))
  const bottom = Math.max(...rects.map(r => r.top + r.height))
  return { left, top, width: right - left, height: bottom - top }
}

/**
 * Places the surfaces of a facsimile side by side on one canvas. Each surface
 * is cropped to the area its zones cover (plus a small margin), so that an
 * advertisement printed in the corner of a newspaper page is shown as the
 * advertisement rather than as a mostly empty page.
 */
export function computeLayout(facsimile: Facsimile, margin = 0.03): Layout {
  const surfaces: PlacedSurface[] = []
  const zones: Record<string, PlacedZone> = {}

  const boxes = facsimile.zones.map(zone => ({ zone, box: boundingBox(zone.points) }))
  const used = facsimile.surfaces.filter((_, index) => boxes.some(({ zone }) => zone.surface === index))
  // the pages of an advertisement spanning several pages are shown whole
  const wholePages = used.length > 1 && used.every(s => s.width && s.height)

  const cropped = facsimile.surfaces.map((surface, index) => {
    const own = boxes.filter(({ zone }) => zone.surface === index).map(({ box }) => box)
    if (own.length === 0) return null
    if (wholePages) {
      return { index, crop: { left: 0, top: 0, width: surface.width!, height: surface.height! } }
    }

    // tiny specks left over from the automatic segmentation do not count
    const all = union(own)
    const speck = 0.015 * Math.max(all.width, all.height)
    const real = own.filter(box => box.width >= speck || box.height >= speck)
    const covered = union(real.length > 0 ? real : own)
    const m = margin * Math.max(covered.width, covered.height)
    const left = Math.max(0, covered.left - m)
    const top = Math.max(0, covered.top - m)
    const right = Math.min(surface.width ?? Infinity, covered.left + covered.width + m)
    const bottom = Math.min(surface.height ?? Infinity, covered.top + covered.height + m)
    return { index, crop: { left, top, width: right - left, height: bottom - top } }
  })

  const shown = cropped.filter(c => c !== null)
  const gap = shown.length > 1 ? 0.04 * Math.max(...shown.map(c => c.crop.height)) : 0

  let offset = 0
  for (const { index, crop } of shown) {
    const surface = facsimile.surfaces[index]
    surfaces.push({
      index,
      url: surface.url,
      left: offset,
      top: 0,
      width: crop.width,
      height: crop.height,
      crop,
      full: surface.width && surface.height
        ? { left: offset - crop.left, top: -crop.top, width: surface.width, height: surface.height }
        : null,
    })

    for (const { zone, box } of boxes) {
      if (zone.surface !== index) continue
      zones[zone.id] = {
        id: zone.id,
        pageWidth: crop.width,
        left: box.left - crop.left + offset,
        top: box.top - crop.top,
        width: box.width,
        height: box.height,
        shape: null,
        floats: null,
        rotation: 0,
      }
      const slanted = slantedRect(zone.points)
      if (slanted) {
        const [x, y] = slanted.centre
        Object.assign(zones[zone.id], {
          left: x - slanted.width / 2 - crop.left + offset,
          top: y - slanted.height / 2 - crop.top,
          width: slanted.width,
          height: slanted.height,
          rotation: slanted.rotation,
        })
      }
      else if (isShaped(zone.points, box)) {
        const shape = zone.points.map(([x, y]) => [x - box.left, y - box.top] as Point)
        const floats = exclusions(shape, box.width, box.height)
        if (floats) Object.assign(zones[zone.id], { shape, floats })
      }
    }

    offset += crop.width + gap
  }

  return {
    width: Math.max(0, offset - gap),
    height: Math.max(0, ...surfaces.map(s => s.height)),
    surfaces,
    zones,
  }
}

// Where a horizontal line at height y enters and leaves the polygon.
const span = (shape: Point[], y: number): [number, number] | null => {
  const xs: number[] = []
  for (let i = 0; i < shape.length; i++) {
    const [x1, y1] = shape[i]
    const [x2, y2] = shape[(i + 1) % shape.length]
    if (y1 === y2) {
      if (y === y1) xs.push(x1, x2)
      continue
    }
    if (y < Math.min(y1, y2) || y > Math.max(y1, y2)) continue
    xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1))
  }
  if (xs.length === 0) return null
  return [Math.min(...xs), Math.max(...xs)]
}

interface FloatShape {
  width: number
  polygon: Point[]
}

interface Floats {
  left: FloatShape | null
  right: FloatShape | null
}

/**
 * The parts of a zone's bounding box that lie outside its polygon, as one
 * float shape along the left and one along the right edge. Text placed
 * between them follows the outline of the zone. Exclusions shallower than
 * `minDepth` (sloppy corners of an automatic segmentation) are ignored, and
 * where both sides would leave no room for text, only the deeper one is
 * kept. Null when nothing is left.
 *
 * Both floats span the whole height: further floats in the text, such as a
 * drop cap, cannot be placed above an earlier float.
 */
export function exclusions(
  shape: Point[], width: number, height: number,
  minDepth = 0.06 * width, steps = 48
): Floats | null {
  // regular samples for slanted edges, plus rows just above and below every
  // corner so that steps in the outline stay steps
  const ys = new Set<number>()
  for (let i = 0; i <= steps; i++) ys.add((i / steps) * height)
  for (const [, y] of shape) {
    ys.add(y - 0.5)
    ys.add(y + 0.5)
  }
  const rows = Array.from(ys)
    .filter(y => y >= 0 && y <= height)
    .sort((a, b) => a - b)
    .map(y => {
      // sample just inside the box so that horizontal edges count
      const s = span(shape, Math.min(height - 0.5, Math.max(0.5, y)))
      let left = s ? s[0] : 0
      let right = s ? width - s[1] : 0
      if (left < minDepth) left = 0
      if (right < minDepth) right = 0
      if (left + right > width - minDepth) {
        if (left >= right) right = 0
        else left = 0
      }
      return { y, left, right }
    })

  // how deep an exclusion goes over at least 5% of the zone's height, so
  // that a thin sliver at a corner does not count as a notch
  const depth = (side: 'left' | 'right') => {
    const covered = rows.map((r, i) => ({
      depth: r[side],
      height: (rows[i + 1]?.y ?? height) - r.y,
    }))
    covered.sort((a, b) => b.depth - a.depth)
    let sum = 0
    for (const { depth, height: h } of covered) {
      sum += h
      if (sum >= 0.05 * height) return depth
    }
    return 0
  }

  let left = depth('left')
  let right = depth('right')
  // the two floats sit side by side at the top of the zone
  if (left + right > width - minDepth) {
    if (left >= right) right = Math.max(0, width - left - minDepth)
    else left = Math.max(0, width - right - minDepth)
  }
  if (left === 0 && right === 0) return null

  return {
    left: left > 0
      ? {
        width: left,
        polygon: [
          [0, 0],
          ...rows.map(r => [Math.min(r.left, left), r.y] as Point),
          [0, height],
        ],
      }
      : null,
    right: right > 0
      ? {
        width: right,
        polygon: [
          [right, 0],
          ...rows.map(r => [right - Math.min(r.right, right), r.y] as Point),
          [right, height],
        ],
      }
      : null,
  }
}
