"""Energy, efficiency and degradation from the sample log.

The physics, for a tank of mass m (150 L ≈ 148.5 kg of warm water):

    heat stored      Q = m · c · ΔT,   c = 4.186 kJ/(kg·K)  →  0.173 kWh per °C
    standby loss     dT/dt = −k · (T_water − T_air)         (Newton cooling)
    solar gain       dT/dt = a · G                           (G = sunshine, W/m²)

k is fitted from dark idle stretches (night, element off, no hot water
used). a is fitted from sunny idle stretches once k is known. With those,
each heating cycle gives

    heat from element = m·c·ΔT + standby loss during the cycle − solar gain
    efficiency        = heat from element / electrical energy in

Electrical energy comes, best first, from Dolphin's energy counter
(TotalEnergyWh), its power reading (PowerW) times on-time, or the element's
rated power times on-time (an estimate; see the README for adding a meter).

An electric element turns almost all of its electricity into heat, so a
healthy boiler shows ~90–100 % here; the missing part is heat lost through
the tank and pipes. What the trend catches is change: scale on the element
or tank floor, a thermostat drifting, an element losing power, or the tank
losing more heat (insulation, solar loop running backwards at night).

Cycles where hot water was used while heating (the water cools sharply) are
kept in the log but left out of the trend, because the cold refill hides
the heat.
"""

from __future__ import annotations

import math
import statistics
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from .config import MonitorConfig
from .store import Sample

DEFAULT_K_PER_H = 0.009      # ≈1.5 kWh/day lost from 150 L at 60 °C, a typical insulated tank
DRAW_DROP_K = 1.0            # a drop this big between samples means hot water was used
DARK_WM2 = 20.0              # below this the solar panels aren't adding heat
SUNNY_WM2 = 100.0


@dataclass
class Cycle:
    start: datetime
    end: datetime
    start_c: float
    end_c: float
    on_hours: float
    elec_kwh: float
    elec_source: str          # counter | meter | estimate
    avg_power_w: float | None
    air_c: float | None
    solar_wm2: float | None
    stored_kwh: float = 0.0   # m·c·ΔT
    loss_kwh: float = 0.0
    solar_kwh: float = 0.0
    heat_kwh: float = 0.0     # heat the element put in
    efficiency: float | None = None
    clean: bool = True
    note: str = ""

    @property
    def hours(self) -> float:
        return (self.end - self.start).total_seconds() / 3600

    @property
    def rise_per_kwh(self) -> float | None:
        return (self.end_c - self.start_c) / self.elec_kwh if self.elec_kwh > 0 else None


@dataclass
class Standby:
    when: datetime
    k_per_h: float
    loss_w_at_60: float = 0.0  # equivalent heat loss with water 60 °C, air 20 °C


@dataclass
class Trend:
    name: str
    unit: str
    baseline: float | None = None
    recent: float | None = None
    baseline_since: datetime | None = None
    per_30_days: float | None = None   # slope of a straight-line fit
    n: int = 0

    @property
    def change_pct(self) -> float | None:
        if self.baseline in (None, 0) or self.recent is None:
            return None
        return (self.recent - self.baseline) / abs(self.baseline) * 100


@dataclass
class Analysis:
    samples: list[Sample]
    cycles: list[Cycle] = field(default_factory=list)
    standby: list[Standby] = field(default_factory=list)
    k_per_h: float = DEFAULT_K_PER_H
    k_fitted: bool = False
    solar_a: float | None = None     # K/h per W/m²
    trends: dict[str, Trend] = field(default_factory=dict)

    @property
    def clean_cycles(self) -> list[Cycle]:
        return [c for c in self.cycles if c.clean and c.efficiency is not None]


# --- helpers ----------------------------------------------------------------

def _ok(s: Sample) -> bool:
    return bool(s.boiler_ok and s.water_c is not None)


def _hours(a: Sample, b: Sample) -> float:
    return (b.time - a.time).total_seconds() / 3600


def _mean(xs):
    xs = [x for x in xs if x is not None]
    return sum(xs) / len(xs) if xs else None


def _median(xs):
    xs = [x for x in xs if x is not None]
    return statistics.median(xs) if xs else None


def sample_interval_h(samples: list[Sample], cfg: MonitorConfig) -> float:
    gaps = [_hours(a, b) for a, b in zip(samples, samples[1:]) if _hours(a, b) > 0]
    return _median(gaps) or cfg.interval_min / 60


