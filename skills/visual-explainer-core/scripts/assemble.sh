#!/usr/bin/env bash
# assemble.sh — splice the locked core (core.css/core.js) into a marker-based
# explainer draft, producing one self-contained HTML file.
#
# The draft must contain the two marker lines (anywhere, any indent):
#     <!-- @core:css -->      → replaced with <style> … core.css … </style>
#     <!-- @core:js -->       → replaced with <script> … core.js … </script>
#
# Zero install: uses only awk + coreutils, present on macOS & Linux.
# Usage: bash assemble.sh <draft-with-markers.html> <output.html>
set -euo pipefail

src=${1:?usage: bash assemble.sh <draft.html> <output.html>}
out=${2:?usage: bash assemble.sh <draft.html> <output.html>}
dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
css="$dir/../assets/core.css"
js="$dir/../assets/core.js"

for f in "$src" "$css" "$js"; do
  [ -r "$f" ] || { echo "assemble: cannot read $f" >&2; exit 1; }
done

awk -v cssfile="$css" -v jsfile="$js" '
  index($0, "<!-- @core:css -->") {
    print "  <style>"
    while ((getline line < cssfile) > 0) print line
    close(cssfile); print "  </style>"; css_done = 1; next
  }
  index($0, "<!-- @core:js -->") {
    print "  <script>"
    while ((getline line < jsfile) > 0) print line
    close(jsfile); print "  </script>"; js_done = 1; next
  }
  { print }
  END {
    if (!css_done || !js_done) {
      print "assemble: a <!-- @core:* --> marker is missing from the template" > "/dev/stderr"
      exit 2
    }
  }
' "$src" > "$out.tmp"
mv "$out.tmp" "$out"

grep -q "{{" "$out" && echo "assemble: warning — unfilled {{...}} placeholders remain in $out" >&2
echo "assembled → $out"
