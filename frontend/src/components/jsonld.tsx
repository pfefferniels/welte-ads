import React from "react"

/** Machine-readable metadata (schema.org) for search engines and
 * aggregators. */
const JsonLd = ({ data }: { data: object }) => (
  <script
    type="application/ld+json"
    // "<" is escaped so that no string can close the script element
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
  />
)

export default JsonLd
