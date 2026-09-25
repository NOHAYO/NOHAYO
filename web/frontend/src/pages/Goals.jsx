import React, { useEffect, useState } from "react";
import { useApp } from "../AppContext.jsx";
import { api } from "../api/client.js";

export default function Goals() {
  const { child } = useApp();
  const [goals, setGoals] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [what, setWhat] = useState("");
  const [why, setWhy] = useState("");
  const [byWhen, setByWhen] = useState("");

  const reload = () => api.listGoals(child.id).then(setGoals);

  useEffect(() => {
    if (child) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  if (!child || goals === null) return <div className="screen">Loading…</div>;

  const addGoal = async (e) => {
    e.preventDefault();
    if (!what.trim()) return;
    await api.createGoal(child.id, { what, why, byWhen });
    setWhat(""); setWhy(""); setByWhen("");
    setShowForm(false);
    reload();
  };

  const notice = async (id) => {
    await api.noticeGoal(child.id, id);
    reload();
  };

  return (
    <div className="screen">
      <h1 className="headline" style={{ fontSize: 24 }}>{child.name}'s goals</h1>
      <p className="muted" style={{ marginTop: 4 }}>Light and low-pressure. No streaks, no success rate.</p>

      <div style={{ marginTop: 18 }}>
        {goals.length === 0 && !showForm && (
          <div className="card-outlined">No goals yet. Add one yourself, or try a next step from an insight.</div>
        )}
        {goals.map((g) => (
          <div key={g.id} className="card" style={{ background: g.status === "noticed" ? "var(--green-tint)" : "var(--bg-cream-deep)" }}>
            <strong>{g.what}</strong>
            {g.why && <div className="muted" style={{ marginTop: 4 }}>Why: {g.why}</div>}
            {g.byWhen && <div className="muted">By: {g.byWhen}</div>}
            <div style={{ marginTop: 10 }}>
              {g.status === "noticed" ? (
                <span className="badge" style={{ background: "var(--green)", color: "var(--white)" }}>✓ Noticed</span>
              ) : (
                <button className="btn btn-outline" onClick={() => notice(g.id)}>Mark as noticed</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={addGoal} className="card-outlined" style={{ marginTop: 12 }}>
          <input placeholder="What" value={what} onChange={(e) => setWhat(e.target.value)} required style={{ marginBottom: 10 }} />
          <input placeholder="Why (optional)" value={why} onChange={(e) => setWhy(e.target.value)} style={{ marginBottom: 10 }} />
          <input placeholder="By when (optional)" value={byWhen} onChange={(e) => setByWhen(e.target.value)} style={{ marginBottom: 10 }} />
          <button className="btn btn-primary" type="submit">Save goal</button>
        </form>
      ) : (
        <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => setShowForm(true)}>
          + Add a goal
        </button>
      )}
    </div>
  );
}
