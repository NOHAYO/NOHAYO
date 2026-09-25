import React from "react";
import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/today", label: "Today", icon: "☀" },
  { to: "/timeline", label: "Timeline", icon: "⏱" },
  { to: "/insights", label: "Insights", icon: "💡" },
  { to: "/journal", label: "Journal", icon: "📔" },
  { to: "/family", label: "Family", icon: "👪" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
          <span className="icon">{t.icon}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
