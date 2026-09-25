import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../AppContext.jsx";
import { api } from "../api/client.js";
import { domainColor, domainLabel } from "../domains.js";
import ConfidenceDots from "../components/ConfidenceDots.jsx";
import TopBar from "../components/TopBar.jsx";

export default function InsightDetail() {
  const { child } = useApp();
  const { insightId } = useParams();
  const navigate = useNavigate();
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    if (!child) return;
    api.getInsight(child.id, insightId).then(setInsight);
  }, [child, insightId]);

  if (!insight) return <div className="screen">Loading…</div>;

  const act = async (status) => {
    await api.setInsightStatus(child.id, insight.id, status);
    navigate(-1);
  };

  return (
    <div className="screen">
      <TopBar title="Insight" />
      <span className="label" style={{ color: domainColor(insight.domain) }}>{domainLabel(insight.domain)}</span>
      <h1 className="headline" style={{ fontSize: 23, marginTop: 8 }}>{insight.title}</h1>
      <div style={{ marginTop: 10 }}><ConfidenceDots level={insight.confidenceLevel} /></div>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 4 }}>{insight.confidenceTier}</div>
      <p style={{ marginTop: 12 }}>{insight.summary}</p>

      <div className="card-outlined" style={{ marginTop: 20 }}>
        <strong>Why you are seeing this</strong>
        {insight.evidence.map((m, i) => (
          <div key={m.id} style={{ marginTop: 12 }}>
            {i > 0 && <div className="divider" />}
            <div className="row-center">
              <span className="muted" style={{ flex: 1 }}>{new Date(m.timestamp).toLocaleDateString()}</span>
              <span className="badge" style={{ background: "var(--green-tint)", color: "var(--green-dark)" }}>You noted</span>
            </div>
            <p style={{ marginTop: 4 }}>“{m.text}”</p>
          </div>
        ))}
      </div>

      <div className="card card-green" style={{ marginTop: 4 }}>
        <div className="label" style={{ color: domainColor(insight.domain) }}>One small thing to try</div>
        <strong style={{ display: "block", fontSize: 16, marginTop: 8 }}>{insight.recommendation}</strong>
        <div className="row-center" style={{ marginTop: 10, gap: 8 }}>
          <span className="badge" style={{ background: "var(--white)", color: "var(--text-muted)" }}>{insight.recommendationEffort}</span>
          <span className="badge" style={{ background: "var(--white)", color: "var(--text-muted)" }}>{insight.recommendationFor}</span>
        </div>
      </div>

      <div className="row gap-12" style={{ marginTop: 18 }}>
        <button className="btn btn-green" disabled={insight.status !== "active"} onClick={() => act("tried")}>
          {insight.status === "active" ? "Try a next step" : "Tried"}
        </button>
        <button className="btn btn-outline" disabled={insight.status !== "active"} onClick={() => act("dismissed")}>
          Not helpful
        </button>
      </div>

      <p className="muted" style={{ marginTop: 16, textAlign: "center" }}>
        If something about {child.name}'s development worries you, a qualified professional is the right person to ask.
      </p>
    </div>
  );
}
