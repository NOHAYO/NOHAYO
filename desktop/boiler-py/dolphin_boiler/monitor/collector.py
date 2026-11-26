"""Take one sample: read the boiler and the weather, and store both.

The boiler and the weather are read independently, so a Dolphin outage still
logs the weather and vice versa. Only reads are sent to Dolphin: the monitor
never turns the boiler on or off.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from ..boiler import Boiler
from ..client import DolphinError
from .config import MonitorConfig
from .store import Sample, Store
from .weather import WeatherError, fetch_weather

# Above this the meter says the element is drawing power.
HEATING_THRESHOLD_W = 100.0


def take_sample(boiler: Boiler, cfg: MonitorConfig, store: Store, now: datetime | None = None) -> Sample:
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc).replace(microsecond=0)
    s = Sample(
        ts_utc=now.isoformat(timespec="seconds"),
        ts_local=now.astimezone(ZoneInfo(cfg.timezone)).isoformat(timespec="seconds"),
    )
    errors = []

    try:
        st = boiler.status()
        s.boiler_ok = 1
        s.water_c = st.temperature
        s.target_c = st.target_temperature
        s.shabbat = int(st.shabbat)
        s.total_energy_wh = st.total_energy_wh
        if st.power_w is not None:
            s.power_w = st.power_w
            s.power_source = "meter"
            s.heating = int(st.power_w >= HEATING_THRESHOLD_W)
        else:
            s.heating = int(st.power)
            s.power_w = cfg.element_watts if st.power else 0.0
            s.power_source = "estimate"
        s.current_a = round(s.power_w / cfg.mains_volts, 2) if cfg.mains_volts else None
        s.raw_boiler = json.dumps(st.raw, sort_keys=True)
    except DolphinError as e:
        errors.append(f"boiler: {e}")

    try:
        w = fetch_weather(cfg.latitude, cfg.longitude, cfg.timezone)
        s.weather_ok = 1
        s.air_c = w.air_c
        s.humidity_pct = w.humidity_pct
        s.precipitation_mm = w.precipitation_mm
        s.rain_mm = w.rain_mm
        s.cloud_pct = w.cloud_pct
        s.uv_index = w.uv_index
        s.solar_wm2 = w.solar_wm2
        s.wind_kmh = w.wind_kmh
        s.is_day = None if w.is_day is None else int(w.is_day)
        s.weather_code = w.weather_code
    except WeatherError as e:
        errors.append(f"weather: {e}")

    s.error = "; ".join(errors) or None
    store.add(s)
    return s


def describe(s: Sample) -> str:
    def f(v, unit="", nd=1):
        return "?" if v is None else f"{v:.{nd}f}{unit}"

    parts = [s.ts_local]
    if s.boiler_ok:
        heat = "heating" if s.heating else "idle"
        amps = f", {f(s.power_w, ' W', 0)} / {f(s.current_a, ' A')}" if s.heating else ""
        est = " (estimated)" if s.heating and s.power_source == "estimate" else ""
        parts.append(f"water {f(s.water_c, ' °C')} {heat}{amps}{est}")
    if s.weather_ok:
        rain = f", rain {f(s.rain_mm, ' mm')}" if (s.rain_mm or 0) > 0 else ""
        parts.append(
            f"air {f(s.air_c, ' °C')}, humidity {f(s.humidity_pct, '%', 0)}, "
            f"UV {f(s.uv_index)}, sun {f(s.solar_wm2, ' W/m²', 0)}, cloud {f(s.cloud_pct, '%', 0)}{rain}"
        )
    if s.error:
        parts.append(f"errors: {s.error}")
    return " | ".join(parts)
