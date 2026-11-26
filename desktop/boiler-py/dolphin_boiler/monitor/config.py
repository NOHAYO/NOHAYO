"""Monitor settings, kept in monitor.json next to the app's other settings.

Nothing secret lives here. The defaults describe Shimon's boiler: a 150 L
vertical tank with solar panels and an electric (turbo) element on 220 VAC,
at Revivim 78, Rosh HaAyin.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, fields
from pathlib import Path

from ..credentials import config_dir


@dataclass
class MonitorConfig:
    # Where the boiler is, for the weather. Rosh HaAyin; the weather model's
    # grid is about 1-2 km, so the town is close enough for the street.
    place: str = "Revivim 78, Rosh HaAyin, Israel"
    latitude: float = 32.0956
    longitude: float = 34.9567
    timezone: str = "Asia/Jerusalem"
    # The tank.
    tank_litres: float = 150.0
    # The heating element, used only when Dolphin doesn't report power.
    # Most Israeli 150 L boilers have a 2.5 kW element; check the label.
    element_watts: float = 2500.0
    mains_volts: float = 220.0
    # How often to sample, in minutes.
    interval_min: int = 10

    @property
    def heat_capacity_kwh_per_k(self) -> float:
        """Energy to warm the whole tank by 1 °C: m * c, with c = 4.186 kJ/(kg K)."""
        return self.tank_litres * 0.99 * 4.186 / 3600.0  # 0.99 kg/L for warm water

    @staticmethod
    def path() -> Path:
        return config_dir() / "monitor.json"

    @classmethod
    def load(cls) -> "MonitorConfig":
        try:
            data = json.loads(cls.path().read_text("utf-8"))
        except (OSError, ValueError):
            data = {}
        known = {f.name: f.type for f in fields(cls)}
        cfg = cls()
        for k, v in (data if isinstance(data, dict) else {}).items():
            if k in known and v is not None:
                setattr(cfg, k, type(getattr(cfg, k))(v))
        return cfg

    def save(self) -> None:
        p = self.path()
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(asdict(self), indent=2), "utf-8")


def db_path() -> Path:
    return config_dir() / "monitor.db"
