"""Outdoor weather at the boiler from Open-Meteo (https://open-meteo.com).

Free, no account or key. One GET per sample returns the current conditions:
air temperature, humidity, rain, cloud cover, UV index and solar radiation
(the sunshine reaching the solar panels, in W/m²).

Set OPEN_METEO_URL to point at a fake server (see tests/fake_weather.py).
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass

DEFAULT_URL = "https://api.open-meteo.com/v1/forecast"

CURRENT_VARS = (
    "temperature_2m",
    "relative_humidity_2m",
    "precipitation",
    "rain",
    "cloud_cover",
    "uv_index",
    "shortwave_radiation",
    "wind_speed_10m",
    "is_day",
    "weather_code",
)


class WeatherError(Exception):
    pass


@dataclass
class Weather:
    time: str | None = None            # the model's time for these values (local)
    air_c: float | None = None
    humidity_pct: float | None = None
    precipitation_mm: float | None = None
    rain_mm: float | None = None
    cloud_pct: float | None = None
    uv_index: float | None = None
    solar_wm2: float | None = None     # shortwave (global horizontal) radiation
    wind_kmh: float | None = None
    is_day: bool | None = None
    weather_code: int | None = None

    @property
    def raining(self) -> bool:
        return bool((self.rain_mm or 0) > 0 or (self.precipitation_mm or 0) > 0)


def _num(v):
    try:
        return None if v is None else float(v)
    except (TypeError, ValueError):
        return None


def fetch_weather(latitude: float, longitude: float, timezone: str = "Asia/Jerusalem",
                  base_url: str | None = None, timeout: float = 10.0) -> Weather:
    url = base_url or os.environ.get("OPEN_METEO_URL") or DEFAULT_URL
    q = urllib.parse.urlencode({
        "latitude": f"{latitude:.4f}",
        "longitude": f"{longitude:.4f}",
        "current": ",".join(CURRENT_VARS),
        "timezone": timezone,
    })
    req = urllib.request.Request(f"{url}?{q}", headers={"User-Agent": "dolphin-boiler-monitor"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            data = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise WeatherError(f"Open-Meteo returned HTTP {e.code}.") from None
    except (urllib.error.URLError, OSError) as e:
        raise WeatherError(f"Could not reach Open-Meteo ({type(e).__name__}).") from None
    except ValueError:
        raise WeatherError("Unexpected reply from Open-Meteo.") from None
    cur = data.get("current") if isinstance(data, dict) else None
    if not isinstance(cur, dict):
        raise WeatherError("Open-Meteo reply has no current weather.")
    is_day = cur.get("is_day")
    code = _num(cur.get("weather_code"))
    return Weather(
        time=cur.get("time"),
        air_c=_num(cur.get("temperature_2m")),
        humidity_pct=_num(cur.get("relative_humidity_2m")),
        precipitation_mm=_num(cur.get("precipitation")),
        rain_mm=_num(cur.get("rain")),
        cloud_pct=_num(cur.get("cloud_cover")),
        uv_index=_num(cur.get("uv_index")),
        solar_wm2=_num(cur.get("shortwave_radiation")),
        wind_kmh=_num(cur.get("wind_speed_10m")),
        is_day=None if is_day is None else bool(int(is_day)),
        weather_code=None if code is None else int(code),
    )
