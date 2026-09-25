import React, { useEffect, useState } from "react";
import { useApp } from "../AppContext.jsx";
import { api } from "../api/client.js";

const ROLE_LABELS = {
  primary_parent: "Primary parent",
  co_parent: "Co-parent",
  guardian: "Guardian",
  viewer_only: "Viewer-only",
};

export default function Family() {
  const { child, logout } = useApp();
  const [members, setMembers] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("co_parent");

  const reload = () => api.listFamily(child.id).then(setMembers);

  useEffect(() => {
    if (child) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  if (!child || members === null) return <div className="screen">Loading…</div>;

  const invite = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.inviteFamilyMember(child.id, { name, role });
    setName("");
    setShowForm(false);
    reload();
  };

  return (
    <div className="screen">
      <h1 className="headline" style={{ fontSize: 26 }}>{child.name}'s family</h1>

      <div className="card-outlined" style={{ marginTop: 18 }}>
        {members.map((m, i) => (
          <div key={m.id}>
            {i > 0 && <div className="divider" />}
            <div className="row-center gap-12">
              <div className="avatar">{m.name[0]?.toUpperCase()}</div>
              <div className="col" style={{ flex: 1 }}>
                <strong>{m.name}</strong>
                <span className="muted">{ROLE_LABELS[m.role]}</span>
              </div>
              <span className="badge" style={{ background: m.status === "pending" ? "var(--bg-cream-deep)" : "var(--peach)", color: m.status === "pending" ? "var(--text-muted)" : "var(--terracotta-dark)" }}>
                {m.status === "pending" ? "Pending" : "Full access"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={invite} className="card-outlined" style={{ marginTop: 14 }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ marginBottom: 10 }} />
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ marginBottom: 10, width: "100%", padding: 10, borderRadius: 14, border: "1.2px solid var(--line)" }}>
            <option value="co_parent">Co-parent</option>
            <option value="guardian">Guardian</option>
            <option value="viewer_only">Viewer-only</option>
          </select>
          <button className="btn btn-primary" type="submit">Send invite</button>
        </form>
      ) : (
        <button className="btn btn-outline" style={{ marginTop: 14 }} onClick={() => setShowForm(true)}>
          + Invite someone
        </button>
      )}

      <p className="muted" style={{ marginTop: 18, textAlign: "center" }}>
        Each child has one profile. Siblings are never compared anywhere in the app.
      </p>

      <button className="btn btn-link" style={{ marginTop: 8 }} onClick={logout}>
        Sign out
      </button>
    </div>
  );
}
