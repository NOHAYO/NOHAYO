import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../AppContext.jsx";
import { api } from "../api/client.js";
import { domainColor, domainLabel } from "../domains.js";
import ConfidenceDots from "../components/ConfidenceDots.jsx";

export default function Insights() {
  const { child } = useApp();
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (!child) return;
    api.listInsights(child.id).then(setInsights);
  }, [child]);

  if (!child || insights === null) return <div className="screen">Loading…</div>;

  return (
    <div className="screen">
      <h1 className="headline" style={{ fontSize: 26 }}>Insights</h1>
      <p className="muted" style={{ marginTop: 4 }}>Hypotheses, never verdicts. Every one shows its evidence.</p>

      {insights.length === 0 ? (
        <div className="card-outlined" style={{ marginTop: 18 }}>
          <strong>Nothing yet</strong>
          <p style={{ marginTop: 6 }}>Insights appear once a few related moments build up a pattern, usually after 2-3 logged moments in the same area.</p>
        </div>
      ) : (
        insights.map((ins) => (
          <Link
            key={ins.id}
            to={`/insights/${ins.id}`}
            className={`card ${ins.status === "active" ? "" : ""}`}
            style={{ display: "block", textDecoration: "none", color: "inherit", marginTop: 16, background: ins.status === "active" ? "var(--green-tint)" : "var(--bg-cream-deep)" }}
          >
            <div className="row-center">
              <span className="label" style={{ color: domainColor(ins.domain) }}>{domainLabel(ins.domain)}</span>
              <div className="spacer" />
              {ins.status !== "active" && <span className="badge" style={{ background: "var(--line)", color: "var(--text-muted)" }}>{ins.status === "tried" ? "Tried" : "Not helpful"}</span>}
            </div>
            <strong style={{ display: "block", fontSize: 17, marginTop: 8 }}>{ins.title}</strong>
            <div style={{ marginTop: 8 }}><ConfidenceDots level={ins.confidenceLevel} /></div>
            <span className="muted">{ins.confidenceTier}</span>
          </Link>
        ))
      )}
    </div>
  );
}
