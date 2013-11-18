#!/bin/sh

# generate compressed keepright-min.js from keepright.js
#
# requires uglifyjs2. install with:
# npm install -g uglify-js
#
# usage: ./uglify.sh
#
# while developing, it may be useful to generate a source map for
# use with browser dev consoles. to do that, run:
# ./uglify.sh --source-map keepright-min.js.map

PREAMBLE=`cat <<END
// this file includes derived classes from various libraries
// find the readable version of this file in the keepright svn repository
// JS code compressed by UglifyJS http://lisperator.net/uglifyjs/

/*
leaflet-hash
https://github.com/mlevans/leaflet-hash

Copyright (c) 2013 Michael Lawrence Evans

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
END
`
uglifyjs --mangle --preamble "$PREAMBLE" -o keepright-min.js "$@" -- leaflet-hash.js keepright.js
