#!/bin/bash
# Build the live page's generated files into <out> (default: this directory).
#  1. VocalTractLab 2.4.2 from the vocaltractlab-cython 0.0.17 sdist on PyPI, with
#     vocaltractlab.patch applied, to WebAssembly (Emscripten 3.1.6): vtl.js
#  2. espressivo 0.11 bundled for a worker (esbuild): espressivo.js
#  3. data/ and piano/ come from prep_static.py (needs the offline pipeline's files)
set -e
HERE=$(cd "$(dirname "$0")" && pwd); OUT=${1:-$HERE}; T=$(mktemp -d)
curl -sS -o $T/vtl.tar.gz https://files.pythonhosted.org/packages/d6/18/3f386515b95e09cb7d15643157ba334d57effd88f1835769026f089a3386/vocaltractlab_cython-0.0.17.tar.gz
tar xzf $T/vtl.tar.gz -C $T
B=$T/vocaltractlab_cython-0.0.17/VocalTractLabBackend-dev
(cd $B && patch -p1 < $HERE/vocaltractlab.patch)
EXPORTS='["_vtlInitialize","_vtlClose","_vtlGetVersion","_vtlGetConstants","_vtlSynthesisReset","_vtlSynthesisAddTube","_vtlFastTractToTube","_vtlGesturalScoreToStates","_malloc","_free"]'
mkdir -p $T/obj && cd $T/obj
ls $B/src/VocalTractLabBackend/*.cpp $B/src/VocalTractLabApi/VocalTractLabApi.cpp | xargs -P 4 -I{} sh -c \
  "em++ -O3 -msimd128 -flto -std=c++17 -D_USE_MATH_DEFINES -I$B/include -I$B/include/VocalTractLabApi -c {} -o \$(basename {} .cpp).o 2>/dev/null"
em++ *.o -O3 -msimd128 -flto -sMODULARIZE=1 -sALLOW_MEMORY_GROWTH=1 -sENVIRONMENT=web,worker,node -sFILESYSTEM=1 -sSINGLE_FILE=1 \
  -sEXPORTED_FUNCTIONS=$EXPORTS '-sEXPORTED_RUNTIME_METHODS=["FS","ccall","getValue"]' -sEXPORT_NAME=createVTL -o $OUT/vtl.js
cd $T && npm init -y >/dev/null && npm install --silent espressivo@0.11.0 esbuild@0.24.2
echo "export { exaggerateMpm, weightedFactors, performMsmToData } from 'espressivo';" > entry.mjs
npx esbuild entry.mjs --bundle --format=iife --global-name=espressivo --platform=browser --minify --target=es2020 --outfile=$OUT/espressivo.js
rm -rf $T; ls -la $OUT/vtl.js $OUT/espressivo.js
