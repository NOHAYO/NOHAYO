"""A fake Open-Meteo forecast API for tests and trying the monitor offline.

    python tests/fake_weather.py   # serves on http://127.0.0.1:4101/v1/forecast

Set fake.current to change the weather, fake.outage = True for HTTP 500.
"""

from __future__ import annotations

import json
import threading
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class FakeWeather:
    def __init__(self, port: int = 0):
        self.current = {
            "time": "2026-11-26T10:00",
            "interval": 900,
            "temperature_2m": 21.4,
            "relative_humidity_2m": 58,
            "precipitation": 0.0,
            "rain": 0.0,
            "cloud_cover": 20,
            "uv_index": 3.1,
            "shortwave_radiation": 480.0,
            "wind_speed_10m": 9.5,
            "is_day": 1,
            "weather_code": 1,
        }
        self.outage = False
        self.queries: list[dict] = []
        fake = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def do_GET(self):
                u = urllib.parse.urlparse(self.path)
                if u.path != "/v1/forecast":
                    self.send_response(404)
                    self.end_headers()
                    return
                q = dict(urllib.parse.parse_qsl(u.query))
                fake.queries.append(q)
                if fake.outage:
                    self.send_response(500)
                    self.end_headers()
                    return
                wanted = q.get("current", "").split(",")
                cur = {k: v for k, v in fake.current.items() if k in wanted or k in ("time", "interval")}
                body = json.dumps({
                    "latitude": float(q.get("latitude", 0)), "longitude": float(q.get("longitude", 0)),
                    "timezone": q.get("timezone", "GMT"), "current": cur,
                }).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

        self.server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}/v1/forecast"

    def start(self):
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        return self

    def stop(self):
        self.server.shutdown()
        self.server.server_close()


if __name__ == "__main__":
    fake = FakeWeather(port=4101)
    print(f"Fake Open-Meteo on {fake.url}  (set OPEN_METEO_URL to it)")
    try:
        fake.server.serve_forever()
    except KeyboardInterrupt:
        pass
