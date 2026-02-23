import InitializeForm from "./InitializeForm";

export default function InitializePage() {
  return (
    <div style={{ paddingTop: 72, display: "flex", justifyContent: "center" }}>
      <div style={{ width: 880 }}>
        <h1 style={{ marginBottom: 8 }}>Initialize</h1>
        <p style={{ opacity: 0.7, marginBottom: 24 }}>
          Enter baseline financial and strategic assumptions to build your landscape.
        </p>
        <InitializeForm />
      </div>
    </div>
  );
}
