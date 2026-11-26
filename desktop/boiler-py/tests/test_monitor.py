import json
import math
import plistlib
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from dolphin_boiler import cli  # noqa: E402
from dolphin_boiler.boiler import Boiler  # noqa: E402
from dolphin_boiler.client import DolphinClient, normalise_status  # noqa: E402
from dolphin_boiler.credentials import CredentialStore  # noqa: E402
from dolphin_boiler.monitor import alerts, launchd  # noqa: E402
from dolphin_boiler.monitor.analysis import analyse, daily_energy  # noqa: E402
from dolphin_boiler.monitor.cli import main as monitor_main, sample_once  # noqa: E402
from dolphin_boiler.monitor.collector import take_sample  # noqa: E402
from dolphin_boiler.monitor.config import MonitorConfig  # noqa: E402
from dolphin_boiler.monitor.report import html_report, text_report  # noqa: E402
from dolphin_boiler.monitor.store import Sample, Store  # noqa: E402
from dolphin_boiler.monitor.weather import WeatherError, fetch_weather  # noqa: E402
from fake_dolphin import API_KEY, EMAIL, PASSWORD, FakeDolphin  # noqa: E402
from fake_weather import FakeWeather  # noqa: E402

UTC = timezone.utc


@pytest.fixture(autouse=True)
def home(tmp_path, monkeypatch):
    monkeypatch.setenv("DOLPHIN_BOILER_HOME", str(tmp_path / "home"))
    monkeypatch.setattr(alerts, "notify", lambda a: None)
    return tmp_path / "home"


@pytest.fixture
def fake():
    f = FakeDolphin().start()
    yield f
    f.stop()


@pytest.fixture
def weather(monkeypatch):
    w = FakeWeather().start()
    monkeypatch.setenv("OPEN_METEO_URL", w.url)
    yield w
    w.stop()


@pytest.fixture
def boiler(fake, tmp_path):
    b = Boiler(client=DolphinClient(base_url=fake.base_url, timeout=3),
               store=CredentialStore(directory=tmp_path / "cred", use_keyring=False))
    b.sign_in(EMAIL, PASSWORD)
    return b


@pytest.fixture
def store(tmp_path):
    s = Store(tmp_path / "m.db")
    yield s
    s.close()


CFG = MonitorConfig()


# --- a simulated boiler, for the analysis -------------------------------------

def simulate(days=40, eta=lambda day: 0.97, power=lambda day: 2500.0, k=0.010, solar=0.0008,
             draws=True, start=datetime(2026, 1, 1, tzinfo=UTC), meter=True, counter=True):
    """10-minute samples of a 150 L tank: heats to 55 °C at 03:00 UTC (05:00 Israel),
    loses heat to the air, gains from the sun, and has an evening shower."""
    C = CFG.heat_capacity_kwh_per_k
    T, wh, on = 35.0, 0.0, False
    out = []
    t = start
    end = start + timedelta(days=days)
    step = timedelta(minutes=1)
    while t < end:
        day = (t - start).days
        hour = t.hour + t.minute / 60
        air = 18 + 6 * math.sin((hour - 8) / 24 * 2 * math.pi)
        sun = max(0.0, 800 * math.sin((hour - 4.5) / 12 * math.pi)) if 4.5 <= hour <= 16.5 else 0.0
        if t.minute % 10 == 0:
            out.append(Sample(
                ts_utc=t.isoformat(timespec="seconds"), ts_local=t.isoformat(timespec="seconds"),
                boiler_ok=1, water_c=round(T, 1), target_c=55.0, heating=int(on), shabbat=0,
                power_w=(power(day) if on else 0.0) if meter else (CFG.element_watts if on else 0.0),
                total_energy_wh=round(wh, 1) if counter else None,
                power_source="meter" if meter else "estimate",
                weather_ok=1, air_c=round(air, 1), solar_wm2=round(sun), humidity_pct=60, uv_index=sun / 100,
            ))
        if hour == 3.0:
            on = True
        if on and T >= 55:
            on = False
        dT = -k * (T - air) / 60 + solar * sun / 60
        if on:
            wh += power(day) / 60
            dT += eta(day) * power(day) / 60 / 1000 / C
        if draws and t.hour == 18 and t.minute == 5:
            dT -= 12  # a shower
        T += dT
        t += step
    return out


