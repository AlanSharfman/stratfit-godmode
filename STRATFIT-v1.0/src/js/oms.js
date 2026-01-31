// OMS Integration (Execution Routing) — v1.0
// ES module, but also exposes globals for inline onclick / legacy scripts.

async function postOms(payload) {
  const res = await fetch("/api/oms/queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to queue trade");
  return await res.json().catch(() => ({ status: "ok" }));
}

export async function sendToOMS() {
  const payload = {
    runId: "SIM-2026-X9",
    strategy: "DEFENSIVE",
    weights: {
      "US 10Y": 0.34,
      "Gold": 0.3,
      "Cash": 0.36,
    },
    alpha: 6.4,
    volatility: 12.7,
    confidence: 92,
    approvedBy: "committee",
    timestamp: new Date().toISOString(),
  };

  const statusEl = document.getElementById("oms-status");

  try {
    await postOms(payload);
    if (statusEl) statusEl.innerText = "✅ Trade pushed to OMS.";
  } catch (e) {
    if (statusEl) statusEl.innerText = "❌ OMS push failed.";
    console.error(e);

    // Fallback queue so static package still works offline
    const q = JSON.parse(localStorage.getItem("omsQueue") || "[]");
    q.push({ payload, receivedAt: new Date().toISOString() });
    localStorage.setItem("omsQueue", JSON.stringify(q));
  }
}

// Back-compat: allow existing app code to send arbitrary payloads
export async function sendToOms(payload) {
  try {
    await postOms(payload);
    return { ok: true };
  } catch (e) {
    const q = JSON.parse(localStorage.getItem("omsQueue") || "[]");
    q.push({ payload, receivedAt: new Date().toISOString() });
    localStorage.setItem("omsQueue", JSON.stringify(q));
    return { ok: false, fallback: true };
  }
}

// Expose globals for inline onclick / non-module scripts
window.sendToOMS = sendToOMS;
window.sendToOms = sendToOms;


