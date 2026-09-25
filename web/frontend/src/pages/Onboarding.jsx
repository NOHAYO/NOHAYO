import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../AppContext.jsx";
import { api } from "../api/client.js";

export default function Onboarding() {
  const { setChild } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [about, setAbout] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const child = await api.createChild({ name, birthDate, aboutText: about });
      setChild(child);
      navigate("/today");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen" style={{ paddingTop: 40 }}>
      <div className="label">Step 1 of 1 · About your child</div>
      <h1 className="headline" style={{ fontSize: 26, marginTop: 8 }}>Tell us about your child</h1>

      <form onSubmit={submit} style={{ marginTop: 22 }}>
        <div className="col gap-12">
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>Child's name</div>
            <input placeholder="e.g. Noa" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>Birth date</div>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>In your own words</div>
            <textarea placeholder="Curious, watches faces closely, calms down when we sing." value={about} onChange={(e) => setAbout(e.target.value)} />
            <div className="muted" style={{ marginTop: 6 }}>We never ask diagnostic questions.</div>
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={busy} type="submit">
          {busy ? "Setting up…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
