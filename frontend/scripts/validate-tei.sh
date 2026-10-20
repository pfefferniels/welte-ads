#!/bin/sh
# Validates the TEI files with xmllint: against the project schema
# (tei/schema/welte-ads.rng, generated from the ODD tei/schema/welte-ads.odd),
# which every file names in its xml-model processing instruction, and, to make
# sure that they remain conformant TEI, against tei_all of the TEI P5 release
# that the ODD is based on; the ODD itself is validated against tei_all too.
# Fails if a file is not valid against either schema. tei_all is downloaded
# once into frontend/.cache. Needs xmllint and curl.
set -e
cd "$(dirname "$0")/../.."

odd=tei/schema/welte-ads.odd
schema=tei/schema/welte-ads.rng
ads=$(ls tei/*.xml)
shared=$(ls tei/shared/*.xml)
status=0

# every file must name the project schema, by its path relative to the file
names() {
  grep -qF "<?xml-model href=\"$2\"" "$1" || {
    echo "$1 does not name $2 in its xml-model processing instruction" >&2
    status=1
  }
}
for file in $ads; do names "$file" schema/welte-ads.rng; done
for file in $shared; do names "$file" ../schema/welte-ads.rng; done

release=$(sed -n 's/.*<schemaSpec[^>]* source="tei:\([0-9.]*\)".*/\1/p' "$odd")
[ -n "$release" ] || { echo "$odd names no TEI release in <schemaSpec source=\"tei:...\">" >&2; exit 1; }
url="https://www.tei-c.org/Vault/P5/$release/xml/tei/custom/schema/relaxng/tei_all.rng"
cache=frontend/.cache
tei_all="$cache/$(echo "$url" | sed 's|^https\?://||; s|[/:]|_|g')"
mkdir -p "$cache"
[ -s "$tei_all" ] || curl -sSfL --retry 3 -o "$tei_all" "$url"

log=$(mktemp)
trap 'rm -f "$log"' EXIT

# validate NAME SCHEMA FILE...: reports only the files that are not valid
validate() {
  name=$1
  rng=$2
  shift 2
  if xmllint --noout --relaxng "$rng" "$@" 2> "$log"; then
    echo "All $# files are valid against $name"
  else
    grep -v ' validates$' "$log" >&2
    echo "Not all files are valid against $name" >&2
    status=1
  fi
}

# shellcheck disable=SC2086 # the file names hold no spaces
validate "the project schema $schema" "$schema" $ads $shared
# shellcheck disable=SC2086
validate "tei_all of TEI P5 $release" "$tei_all" $ads $shared "$odd"

exit $status
