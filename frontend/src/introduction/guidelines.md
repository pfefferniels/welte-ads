---
path: "/guidelines"
---

## Guidelines
Parts of an advertisement that are concerning other products
than Welte-Mignon reproducing pianos are not transcribed but 
instead marked with the `gap` element. It should contain a
`<desc>` element which shortly describes the left-out parts, e.g.

```
  <gap reason="irrelevant">
      <desc resp="#np">
          The ad also includes textes for "Pathe",
          "Pianos and Player-Pianos" and
          "Victor Victrolas and Victor Records".
      </desc>
  </gap>
```

