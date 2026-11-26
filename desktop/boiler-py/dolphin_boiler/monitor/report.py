"""Ways to look at the log: a text summary and an HTML page with charts.

The HTML page is a single file with inline SVG charts, so it opens in any
browser without the internet and needs nothing installed.
"""

from __future__ import annotations

import html
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from .alerts import Alert
from .analysis import Analysis, Trend, daily_energy
from .config import MonitorConfig


def _f(v, nd=1, unit=""):
    return "?" if v is None else f"{v:.{nd}f}{unit}"


def _local(dt: datetime, cfg: MonitorConfig, fmt="%d %b %H:%M") -> str:
    return dt.astimezone(ZoneInfo(cfg.timezone)).strftime(fmt)


def trend_line(t: Trend) -> str:
    if t.baseline is None:
        return f"  {t.name:<44} not enough data yet ({t.n} points)"
    ch = t.change_pct
    extra = [f"{ch:+.0f}%"] if ch is not None else []
    if t.per_30_days is not None:
        extra.append(f"{t.per_30_days:+.1f} {t.unit} per 30 days")
    return f"  {t.name:<44} first {t.baseline:.1f} → now {t.recent:.1f} {t.unit} ({', '.join(extra)})"


def text_report(a: Analysis, cfg: MonitorConfig, alerts: list[Alert], last_cycles: int = 10) -> str:
    L = []
    s = a.samples
    if not s:
        return "No samples yet. Run `monitor sample` or install the monitor (`monitor install`)."
    L.append(f"Boiler monitor, {cfg.place}")
    L.append(f"  {len(s)} samples, {_local(s[0].time, cfg)} to {_local(s[-1].time, cfg)} (Israel time)")
    last = s[-1]
    from .collector import describe

    L.append(f"  latest: {describe(last)}")
    meter = any(x.power_source == "meter" for x in s)
    L.append("  power: " + ("from Dolphin's energy meter" if meter else
             f"ESTIMATED from the {cfg.element_watts:.0f} W element rating (Dolphin reported no power)"))
    L.append("")
    L.append("Tank model")
    C = cfg.heat_capacity_kwh_per_k
    L.append(f"  heat capacity    {C:.3f} kWh per °C ({cfg.tank_litres:.0f} L)")
    L.append(f"  standby loss     k = {a.k_per_h:.4f}/h "
             f"(≈{a.k_per_h * 40 * C * 1000:.0f} W at 60 °C water, 20 °C air)"
             + ("" if a.k_fitted else "  [default, not fitted yet: needs a few quiet nights]"))
    L.append("  solar gain       " + (f"{a.solar_a * 1000:.2f} °C/h per kW/m² of sunshine" if a.solar_a is not None
                                   else "not fitted yet (needs sunny hours with the element off)"))
    L.append("")
    L.append(f"Heating cycles ({len(a.cycles)} total, {len(a.clean_cycles)} clean)")
    if a.cycles:
        L.append("  start          °C from→to   on    kWh in  source    heat kWh  eff    note")
    for c in a.cycles[-last_cycles:]:
        L.append(f"  {_local(c.start, cfg):<14} {c.start_c:5.1f}→{c.end_c:5.1f}  {c.on_hours:4.1f}h  {c.elec_kwh:6.2f}  "
                 f"{c.elec_source:<8}  {c.heat_kwh:7.2f}  {_f(c.efficiency * 100 if c.efficiency is not None else None, 0, '%'):>5}  {c.note}")
    L.append("")
    L.append("Trends (first cycles logged vs latest)")
    for t in a.trends.values():
        L.append(trend_line(t))
    L.append("")
    if alerts:
        L.append("ALERTS")
        for al in alerts:
            L.append(f"  [{al.level}] {al.message}")
    else:
        L.append("No maintenance alerts.")
    return "\n".join(L)


# --- HTML ---------------------------------------------------------------------

W, H, PAD_L, PAD_R, PAD_T, PAD_B = 900, 260, 48, 48, 16, 28


def _scale(lo, hi, a, b):
    if hi == lo:
        hi = lo + 1
    return lambda v: a + (v - lo) / (hi - lo) * (b - a)


