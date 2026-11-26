"""``monitor`` commands.

    monitor sample        take one sample now and check for alerts (what launchd runs)
    monitor run           keep sampling every 10 minutes (for a terminal, or non-Mac)
    monitor install       run unattended on this Mac (launchd), every 10 minutes
    monitor uninstall     stop that
    monitor report        text summary: cycles, efficiency, trends, alerts
    monitor chart         write an HTML page with charts and open it
    monitor export FILE   write all samples to a CSV file
    monitor config        show or change settings (tank size, element watts, location)
"""

from __future__ import annotations

import argparse
import sys
import time
import webbrowser
from datetime import datetime, timezone
from pathlib import Path

from ..boiler import Boiler
from ..credentials import config_dir
from . import alerts as alerts_mod
from . import launchd
from .analysis import analyse
from .collector import describe, take_sample
from .config import MonitorConfig, db_path
from .report import html_report, text_report
from .store import Store


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="dolphin_boiler monitor", description="Log and analyse the boiler.")
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("sample", help="take one sample now")
    s.add_argument("--quiet", action="store_true", help="one line of output (for the log)")
    r = sub.add_parser("run", help="sample every N minutes until stopped")
    r.add_argument("--interval", type=float, help="minutes between samples (default from config: 10)")
    sub.add_parser("install", help="run unattended on this Mac (launchd)")
    sub.add_parser("uninstall", help="remove the launchd job")
    rep = sub.add_parser("report", help="text summary")
    rep.add_argument("--days", type=float, help="only the last N days")
    ch = sub.add_parser("chart", help="HTML page with charts")
    ch.add_argument("--days", type=float, default=7, help="days in the temperature chart (default 7)")
    ch.add_argument("--out", help="where to write it (default: next to the log)")
    ch.add_argument("--no-open", action="store_true")
    ex = sub.add_parser("export", help="write samples to CSV")
    ex.add_argument("file")
    c = sub.add_parser("config", help="show or change settings")
    for name, kind, desc in (
        ("tank-litres", float, "tank size"), ("element-watts", float, "element rating, used when Dolphin reports no power"),
        ("mains-volts", float, "mains voltage"), ("latitude", float, ""), ("longitude", float, ""),
        ("place", str, "label for the location"), ("interval-min", int, "minutes between samples"),
    ):
        c.add_argument(f"--{name}", type=kind, help=desc or None)
    return p


def _since(days):
    if not days:
        return None
    from datetime import timedelta

    return datetime.now(timezone.utc) - timedelta(days=days)


def run_checks(store: Store, cfg: MonitorConfig, now: datetime, announce=True) -> list[alerts_mod.Alert]:
    from datetime import timedelta

    a = analyse(store.samples(since=now - timedelta(days=400)), cfg)
    found = alerts_mod.check(a, now)
    for al in found:
        if store.raise_alert(al.key, al.level, al.message, now) and announce:
            print(f"ALERT [{al.level}] {al.message}")
            alerts_mod.notify(al)
    store.clear_alerts_except({al.key for al in found}, now)
    return found


def sample_once(boiler: Boiler, cfg: MonitorConfig, store: Store, quiet=False, now=None) -> int:
    s = take_sample(boiler, cfg, store, now=now)
    print(describe(s))
    if not quiet and s.boiler_ok and s.power_source == "estimate" and s.heating:
        print(f"  (Dolphin sent no power reading; {cfg.element_watts:.0f} W is the element rating from `monitor config`.)")
    run_checks(store, cfg, s.time)
    return 0 if (s.boiler_ok or s.weather_ok) else 1


def main(argv: list[str], boiler: Boiler | None = None, store: Store | None = None) -> int:
    args = build_parser().parse_args(argv)
    cfg = MonitorConfig.load()

    if args.cmd == "config":
        changed = False
        for k, v in vars(args).items():
            if k != "cmd" and v is not None:
                setattr(cfg, k.replace("-", "_"), v)
                changed = True
        if changed:
            cfg.save()
        for k, v in vars(cfg).items():
            print(f"  {k:<14} {v}")
        print(f"  (settings: {MonitorConfig.path()}, log: {db_path()})")
        return 0

    if args.cmd == "install":
        p = launchd.install(cfg.interval_min)
        print(f"Installed. The monitor samples every {cfg.interval_min} minutes while you're logged in.")
        print(f"  job: {p}\n  output: {launchd.log_path()}\n  data: {db_path()}")
        print("If macOS asks whether Python may use your keychain, choose Always Allow.")
        return 0
    if args.cmd == "uninstall":
        print("Removed the monitor job." if launchd.uninstall() else "The monitor job wasn't installed.")
        print(f"Your data is still in {db_path()}.")
        return 0

    store = store or Store(db_path())
    if args.cmd == "export":
        n = store.export_csv(args.file)
        print(f"Wrote {n} samples to {args.file}")
        return 0
    if args.cmd in ("report", "chart"):
        a = analyse(store.samples(since=_since(getattr(args, "days", None) if args.cmd == "report" else None)), cfg)
        found = alerts_mod.check(a)
        if args.cmd == "report":
            print(text_report(a, cfg, found))
            return 0
        out = Path(args.out) if args.out else config_dir() / "boiler-monitor.html"
        out.write_text(html_report(a, cfg, found, days=args.days), "utf-8")
        print(f"Wrote {out}")
        if not args.no_open:
            webbrowser.open(out.resolve().as_uri())
        return 0

    boiler = boiler or Boiler()
    if not boiler.signed_in:
        print("Not signed in to Dolphin; logging the weather only. Run: ./boiler.sh login", file=sys.stderr)
    if args.cmd == "sample":
        return sample_once(boiler, cfg, store, quiet=args.quiet)
    if args.cmd == "run":
        every = 60 * (args.interval or cfg.interval_min)
        print(f"Sampling every {every / 60:g} minutes. Ctrl+C to stop.")
        try:
            while True:
                t0 = time.monotonic()
                sample_once(boiler, cfg, store, quiet=True)
                time.sleep(max(1.0, every - (time.monotonic() - t0)))
        except KeyboardInterrupt:
            return 0
    return 0
