// src/components/terrain/ModelDisclosure.tsx
// STRATFIT — Model Disclosure (Legal Footer)
// 11px, rgba(255,255,255,0.4). Divider line above. No red warnings. No modal.

import React from "react";

const ModelDisclosure: React.FC = () => {
  return (
    <div
      style={{
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        padding: "12px 20px 16px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: "rgba(255, 255, 255, 0.25)",
          marginBottom: 6,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Model Disclosure
      </div>
      <p
        style={{
          fontSize: 11,
          lineHeight: 1.5,
          color: "rgba(255, 255, 255, 0.35)",
          fontFamily: "'Inter', sans-serif",
          margin: 0,
          maxWidth: 720,
        }}
      >
        This model presents probabilistic scenarios derived from user inputs and
        statistical assumptions. Outputs are indicative and do not constitute
        financial advice. Strategic decisions remain the responsibility of the
        user.
      </p>
    </div>
  );
};

export default ModelDisclosure;





