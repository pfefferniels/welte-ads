# Welte-Mignon Advertisements Collection

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23496355.svg)](https://doi.org/10.5281/zenodo.23496355)

A TEI edition of print advertisements for the Welte-Mignon reproducing
piano, 1905–1930, edited by Niels Pfeffer.

Live at https://anz.welte225.org/. The TEI files are published with the site
(https://anz.welte225.org/data/) under CC BY 4.0, the code under the
MIT License; see `LICENSE.md`.

## Data

Every advertisement is a TEI file in `tei/`. The files follow the project
schema `tei/schema/welte-ads.rng`, which is generated from the ODD
`tei/schema/welte-ads.odd`: a customisation of TEI P5 4.12.0 that admits
only the elements the collection uses, closes the lists of values it uses
and documents what it means by them. Each file names the schema in its
`xml-model` processing instruction and the ODD in its `<schemaRef>`; the
files are also valid against `tei_all` of the same release. Each file
explains its own markup: its `<encodingDesc>` holds the project description,
the editorial principles, the reference to the ODD, and the renditions
(`@rendition`) and topics (`@ana`) that it uses. These are copied from the
shared encoding description in `tei/shared/encoding.xml`, which is also
where the site reads the topics from. After changing that file, or after
using a new rendition or topic in an advertisement, run `npm run sync-tei`
in `frontend/`; `npm test` fails until the files agree.

`npm run validate-tei` validates all files with `xmllint`, against the
project schema and against `tei_all`. After changing the ODD, run
`npm run build-schema` to regenerate the schema with the TEI Stylesheets
(this needs Java; the Stylesheets and Saxon are downloaded into
`frontend/.cache/`) and commit both; `npm run check-schema` tells whether
they agree. `npm run survey-tei` lists the elements, attributes and values
that the files use. On every push and pull request, GitHub Actions validates
the TEI and runs the type check, the linter, the tests and knip; `main` is
deployed only when they pass.

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

## Narratives

The timelines of the places map and of the artists cloud tell a story in
chapters. Each chapter is a Markdown file in
`frontend/src/narratives/places/` or `frontend/src/narratives/artists/`,
named after its first year (e.g. `1915-the-war.md`). Its front matter gives
the years it covers (`from`, `to`), its `title`, its `caption` (one sentence
of at most 15 words, shown on a card while the timeline plays through the
chapter), its `focus` (the places by their GeoNames URI, the artists by
their GND URI), the `ads` that show it (by slug) and, where the text
explains, its `sources` (`title` and `url`). The text below the front
matter is the chapter in full, listed under the picture; the figures under
it are computed. `npm test` fails when chapters overlap, lie outside the
timeline, lack a caption or have a longer one, or name an ad, place, artist
or topic that the collection does not have.

## Releases

The site always shows the current state of `main`. A numbered release fixes a
state that can be cited: set `version` and `date-released` in `CITATION.cff`,
commit to `main`, and either run the Release workflow from the Actions tab,
which tags the commit itself, or push the tag `v<version>` (e.g. `git tag
v1.0.0 && git push origin v1.0.0`; the workflow then checks that it matches
`CITATION.cff`). It publishes a GitHub release with the TEI files as a zip. The repository is
connected to Zenodo, which archives every release and gives it a DOI; the
metadata of the Zenodo record come from `.zenodo.json`.
