import React from "react";

export default function ConfidenceDots({ level, total = 3 }) {
  return (
    <div className="confidence-dots">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`confidence-dot${i < level ? " filled" : ""}`} />
      ))}
    </div>
  );
}
