"""Where the sign-in is kept between runs.

The Dolphin password is never saved anywhere. It is sent once to Dolphin to
get an API key, and only that key is kept, in the operating system's own
secret store through the ``keyring`` package (Windows Credential Manager,
macOS Keychain, or the Linux Secret Service). Signing out deletes it.

If ``keyring`` isn't installed or has no working backend, nothing secret is
written to disk: the key lives in memory and you sign in again next time.
The email address and chosen boiler (not secrets) go in a small JSON file.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

SERVICE = "dolphin-boiler-py"


def config_dir() -> Path:
    override = os.environ.get("DOLPHIN_BOILER_HOME")
    if override:
        return Path(override)
    if os.name == "nt":
        return Path(os.environ.get("APPDATA") or Path.home()) / "DolphinBoiler"
    return Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config") / "dolphin-boiler"


def _keyring():
    if os.environ.get("DOLPHIN_NO_KEYRING"):
        return None
    try:
        import keyring  # type: ignore
        from keyring.backends import fail  # type: ignore

        if isinstance(keyring.get_keyring(), fail.Keyring):
            return None
        return keyring
    except Exception:
        return None


class CredentialStore:
    def __init__(self, directory: "Path | str | None" = None, use_keyring: bool = True):
        self.dir = Path(directory) if directory else config_dir()
        self.kr = _keyring() if use_keyring else None
        self._memory_key: str | None = None

    @property
    def persistent(self) -> bool:
        """True when the API key survives closing the app."""
        return self.kr is not None

    @property
    def _settings_path(self) -> Path:
        return self.dir / "settings.json"

    def load_settings(self) -> dict:
        try:
            data = json.loads(self._settings_path.read_text("utf-8"))
            return data if isinstance(data, dict) else {}
        except (OSError, ValueError):
            return {}

    def save_settings(self, **values) -> None:
        data = self.load_settings()
        data.update({k: v for k, v in values.items()})
        data = {k: v for k, v in data.items() if v is not None}
        # Guard against anyone ever passing a secret in here.
        for secret in ("password", "api_key", "API_Key"):
            data.pop(secret, None)
        self.dir.mkdir(parents=True, exist_ok=True)
        self._settings_path.write_text(json.dumps(data, indent=2), "utf-8")

    def get_key(self, email: str) -> str | None:
        if self.kr:
            try:
                return self.kr.get_password(SERVICE, email)
            except Exception:
                return None
        return self._memory_key

    def set_key(self, email: str, key: str) -> None:
        self._memory_key = key
        if self.kr:
            try:
                self.kr.set_password(SERVICE, email, key)
            except Exception:
                self.kr = None  # fall back to memory only

    def clear(self, email: str | None) -> None:
        self._memory_key = None
        if self.kr and email:
            try:
                self.kr.delete_password(SERVICE, email)
            except Exception:
                pass
