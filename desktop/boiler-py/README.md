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

The first time you run `boiler.bat` or `./boiler.sh`, it makes a private
Python environment in a `.venv` folder here and installs `keyring` into it.
Nothing is installed system-wide, so this also works with Homebrew Python on
a Mac. To start over, delete the `.venv` folder.

**Mac with Homebrew Python:** the window needs Tk, which Homebrew ships
separately. If `./boiler.sh` says "no window support", run
`brew install python-tk@3.13` (use your Python version, which the message
shows), delete `.venv`, and run `./boiler.sh` again. The command line works
without it.

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

## Monitor: temperature, weather, energy and early maintenance alerts

The monitor reads the boiler and the outdoor weather **every 10 minutes**,
keeps everything in a log on your Mac, and works out how efficiently the
boiler heats and whether that is getting worse over time. It only *reads*
from Dolphin; it never turns the boiler on or off.

Each sample records, with the real time (UTC and Israel time):

- water temperature, target, and whether the element is heating
- electrical power and current (see "Power and current" below)
- outdoor air temperature, humidity, rain, cloud cover, UV index and
  sunshine (solar radiation, W/m²) at Revivim 78, Rosh HaAyin, from
  [Open-Meteo](https://open-meteo.com) (free, no account)

### Start it (Mac)

```
./boiler.sh login                 # once, if you haven't already
./boiler.sh monitor sample        # one sample now: check it looks right
./boiler.sh monitor config        # check tank size (150 L) and element watts
./boiler.sh monitor install       # run every 10 minutes from now on
```

`install` adds a small launchd job (`~/Library/LaunchAgents/com.nohayo.boiler-monitor.plist`)
that runs while you're logged in and survives restarts. If macOS asks whether
Python may use your keychain, choose **Always Allow** (that's where the
Dolphin sign-in key is). Output goes to `~/Library/Logs/boiler-monitor.log`.
`./boiler.sh monitor uninstall` stops it; the data stays.

Prefer a terminal window? `./boiler.sh monitor run` samples every 10 minutes
until you press Ctrl+C (this also works on Windows and Linux).

### Look at the results

```
./boiler.sh monitor chart         # opens a page with charts in your browser
./boiler.sh monitor report        # the same as text
./boiler.sh monitor export log.csv   # every sample, for Excel/Numbers
```

The chart page shows water vs outdoor temperature with heating times and
sunshine, efficiency per heating cycle, electric vs solar energy per day,
standby heat loss and element power. The log itself is
`~/.config/dolphin-boiler/monitor.db` (SQLite).

### How efficiency is worked out

For each heating cycle:

- **Electrical energy in**: from Dolphin's energy counter if it has one,
  otherwise power × time the element was on.
- **Heat gained by the water**: m·c·ΔT, with 150 L of water and
  c = 4.186 kJ/kg·°C, which is **0.173 kWh per °C** for the whole tank.
- **Corrections from the weather**: the tank's standby loss is learnt from
  quiet nights (element off, no sun, no hot water used) against the outdoor
  temperature, and the solar panels' gain is learnt from sunny hours against
  the sunshine reading. Both are added/removed for each cycle.
- **Efficiency** = heat the element put into the water ÷ electricity in.

An electric element turns nearly all its electricity into heat, so a healthy
tank reads roughly 90–100 %. What matters is **change over time**, so the
monitor compares the first cycles it logged with the latest ones. Cycles
where hot water was used while heating, or that were mostly solar, are kept
in the log but left out of the trend.

It needs a few days to learn the tank (until then it uses typical values and
says so) and a few weeks before trends mean much.

### Maintenance alerts

Alerts appear in `monitor report`, on the chart page, and as a Mac
notification the first time they're raised:

| Alert | When | Likely cause |
|---|---|---|
| Efficiency down | 10 % (warning) / 20 % (critical) below the first cycles | scale on the element or tank floor, thermostat drift → descale/check |
| Element power changed | 10 % less (or more) power than at first | element wear, or one turbo element failed |
| Standby loss up | tank cools 30 % faster when idle | insulation, dripping pressure valve, solar loop flowing back at night |
| Not warming | heating 30+ min with no rise | element, thermostat or breaker failed |
| Overheating | water ≥ 85 °C | thermostat or solar overheat protection |
| Offline | no answer from the boiler for an hour | Wi-Fi, Dolphin cloud, or sign-in |

### Power and current

Dolphin's status reply for this boiler includes `PowerW` (power now) and
`TotalEnergyWh` (energy counter), from the Dolphin energy meter. The monitor
uses them when present, and shows current as power ÷ 220 V. It also stores
each raw Dolphin reply, so nothing is lost if the field names turn out
different.

If a reply has **no** power reading, the monitor says so ("estimated") and
uses the element's rating × the time it was heating. Set the rating from the
label on the boiler: `./boiler.sh monitor config --element-watts 2500`. The
estimate is fine for energy totals, but it can't see an element losing power,
and with 10-minute samples the on-time is only accurate to about ±10 minutes
per cycle. For exact numbers, add a meter on the boiler's circuit, for example:

- a DIN-rail energy meter with Wi-Fi (Shelly Pro EM / Shelly EM with a clamp)
  fitted by an electrician on the boiler breaker, or
- a clamp-on current sensor (CT) on the boiler's live wire with an
  ESP32/Shelly EM reading it.

Only an electrician should work in the switchboard. Tell Claude which meter
you choose and the monitor can read it too.

### Settings

`./boiler.sh monitor config` shows them; change any with e.g.
`--tank-litres 150 --element-watts 2500 --mains-volts 220 --latitude 32.0956 --longitude 34.9567 --interval-min 10`.

## Command line

```
boiler.bat status            # or ./boiler.sh status
boiler.bat heat 45           # heat now until 45 °C (20 to 71)
boiler.bat showers 2         # heat enough water for 2 showers
boiler.bat shabbat on|off
boiler.bat stop
boiler.bat devices           # list boilers; use --device NAME to pick one
boiler.bat logout            # forget the saved sign-in
boiler.bat monitor report    # monitor commands: sample, run, install, chart, report, export, config
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
- `dolphin_boiler/monitor/` the monitor: weather, log, analysis, alerts, charts, launchd
- `tests/fake_dolphin.py` the fake Dolphin server (`fake.meter = True` adds power readings)
- `tests/fake_weather.py` a fake Open-Meteo server
