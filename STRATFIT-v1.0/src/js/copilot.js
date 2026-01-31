const chatInput = document.getElementById("chat-input");
const chatHistory = document.getElementById("chat-history");

if (chatInput) {
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") window.submitChat();
  });
}

window.submitChat = async function submitChat() {
  const input = document.getElementById("chat-input");
  const history = document.getElementById("chat-history");
  if (!input || !history) return;

  const userMsg = input.value.trim();
  if (!userMsg) return;

  history.innerHTML += `<div><strong>You:</strong> ${escapeHtml(userMsg)}</div>`;

  const response = await handleQuery(userMsg);
  history.innerHTML += `<div><strong>STRATFIT:</strong> ${escapeHtml(response)}</div>`;

  input.value = "";
  history.scrollTop = history.scrollHeight;
};

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

async function safeDecisionHistory() {
  try {
    const res = await fetch("/api/decision-history");
    return await res.json();
  } catch {
    return JSON.parse(localStorage.getItem("decisionAudit") || "[]");
  }
}

async function handleQuery(query) {
  query = query.toLowerCase();

  if (query.includes("best") && query.includes("alpha")) {
    const runs = await safeDecisionHistory();
    if (!runs.length) return "No decision history found.";
    const best = runs.slice().sort((a, b) => (b.alpha || 0) - (a.alpha || 0))[0];
    return `The best alpha was ${best.alpha}% in run ${best.runId} under the ${best.strategy} strategy.`;
  }

  if (query.includes("compare") && query.includes("defensive")) {
    const runs = (await safeDecisionHistory()).filter((r) => r.strategy === "DEFENSIVE");
    const good = runs.filter((r) => (r.sharpe || 0) > 0.5);
    return `Found ${good.length} DEFENSIVE strategies with Sharpe > 0.5.`;
  }

  if (query.includes("explain") && query.includes("sim-2026")) {
    return "SIM-2026-X7 was approved due to high alpha (6.4%) and acceptable risk skew. Confidence was 92%.";
  }

  return "I’m still learning. Try asking about alpha, strategies, or decisions.";
}


