import React from "react"
import { TEINodes } from "react-teirouter"

interface TEIProps {
  teiNode: Node
  availableRoutes?: string[]
}

function forwardAttributes(atts: NamedNodeMap) {
  const result: Record<string, string> = {}
  for (let i = 0; i < atts.length; i++) {
    const att = atts[i]
    if (att.name === 'ref') {
      result['Ref'] = att.value
    } else {
      result[att.name] = att.value
    }
  }
  return result
}

export const Tei = ({ teiNode, availableRoutes }: TEIProps) => {
  const el = teiNode as Element
  const tagName = el.tagName.toLowerCase()
  const atts = forwardAttributes(el.attributes)

  // Process end notes
  const endNotes = el.querySelectorAll('tei-note[place="end"]')
  endNotes.forEach((note, idx) => {
    note.setAttribute('data-idx', String(idx + 1))
  })

  const notesList = endNotes.length > 0 ? (
    <ol className="ceteicean-notes">
      {Array.from(endNotes).map((note, idx) => (
        <li key={idx} id={`note-${idx + 1}`}>
          <TEINodes teiNodes={note.childNodes} availableRoutes={availableRoutes} />
        </li>
      ))}
    </ol>
  ) : null

  return React.createElement(
    tagName,
    atts,
    <TEINodes teiNodes={el.childNodes} availableRoutes={availableRoutes} />,
    notesList
  )
}

export const TeiHeader = ({ teiNode, availableRoutes }: TEIProps) => {
  const el = teiNode as Element
  const tagName = el.tagName.toLowerCase()

  return React.createElement(
    tagName,
    {},
    <TEINodes teiNodes={el.childNodes} availableRoutes={availableRoutes} />
  )
}
