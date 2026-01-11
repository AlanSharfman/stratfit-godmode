// src/pitch/api/server.ts
// STRATFIT — API Server for Pitch Export
// Can be run standalone or integrated with Vite

import express from "express";
import cors from "cors";
import { exportPitch } from "./exportPitch";

const app = express();
const PORT = process.env.PITCH_API_PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "stratfit-pitch-api" });
});

// Export pitch to PDF
app.get("/api/export-pitch", async (_req, res) => {
  try {
    console.log("📄 Generating investor deck...");
    const url = await exportPitch();
    console.log(`✅ Deck ready: ${url}`);
    res.json({ url, success: true });
  } catch (error) {
    console.error("❌ Export failed:", error);
    res.status(500).json({ 
      error: "Failed to export pitch deck", 
      details: error instanceof Error ? error.message : "Unknown error",
      success: false 
    });
  }
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 STRATFIT Pitch API running on http://localhost:${PORT}`);
    console.log(`   📄 Export endpoint: http://localhost:${PORT}/api/export-pitch`);
  });
}

export { app };

