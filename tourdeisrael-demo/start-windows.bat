@echo off
rem Tour de Israel demo - double-click to start (Windows)
cd /d "%~dp0"
where py >nul 2>nul && (py serve.py & goto :eof)
where python >nul 2>nul && (python serve.py & goto :eof)
rem No Python installed: open the site directly from the folder (works too)
start "" "index.html"
