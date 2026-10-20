#!/bin/bash
# Tour de Israel demo – start a local server and open the browser (Linux)
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  python3 serve.py
else
  xdg-open index.html
fi
