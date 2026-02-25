import React from "react"

interface BehaviorProps {
  node: Node
  children: React.ReactNode
}

const Behavior = ({ node, children }: BehaviorProps) => {
  if (node.nodeType === 1) {
    const el = node as Element
    const tagName = el.tagName.toLowerCase()
    const id = el.getAttribute('id') || undefined

    return React.createElement(
      tagName,
      { id },
      <span hidden aria-hidden="true" data-original="true"
        dangerouslySetInnerHTML={{ __html: el.innerHTML }} />,
      children
    )
  }

  return (
    <>
      <span hidden aria-hidden="true">{node.textContent}</span>
      {children}
    </>
  )
}

export { Behavior }