# --- standby loss and solar gain ----------------------------------------------

def _segments(samples: list[Sample], keep, max_gap_h: float):
    """Split into runs of consecutive samples that satisfy keep(), breaking at gaps and hot-water draws."""
    seg: list[Sample] = []
    for s in samples:
        if not (_ok(s) and keep(s)):
            if len(seg) > 1:
                yield seg
            seg = []
            continue
        if seg:
            prev = seg[-1]
            gap = _hours(prev, s)
            if gap > max_gap_h or prev.water_c - s.water_c > DRAW_DROP_K:
                if len(seg) > 1:
                    yield seg
                seg = []
        seg.append(s)
    if len(seg) > 1:
        yield seg


def fit_standby(samples, cfg, interval_h) -> list[Standby]:
    out = []
    dark = lambda s: not s.heating and (s.solar_wm2 or 0) <= DARK_WM2
    for seg in _segments(samples, dark, 2.5 * interval_h):
        a, b = seg[0], seg[-1]
        dt = _hours(a, b)
        air = _mean(x.air_c for x in seg)
        if dt < 2 or air is None:
            continue
        d0, d1 = a.water_c - air, b.water_c - air
        if d0 < 8 or d1 <= 0 or d1 > d0:
            continue
        k = math.log(d0 / d1) / dt
        if 0 < k < 0.2:
            out.append(Standby(when=a.time, k_per_h=k, loss_w_at_60=k * 40 * cfg.heat_capacity_kwh_per_k * 1000))
    return out


def fit_solar(samples, k, interval_h) -> float | None:
    gain = weight = 0.0
    sunny = lambda s: not s.heating and (s.solar_wm2 or 0) >= SUNNY_WM2
    for seg in _segments(samples, sunny, 2.5 * interval_h):
        for p, q in zip(seg, seg[1:]):
            dt = _hours(p, q)
            air = _mean([p.air_c, q.air_c])
            g = _mean([p.solar_wm2, q.solar_wm2])
            if air is None or g is None:
                continue
            loss = k * ((p.water_c + q.water_c) / 2 - air) * dt
            gain += (q.water_c - p.water_c) + loss
            weight += g * dt
    if weight < 500 * 2:  # need at least ~2 sunny hours
        return None
    return max(0.0, gain / weight)


# --- heating cycles ---------------------------------------------------------

def find_cycles(samples, cfg, interval_h, k, solar_a) -> list[Cycle]:
    ok = [s for s in samples if _ok(s)]
    cycles = []
    i = 0
    C = cfg.heat_capacity_kwh_per_k
    while i < len(ok):
        if not ok[i].heating:
            i += 1
            continue
        j = i
        while j + 1 < len(ok) and ok[j + 1].heating and _hours(ok[j], ok[j + 1]) <= 2.5 * interval_h:
            j += 1
        run = ok[i:j + 1]
        before = ok[i - 1] if i > 0 and _hours(ok[i - 1], ok[i]) <= 2.5 * interval_h else None
        after = ok[j + 1] if j + 1 < len(ok) and not ok[j + 1].heating and _hours(ok[j], ok[j + 1]) <= 2.5 * interval_h else None
        first, last = before or run[0], after or run[-1]
        span = [first] + run + ([after] if after else [])
        on_h = len(run) * interval_h
        powers = [s.power_w for s in run if s.power_source == "meter" and s.power_w]
        avg_p = _mean(powers)

        elec, src = None, "estimate"
        if first.total_energy_wh is not None and last.total_energy_wh is not None:
            d = (last.total_energy_wh - first.total_energy_wh) / 1000
            limit = 2 * max(cfg.element_watts, avg_p or 0) / 1000 * max(_hours(first, last), interval_h)
            if 0 < d <= limit:
                elec, src = d, "counter"
        if elec is None and avg_p:
            elec, src = avg_p * on_h / 1000, "meter"
        if elec is None:
            elec = cfg.element_watts * on_h / 1000

        air = _mean(s.air_c for s in span)
        sun = _mean(s.solar_wm2 for s in span)
        c = Cycle(start=first.time, end=last.time, start_c=first.water_c, end_c=last.water_c,
                  on_hours=on_h, elec_kwh=elec, elec_source=src, avg_power_w=avg_p, air_c=air, solar_wm2=sun)
        c.stored_kwh = C * (c.end_c - c.start_c)
        if air is not None:
            c.loss_kwh = max(0.0, k * ((c.start_c + c.end_c) / 2 - air) * c.hours * C)
        if sun and solar_a:
            c.solar_kwh = solar_a * sun * c.hours * C
        c.heat_kwh = c.stored_kwh + c.loss_kwh - c.solar_kwh
        c.efficiency = c.heat_kwh / elec if elec > 0 else None

        notes = []
        if any(p.water_c - q.water_c > 0.5 for p, q in zip(span, span[1:])):
            notes.append("hot water used during heating")
        if c.end_c - c.start_c < 3:
            notes.append("too small a rise to measure")
        if not before or not after:
            notes.append("start or end not seen")
        if sun and sun > SUNNY_WM2 and solar_a is None:
            notes.append("sunny; solar gain not fitted yet")
        if c.solar_kwh > 0.3 * max(c.stored_kwh, 0.01):
            notes.append("mostly solar")
        if air is None:
            notes.append("no weather")
        c.clean = not notes
        c.note = "; ".join(notes)
        cycles.append(c)
        i = j + 1
    return cycles


