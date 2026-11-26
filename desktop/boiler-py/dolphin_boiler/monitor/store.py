"""The monitor's log: one SQLite file (monitor.db) next to the app settings.

Table ``samples`` holds one row per sample (every 10 minutes): when it was
taken, in UTC and Israel time, what the boiler reported, and the weather.
Table ``alerts`` remembers which maintenance alerts were raised, so each is
announced once. Use ``export_csv`` (``monitor export``) for a spreadsheet.
"""

from __future__ import annotations

import csv
import json
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

SAMPLE_COLUMNS = [
    # time
    ("ts_utc", "TEXT NOT NULL"),       # ISO 8601, UTC, e.g. 2026-11-26T07:50:00+00:00
    ("ts_local", "TEXT NOT NULL"),     # same moment in Israel time, with offset
    # boiler
    ("boiler_ok", "INTEGER NOT NULL"), # 1 if Dolphin answered
    ("water_c", "REAL"),
    ("target_c", "REAL"),
    ("heating", "INTEGER"),            # 1 while the element is on
    ("shabbat", "INTEGER"),
    ("power_w", "REAL"),               # from Dolphin's meter (PowerW), if present
    ("total_energy_wh", "REAL"),       # Dolphin's energy counter (TotalEnergyWh), if present
    ("current_a", "REAL"),             # power / mains volts
    ("power_source", "TEXT"),          # 'meter' or 'estimate' (element rating)
    # weather
    ("weather_ok", "INTEGER NOT NULL"),
    ("air_c", "REAL"),
    ("humidity_pct", "REAL"),
    ("precipitation_mm", "REAL"),
    ("rain_mm", "REAL"),
    ("cloud_pct", "REAL"),
    ("uv_index", "REAL"),
    ("solar_wm2", "REAL"),
    ("wind_kmh", "REAL"),
    ("is_day", "INTEGER"),
    ("weather_code", "INTEGER"),
    # diagnostics
    ("error", "TEXT"),
    ("raw_boiler", "TEXT"),            # Dolphin's reply as JSON (no secrets in it)
]


@dataclass
class Sample:
    ts_utc: str
    ts_local: str
    boiler_ok: int = 0
    water_c: float | None = None
    target_c: float | None = None
    heating: int | None = None
    shabbat: int | None = None
    power_w: float | None = None
    total_energy_wh: float | None = None
    current_a: float | None = None
    power_source: str | None = None
    weather_ok: int = 0
    air_c: float | None = None
    humidity_pct: float | None = None
    precipitation_mm: float | None = None
    rain_mm: float | None = None
    cloud_pct: float | None = None
    uv_index: float | None = None
    solar_wm2: float | None = None
    wind_kmh: float | None = None
    is_day: int | None = None
    weather_code: int | None = None
    error: str | None = None
    raw_boiler: str | None = field(default=None, repr=False)

    @property
    def time(self) -> datetime:
        return datetime.fromisoformat(self.ts_utc)

    @property
    def raw(self) -> dict:
        try:
            return json.loads(self.raw_boiler) if self.raw_boiler else {}
        except ValueError:
            return {}


class Store:
    def __init__(self, path: "Path | str"):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(str(self.path), timeout=30)
        self.db.row_factory = sqlite3.Row
        cols = ", ".join(f"{n} {t}" for n, t in SAMPLE_COLUMNS)
        self.db.executescript(f"""
            CREATE TABLE IF NOT EXISTS samples (id INTEGER PRIMARY KEY, {cols});
            CREATE INDEX IF NOT EXISTS samples_ts ON samples(ts_utc);
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY,
                key TEXT NOT NULL UNIQUE,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                first_seen_utc TEXT NOT NULL,
                last_seen_utc TEXT NOT NULL,
                cleared_utc TEXT
            );
        """)
        # Older logs: add any column that's new since.
        have = {r["name"] for r in self.db.execute("PRAGMA table_info(samples)")}
        for n, t in SAMPLE_COLUMNS:
            if n not in have:
                self.db.execute(f"ALTER TABLE samples ADD COLUMN {n} {t.replace(' NOT NULL', '')}")
        self.db.commit()

    def close(self):
        self.db.close()

    # --- samples ---------------------------------------------------------

    def add(self, s: Sample) -> None:
        names = [n for n, _ in SAMPLE_COLUMNS]
        self.db.execute(
            f"INSERT INTO samples ({', '.join(names)}) VALUES ({', '.join('?' * len(names))})",
            [getattr(s, n) for n in names],
        )
        self.db.commit()

    def samples(self, since: datetime | None = None) -> list[Sample]:
        names = [n for n, _ in SAMPLE_COLUMNS]
        q = f"SELECT {', '.join(names)} FROM samples"
        args: list = []
        if since:
            q += " WHERE ts_utc >= ?"
            args.append(since.astimezone(timezone.utc).isoformat(timespec="seconds"))
        q += " ORDER BY ts_utc"
        return [Sample(**dict(r)) for r in self.db.execute(q, args)]

    def count(self) -> int:
        return self.db.execute("SELECT COUNT(*) FROM samples").fetchone()[0]

    def last(self) -> Sample | None:
        names = [n for n, _ in SAMPLE_COLUMNS]
        r = self.db.execute(f"SELECT {', '.join(names)} FROM samples ORDER BY ts_utc DESC LIMIT 1").fetchone()
        return Sample(**dict(r)) if r else None

    def export_csv(self, out: "Path | str") -> int:
        names = [n for n, _ in SAMPLE_COLUMNS if n != "raw_boiler"]
        rows = self.db.execute(f"SELECT {', '.join(names)} FROM samples ORDER BY ts_utc").fetchall()
        with open(out, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(names)
            w.writerows([tuple(r) for r in rows])
        return len(rows)

    # --- alerts ----------------------------------------------------------

    def raise_alert(self, key: str, level: str, message: str, now: datetime) -> bool:
        """Record an alert. True when it's new (or came back after clearing), i.e. worth announcing."""
        ts = now.astimezone(timezone.utc).isoformat(timespec="seconds")
        r = self.db.execute("SELECT cleared_utc FROM alerts WHERE key = ?", (key,)).fetchone()
        if r is None:
            self.db.execute(
                "INSERT INTO alerts (key, level, message, first_seen_utc, last_seen_utc) VALUES (?, ?, ?, ?, ?)",
                (key, level, message, ts, ts),
            )
            fresh = True
        else:
            fresh = r["cleared_utc"] is not None
            self.db.execute(
                "UPDATE alerts SET level = ?, message = ?, last_seen_utc = ?, cleared_utc = NULL"
                + (", first_seen_utc = ?" if fresh else "") + " WHERE key = ?",
                (level, message, ts, ts, key) if fresh else (level, message, ts, key),
            )
        self.db.commit()
        return fresh

    def clear_alerts_except(self, keys: set[str], now: datetime) -> None:
        ts = now.astimezone(timezone.utc).isoformat(timespec="seconds")
        for r in self.db.execute("SELECT key FROM alerts WHERE cleared_utc IS NULL").fetchall():
            if r["key"] not in keys:
                self.db.execute("UPDATE alerts SET cleared_utc = ? WHERE key = ?", (ts, r["key"]))
        self.db.commit()

    def open_alerts(self) -> list[sqlite3.Row]:
        return self.db.execute(
            "SELECT * FROM alerts WHERE cleared_utc IS NULL ORDER BY level DESC, first_seen_utc"
        ).fetchall()
