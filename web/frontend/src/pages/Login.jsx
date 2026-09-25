import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../AppContext.jsx";

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@nohayo.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/today");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen" style={{ paddingTop: 64 }}>
      <div className="label">The Plan</div>
      <h1 className="headline" style={{ fontSize: 30, marginTop: 10 }}>Welcome back</h1>
      <p className="muted" style={{ marginTop: 10 }}>Sign in to the record you've been keeping.</p>

      <form onSubmit={submit} style={{ marginTop: 28 }}>
        <div className="col gap-12">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="muted" style={{ marginTop: 18, textAlign: "center" }}>
        Try the seeded demo: <strong>demo@nohayo.com</strong> / <strong>password123</strong>
      </div>

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <Link to="/signup">I don't have an account yet</Link>
      </div>
    </div>
  );
}
