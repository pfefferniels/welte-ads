import { forceCenter, forceCollide, forceManyBody, forceRadial, forceSimulation, max, min, scaleSqrt } from 'd3'
import type { SimulationNodeDatum } from 'd3'

export interface WeighedTerm {
  topic: string
  label: string
  weight: number
}

interface Bubble extends WeighedTerm {
  // the centre and radius of the circle
  x: number
  y: number
  r: number
  // the label, broken into lines, and its font size
  lines: string[]
  fontSize: number
}

type Node = WeighedTerm & SimulationNodeDatum & { r: number }

// the radius of the circle of the heaviest term
const maxRadius = 150
// the space around the outermost circles
const margin = 4

/**
 * The width of a text in em: Crimson Pro averages 0.43 em per character,
 * and the rest covers capitals and the bold on hover.
 */
const textWidth = (text: string) => 0.45 * text.length + 0.7

/**
 * A label at a quarter of the radius, or smaller where that is needed to
 * keep it inside its circle. A long label is broken into two lines when
 * that makes it clearly larger.
 */
export function fitLabel(label: string, r: number): { lines: string[]; fontSize: number } {
  const fit = (lines: string[]) => ({
    lines,
    fontSize: Math.min(r / 4, 1.8 * r / Math.max(...lines.map(textWidth))),
  })
  const words = label.split(' ')
  const oneLine = fit([label])
  const twoLines = words.slice(1)
    .map((_, i) => fit([words.slice(0, i + 1).join(' '), words.slice(i + 1).join(' ')]))
    .reduce((best, lines) => lines.fontSize > best.fontSize ? lines : best, oneLine)
  return twoLines.fontSize > 1.25 * oneLine.fontSize ? twoLines : oneLine
}

/**
 * Circles whose areas grow with the weights of their terms, packed by a
 * force simulation that is run to its end at once, so that the circles
 * stand still and the same terms always give the same picture. The view
 * box encloses all circles.
 */
export function layoutBubbles(terms: WeighedTerm[]): { bubbles: Bubble[]; viewBox: number[] } {
  const radius = scaleSqrt()
    .domain([0, max(terms, term => term.weight) ?? 0])
    .range([0, maxRadius])
  // the heaviest first, also in the order of tabbing through them
  const nodes: Node[] = terms
    .map(term => ({ ...term, r: radius(term.weight) }))
    .sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label))

  const simulation = forceSimulation(nodes)
    .force('charge', forceManyBody().strength(7))
    .force('collide', forceCollide<Node>(d => d.r + 1))
    .force('center', forceCenter())
    .force('radial', forceRadial<Node>(d => d.r))
    .stop()
  simulation.tick(Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())))

  const bubbles = nodes.map(({ topic, label, weight, r, x = 0, y = 0 }) => ({
    topic, label, weight, x, y, r, ...fitLabel(label, r),
  }))
  if (!bubbles.length) return { bubbles, viewBox: [0, 0, 0, 0] }

  const left = min(bubbles, b => b.x - b.r)! - margin
  const top = min(bubbles, b => b.y - b.r)! - margin
  const right = max(bubbles, b => b.x + b.r)! + margin
  const bottom = max(bubbles, b => b.y + b.r)! + margin
  return { bubbles, viewBox: [left, top, right - left, bottom - top] }
}
