"""The actions the app offers, on top of the raw Dolphin client.

Both the window (gui.py) and the command line (cli.py) go through this class,
so the safety rules live in one place:
  * nothing heats while Shabbat mode is on;
  * showers only heat when the water isn't already hot enough;
  * a rejected API key signs you out instead of retrying.
"""

from __future__ import annotations

from .client import MAX_TEMP, MIN_TEMP, DolphinClient, DolphinError, Status, check_temp
from .credentials import CredentialStore


class NotSignedIn(DolphinError):
    def __init__(self):
        super().__init__("Not signed in to Dolphin.", code="unauthorized")


class Boiler:
    def __init__(self, client: DolphinClient | None = None, store: CredentialStore | None = None):
        self.client = client or DolphinClient()
        self.store = store or CredentialStore()
        settings = self.store.load_settings()
        self.email: str | None = settings.get("email")
        self.device: str | None = settings.get("device")

    # --- sign in ---------------------------------------------------------

    @property
    def api_key(self) -> str | None:
        return self.store.get_key(self.email) if self.email else None

    @property
    def signed_in(self) -> bool:
        return bool(self.email and self.api_key)

    def sign_in(self, email: str, password: str) -> list[str]:
        """Swap email + password for an API key and pick a boiler. The password is not kept."""
        email = email.strip()
        if not email or not password:
            raise DolphinError("Enter your Dolphin email and password.", code="bad_login")
        key = self.client.get_api_key(email, password)
        devices = self.client.get_devices(email, key)
        if not devices:
            raise DolphinError("Signed in, but this Dolphin account has no boilers.", code="rejected")
        if self.email and self.email != email:
            self.store.clear(self.email)
        self.email = email
        self.store.set_key(email, key)
        if self.device not in devices:
            self.device = devices[0]
        self.store.save_settings(email=email, device=self.device)
        return devices

    def sign_out(self) -> None:
        self.store.clear(self.email)
        self.store.save_settings(device=None)
        self.device = None

    def devices(self) -> list[str]:
        return self._call(lambda e, k: self.client.get_devices(e, k), need_device=False)

    def choose_device(self, name: str) -> None:
        self.device = name
        self.store.save_settings(device=name)

    def _call(self, fn, need_device: bool = True):
        key = self.api_key
        if not self.email or not key:
            raise NotSignedIn()
        if need_device and not self.device:
            devices = self.client.get_devices(self.email, key)
            if not devices:
                raise DolphinError("This Dolphin account has no boilers.", code="rejected")
            self.choose_device(devices[0])
        try:
            return fn(self.email, key)
        except DolphinError as e:
            if e.code == "unauthorized":
                # Dolphin also says "unauthorized" for "not your boiler"; check the key itself first.
                try:
                    self.client.get_devices(self.email, key)
                except DolphinError as again:
                    if again.code == "unauthorized":
                        self.store.clear(self.email)
                        raise DolphinError("Dolphin no longer accepts the saved sign-in. Please sign in again.", code="unauthorized") from None
            raise

    # --- actions ---------------------------------------------------------

    def status(self) -> Status:
        return self._call(lambda e, k: self.client.get_status(e, k, self.device))

    def _not_shabbat(self, e, k) -> Status:
        s = self.client.get_status(e, k, self.device)
        if s.shabbat:
            raise DolphinError("Shabbat mode is on. Turn it off first to control the boiler.", code="refused")
        return s

    def heat_to(self, temperature: int) -> Status:
        t = check_temp(temperature)

        def go(e, k):
            self._not_shabbat(e, k)
            self.client.turn_on(e, k, self.device, t)
            return self.client.get_status(e, k, self.device)

        return self._call(go)

    def heat_for_showers(self, count: int) -> tuple[Status, bool]:
        """Heat enough water for `count` showers. Returns (status, started_heating)."""
        if count not in (1, 2, 3, 4):
            raise DolphinError("Choose 1 to 4 showers.", code="refused")

        def go(e, k):
            s = self._not_shabbat(e, k)
            shower = s.shower(count)
            if not shower or shower.temperature is None:
                raise DolphinError(f"This boiler has no setting for {count} showers.", code="rejected")
            if s.ready_for(count):
                return s, False
            target = min(MAX_TEMP, max(MIN_TEMP, round(shower.temperature)))
            self.client.turn_on(e, k, self.device, target)
            return self.client.get_status(e, k, self.device), True

        return self._call(go)

    def set_shabbat(self, on: bool) -> Status:
        def go(e, k):
            self.client.set_shabbat(e, k, self.device, on)
            return self.client.get_status(e, k, self.device)

        return self._call(go)

    def stop(self) -> Status | None:
        """Stop heating. Sent straight away, without reading status first, so it works even if status is broken.

        Returns None when the stop went through but the follow-up status read failed.
        """

        def go(e, k):
            self.client.turn_off(e, k, self.device)
            try:
                return self.client.get_status(e, k, self.device)
            except DolphinError:
                return None

        return self._call(go)