def _axis_y(lo, hi, y, unit, right=False, n=4):
    out = []
    x = W - PAD_R + 6 if right else PAD_L - 6
    anchor = "start" if right else "end"
    for i in range(n + 1):
        v = lo + (hi - lo) * i / n
        out.append(f'<text x="{x}" y="{y(v) + 4:.1f}" text-anchor="{anchor}" class="tick">{v:.0f}{unit}</text>')
        if not right:
            out.append(f'<line x1="{PAD_L}" x2="{W - PAD_R}" y1="{y(v):.1f}" y2="{y(v):.1f}" class="grid"/>')
    return out


def _axis_x(t0, t1, x, cfg, n=6, fmt="%d %b %H:%M"):
    out = []
    for i in range(n + 1):
        t = t0 + (t1 - t0) * i / n
        out.append(f'<text x="{x(t.timestamp()):.1f}" y="{H - 8}" text-anchor="middle" class="tick">{_local(t, cfg, fmt)}</text>')
    return out


def _path(points):
    return " ".join(("M" if i == 0 else "L") + f"{px:.1f},{py:.1f}" for i, (px, py) in enumerate(points))


def _lines(points, gap_s):
    """Path that breaks at gaps in the data."""
    segs, cur, prev = [], [], None
    for t, px, py in points:
        if prev is not None and t - prev > gap_s:
            segs.append(cur)
            cur = []
        cur.append((px, py))
        prev = t
    segs.append(cur)
    return " ".join(_path(s) for s in segs if s)


