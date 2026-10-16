#!/bin/sh
# Validates the TEI files against the schema that they name in their
# xml-model processing instruction (tei_all of a fixed TEI P5 release).
# The schema is downloaded once into frontend/.cache. Needs xmllint.
set -e
cd "$(dirname "$0")/../.."

url=$(sed -n 's/.*<?xml-model href="\([^"]*\)".*/\1/p' tei/shared/encoding.xml | head -n 1)
[ -n "$url" ] || { echo "tei/shared/encoding.xml names no schema" >&2; exit 1; }

# every file must name the same schema
for file in tei/*.xml; do
  grep -qF "<?xml-model href=\"$url\"" "$file" || { echo "$file does not name $url" >&2; exit 1; }
done

cache=frontend/.cache
schema="$cache/$(echo "$url" | sed 's|^https\?://||; s|[/:]|_|g')"
mkdir -p "$cache"
[ -s "$schema" ] || curl -sSfL --retry 3 -o "$schema" "$url"

xmllint --noout --relaxng "$schema" tei/*.xml tei/shared/*.xml
