import React from "react";
import { useNavigate } from "react-router-dom";

export default function TopBar({ title, onClose }) {
  const navigate = useNavigate();
  return (
    <div className="top-bar">
      {onClose ? (
        <>
          <div style={{ width: 28 }} />
          <div className="title">{title}</div>
          <button className="back" style={{ paddingRight: 0 }} onClick={onClose} aria-label="Close">
            {"✕"}
          </button>
        </>
      ) : (
        <>
          <button className="back" onClick={() => navigate(-1)} aria-label="Back">
            {"‹"}
          </button>
          <div className="title">{title}</div>
          <div style={{ width: 28 }} />
        </>
      )}
    </div>
  );
}
