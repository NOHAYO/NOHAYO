import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useApp } from "./AppContext.jsx";
import BottomNav from "./components/BottomNav.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Today from "./pages/Today.jsx";
import NewMoment from "./pages/NewMoment.jsx";
import Timeline from "./pages/Timeline.jsx";
import Insights from "./pages/Insights.jsx";
import InsightDetail from "./pages/InsightDetail.jsx";
import Goals from "./pages/Goals.jsx";
import Journal from "./pages/Journal.jsx";
import Family from "./pages/Family.jsx";

const TAB_ROUTES = ["/today", "/timeline", "/insights", "/journal", "/family"];

export default function App() {
  const { user, child, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return <div className="app-shell"><div className="screen">Loading…</div></div>;
  }

  if (!user) {
    return (
      <div className="app-shell">
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="app-shell">
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      </div>
    );
  }

  const showNav = TAB_ROUTES.includes(location.pathname);

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/today" element={<Today />} />
        <Route path="/moments/new" element={<NewMoment />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/insights/:insightId" element={<InsightDetail />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/family" element={<Family />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
      {showNav && <BottomNav />}
    </div>
  );
}
