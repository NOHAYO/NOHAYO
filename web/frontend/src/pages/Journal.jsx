import React, { useEffect, useState } from "react";
import { useApp } from "../AppContext.jsx";
import { api } from "../api/client.js";

export default function Journal() {
  const { child } = useApp();
  const [entries, setEntries] = useState(null);
  const [text, setText] = useState("");
  const [showForm, setShowForm] = useState(false);

  const reload = () => api.listJournal(child.id).then(setEntries);

  useEffect(() => {
    if (child) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  if (!child || entries === null) return <div className="screen">Loading…</div>;

  const addEntry = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await api.createJournalEntry(child.id, { text });
    setText("");
    setShowForm(false);
    reload();
  };

  return (
    <div className="screen">
      <h1 className="headline" style={{ fontSize: 26 }}>Journal</h1>
      <p className="muted" style={{ marginTop: 4 }}>Private to you. Only you can read what you write here.</p>

      {showForm ? (
        <form onSubmit={addEntry} style={{ marginTop: 18 }}>
          <textarea placeholder="Today I noticed…" rows={5} value={text} onChange={(e) => setText(e.target.value)} required />
          <button className="btn btn-primary" style={{ marginTop: 10 }} type="submit">Save entry</button>
        </form>
      ) : (
        <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setShowForm(true)}>
          + Write an entry
        </button>
      )}

      <div style={{ marginTop: 20 }}>
        {entries.length === 0 && <div className="card-outlined">Nothing written yet. This space is just for you to reflect.</div>}
        {entries.map((e) => (
          <div key={e.id} className="card-outlined">
            <span className="muted">{new Date(e.timestamp).toLocaleDateString()} · {e.author}</span>
            <p style={{ marginTop: 8 }}>{e.text}</p>
            {e.isPrivate && <span className="badge" style={{ marginTop: 10, background: "var(--bg-cream-deep)", color: "var(--text-muted)" }}>🔒 Private</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
