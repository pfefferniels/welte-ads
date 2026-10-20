# Welte-Mignon Advertisements Collection

A TEI edition of print advertisements for the Welte-Mignon reproducing
piano, 1905–1930, edited by Niels Pfeffer.

Live at https://anz.welte225.org/. The TEI files are published with the site
(https://anz.welte225.org/data/) under CC BY-NC-SA 4.0, the code under the
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

## Releases

The site always shows the current state of `main`. A numbered release fixes a
state that can be cited: set `version` and `date-released` in `CITATION.cff`,
commit, and push the tag `v<version>` (e.g. `git tag v1.0.0 && git push origin
v1.0.0`). The release workflow checks that the tag matches `CITATION.cff` and
publishes a GitHub release with the TEI files as a zip. If the repository is
connected to Zenodo, every release also gets a DOI there.
