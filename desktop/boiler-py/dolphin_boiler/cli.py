"""Command line for the boiler app.

    python -m dolphin_boiler login            sign in (asks for email and password)
    python -m dolphin_boiler status           water temperature and heating state
    python -m dolphin_boiler heat 40          heat now until 40 °C
    python -m dolphin_boiler showers 2        heat enough water for 2 showers
    python -m dolphin_boiler shabbat on|off
    python -m dolphin_boiler stop             stop heating
    python -m dolphin_boiler devices          list boilers / pick one with --device
    python -m dolphin_boiler logout           forget the saved sign-in

The password is typed at a hidden prompt, never on the command line.
"""

from __future__ import annotations

import argparse
import getpass
import os
import sys

from .boiler import Boiler
from .client import DEFAULT_BASE_URL, DolphinError, Status


def format_status(device: str | None, s: Status) -> str:
    lines = [device or "Boiler"]
    lines.append(f"  water        {fmt(s.temperature)} °C")
    lines.append(f"  heating      {'ON, to ' + fmt(s.target_temperature) + ' °C' if s.power else 'off'}")
    lines.append(f"  shabbat      {'on' if s.shabbat else 'off'}")
    lines.append(f"  fixed temp   {'on' if s.fixed_temperature else 'off'}")
    for sh in s.showers:
        ready = "  ready" if s.ready_for(sh.count) else ""
        plural = "s" if sh.count > 1 else " "
        lines.append(f"  {sh.count} shower{plural}    needs {fmt(sh.temperature)} °C{ready}")
    return "\n".join(lines)


def fmt(v) -> str:
    if v is None:
        return "?"
    return str(int(v)) if float(v).is_integer() else f"{v:.1f}"


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="dolphin_boiler", description="Control a Dolphin smart boiler.")
    p.add_argument("--device", help="boiler name (default: the one you used last, or your first boiler)")
    sub = p.add_subparsers(dest="cmd", required=True)
    login = sub.add_parser("login", help="sign in with your Dolphin email and password")
    login.add_argument("--email", help="Dolphin email (asked if left out)")
    sub.add_parser("logout", help="forget the saved sign-in")
    sub.add_parser("devices", help="list your boilers")
    sub.add_parser("status", help="water temperature and heating state")
    heat = sub.add_parser("heat", help="heat now until a temperature")
    heat.add_argument("temperature", type=int)
    showers = sub.add_parser("showers", help="heat enough water for 1-4 showers")
    showers.add_argument("count", type=int, choices=[1, 2, 3, 4])
    shabbat = sub.add_parser("shabbat", help="turn Shabbat mode on or off")
    shabbat.add_argument("state", choices=["on", "off"])
    sub.add_parser("stop", help="stop heating")
    sub.add_parser("gui", help="open the window")
    return p


def open_window() -> int:
    try:
        import tkinter  # noqa: F401
    except ImportError:
        print("This Python has no window support (tkinter).", file=sys.stderr)
        if sys.platform == "darwin":
            v = f"{sys.version_info.major}.{sys.version_info.minor}"
            print(f"On a Mac with Homebrew, install it with:  brew install python-tk@{v}", file=sys.stderr)
            print("then delete the .venv folder here and run ./boiler.sh again.", file=sys.stderr)
        else:
            print("On Linux, install your distribution's python3-tk package.", file=sys.stderr)
        print("The command line still works, e.g. ./boiler.sh status", file=sys.stderr)
        return 1
    from .gui import run

    run()
    return 0


def main(argv: list[str] | None = None, boiler: Boiler | None = None, password_prompt=getpass.getpass) -> int:
    args = build_parser().parse_args(argv)
    if args.cmd == "gui":
        return open_window()

    b = boiler or Boiler()
    base = os.environ.get("DOLPHIN_BASE_URL")
    if base:
        print(f"(using {base})", file=sys.stderr)
    if args.device:
        b.choose_device(args.device)

    try:
        if args.cmd == "login":
            email = args.email or input(f"Dolphin email{' [' + b.email + ']' if b.email else ''}: ").strip() or b.email or ""
            password = password_prompt("Dolphin password (not saved): ")
            devices = b.sign_in(email, password)
            print(f"Signed in as {b.email}. Boiler: {b.device}")
            if len(devices) > 1:
                print("Other boilers on this account: " + ", ".join(d for d in devices if d != b.device))
            if not b.store.persistent:
                print(
                    "Note: the keyring package isn't available, so this sign-in only lasts for this one command.\n"
                    "Use ./boiler.sh (Mac) or boiler.bat (Windows), which install it for you.",
                    file=sys.stderr,
                )
            return 0
        if args.cmd == "logout":
            b.sign_out()
            print("Signed out. The saved sign-in was removed.")
            return 0
        if args.cmd == "devices":
            for d in b.devices():
                print(("* " if d == b.device else "  ") + d)
            return 0
        if args.cmd == "status":
            print(format_status(b.device, b.status()))
        elif args.cmd == "heat":
            print(format_status(b.device, b.heat_to(args.temperature)))
        elif args.cmd == "showers":
            s, started = b.heat_for_showers(args.count)
            print("Heating started." if started else "Already hot enough, not heating.")
            print(format_status(b.device, s))
        elif args.cmd == "shabbat":
            print(format_status(b.device, b.set_shabbat(args.state == "on")))
        elif args.cmd == "stop":
            s = b.stop()
            print("Stop sent.")
            if s:
                print(format_status(b.device, s))
            else:
                print("(Could not read the status afterwards. Run `status` to check.)")
        return 0
    except DolphinError as e:
        print(f"Error: {e}", file=sys.stderr)
        if e.code == "unauthorized":
            print("Run: python -m dolphin_boiler login", file=sys.stderr)
        return 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
