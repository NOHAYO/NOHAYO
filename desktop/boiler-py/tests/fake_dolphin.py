"""A fake Dolphin cloud API for tests and trying the app without a real boiler.

A Python port of web/backend/scripts/dolphin-mock.js: same form-encoded
POST /HA/V1/<endpoint>.php protocol, one simulated boiler whose water warms
2 °C on each status read while heating.

    python tests/fake_dolphin.py          # serves on http://127.0.0.1:4100/HA/V1
    login: demo@example.com / demo-password

Faults for tests: fake.offline = True, fake.outage = "http500" | "drop" | "garbage",
fake.revoke_key().
"""

from __future__ import annotations

import json
import re
import threading
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

EMAIL = "demo@example.com"
PASSWORD = "demo-password"
API_KEY = "mock-api-key-123"
DEVICE = "DOLPHIN-MOCK-1"


class FakeDolphin:
    def __init__(self, port: int = 0):
        self.device = {
            "Power": "OFF",
            "Temperature": 31,
            "targetTemperature": 0,
            "Energy": 0,
            "Shabbat": "OFF",
            "fixedTemperature": "OFF",
            "showerTemperature": [{"temp": 38}, {"temp": 45}, {"temp": 52}, {"temp": 58}],
        }
        self.calls: list[tuple[str, dict]] = []
        self.offline = False
        self.outage: str | None = None
        self.api_key = API_KEY
        # What getAPIkey sends for a wrong login. The real server sends "failed".
        self.bad_login_reply = "failed"
        fake = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def do_GET(self):
                self.send_response(404)
                self.end_headers()

            def do_POST(self):
                m = re.match(r"^/HA/V1/+([A-Za-z]+)\.php$", self.path)
                n = int(self.headers.get("Content-Length") or 0)
                fields = dict(urllib.parse.parse_qsl(self.rfile.read(n).decode()))
                handler = m and getattr(fake, "h_" + m.group(1), None)
                if not handler:
                    self.send_response(404)
                    self.end_headers()
                    return
                fake.calls.append((m.group(1), fields))
                if fake.outage == "drop":
                    self.close_connection = True
                    self.connection.close()
                    return
                if fake.outage == "http500":
                    self._send(500, "text/plain", "Internal Server Error")
                    return
                if fake.outage == "garbage":
                    self._send(200, "text/html", "<html>maintenance</html>")
                    return
                if fake.offline and "deviceName" in fields and fake._owns(fields):
                    out = {"error": "Device is offline"}
                else:
                    out = handler(fields)
                if isinstance(out, str):
                    self._send(200, "text/plain", out)
                else:
                    self._send(200, "application/json", json.dumps(out))

            def _send(self, code, ctype, body):
                data = body.encode()
                self.send_response(code)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

        self.server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
        self.base_url = f"http://127.0.0.1:{self.server.server_address[1]}/HA/V1"

    # --- lifecycle ---
    def start(self):
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        return self

    def stop(self):
        self.server.shutdown()
        self.server.server_close()

    def revoke_key(self):
        self.api_key = f"{API_KEY}-{len(self.calls)}"

    def endpoints(self) -> list[str]:
        return [c[0] for c in self.calls]

    # --- simulation ---
    def _authed(self, f):
        return f.get("email") == EMAIL and f.get("API_Key") == self.api_key

    def _owns(self, f):
        return self._authed(f) and f.get("deviceName") == DEVICE

    def _tick(self):
        d = self.device
        if d["Power"] == "ON" and d["Temperature"] < d["targetTemperature"]:
            d["Temperature"] = min(d["targetTemperature"], d["Temperature"] + 2)
        if d["Power"] == "ON" and d["Temperature"] >= d["targetTemperature"] and d["fixedTemperature"] == "OFF":
            d["Power"] = "OFF"
        d["Energy"] = 13.2 if d["Power"] == "ON" else 0

    def _cmd(self, f, change):
        if not self._owns(f):
            return {"error": "unauthorized"}
        change()
        return {"ok": True}

    def h_getAPIkey(self, f):
        return self.api_key if f.get("email") == EMAIL and f.get("password") == PASSWORD else self.bad_login_reply

    def h_getDevices(self, f):
        return [{"deviceName": DEVICE}] if self._authed(f) else {"error": "unauthorized"}

    def h_getMainScreenData(self, f):
        if not self._owns(f):
            return {"error": "unauthorized"}
        self._tick()
        return dict(self.device)

    def h_turnOnManually(self, f):
        return self._cmd(f, lambda: self.device.update(Power="ON", targetTemperature=float(f["temperature"])))

    def h_turnOffManually(self, f):
        return self._cmd(f, lambda: self.device.update(Power="OFF"))

    def h_enableShabbat(self, f):
        return self._cmd(f, lambda: self.device.update(Shabbat="ON"))

    def h_disableShabbat(self, f):
        return self._cmd(f, lambda: self.device.update(Shabbat="OFF"))


if __name__ == "__main__":
    fake = FakeDolphin(port=4100)
    print(f"Fake Dolphin API on {fake.base_url}")
    print(f"Login: {EMAIL} / {PASSWORD}  (device {DEVICE})")
    print("Run the app with DOLPHIN_BASE_URL set to that address. Ctrl+C to stop.")
    try:
        fake.server.serve_forever()
    except KeyboardInterrupt:
        pass
