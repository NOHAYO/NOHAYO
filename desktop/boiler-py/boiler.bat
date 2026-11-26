@echo off
rem Runs the Dolphin boiler app. Double-click to open the window,
rem or run "boiler.bat status" etc. from a command window (see README.md).
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo First run: setting up the app's Python environment ^(one time^)...
  py -3 -m venv .venv 2>nul || python -m venv .venv
)
if not exist ".venv\Scripts\python.exe" (
  echo Python 3 is not installed. Get it from https://www.python.org/downloads/
  pause
  exit /b 1
)
".venv\Scripts\python.exe" -c "import keyring" 2>nul || ".venv\Scripts\python.exe" -m pip install --quiet --disable-pip-version-check -r requirements.txt
".venv\Scripts\python.exe" -m dolphin_boiler %*
if errorlevel 1 pause
