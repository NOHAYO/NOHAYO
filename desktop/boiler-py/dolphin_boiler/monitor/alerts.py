"""Maintenance alerts from the analysis.

Slow trends (need a few weeks of data, compare the first cycles logged with
the latest ones):
  efficiency   heating takes more electricity for the same heat: scale on
               the element or tank floor, or a drifting thermostat
  power        the element draws less (or more) power than it used to:
               element wear, or one element of a turbo heater failed
  standby      the tank loses heat faster when idle: insulation, a dripping
               pressure valve, or the solar loop running backwards at night

Right-now checks:
  no_rise      heating for 30+ minutes but the water isn't warming
  overheat     water at 85 °C or more
  offline      no answer from the boiler for over an hour
"""

from __future__ import annotations

import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from .analysis import Analysis

EFF_WARN_PCT = 10
EFF_CRIT_PCT = 20
POWER_WARN_PCT = 10
STANDBY_WARN_PCT = 30


@dataclass
class Alert:
    key: str
    level: str     # warning | critical
    message: str


def _pct(v: float) -> str:
    return f"{abs(v):.0f}%"


def check(a: Analysis, now: datetime | None = None) -> list[Alert]:
    now = now or datetime.now(timezone.utc)
    out: list[Alert] = []
    t = a.trends

    eff = t.get("efficiency")
    if eff and eff.change_pct is not None and eff.change_pct <= -EFF_WARN_PCT:
        lvl = "critical" if eff.change_pct <= -EFF_CRIT_PCT else "warning"
        out.append(Alert("efficiency", lvl,
            f"Heating efficiency is down {_pct(eff.change_pct)} (from {eff.baseline:.0f}% to {eff.recent:.0f}%). "
            "The boiler now needs more electricity for the same hot water. Usual causes: scale on the "
            "element or tank floor, or a drifting thermostat. Worth a descale and element check."))

    pw = t.get("power")
    if pw and pw.change_pct is not None and abs(pw.change_pct) >= POWER_WARN_PCT:
        if pw.change_pct < 0:
            msg = (f"The element now draws {_pct(pw.change_pct)} less power ({pw.recent:.0f} W, was {pw.baseline:.0f} W). "
                   "That points to element wear, or one element of the turbo heater no longer working.")
        else:
            msg = (f"The element now draws {_pct(pw.change_pct)} more power ({pw.recent:.0f} W, was {pw.baseline:.0f} W). "
                   "Check the mains voltage and the element wiring.")
        out.append(Alert("power", "warning", msg))

    sb = t.get("standby")
    if sb and sb.change_pct is not None and sb.change_pct >= STANDBY_WARN_PCT:
        out.append(Alert("standby", "warning",
            f"The tank loses heat {_pct(sb.change_pct)} faster when idle ({sb.recent:.0f} W, was {sb.baseline:.0f} W). "
            "Check the tank insulation, the pressure-relief valve for drips, and the solar loop's check valve "
            "(hot water can flow back to the panels at night)."))

    ok = [s for s in a.samples if s.boiler_ok and s.water_c is not None]
    tail = []
    for s in reversed(ok):
        if not s.heating:
            break
        tail.append(s)
    tail.reverse()
    if len(tail) >= 2 and (tail[-1].time - tail[0].time) >= timedelta(minutes=30):
        if tail[-1].water_c - tail[0].water_c < 0.5 and (tail[0].target_c is None or tail[0].water_c < tail[0].target_c - 1):
            out.append(Alert("no_rise", "critical",
                f"Heating has been on since {tail[0].ts_local[11:16]} but the water hasn't warmed "
                f"({tail[0].water_c:.1f} → {tail[-1].water_c:.1f} °C). The element, its thermostat or the breaker may have failed."))

    if ok and ok[-1].water_c >= 85:
        out.append(Alert("overheat", "critical",
            f"The water is at {ok[-1].water_c:.0f} °C. Check the thermostat and the solar panels' overheat protection."))

    if a.samples:
        last_ok = ok[-1].time if ok else None
        if a.samples[-1].boiler_ok == 0 and (last_ok is None or now - last_ok > timedelta(hours=1)):
            since = ok[-1].ts_local[:16].replace("T", " ") if ok else "the start of the log"
            out.append(Alert("offline", "warning", f"No answer from the boiler since {since}."))
    return out


def notify(alert: Alert) -> None:
    """Show a Mac notification (does nothing elsewhere)."""
    if sys.platform != "darwin":
        return
    title = "Boiler: " + ("needs attention" if alert.level == "critical" else "maintenance alert")
    text = alert.message.replace("\\", "").replace('"', "'")
    try:
        subprocess.run(["osascript", "-e", f'display notification "{text}" with title "{title}"'],
                       timeout=10, check=False, capture_output=True)
    except Exception:
        pass