# --- trends -------------------------------------------------------------------

def _trend(name, unit, points: list[tuple[datetime, float]], min_points=6) -> Trend:
    t = Trend(name=name, unit=unit, n=len(points))
    if len(points) < min_points:
        return t
    points = sorted(points)
    m = max(3, min(15, len(points) // 3))
    t.baseline = _median(v for _, v in points[:m])
    t.baseline_since = points[0][0]
    t.recent = _median(v for _, v in points[-m:])
    x0 = points[0][0]
    xs = [(d - x0).total_seconds() / 86400 for d, _ in points]
    ys = [v for _, v in points]
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    sxx = sum((x - mx) ** 2 for x in xs)
    if sxx > 0:
        t.per_30_days = 30 * sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx
    return t


def analyse(samples: list[Sample], cfg: MonitorConfig) -> Analysis:
    samples = sorted(samples, key=lambda s: s.ts_utc)
    interval_h = sample_interval_h(samples, cfg)
    a = Analysis(samples=samples)
    a.standby = fit_standby(samples, cfg, interval_h)
    recent = [s.k_per_h for s in a.standby[-30:]]
    if len(recent) >= 2:
        a.k_per_h, a.k_fitted = _median(recent), True
    a.solar_a = fit_solar(samples, a.k_per_h, interval_h)
    a.cycles = find_cycles(samples, cfg, interval_h, a.k_per_h, a.solar_a)
    clean = a.clean_cycles
    a.trends = {
        "efficiency": _trend("Heating efficiency", "%", [(c.start, c.efficiency * 100) for c in clean]),
        "rise": _trend("Water warming per kWh", "°C/kWh", [(c.start, c.rise_per_kwh) for c in clean if c.rise_per_kwh]),
        "power": _trend("Element power", "W", [(c.start, c.avg_power_w) for c in a.cycles if c.avg_power_w]),
        "standby": _trend("Standby heat loss (60 °C water, 20 °C air)", "W", [(s.when, s.loss_w_at_60) for s in a.standby], min_points=4),
    }
    return a


def daily_energy(a: Analysis, cfg: MonitorConfig) -> list[tuple[str, float, float]]:
    """(local date, electric kWh, solar kWh) per day."""
    from zoneinfo import ZoneInfo

    tz = ZoneInfo(cfg.timezone)
    days: dict[str, list[float]] = {}
    for c in a.cycles:
        d = c.start.astimezone(tz).date().isoformat()
        days.setdefault(d, [0.0, 0.0])[0] += c.elec_kwh
    if a.solar_a:
        C = cfg.heat_capacity_kwh_per_k
        for p, q in zip(a.samples, a.samples[1:]):
            dt = _hours(p, q)
            g = _mean([p.solar_wm2, q.solar_wm2])
            if g and 0 < dt <= 1:
                d = p.time.astimezone(tz).date().isoformat()
                days.setdefault(d, [0.0, 0.0])[1] += a.solar_a * g * dt * C
    return [(d, v[0], v[1]) for d, v in sorted(days.items())]


def recent_window(samples: list[Sample], now: datetime, hours: float) -> list[Sample]:
    cut = now - timedelta(hours=hours)
    return [s for s in samples if s.time >= cut]
