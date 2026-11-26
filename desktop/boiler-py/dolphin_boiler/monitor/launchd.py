"""Run the monitor unattended on a Mac with launchd.

``monitor install`` writes ~/Library/LaunchAgents/com.nohayo.boiler-monitor.plist,
which runs ``monitor sample`` every 10 minutes while you're logged in (and
catches up after the Mac wakes from sleep). Output goes to
~/Library/Logs/boiler-monitor.log. ``monitor uninstall`` removes it.
"""

from __future__ import annotations

import os
import plistlib
import subprocess
import sys
from pathlib import Path

LABEL = "com.nohayo.boiler-monitor"


def plist_path() -> Path:
    return Path.home() / "Library" / "LaunchAgents" / f"{LABEL}.plist"


def log_path() -> Path:
    return Path.home() / "Library" / "Logs" / "boiler-monitor.log"


def build_plist(python: str, app_dir: str, interval_min: int) -> dict:
    env = {"PYTHONUNBUFFERED": "1"}
    for k in ("DOLPHIN_BOILER_HOME", "DOLPHIN_BASE_URL", "OPEN_METEO_URL"):
        if os.environ.get(k):
            env[k] = os.environ[k]
    return {
        "Label": LABEL,
        "ProgramArguments": [python, "-m", "dolphin_boiler", "monitor", "sample", "--quiet"],
        "WorkingDirectory": app_dir,
        "StartInterval": int(interval_min) * 60,
        "RunAtLoad": True,
        "ProcessType": "Background",
        "LowPriorityIO": True,
        "StandardOutPath": str(log_path()),
        "StandardErrorPath": str(log_path()),
        "EnvironmentVariables": env,
    }


def _launchctl(*args) -> subprocess.CompletedProcess:
    return subprocess.run(["launchctl", *args], capture_output=True, text=True)


def install(interval_min: int) -> str:
    if sys.platform != "darwin":
        raise SystemExit("`monitor install` sets up launchd, which is macOS only. Elsewhere use `monitor run`.")
    app_dir = str(Path(__file__).resolve().parents[2])
    p = plist_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    log_path().parent.mkdir(parents=True, exist_ok=True)
    uid = os.getuid()
    _launchctl("bootout", f"gui/{uid}/{LABEL}")  # replace an older copy; fine if none
    with open(p, "wb") as f:
        plistlib.dump(build_plist(sys.executable, app_dir, interval_min), f)
    r = _launchctl("bootstrap", f"gui/{uid}", str(p))
    if r.returncode != 0:
        r = _launchctl("load", "-w", str(p))
        if r.returncode != 0:
            raise SystemExit(f"launchctl couldn't load {p}: {r.stderr.strip()}")
    return str(p)


def uninstall() -> bool:
    p = plist_path()
    if sys.platform == "darwin":
        r = _launchctl("bootout", f"gui/{os.getuid()}/{LABEL}")
        if r.returncode != 0 and p.exists():
            _launchctl("unload", "-w", str(p))
    if p.exists():
        p.unlink()
        return True
    return False


def installed() -> bool:
    return plist_path().exists()
