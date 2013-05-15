#!/bin/bash
rm -rf dist
mkdir dist
cp -r ../../packages dist
r.js -o app.build.js skipDirOptimize=true
