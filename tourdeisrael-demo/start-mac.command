#!/bin/bash
# Tour de Israel demo – double-click to start (macOS)
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  python3 serve.py
else
  open index.html
fi
