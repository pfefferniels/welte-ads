// Facsimile model shared between the build step (lib/tei.ts) and the
// layout view. Kept free of Node imports so it can run in the browser.

export type Point = [number, number]

export interface FacsSurface {
  url: string
  width: number | null
  height: number | null
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
  bands: Band[] | null
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

    const covered = union(own)
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
        bands: null,
      }
      if (isShaped(zone.points, box)) {
        const shape = zone.points.map(([x, y]) => [x - box.left, y - box.top] as Point)
        const bands = exclusionBands(shape, box.width, box.height)
        if (bands) Object.assign(zones[zone.id], { shape, bands })
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

interface Band {
  height: number
  left: FloatShape | null
  right: FloatShape | null
}

/**
 * The parts of a zone's bounding box that lie outside its polygon, as float
 * shapes along the left and right edges. Text placed between them follows
 * the outline of the zone. The floats are cut into horizontal bands (at every
 * corner of the outline and at least every 1/12 of the height) so that a
 * notch on one side and a sliver on the other never compete for the same
 * room. Exclusions shallower than `minDepth` (sloppy corners of an
 * automatic segmentation) are ignored; null when nothing is left.
 */
export function exclusionBands(
  shape: Point[], width: number, height: number,
  minDepth = 0.06 * width, steps = 48
): Band[] | null {
  const cuts = new Set<number>([0, height])
  for (let i = 1; i < 12; i++) cuts.add((i / 12) * height)
  for (const [, y] of shape) if (y > 1 && y < height - 1) cuts.add(y)
  const bounds = Array.from(cuts).sort((a, b) => a - b)
    .filter((y, i, all) => i === 0 || y === height || y - all[i - 1] >= 2)

  // regular samples for slanted edges, plus rows just inside every band so
  // that steps in the outline stay steps
  const ys = new Set<number>()
  for (let i = 0; i <= steps; i++) ys.add((i / steps) * height)
  for (const y of bounds) {
    ys.add(y - 0.5)
    ys.add(y + 0.5)
  }
  const rows = Array.from(ys)
    .filter(y => y >= 0 && y <= height)
    .sort((a, b) => a - b)
    .map(y => {
      // sample just inside the box so that horizontal edges count
      const s = span(shape, Math.min(height - 0.5, Math.max(0.5, y)))
      return { y, from: s ? s[0] : 0, to: s ? s[1] : width }
    })

  const bands: Band[] = []
  for (let i = 1; i < bounds.length; i++) {
    const top = bounds[i - 1]
    const bottom = bounds[i]
    const own = rows.filter(r => r.y >= top && r.y <= bottom)
    if (own.length === 0) continue

    let left = Math.max(...own.map(r => r.from))
    let right = Math.max(...own.map(r => width - r.to))
    if (left < minDepth) left = 0
    if (right < minDepth) right = 0
    // both floats have to fit side by side, with room for text
    if (left + right > width - minDepth) {
      if (left >= right) right = 0
      else left = 0
    }

    const h = bottom - top
    const first = own[0]
    const last = own[own.length - 1]
    bands.push({
      height: h,
      left: left > 0
        ? {
          width: left,
          polygon: [
            [0, 0], [Math.min(first.from, left), 0],
            ...own.map(r => [Math.min(r.from, left), r.y - top] as Point),
            [Math.min(last.from, left), h], [0, h],
          ],
        }
        : null,
      right: right > 0
        ? {
          width: right,
          polygon: [
            [right, 0], [right - Math.min(width - first.to, right), 0],
            ...own.map(r => [right - Math.min(width - r.to, right), r.y - top] as Point),
            [right - Math.min(width - last.to, right), h], [right, h],
          ],
        }
        : null,
    })
  }

  return bands.some(b => b.left || b.right) ? bands : null
}