def test_simulated_healthy_boiler_reads_true_efficiency_and_raises_nothing():
    a = analyse(simulate(days=30), CFG)
    assert a.k_fitted and a.k_per_h == pytest.approx(0.010, rel=0.15)
    assert a.solar_a == pytest.approx(0.0008, rel=0.25)
    clean = a.clean_cycles
    assert len(clean) >= 25
    assert all(c.elec_source == "counter" for c in clean)
    effs = sorted(c.efficiency for c in clean)
    assert effs[len(effs) // 2] == pytest.approx(0.97, abs=0.04)
    assert a.trends["efficiency"].change_pct == pytest.approx(0, abs=3)
    assert alerts.check(a, now=a.samples[-1].time) == []


def test_efficiency_drop_from_scaling_raises_alert():
    # efficiency falls from 97% to ~75% over 60 days
    a = analyse(simulate(days=60, eta=lambda d: 0.97 - 0.0037 * d), CFG)
    eff = a.trends["efficiency"]
    assert eff.change_pct < -15 and eff.per_30_days < -5
    found = {x.key: x for x in alerts.check(a, now=a.samples[-1].time)}
    assert "efficiency" in found and "scale" in found["efficiency"].message


def test_element_losing_power_raises_alert():
    a = analyse(simulate(days=40, power=lambda d: 2500 if d < 20 else 1900), CFG)
    found = {x.key: x for x in alerts.check(a, now=a.samples[-1].time)}
    assert "power" in found and "less power" in found["power"].message
    assert "efficiency" not in found  # it still heats the water as well per kWh


def test_standby_loss_rising_raises_alert():
    samples = simulate(days=20, k=0.008) + simulate(days=20, k=0.014, start=datetime(2026, 1, 21, tzinfo=UTC))
    a = analyse(samples, CFG)
    found = {x.key for x in alerts.check(a, now=a.samples[-1].time)}
    assert "standby" in found


def test_showers_during_heating_are_left_out_of_trend():
    samples = simulate(days=5)
    # someone showers during each morning heat-up
    for s in samples:
        if s.time.hour == 3 and s.time.minute == 20:
            s.water_c -= 8
    a = analyse(samples, CFG)
    assert a.cycles and not a.clean_cycles
    assert "hot water used" in a.cycles[0].note


def test_without_counter_uses_power_reading_and_without_meter_estimates():
    a = analyse(simulate(days=10, counter=False), CFG)
    assert {c.elec_source for c in a.cycles} == {"meter"}
    eff = statistics_median([c.efficiency for c in a.clean_cycles])
    assert eff == pytest.approx(0.97, abs=0.12)  # 10-minute on-time resolution
    a = analyse(simulate(days=10, counter=False, meter=False), CFG)
    assert {c.elec_source for c in a.cycles} == {"estimate"}


def statistics_median(xs):
    import statistics

    return statistics.median(xs)


def test_no_rise_and_offline_alerts():
    t0 = datetime(2026, 2, 1, tzinfo=UTC)
    ss = [Sample(ts_utc=(t0 + timedelta(minutes=10 * i)).isoformat(), ts_local=(t0 + timedelta(minutes=10 * i)).isoformat(),
                 boiler_ok=1, water_c=40.0, target_c=55, heating=1, power_w=0, power_source="meter", weather_ok=1, air_c=15)
          for i in range(5)]
    keys = {a.key for a in alerts.check(analyse(ss, CFG), now=ss[-1].time)}
    assert "no_rise" in keys
    ss.append(Sample(ts_utc=(t0 + timedelta(hours=2)).isoformat(), ts_local="x", boiler_ok=0, weather_ok=1))
    keys = {a.key for a in alerts.check(analyse(ss, CFG), now=t0 + timedelta(hours=2))}
    assert "offline" in keys


def test_daily_energy_and_reports_render():
    a = analyse(simulate(days=8), CFG)
    days = daily_energy(a, CFG)
    assert len(days) >= 7
    d, elec, sol = days[3]
    assert 1 < elec < 6 and sol > 0.5
    txt = text_report(a, CFG, [])
    assert "Heating cycles" in txt and "Dolphin's energy meter" in txt
    page = html_report(a, CFG, [alerts.Alert("efficiency", "warning", "test <b>")], days=3)
    assert page.startswith("<!doctype html>") and "<svg" in page and "test &lt;b&gt;" in page


# --- weather --------------------------------------------------------------------

def test_weather_from_fake_open_meteo(weather):
    w = fetch_weather(CFG.latitude, CFG.longitude)
    assert w.air_c == 21.4 and w.humidity_pct == 58 and w.uv_index == 3.1 and w.solar_wm2 == 480
    assert w.is_day is True and not w.raining
    q = weather.queries[-1]
    assert q["latitude"] == "32.0956" and q["timezone"] == "Asia/Jerusalem"
    assert "uv_index" in q["current"] and "shortwave_radiation" in q["current"]


def test_weather_outage(weather):
    weather.outage = True
    with pytest.raises(WeatherError):
        fetch_weather(1, 2)


# --- collecting against the fakes ----------------------------------------------

def test_sample_logs_boiler_and_weather_with_timestamps(boiler, weather, store):
    now = datetime(2026, 11, 26, 7, 50, 3, 123, tzinfo=UTC)
    s = take_sample(boiler, CFG, store, now=now)
    assert s.ts_utc == "2026-11-26T07:50:03+00:00"
    assert s.ts_local == "2026-11-26T09:50:03+02:00"
    assert s.boiler_ok and s.weather_ok and s.water_c == 31 and s.heating == 0 and s.air_c == 21.4
    assert store.count() == 1
    assert API_KEY not in (s.raw_boiler or "")


def test_sample_with_meter_reads_power_and_current(fake, boiler, weather, store):
    fake.meter = True
    boiler.heat_to(50)
    s = take_sample(boiler, CFG, store)
    assert s.power_source == "meter" and s.power_w == 2500 and s.heating == 1
    assert s.current_a == pytest.approx(2500 / 220, abs=0.01)
    assert s.total_energy_wh > 1000


def test_sample_without_meter_estimates_from_rating(boiler, weather, store):
    boiler.heat_to(50)
    s = take_sample(boiler, CFG, store)
    assert s.power_source == "estimate" and s.power_w == CFG.element_watts and s.heating == 1


def test_dolphin_down_still_logs_weather(fake, boiler, weather, store):
    fake.outage = "http500"
    s = take_sample(boiler, CFG, store)
    assert not s.boiler_ok and s.weather_ok and "boiler" in s.error
    weather.outage = True
    fake.outage = None
    s = take_sample(boiler, CFG, store)
    assert s.boiler_ok and not s.weather_ok and "weather" in s.error


def test_monitor_never_sends_commands(fake, boiler, weather, store):
    n = len(fake.calls)
    for _ in range(3):
        sample_once(boiler, CFG, store, quiet=True)
    assert set(fake.endpoints()[n:]) == {"getMainScreenData"}


def test_alert_announced_once(store, capsys, monkeypatch):
    seen = []
    monkeypatch.setattr(alerts, "notify", seen.append)
    from dolphin_boiler.monitor.cli import run_checks

    for s in simulate(days=1, draws=False)[:20]:
        s.power_w = 0
        s.heating = 1
        s.water_c = 40.0
        store.add(s)
    now = store.last().time
    run_checks(store, CFG, now)
    run_checks(store, CFG, now + timedelta(minutes=10))
    assert [a.key for a in seen] == ["no_rise"]
    assert [r["key"] for r in store.open_alerts()] == ["no_rise"]


# --- CLI, export, launchd -----------------------------------------------------

def test_cli_sample_report_chart_export(boiler, weather, home, tmp_path, capsys):
    assert cli.main(["monitor", "sample"], boiler=boiler) == 0
    out = capsys.readouterr().out
    assert "water 31" in out and "air 21.4" in out
    assert monitor_main(["report"]) == 0
    assert "1 samples" in capsys.readouterr().out
    page = tmp_path / "p.html"
    assert monitor_main(["chart", "--no-open", "--out", str(page)]) == 0
    assert "<svg" in page.read_text()
    csv_file = tmp_path / "s.csv"
    assert monitor_main(["export", str(csv_file)]) == 0
    lines = csv_file.read_text().splitlines()
    assert lines[0].startswith("ts_utc,ts_local") and len(lines) == 2
    assert PASSWORD not in "".join(p.read_text(errors="ignore") for p in home.rglob("*") if p.is_file())
    assert API_KEY not in "".join(p.read_text(errors="ignore") for p in home.rglob("*") if p.is_file())


def test_config_roundtrip(capsys):
    assert monitor_main(["config", "--element-watts", "3000", "--tank-litres", "120"]) == 0
    cfg = MonitorConfig.load()
    assert cfg.element_watts == 3000 and cfg.tank_litres == 120
    assert cfg.heat_capacity_kwh_per_k == pytest.approx(120 * 0.99 * 4.186 / 3600)


def test_launchd_plist():
    p = launchd.build_plist("/x/.venv/bin/python", "/x", 10)
    assert p["StartInterval"] == 600 and p["RunAtLoad"]
    assert p["ProgramArguments"][-3:] == ["monitor", "sample", "--quiet"]
    plistlib.dumps(p)  # valid plist


def test_status_reads_meter_fields():
    s = normalise_status({"Power": "ON", "Temperature": 44, "PowerW": "2480", "TotalEnergyWh": 12345.6})
    assert s.power_w == 2480 and s.total_energy_wh == 12345.6 and s.raw["PowerW"] == "2480"
