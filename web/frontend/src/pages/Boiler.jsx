import React, { useCallback, useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { api } from "../api/client.js";

const MIN_TEMP = 20;
const MAX_TEMP = 71;
const REFRESH_MS = 30_000;

/** Controls for a linked Dolphin smart boiler. */
export default function Boiler() {
  const [state, setState] = useState(null); // { linked, email, devices }
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setState(await api.getBoiler());
      setError("");
    } catch (err) {
      setError(err.message);
      setState((s) => s ?? { linked: true, devices: [] });
    }
  }, []);

  useEffect(() => {
    reload();
    const id = setInterval(reload, REFRESH_MS);
    return () => clearInterval(id);
  }, [reload]);

  const replaceDevice = (status) =>
    setState((s) => ({ ...s, devices: s.devices.map((d) => (d.deviceName === status.deviceName ? status : d)) }));

  const unlink = async () => {
    if (!window.confirm("Disconnect your Dolphin account from NOHAYO?")) return;
    await api.unlinkBoiler();
    reload();
  };

  return (
    <div className="screen">
      <TopBar title="Home boiler" />
        {state === null ? (
          "Loading…"
        ) : !state.linked ? (
          <LinkForm onLinked={reload} />
        ) : (
          <>
            {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
            {state.devices.length === 0 && !error && <p className="muted">No boilers on this Dolphin account.</p>}
            {state.devices.map((d) => (
              <DeviceCard key={d.deviceName} device={d} onChange={replaceDevice} />
            ))}
            {state.email && (
              <p className="muted" style={{ marginTop: 18, textAlign: "center" }}>
                Connected as {state.email} · updates every 30 seconds
              </p>
            )}
            <button className="btn btn-link" onClick={unlink}>Disconnect Dolphin account</button>
          </>
        )}
    </div>
  );
}

function LinkForm({ onLinked }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.linkBoiler(email, password);
      setPassword("");
      onLinked();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <h1 className="headline" style={{ fontSize: 26 }}>Connect your Dolphin boiler</h1>
      <p className="muted" style={{ marginTop: 10 }}>
        Sign in with the email and password you use in the Dolphin app. Your password is used once to get an
        access key and is not stored.
      </p>
      <div className="col gap-12" style={{ marginTop: 22 }}>
        <input type="email" placeholder="Dolphin email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        <input type="password" placeholder="Dolphin password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </div>
      {error && <div className="error-text">{error}</div>}
      <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={busy} type="submit">
        {busy ? "Connecting…" : "Connect"}
      </button>
    </form>
  );
}

function DeviceCard({ device: d, onChange }) {
  const [target, setTarget] = useState(d.targetTemperature ?? 55);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      onChange(await fn());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const locked = d.shabbat || busy;
  const statusLine = d.shabbat
    ? "Shabbat mode — controls are paused"
    : d.power
      ? `Heating to ${d.targetTemperature ?? "?"}°${d.fixedTemperature ? " · holding" : ""}`
      : "Not heating";

  return (
    <div className="card-outlined" style={{ marginBottom: 14 }}>
      <div className="row-center">
        <div className="col" style={{ flex: 1 }}>
          <div className="label">{d.deviceName}</div>
          <div className="headline" style={{ fontSize: 44, marginTop: 6 }}>
            {d.temperature ?? "–"}<span style={{ fontSize: 22 }}>°C</span>
          </div>
          <span className="muted">{statusLine}</span>
        </div>
        <span
          className="badge"
          style={{
            background: d.power ? "var(--peach)" : "var(--bg-cream-deep)",
            color: d.power ? "var(--terracotta-dark)" : "var(--text-muted)",
          }}
        >
          {d.power ? "🔥 On" : "Off"}
        </span>
      </div>

      {d.showers.length > 0 && (
        <>
          <div className="divider" />
          <div className="label">Hot water for</div>
          <div className="row gap-8" style={{ flexWrap: "wrap", marginTop: 10 }}>
            {d.showers.map((s) => {
              const ready = d.temperature !== null && s.temperature !== null && d.temperature >= s.temperature;
              return (
                <button
                  key={s.count}
                  className={`chip${ready ? " selected" : ""}`}
                  disabled={locked || ready}
                  title={`Needs ${s.temperature}°C`}
                  style={{ width: "auto", fontWeight: 700 }}
                  onClick={() => run(() => api.boilerShowers(d.deviceName, s.count))}
                >
                  {s.count} 🚿{ready ? " ✓" : ""}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="divider" />
      <div className="row-center">
        <div className="label" style={{ flex: 1 }}>Heat to</div>
        <strong>{target}°C</strong>
      </div>
      <input
        type="range"
        min={MIN_TEMP}
        max={MAX_TEMP}
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        disabled={locked}
        style={{ width: "100%", marginTop: 8, padding: 0, accentColor: "var(--terracotta)" }}
        aria-label="Target temperature"
      />
      <div className="row gap-8" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" disabled={locked} onClick={() => run(() => api.boilerHeat(d.deviceName, target))}>
          Heat now
        </button>
        <button className="btn btn-outline" disabled={locked || !d.power} onClick={() => run(() => api.boilerOff(d.deviceName))}>
          Stop
        </button>
      </div>

      <div className="divider" />
      <Toggle
        label="Keep at this temperature"
        hint={d.fixedTemperature ? `Holding ${d.targetTemperature ?? target}°C` : "Hold the water hot all the time"}
        on={d.fixedTemperature}
        disabled={locked}
        onToggle={() => run(() => api.boilerFixed(d.deviceName, d.fixedTemperature ? null : target))}
      />
      <Toggle
        label="Shabbat mode"
        hint="Same as Shabbat mode in the Dolphin app"
        on={d.shabbat}
        disabled={busy}
        onToggle={() => run(() => api.boilerShabbat(d.deviceName, !d.shabbat))}
      />

      {error && <div className="error-text">{error}</div>}
    </div>
  );
}

function Toggle({ label, hint, on, disabled, onToggle }) {
  return (
    <div className="row-center" style={{ marginTop: 10 }}>
      <div className="col" style={{ flex: 1 }}>
        <strong>{label}</strong>
        <span className="muted">{hint}</span>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        style={{
          width: 52, height: 30, padding: 3, borderRadius: 15, flexShrink: 0,
          background: on ? "var(--green)" : "var(--line)", display: "flex",
          justifyContent: on ? "flex-end" : "flex-start", opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{ width: 24, height: 24, borderRadius: 12, background: "var(--white)", display: "block" }} />
      </button>
    </div>
  );
}
