import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from dolphin_boiler import cli  # noqa: E402
from dolphin_boiler.boiler import Boiler, NotSignedIn  # noqa: E402
from dolphin_boiler.client import DolphinClient, DolphinError, normalise_status  # noqa: E402
from dolphin_boiler.credentials import CredentialStore  # noqa: E402
from fake_dolphin import API_KEY, DEVICE, EMAIL, PASSWORD, FakeDolphin  # noqa: E402


@pytest.fixture
def fake():
    f = FakeDolphin().start()
    yield f
    f.stop()


@pytest.fixture
def store(tmp_path):
    # No keyring in tests: the key lives in memory only.
    return CredentialStore(directory=tmp_path, use_keyring=False)


@pytest.fixture
def boiler(fake, store):
    return Boiler(client=DolphinClient(base_url=fake.base_url, timeout=3), store=store)


@pytest.fixture
def signed_in(boiler):
    boiler.sign_in(EMAIL, PASSWORD)
    return boiler


# --- sign in -----------------------------------------------------------------

def test_sign_in_picks_first_boiler_and_never_writes_password(boiler, store, tmp_path):
    devices = boiler.sign_in(EMAIL, PASSWORD)
    assert devices == [DEVICE]
    assert boiler.signed_in and boiler.device == DEVICE
    on_disk = "".join(p.read_text() for p in tmp_path.rglob("*") if p.is_file())
    assert PASSWORD not in on_disk
    assert API_KEY not in on_disk
    assert json.loads((tmp_path / "settings.json").read_text()) == {"email": EMAIL, "device": DEVICE}


def test_wrong_password(boiler):
    with pytest.raises(DolphinError) as e:
        boiler.sign_in(EMAIL, "nope")
    assert e.value.code == "bad_login"
    assert not boiler.signed_in


def test_empty_credentials(boiler, fake):
    with pytest.raises(DolphinError):
        boiler.sign_in("", "")
    assert fake.calls == []


def test_actions_need_sign_in(boiler):
    with pytest.raises(NotSignedIn):
        boiler.status()


def test_revoked_key_signs_out(signed_in, fake):
    fake.revoke_key()
    with pytest.raises(DolphinError) as e:
        signed_in.status()
    assert e.value.code == "unauthorized"
    assert not signed_in.signed_in


def test_sign_out(signed_in):
    signed_in.sign_out()
    assert not signed_in.signed_in


# --- status and heating ------------------------------------------------------

def test_status(signed_in):
    s = signed_in.status()
    assert s.temperature == 31 and not s.power and not s.shabbat
    assert [sh.temperature for sh in s.showers] == [38, 45, 52, 58]


def test_heat_to_40_then_stop(signed_in, fake):
    s = signed_in.heat_to(40)
    assert s.power and s.target_temperature == 40
    s = signed_in.stop()
    assert not s.power
    assert fake.endpoints()[-2:] == ["turnOffManually", "getMainScreenData"]


@pytest.mark.parametrize("bad", [19, 72, "abc", 40.5])
def test_heat_rejects_bad_temperature(signed_in, fake, bad):
    before = len(fake.calls)
    with pytest.raises(DolphinError):
        signed_in.heat_to(bad)
    assert "turnOnManually" not in fake.endpoints()[before:]


def test_showers_heats_to_that_showers_temperature(signed_in, fake):
    s, started = signed_in.heat_for_showers(2)
    assert started
    assert ("turnOnManually", {"email": EMAIL, "API_Key": API_KEY, "deviceName": DEVICE, "temperature": "45"}) in fake.calls
    assert s.power


def test_showers_skips_when_already_hot(signed_in, fake):
    fake.device["Temperature"] = 50
    s, started = signed_in.heat_for_showers(2)
    assert not started
    assert "turnOnManually" not in fake.endpoints()


@pytest.mark.parametrize("n", [0, 5])
def test_showers_only_1_to_4(signed_in, n):
    with pytest.raises(DolphinError):
        signed_in.heat_for_showers(n)


def test_water_warms_until_target(signed_in):
    signed_in.heat_to(40)
    for _ in range(10):
        s = signed_in.status()
    assert s.temperature == 40 and not s.power


# --- Shabbat -----------------------------------------------------------------

def test_shabbat_on_blocks_heating(signed_in, fake):
    assert signed_in.set_shabbat(True).shabbat
    for action in (lambda: signed_in.heat_to(40), lambda: signed_in.heat_for_showers(1)):
        with pytest.raises(DolphinError) as e:
            action()
        assert e.value.code == "refused"
    assert "turnOnManually" not in fake.endpoints()
    assert not signed_in.set_shabbat(False).shabbat


def test_stop_works_during_shabbat(signed_in, fake):
    fake.device.update(Power="ON", targetTemperature=60, Shabbat="ON")
    signed_in.stop()
    assert fake.device["Power"] == "OFF"


# --- failures ----------------------------------------------------------------

def test_offline_boiler(signed_in, fake):
    fake.offline = True
    with pytest.raises(DolphinError) as e:
        signed_in.status()
    assert e.value.code == "rejected" and "offline" in str(e.value)
    assert signed_in.signed_in  # an offline boiler doesn't sign you out


@pytest.mark.parametrize("outage,code", [("http500", "bad_reply"), ("garbage", "bad_reply"), ("drop", "unreachable")])
def test_outages(signed_in, fake, outage, code):
    fake.outage = outage
    with pytest.raises(DolphinError) as e:
        signed_in.status()
    assert e.value.code == code
    assert API_KEY not in str(e.value)


def test_stop_reports_success_even_if_status_read_fails(signed_in, fake):
    fake.device["Power"] = "ON"
    real = fake.h_getMainScreenData
    fake.h_getMainScreenData = lambda f: {"error": "Device is offline"}
    try:
        assert signed_in.stop() is None
    finally:
        fake.h_getMainScreenData = real
    assert fake.device["Power"] == "OFF"


def test_unreachable_host(store):
    b = Boiler(client=DolphinClient(base_url="http://127.0.0.1:9/HA/V1", timeout=1), store=store)
    with pytest.raises(DolphinError) as e:
        b.sign_in(EMAIL, PASSWORD)
    assert e.value.code == "unreachable"


def test_normalise_ignores_junk():
    s = normalise_status({"Temperature": "abc", "targetTemperature": 0, "showerTemperature": [{"temp": ""}, None]})
    assert s.temperature is None and s.target_temperature is None
    assert [sh.temperature for sh in s.showers] == [None, None]


# --- command line ------------------------------------------------------------

def test_cli_login_status_heat_stop(boiler, capsys, monkeypatch):
    monkeypatch.setattr("builtins.input", lambda _p: EMAIL)
    assert cli.main(["login"], boiler=boiler, password_prompt=lambda _p: PASSWORD) == 0
    assert cli.main(["status"], boiler=boiler) == 0
    out = capsys.readouterr().out
    assert "31 °C" in out and PASSWORD not in out
    assert cli.main(["heat", "40"], boiler=boiler) == 0
    assert "ON, to 40 °C" in capsys.readouterr().out
    assert cli.main(["stop"], boiler=boiler) == 0
    assert "heating      off" in capsys.readouterr().out


def test_cli_error_exit_code(boiler, capsys):
    assert cli.main(["status"], boiler=boiler) == 1
    assert "login" in capsys.readouterr().err
