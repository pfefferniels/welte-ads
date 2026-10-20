#!/bin/sh
# Generates the RELAX NG schema tei/schema/welte-ads.rng from the project ODD
# tei/schema/welte-ads.odd with the TEI Stylesheets: odd2odd compiles the ODD
# against the TEI P5 source of the release that its <schemaSpec> names
# (source="tei:4.12.0"), odd2relax turns the result into RELAX NG, and
# simplify-rng.xsl removes patterns that xmllint cannot cope with (see there).
#
# The Stylesheets, Saxon-HE and the TEI source (p5subset.xml) are downloaded
# once into frontend/.cache/schema. Needs java, curl and unzip.
#
#   npm run build-schema   writes tei/schema/welte-ads.rng
#   npm run check-schema   fails if the committed schema is not the one that
#                          the ODD gives (not run in CI, as it needs Java)
set -e
cd "$(dirname "$0")/../.."

# the Stylesheets released with TEI P5 4.12.0, and the Saxon version they use
STYLESHEETS=7.61.0
STYLESHEETS_SHA256=1a6cd1043af5adb3c5a8c1b2ec0b6abb7d0f241cd8725e233d691b3ca2f312bf
SAXON=10.9
SAXON_SHA256=491d8edf4ec811d15c2b2417b007218b9b938f15e4dfbad004025beb4e70e960

odd=tei/schema/welte-ads.odd
rng=tei/schema/welte-ads.rng

release=$(sed -n 's/.*<schemaSpec[^>]* source="tei:\([0-9.]*\)".*/\1/p' "$odd")
[ -n "$release" ] || { echo "$odd names no TEI release in <schemaSpec source=\"tei:...\">" >&2; exit 1; }

cache=frontend/.cache/schema
mkdir -p "$cache"

sha256() {
  if command -v sha256sum > /dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d ' ' -f 1
}

# fetch URL FILE [SHA256]: downloads a file once, checking it if a sum is given
fetch() {
  [ -s "$2" ] && return
  mkdir -p "$(dirname "$2")"
  curl -sSfL --retry 5 --retry-delay 5 -o "$2.part" "$1"
  if [ -n "$3" ] && [ "$(sha256 "$2.part")" != "$3" ]; then
    rm -f "$2.part"
    echo "$1 does not have the expected checksum" >&2
    exit 1
  fi
  mv "$2.part" "$2"
}

saxon="$cache/Saxon-HE-$SAXON.jar"
fetch "https://repo1.maven.org/maven2/net/sf/saxon/Saxon-HE/$SAXON/Saxon-HE-$SAXON.jar" "$saxon" "$SAXON_SHA256"

xsl="$cache/tei-xsl-$STYLESHEETS/xml/tei/stylesheet"
if [ ! -f "$xsl/VERSION" ]; then
  fetch "https://github.com/TEIC/Stylesheets/releases/download/v$STYLESHEETS/tei-xsl-$STYLESHEETS.zip" \
    "$cache/tei-xsl-$STYLESHEETS.zip" "$STYLESHEETS_SHA256"
  unzip -q -o "$cache/tei-xsl-$STYLESHEETS.zip" 'xml/*' -d "$cache/tei-xsl-$STYLESHEETS"
fi

# a copy of the TEI Vault for the release, where odd2odd finds "tei:$release"
vault="$cache/tei-p5"
fetch "https://www.tei-c.org/Vault/P5/$release/xml/tei/odd/p5subset.xml" "$vault/$release/xml/tei/odd/p5subset.xml"
server="file://$(cd "$vault" && pwd | sed 's/ /%20/g')/"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

java -jar "$saxon" -s:"$odd" -xsl:"$xsl/odds/odd2odd.xsl" -o:"$tmp/compiled.odd" \
  defaultTEIServer="$server"
# with a fixed date, the schema changes only when the ODD does
java -jar "$saxon" -s:"$tmp/compiled.odd" -xsl:"$xsl/profiles/default/rng/to.xsl" -o:"$tmp/odd2relax.rng" \
  useFixedDate=true
java -jar "$saxon" -s:"$tmp/odd2relax.rng" -xsl:frontend/scripts/simplify-rng.xsl -o:"$tmp/schema.rng"

if [ "$1" = "--check" ]; then
  if cmp -s "$tmp/schema.rng" "$rng"; then
    echo "$rng is the schema that $odd gives"
  else
    diff "$rng" "$tmp/schema.rng" | head -n 20 >&2
    echo "$rng is not the schema that $odd gives: run npm run build-schema" >&2
    exit 1
  fi
else
  cp "$tmp/schema.rng" "$rng"
  echo "Generated $rng from $odd (TEI P5 $release, TEI Stylesheets $STYLESHEETS)"
fi
