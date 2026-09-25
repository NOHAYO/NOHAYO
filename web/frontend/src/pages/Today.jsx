import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../AppContext.jsx";
import { api } from "../api/client.js";
import { domainColor } from "../domains.js";
import ConfidenceDots from "../components/ConfidenceDots.jsx";

function ageLabel(birthDate) {
  const years = (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (years < 2) {
    const months = Math.floor(years * 12);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  const y = Math.floor(years);
  return `${y} year${y === 1 ? "" : "s"}`;
}

export default function Today() {
  const { child } = useApp();
  const [moments, setMoments] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!child) return;
    Promise.all([api.listMoments(child.id), api.listInsights(child.id)]).then(([m, insights]) => {
      setMoments(m);
      setInsight(insights.find((i) => i.status === "active") || null);
      setLoading(false);
    });
  }, [child]);

  if (!child) return null;
  if (loading) return <div className="screen">Loading…</div>;

  return (
    <div className="screen">
      <div className="row-center gap-12">
        <div className="avatar">{child.name[0]?.toUpperCase()}</div>
        <div className="col">
          <strong>{child.name}</strong>
          <span className="muted">{ageLabel(child.birthDate)}</span>
        </div>
        <div className="spacer" />
        <span style={{ fontSize: 20 }}>🔔</span>
      </div>

      <div style={{ marginTop: 20 }}>
        {insight ? (
          <div className="card card-green">
            <div className="label" style={{ color: "var(--green-dark)" }}>New insight</div>
            <h2 className="headline" style={{ fontSize: 19, marginTop: 8 }}>{insight.title}</h2>
            <div style={{ marginTop: 10 }}>
              <ConfidenceDots level={insight.confidenceLevel} />
            </div>
            <div className="muted" style={{ marginTop: 4 }}>{insight.confidenceTier}</div>
            <Link to={`/insights/${insight.id}`} className="btn btn-green" style={{ marginTop: 14, textDecoration: "none" }}>
              Read it
            </Link>
          </div>
        ) : (
          <div className="card card-tint">
            <div className="label" style={{ color: "var(--terracotta-dark)" }}>A gentle thing to notice</div>
            <h2 className="headline" style={{ fontSize: 20, marginTop: 8 }}>What did {child.name} choose for themselves today?</h2>
            <p style={{ marginTop: 8 }}>Notice it a few times, then jot it down. Small moments add up to a picture.</p>
            <Link to="/moments/new" className="btn btn-primary" style={{ marginTop: 14, textDecoration: "none" }}>
              🎤 Log a moment
            </Link>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: 16, marginTop: 20, marginBottom: 10 }}>Noticed this week</h3>
      {moments.length === 0 ? (
        <p className="muted">Nothing logged yet. Your first moment will show up here.</p>
      ) : (
        <div className="card-outlined">
          {moments.slice(0, 5).map((m, i) => (
            <div key={m.id}>
              {i > 0 && <div className="divider" />}
              <div className="row-center gap-12">
                <span style={{ color: domainColor(m.domain), fontSize: 20 }}>•</span>
                <div className="col">
                  <span>{m.text}</span>
                  <span className="muted">{new Date(m.timestamp).toLocaleDateString()} · {m.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <Link to="/goals" className="btn btn-outline" style={{ textDecoration: "none", marginBottom: 12 }}>
          🎯 Goals
        </Link>
        <Link to="/moments/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
          🎤 Log a moment
        </Link>
      </div>
    </div>
  );
}
