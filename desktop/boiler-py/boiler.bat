@echo off
rem Opens the Dolphin boiler window. Double-click this file.
cd /d "%~dp0"
where py >nul 2>nul && (set PY=py -3) || (set PY=python)
%PY% -c "import keyring" 2>nul || %PY% -m pip install --user --quiet -r requirements.txt
%PY% -m dolphin_boiler %*
if errorlevel 1 pause