def chart_temps(a: Analysis, cfg: MonitorConfig, days: float) -> str:
    end = a.samples[-1].time
    ss = [s for s in a.samples if s.time >= end - timedelta(days=days)]
    t0, t1 = ss[0].time, max(end, ss[0].time + timedelta(hours=1))
    temps = [v for s in ss for v in (s.water_c, s.air_c) if v is not None] or [0, 50]
    lo, hi = min(0, min(temps) // 10 * 10), max(70, (max(temps) // 10 + 1) * 10)
    x = _scale(t0.timestamp(), t1.timestamp(), PAD_L, W - PAD_R)
    y = _scale(lo, hi, H - PAD_B, PAD_T)
    ys = _scale(0, 1100, H - PAD_B, PAD_T)
    gap = 3 * cfg.interval_min * 60
    out = [f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Water and air temperature">']
    out += _axis_y(lo, hi, y, "°")
    out += _axis_y(0, 1000, ys, "", right=True)
    for c in a.cycles:
        if c.end >= t0:
            xa, xb = x(max(c.start, t0).timestamp()), x(c.end.timestamp())
            out.append(f'<rect x="{xa:.1f}" y="{PAD_T}" width="{max(1, xb - xa):.1f}" height="{H - PAD_B - PAD_T}" class="heat"/>')
    sun = [(s.time.timestamp(), x(s.time.timestamp()), ys(s.solar_wm2)) for s in ss if s.solar_wm2 is not None]
    if sun:
        out.append(f'<path d="{_lines(sun, gap)}" class="sun"/>')
    for attr, cls in (("air_c", "air"), ("water_c", "water")):
        pts = [(s.time.timestamp(), x(s.time.timestamp()), y(getattr(s, attr))) for s in ss if getattr(s, attr) is not None]
        if pts:
            out.append(f'<path d="{_lines(pts, gap)}" class="{cls}"/>')
    out += _axis_x(t0, t1, x, cfg)
    out.append("</svg>")
    return "".join(out)


def chart_points(points, base, cfg, label, unit, lo=None, hi=None) -> str:
    """Scatter of (datetime, value, clean) with an optional baseline line."""
    if not points:
        return '<p class="empty">Not enough data yet.</p>'
    vals = [v for _, v, _ in points]
    lo = min(vals + ([base] if base else [])) * 0.95 if lo is None else lo
    hi = max(vals + ([base] if base else [])) * 1.05 if hi is None else hi
    t0, t1 = points[0][0], max(points[-1][0], points[0][0] + timedelta(days=1))
    x = _scale(t0.timestamp(), t1.timestamp(), PAD_L, W - PAD_R)
    y = _scale(lo, hi, H - PAD_B, PAD_T)
    out = [f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="{html.escape(label)}">']
    out += _axis_y(lo, hi, y, unit)
    if base:
        out.append(f'<line x1="{PAD_L}" x2="{W - PAD_R}" y1="{y(base):.1f}" y2="{y(base):.1f}" class="base"/>')
    for t, v, clean in points:
        out.append(f'<circle cx="{x(t.timestamp()):.1f}" cy="{y(v):.1f}" r="4" class="{"pt" if clean else "pt dim"}">'
                   f'<title>{_local(t, cfg)}: {v:.1f} {unit}</title></circle>')
    out += _axis_x(t0, t1, x, cfg, n=5, fmt="%d %b")
    out.append("</svg>")
    return "".join(out)


def chart_daily(rows, cfg) -> str:
    rows = rows[-30:]
    if not rows:
        return '<p class="empty">No heating yet.</p>'
    hi = max(max(e + s for _, e, s in rows), 1) * 1.1
    y = _scale(0, hi, H - PAD_B, PAD_T)
    bw = (W - PAD_L - PAD_R) / len(rows)
    out = [f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Energy per day">']
    out += _axis_y(0, hi, y, "")
    for i, (d, e, s) in enumerate(rows):
        x0 = PAD_L + i * bw + bw * 0.15
        w = bw * 0.7
        out.append(f'<rect x="{x0:.1f}" y="{y(e):.1f}" width="{w:.1f}" height="{y(0) - y(e):.1f}" class="elec"><title>{d}: {e:.2f} kWh electric</title></rect>')
        out.append(f'<rect x="{x0:.1f}" y="{y(e + s):.1f}" width="{w:.1f}" height="{y(e) - y(e + s):.1f}" class="solar"><title>{d}: {s:.2f} kWh solar</title></rect>')
        if len(rows) <= 15 or i % 3 == 0:
            out.append(f'<text x="{x0 + w / 2:.1f}" y="{H - 8}" text-anchor="middle" class="tick">{d[8:]}/{d[5:7]}</text>')
    out.append("</svg>")
    return "".join(out)


CSS = """
:root{--bg:#fbfaf8;--fg:#1d1d1b;--mute:#6b6a66;--line:#e4e2dd;--water:#1f6fd1;--air:#c2611f;--sun:#d9a400;
--heat:rgba(214,64,52,.13);--elec:#1f6fd1;--solar:#e8b923;--warn:#9a5b00;--crit:#b3261e;--card:#fff}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#171716;--fg:#ecebe8;--mute:#a19f99;--line:#33322f;
--water:#6aa8ff;--air:#f0965a;--sun:#f2c94c;--heat:rgba(255,110,96,.16);--elec:#6aa8ff;--solar:#f2c94c;--warn:#f0b35a;--crit:#ff8a80;--card:#21201f}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:960px;margin:0 auto;padding:24px 16px 48px}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 6px}
.sub,.empty,.legend{color:var(--mute);font-size:13px}.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:8px 0}
svg{width:100%;height:auto;display:block}.tick{fill:var(--mute);font-size:11px}.grid{stroke:var(--line)}
.water{stroke:var(--water);stroke-width:2;fill:none}.air{stroke:var(--air);stroke-width:1.5;fill:none}
.sun{stroke:var(--sun);stroke-width:1;fill:none;stroke-dasharray:3 3}.heat{fill:var(--heat)}
.pt{fill:var(--water)}.pt.dim{fill:var(--mute);opacity:.35}.base{stroke:var(--mute);stroke-dasharray:6 4}
.elec{fill:var(--elec)}.solar{fill:var(--solar)}.sw{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 12px;vertical-align:-1px}
.alert{border-left:4px solid var(--warn)}.alert.critical{border-left-color:var(--crit)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.stat b{display:block;font-size:20px}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:4px 6px;border-bottom:1px solid var(--line);text-align:right}
td:first-child,th:first-child,td:last-child,th:last-child{text-align:left}.scroll{overflow-x:auto}
"""


def html_report(a: Analysis, cfg: MonitorConfig, alerts: list[Alert], days: float = 7) -> str:
    e = html.escape
    now = datetime.now(timezone.utc)
    if not a.samples:
        body = "<p>No samples yet.</p>"
    else:
        last = a.samples[-1]
        eff = a.trends["efficiency"]
        meter = any(x.power_source == "meter" for x in a.samples)
        stats = [
            ("Water now", _f(last.water_c, 1, " °C")),
            ("Outdoor", f"{_f(last.air_c, 0, ' °C')}, {_f(last.humidity_pct, 0, '%')} humidity"),
            ("UV / sunshine", f"{_f(last.uv_index, 1)} / {_f(last.solar_wm2, 0, ' W/m²')}"),
            ("Efficiency (recent)", _f(eff.recent, 0, "%") if eff.recent is not None else "learning…"),
            ("Standby loss", f"{a.k_per_h * 40 * cfg.heat_capacity_kwh_per_k * 1000:.0f} W" + ("" if a.k_fitted else " (default)")),
            ("Power data", "Dolphin meter" if meter else "estimated"),
        ]
        al = "".join(f'<div class="card alert {e(x.level)}"><b>{e(x.level.title())}</b>: {e(x.message)}</div>' for x in alerts) \
            or '<div class="card">No maintenance alerts.</div>'
        eff_pts = [(c.start, c.efficiency * 100, c.clean) for c in a.cycles if c.efficiency is not None and -50 < c.efficiency * 100 < 200]
        sb_pts = [(s.when, s.loss_w_at_60, True) for s in a.standby]
        pw_pts = [(c.start, c.avg_power_w, c.clean) for c in a.cycles if c.avg_power_w]
        rows = "".join(
            f"<tr><td>{_local(c.start, cfg)}</td><td>{c.start_c:.1f}→{c.end_c:.1f}</td><td>{c.on_hours:.1f} h</td>"
            f"<td>{c.elec_kwh:.2f}</td><td>{c.heat_kwh:.2f}</td><td>{_f(c.efficiency * 100 if c.efficiency is not None else None, 0, '%')}</td>"
            f"<td>{e(c.elec_source)}{'; ' + e(c.note) if c.note else ''}</td></tr>"
            for c in reversed(a.cycles[-20:]))
        body = f"""
<div class="stats">{''.join(f'<div class="card stat"><span class="sub">{e(k)}</span><b>{e(v)}</b></div>' for k, v in stats)}</div>
<h2>Alerts</h2>{al}
<h2>Last {days:g} days</h2>
<div class="legend"><span class="sw" style="background:var(--water)"></span>water <span class="sw" style="background:var(--air)"></span>outdoor air
<span class="sw" style="background:var(--sun)"></span>sunshine W/m² (right axis) <span class="sw" style="background:var(--heat)"></span>element on</div>
<div class="card">{chart_temps(a, cfg, days)}</div>
<h2>Efficiency per heating cycle</h2>
<div class="legend">Dots are cycles; faded dots were left out of the trend (hot water used, too sunny, …). Dashed line: first cycles logged.</div>
<div class="card">{chart_points(eff_pts, eff.baseline, cfg, "Efficiency", "%")}</div>
<h2>Energy per day</h2>
<div class="legend"><span class="sw" style="background:var(--elec)"></span>electric kWh <span class="sw" style="background:var(--solar)"></span>solar kWh (estimated)</div>
<div class="card">{chart_daily(daily_energy(a, cfg), cfg)}</div>
<h2>Standby heat loss</h2>
<div class="legend">Heat lost while idle at night, scaled to 60 °C water and 20 °C air. Rising means insulation or valve trouble.</div>
<div class="card">{chart_points(sb_pts, a.trends['standby'].baseline, cfg, "Standby loss", " W")}</div>
<h2>Element power</h2>
<div class="card">{chart_points(pw_pts, a.trends['power'].baseline, cfg, "Element power", " W") if pw_pts else '<p class="empty">Dolphin reported no power readings, so this is estimated from the element rating. See the README for adding a meter.</p>'}</div>
<h2>Recent heating cycles</h2>
<div class="card scroll"><table><tr><th>Start</th><th>°C</th><th>On</th><th>kWh in</th><th>Heat kWh</th><th>Eff.</th><th>Notes</th></tr>{rows}</table></div>
"""
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Boiler monitor</title><style>{CSS}</style></head><body><main>
<h1>Boiler monitor</h1><p class="sub">{e(cfg.place)} · {len(a.samples)} samples · made {_local(now, cfg, '%d %b %Y %H:%M')} Israel time</p>
{body}</main></body></html>"""
