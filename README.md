# Welte Ads

A TEI collection of Welte advertisements.

Live at https://anz.welte225.org/.

## Layout view

Each ad page has a layout view that places the text of every
`<div facs="#zone">` into the bounding box of its zone and scales the text
to fill it, using the encoded `<lb/>`s as line breaks. The page is cropped to
the area the zones cover.

To check an encoding against its original, save the scan as
`frontend/public/facs/<ad>-<surface>.png` (e.g. `ad009-0.png`), sized
exactly like the `<graphic>` (`width` × `height`, the coordinate system of the
zones), and open the page with `?debug` (`npm run dev`, then
`http://localhost:3000/ad009/?debug`). This outlines the zones over the scan;
`?debug=facs` shows only the scan. `frontend/public` is not committed.
