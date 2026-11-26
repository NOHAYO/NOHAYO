# Dolphin boiler for your PC (Python)

A small desktop app to control a Dolphin smart boiler from your computer:

- sign in with your Dolphin app email and password
- see the water temperature and whether it's heating
- heat water for 1, 2, 3 or 4 showers
- turn Shabbat mode on or off
- stop heating

It opens a window by default, and also has a command line for quick checks.
It uses only Python's standard library (plus the optional `keyring` package
for remembering your sign-in), so there is almost nothing to install.

> **Heads-up:** Dolphin has no public API. The app uses the same endpoints as
> the community Home Assistant integration and the NOHAYO web backend
> (`web/backend/src/integrations/dolphin.js`). They are educated guesses until
> they've been tried on a real boiler, which is what the first check below is for.

## Your password

Your Dolphin password is **never saved**. It is sent once to Dolphin to get a
sign-in key, and only that key is kept, in your computer's own password store
(Windows Credential Manager or macOS Keychain). "Sign out" deletes it. If the
password store isn't available, nothing secret is written to disk and you
just sign in each time the app opens. (The command line then can't stay
signed in between commands, so the launchers install `keyring` for you.)

## Install (once)

1. Install Python 3.10 or newer from <https://www.python.org/downloads/>.
   On Windows, tick **"Add python.exe to PATH"** in the installer.
2. Get this folder (`desktop/boiler-py`) onto your PC: download the repository
   from GitHub as a ZIP and unzip it, or `git clone` it.

## Safe first check on the real boiler

Do this once, while you're home and can hear or see the boiler. It reads the
status, heats briefly to a low 40 °C, and turns it off again.

Open a terminal **in the `desktop/boiler-py` folder**
(Windows: open the folder in File Explorer, type `cmd` in the address bar and
press Enter). Then run these one at a time and read the output before the next:

| Step | Windows | Mac / Linux | What you should see |
|---|---|---|---|
| 1. Sign in | `boiler.bat login` | `./boiler.sh login` | "Signed in as ... Boiler: <name>" |
| 2. Read status | `boiler.bat status` | `./boiler.sh status` | The water temperature, roughly what the Dolphin phone app shows |
| 3. Short heat to 40 °C | `boiler.bat heat 40` | `./boiler.sh heat 40` | "heating ON, to 40 °C" (if the water is already above 40 °C it may switch straight off; that's fine) |
| 4. Check | `boiler.bat status` | `./boiler.sh status` | Heating shows ON in this app **and** in the Dolphin phone app |
| 5. Off | `boiler.bat stop` | `./boiler.sh stop` | "Stop sent." and heating off |
| 6. Confirm | (look at the Dolphin phone app) | | The boiler shows as off |

If step 1 or 2 fails, nothing was sent to the boiler, so it's safe; send the
error text to Claude. If step 3 works but step 5 doesn't, **turn the boiler
off from the Dolphin phone app** and report it.

After that passes, open the window by double-clicking `boiler.bat` (Windows)
or running `./boiler.sh` (Mac/Linux).

## Using the window

- **N showers** heats to the temperature your boiler has set for that many
  showers. If the water is already hot enough, it does nothing.
- **Stop heating** turns heating off straight away.
- **Turn Shabbat on/off** switches Shabbat mode. While it's on, the app won't
  start heating (Stop still works).
- The temperature refreshes every 30 seconds, or press **Refresh**.

## Command line

```
boiler.bat status            # or ./boiler.sh status
boiler.bat heat 45           # heat now until 45 °C (20 to 71)
boiler.bat showers 2         # heat enough water for 2 showers
boiler.bat shabbat on|off
boiler.bat stop
boiler.bat devices           # list boilers; use --device NAME to pick one
boiler.bat logout            # forget the saved sign-in
```

## Try it without a boiler

A fake Dolphin server is included for trying the app safely:

```
python tests/fake_dolphin.py                                   # terminal 1
set DOLPHIN_BASE_URL=http://127.0.0.1:4100/HA/V1  (Windows)    # terminal 2
export DOLPHIN_BASE_URL=http://127.0.0.1:4100/HA/V1  (Mac/Linux)
boiler.bat                                                      # sign in as demo@example.com / demo-password
```

## Tests

```
python -m pip install -r requirements-dev.txt
python -m pytest
```

The tests run every feature against the fake server, including a wrong
password, an expired sign-in key, an offline boiler, a Dolphin outage, and
checks that the password and key never land in a file.

## Files

- `dolphin_boiler/client.py` talks to the Dolphin cloud API
- `dolphin_boiler/boiler.py` the actions and safety rules (Shabbat, showers, stop)
- `dolphin_boiler/credentials.py` where the sign-in key is kept
- `dolphin_boiler/gui.py` the window (tkinter)
- `dolphin_boiler/cli.py` the command line
- `tests/fake_dolphin.py` the fake Dolphin server
