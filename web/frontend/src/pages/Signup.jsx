import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../AppContext.jsx";

export default function Signup() {
  const { signup } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(email, password, name);
      navigate("/onboarding");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen" style={{ paddingTop: 64 }}>
      <div className="label">The Plan</div>
      <h1 className="headline" style={{ fontSize: 30, marginTop: 10 }}>Create your account</h1>
      <p className="muted" style={{ marginTop: 10 }}>No scores. No labels. Just what you notice.</p>

      <form onSubmit={submit} style={{ marginTop: 28 }}>
        <div className="col gap-12">
          <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={busy} type="submit">
          {busy ? "Creating account…" : "Get started"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <Link to="/login">I already have an account</Link>
      </div>
    </div>
  );
}
