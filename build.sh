#!/bin/sh

rm ./build/_bundle.js

esbuild --bundle mapgen4.js --minify --outfile=build/_bundle.js || sleep 1h