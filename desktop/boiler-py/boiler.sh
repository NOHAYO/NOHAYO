#!/usr/bin/env bash
# Runs the Dolphin boiler app (Mac or Linux).
#   ./boiler.sh            open the window
#   ./boiler.sh status     use the command line (see README.md)
#
# The first run makes a private Python environment in .venv inside this
# folder and installs `keyring` there, so your Mac Keychain can keep you
# signed in. Nothing is installed system-wide.
set -e
cd "$(dirname "$0")"

PY=python3
command -v "$PY" >/dev/null 2>&1 || { echo "Python 3 isn't installed. Get it from https://www.python.org/downloads/"; exit 1; }

if [ ! -x .venv/bin/python ]; then
  echo "First run: setting up the app's Python environment (one time)…" >&2
  "$PY" -m venv .venv
fi
if ! .venv/bin/python -c "import keyring" >/dev/null 2>&1; then
  .venv/bin/python -m pip install --quiet --disable-pip-version-check -r requirements.txt \
    || echo "Couldn't install keyring; you'll need to sign in each time." >&2
fi

exec .venv/bin/python -m dolphin_boiler "$@"
