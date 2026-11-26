#!/usr/bin/env bash
# Opens the Dolphin boiler window (Mac or Linux). Pass a command to use the
# command line instead, e.g. ./boiler.sh status
cd "$(dirname "$0")"
python3 -c "import keyring" 2>/dev/null || python3 -m pip install --user --quiet -r requirements.txt || true
exec python3 -m dolphin_boiler "$@"
