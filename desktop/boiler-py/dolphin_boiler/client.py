"""Client for the Dolphin smart-boiler cloud API (api.dolphinboiler.com).

Dolphin publishes no official API. This follows the same endpoints as the
NOHAYO web backend (web/backend/src/integrations/dolphin.js), which in turn
follows the community Home Assistant integration (github.com/0xAlon/dolphin):
every call is a form-encoded POST to /HA/V1/<endpoint>.php carrying ``email``
and ``API_Key`` (and usually ``deviceName``). Replies are JSON, except
getAPIkey.php, which returns the key as plain text.

These endpoints are educated guesses until checked against a real boiler.

Only the Python standard library is used, so there is nothing to install.
Set DOLPHIN_BASE_URL to point at a fake server (see tests/fake_dolphin.py).
"""

from __future__ import annotations

import json
import os
import re
import socket
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field

DEFAULT_BASE_URL = "https://api.dolphinboiler.com/HA/V1"
TIMEOUT_S = 10.0
MIN_TEMP = 20
MAX_TEMP = 71


class DolphinError(Exception):
    """Why a Dolphin call failed.

    code is one of:
      bad_login     getAPIkey refused the email/password
      unauthorized  a saved API key was rejected (sign in again)
      unreachable   network error or timeout
      rejected      Dolphin answered {"error": ...} (offline boiler, ...)
      bad_reply     HTTP error or a reply we can't parse
      refused       this app refused (e.g. Shabbat mode is on)

    The message never includes the request or reply body: requests carry the
    password or API key, and errors are the kind of thing that gets logged.
    """

    def __init__(self, message: str, code: str = "bad_reply", status: int | None = None):
        super().__init__(message)
        self.code = code
        self.status = status


@dataclass
class Shower:
    count: int
    temperature: float | None


@dataclass
class Status:
    power: bool = False
    temperature: float | None = None
    target_temperature: float | None = None
    energy: float = 0.0
    shabbat: bool = False
    fixed_temperature: bool = False
    showers: list[Shower] = field(default_factory=list)

    def shower(self, count: int) -> Shower | None:
        return next((s for s in self.showers if s.count == count), None)

    def ready_for(self, count: int) -> bool:
        s = self.shower(count)
        return bool(
            s and s.temperature is not None and self.temperature is not None
            and self.temperature >= s.temperature
        )


def _num(v) -> float | None:
    if v is None or v == "":
        return None
    try:
        n = float(v)
    except (TypeError, ValueError):
        return None
    return n if n == n and n not in (float("inf"), float("-inf")) else None


def _on(v) -> bool:
    return str(v).upper() == "ON"


def normalise_status(raw: dict) -> Status:
    """Turn a getMainScreenData reply into a Status."""
    temp = _num(raw.get("Temperature"))
    target = _num(raw.get("targetTemperature"))
    showers_raw = raw.get("showerTemperature")
    showers = []
    if isinstance(showers_raw, list):
        for i, s in enumerate(showers_raw):
            t = _num(s.get("temp")) if isinstance(s, dict) else None
            showers.append(Shower(count=i + 1, temperature=t))
    return Status(
        power=_on(raw.get("Power")),
        temperature=temp if temp is not None and temp > 0 else None,
        target_temperature=target if target is not None and target > 0 else None,
        energy=_num(raw.get("Energy")) or 0.0,
        shabbat=_on(raw.get("Shabbat")),
        fixed_temperature=_on(raw.get("fixedTemperature")),
        showers=showers,
    )


_AUTH_WORDS = re.compile(r"unauthori[sz]ed|api[ _-]?key|not logged|login|token|credential", re.I)


def _reply_error(endpoint: str, data) -> DolphinError | None:
    if not isinstance(data, dict) or not data.get("error"):
        return None
    detail = str(data["error"])[:120]
    code = "unauthorized" if _AUTH_WORDS.search(detail) else "rejected"
    return DolphinError(f"Dolphin refused {endpoint}: {detail}.", code=code)


def check_temp(t) -> int:
    try:
        n = int(t)
    except (TypeError, ValueError):
        n = None
    if n is None or str(n) != str(t).strip() or not MIN_TEMP <= n <= MAX_TEMP:
        raise DolphinError(
            f"Temperature must be a whole number from {MIN_TEMP} to {MAX_TEMP}.", code="refused"
        )
    return n


