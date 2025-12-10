// ============================================================================
// STRATFIT — App Container v3.0
// Full-screen, neon-ready root wrapper with global UI polishing
// ============================================================================

import DashboardLayout from "./components/layout/DashboardLayout";

export default function App() {
  return (
    <div
      className="
        w-screen h-screen overflow-hidden
        bg-[#0a0f1a] text-white
        antialiased
      "
    >
      {/* Global App Wrapper */}
      <div className="w-full h-full flex flex-col">
        <DashboardLayout />
      </div>
    </div>
  );
}
