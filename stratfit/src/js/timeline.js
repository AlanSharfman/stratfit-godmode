document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("timeline");
  if (!container) return;

  const now = Date.now();
  const start = new Date("2025-01-01").getTime(); // anchor point
  const width = container.clientWidth || container.offsetWidth || 800;

  let history = [];
  try {
    const res = await fetch("/api/decision-history");
    history = await res.json();
  } catch {
    history = Array.from({ length: 15 }, (_, i) => {
      const ts = new Date(2025, 0, 1 + i * 30).toISOString();
      return {
        runId: `SIM-${i + 1}`,
        strategy: ["DEFENSIVE", "NEUTRAL", "ACCUMULATE"][i % 3],
        alpha: +(Math.random() * 10 + 2).toFixed(2),
        confidence: +(Math.random() * 15 + 70).toFixed(2),
        timestamp: ts,
      };
    });
  }

  history.forEach((event) => {
    const ts = new Date(event.timestamp).getTime();
    const offset = ((ts - start) / Math.max(1, (now - start))) * width;
    const y = 100 + Math.random() * 300;

    const dot = document.createElement("div");
    dot.className = "timeline-event";
    dot.style.left = `${offset}px`;
    dot.style.top = `${y}px`;
    dot.title = `${event.strategy} | α ${event.alpha}%`;

    dot.style.background =
      event.strategy === "ACCUMULATE" ? "#18D57F" : event.strategy === "DEFENSIVE" ? "#E53935" : "#3DE0F5";

    dot.addEventListener("click", () => {
      window.location.href = `decision.html?run=${event.runId}`;
    });

    const label = document.createElement("div");
    label.className = "timeline-label";
    label.style.left = `${offset}px`;
    label.style.top = `${y + 14}px`;
    label.textContent = `${event.runId}`;

    container.appendChild(dot);
    container.appendChild(label);
  });
});