_FAILURE_WORDS = re.compile(r"^(failed|fail|failure|error|invalid|wrong|false|null|none|unauthori[sz]ed|denied|0)$", re.I)


class DolphinClient:
    def __init__(self, base_url: str | None = None, timeout: float | None = None):
        self.base_url = (base_url or os.environ.get("DOLPHIN_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self.timeout = timeout or float(os.environ.get("DOLPHIN_TIMEOUT_S") or TIMEOUT_S)

    # --- transport -------------------------------------------------------

    def _post(self, endpoint: str, fields: dict) -> str:
        body = urllib.parse.urlencode({k: str(v) for k, v in fields.items() if v is not None}).encode()
        req = urllib.request.Request(
            f"{self.base_url}/{endpoint}.php",
            data=body,
            method="POST",
            headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "dolphin-boiler-py"},
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as res:
                return res.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                raise DolphinError(f"Dolphin refused {endpoint}: HTTP {e.code}.", code="unauthorized", status=e.code) from None
            raise DolphinError(f"Dolphin returned HTTP {e.code}.", status=e.code) from None
        except (urllib.error.URLError, socket.timeout, TimeoutError, ConnectionError, OSError) as e:
            why = "timeout" if isinstance(getattr(e, "reason", e), (socket.timeout, TimeoutError)) else "connection failed"
            raise DolphinError(f"Could not reach Dolphin ({why}).", code="unreachable") from None

    def _json(self, endpoint: str, fields: dict):
        text = self._post(endpoint, fields)
        try:
            data = json.loads(text)
        except ValueError:
            raise DolphinError(f"Unexpected reply from Dolphin {endpoint}.") from None
        err = _reply_error(endpoint, data)
        if err:
            raise err
        return data

    def _command(self, endpoint: str, fields: dict):
        """Commands may answer plain text ("ok") or JSON; only a JSON error is a failure."""
        text = self._post(endpoint, fields)
        try:
            data = json.loads(text)
        except ValueError:
            return text
        err = _reply_error(endpoint, data)
        if err:
            raise err
        return data

    # --- API -------------------------------------------------------------

    def get_api_key(self, email: str, password: str) -> str:
        """Exchange the Dolphin app login for an API key (plain-text reply)."""
        try:
            text = self._post("getAPIkey", {"email": email, "password": password}).strip()
        except DolphinError as e:
            if e.code == "unauthorized":
                raise DolphinError("Dolphin rejected that email or password.", code="bad_login") from None
            raise
        # A failed login is an empty body, a JSON/HTML error, or a bare word such
        # as "failed" (what the real server sends for a wrong email or password).
        if not text or text[0] in "{[<" or re.search(r"\s", text) or _FAILURE_WORDS.match(text):
            raise DolphinError("Dolphin rejected that email or password.", code="bad_login")
        return text

    def get_devices(self, email: str, api_key: str) -> list[str]:
        data = self._json("getDevices", {"email": email, "API_Key": api_key})
        if not isinstance(data, list):
            raise DolphinError("Dolphin did not return a device list.")
        return [str(d["deviceName"]) for d in data if isinstance(d, dict) and d.get("deviceName")]

    def get_status(self, email: str, api_key: str, device: str) -> Status:
        data = self._json("getMainScreenData", {"email": email, "API_Key": api_key, "deviceName": device})
        if not isinstance(data, dict):
            raise DolphinError("Dolphin did not return boiler status.")
        return normalise_status(data)

    def turn_on(self, email: str, api_key: str, device: str, temperature: int):
        return self._command("turnOnManually", {"email": email, "API_Key": api_key, "deviceName": device, "temperature": check_temp(temperature)})

    def turn_off(self, email: str, api_key: str, device: str):
        return self._command("turnOffManually", {"email": email, "API_Key": api_key, "deviceName": device})

    def set_shabbat(self, email: str, api_key: str, device: str, on: bool):
        return self._command("enableShabbat" if on else "disableShabbat", {"email": email, "API_Key": api_key, "deviceName": device})
