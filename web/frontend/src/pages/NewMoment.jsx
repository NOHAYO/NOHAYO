import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../AppContext.jsx";
import { api } from "../api/client.js";
import { DOMAIN_CHIPS } from "../domains.js";
import TopBar from "../components/TopBar.jsx";

export default function NewMoment() {
  const { child } = useApp();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [domain, setDomain] = useState("__decide__");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.createMoment(child.id, {
        text: text.trim(),
        domain: domain === "__decide__" ? undefined : domain,
      });
      navigate("/today");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <TopBar title="New moment" onClose={() => navigate(-1)} />
      <h1 className="headline" style={{ fontSize: 25, marginTop: 8 }}>What did you notice?</h1>

      <form onSubmit={submit} style={{ marginTop: 16 }}>
        <textarea
          placeholder="She turned her head toward the sound of the door and smiled."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          required
        />
        <p className="muted" style={{ marginTop: 8 }}>Try: "Reached for the rattle." "Laughed at the dog."</p>

        <div style={{ marginTop: 18, fontWeight: 700, fontSize: 14.5 }}>Where does it fit?</div>
        <div style={{ marginTop: 10 }}>
          {DOMAIN_CHIPS.map(([key, label]) => (
            <span key={key} className={`chip${domain === key ? " selected" : ""}`} onClick={() => setDomain(key)}>
              {label}
            </span>
          ))}
        </div>
        <p className="muted">We suggest a place. You can always change it.</p>

        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={busy} type="submit">
          {busy ? "Saving…" : `Save to ${child?.name}'s timeline`}
        </button>
      </form>
    </div>
  );
}
