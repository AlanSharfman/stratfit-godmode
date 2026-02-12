import { useNavigate } from "react-router-dom";

interface SoftGateOverlayProps {
  message?: string;
}

export default function SoftGateOverlay({
  message = "Complete onboarding to unlock this view.",
}: SoftGateOverlayProps) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backdropFilter: "blur(6px)",
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "#111",
          padding: "32px",
          borderRadius: "12px",
          textAlign: "center",
          maxWidth: "420px",
          pointerEvents: "auto",
        }}
      >
        <h2 style={{ marginBottom: "16px" }}>Baseline Required</h2>
        <p style={{ opacity: 0.8, marginBottom: "24px" }}>{message}</p>
        <button
          onClick={() => navigate("/initialize")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: "#00CFFF",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Go to Onboarding
        </button>
      </div>
    </div>
  );
}
