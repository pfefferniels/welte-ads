# Welte Ads

A TEI collection of Welte advertisements.

Live at https://anz.welte225.org/.

## Data

Every advertisement is a TEI file in `tei/`, valid against `tei_all`
(P5 4.12.0, linked from each file). Each file explains its own markup: its
`<encodingDesc>` holds the project description, the editorial principles,
and the renditions (`@rendition`) and topics (`@ana`) that it uses. These
are copied from the shared encoding description in `tei/shared/encoding.xml`,
which is also where the site reads the topics from. After changing that file,
or after using a new rendition or topic in an advertisement, run
`npm run sync-tei` in `frontend/`; `npm test` fails until the files agree.

`npm run validate-tei` validates all files against their schema with
`xmllint`. On every push and pull request, GitHub Actions validates the TEI
and runs the type check, the linter, the tests and knip; `main` is deployed
only when they pass.

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
