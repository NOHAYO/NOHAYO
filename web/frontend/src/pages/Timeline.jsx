import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../AppContext.jsx";
import { api } from "../api/client.js";
import { domainColor, domainLabel } from "../domains.js";

function ageAt(birthDate, at) {
  const diff = new Date(at).getTime() - new Date(birthDate).getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
}

export default function Timeline() {
  const { child } = useApp();
  const [filter, setFilter] = useState("all");
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!child) return;
    Promise.all([api.listMoments(child.id), api.listInsights(child.id)]).then(([moments, insights]) => {
      const all = [
        ...moments.map((m) => ({ ts: m.timestamp, isInsight: false, data: m })),
        ...insights.map((i) => ({ ts: i.createdAt, isInsight: true, data: i })),
      ].sort((a, b) => new Date(b.ts) - new Date(a.ts));
      setEntries(all);
    });
  }, [child]);

  if (!child) return null;

  const filtered = entries.filter((e) => {
    if (filter === "moments") return !e.isInsight;
    if (filter === "insights") return e.isInsight;
    return true;
  });

  let lastAge = null;

  return (
    <div className="screen">
      <h1 className="headline" style={{ fontSize: 25 }}>{child.name}'s story so far</h1>
      <div style={{ marginTop: 16 }}>
        {["all", "moments", "insights"].map((f) => (
          <span key={f} className={`chip${filter === f ? " selected" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
          </span>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {filtered.length === 0 && <p className="muted">Nothing here yet. Log a moment from Today to start the story.</p>}
        {filtered.map((e) => {
          const age = ageAt(child.birthDate, e.ts);
          const showHeader = age !== lastAge;
          lastAge = age;
          return (
            <React.Fragment key={`${e.isInsight ? "i" : "m"}-${e.data.id}`}>
              {showHeader && <div className="label" style={{ color: "var(--green-dark)", marginTop: 14, marginBottom: 8 }}>Age {age}</div>}
              {e.isInsight ? (
                <Link to={`/insights/${e.data.id}`} className="card card-green" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                  <div className="label" style={{ color: "var(--green-dark)" }}>💡 Insight</div>
                  <strong style={{ display: "block", marginTop: 6 }}>{e.data.title}</strong>
                  <span className="muted">{e.data.confidenceTier}</span>
                </Link>
              ) : (
                <div className="row-center gap-12" style={{ marginBottom: 12 }}>
                  <span style={{ color: domainColor(e.data.domain), fontSize: 12 }}>■</span>
                  <div className="col">
                    <span>{e.data.text}</span>
                    <span className="muted">{new Date(e.data.timestamp).toLocaleDateString()} · {e.data.author} · {domainLabel(e.data.domain)}</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
