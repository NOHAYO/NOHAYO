#!/bin/bash
# Tour de Israel demo – double-click to start (macOS)
cd "$(dirname "$0")"
# /usr/bin/python3 is only a stub until Apple's Command Line Tools are installed,
# so use Python only when it really works; otherwise open the site straight from the folder.
PY="$(command -v python3)"
if [ -n "$PY" ] && { [ "$PY" != "/usr/bin/python3" ] || xcode-select -p >/dev/null 2>&1; }; then
  "$PY" serve.py
else
  open index.html
fi
