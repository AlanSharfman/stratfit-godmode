document.getElementById("load-comparison").addEventListener("click", async () => {
  const ids = document
    .getElementById("run-ids")
    .value.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length < 2) return alert("Select at least two run IDs");

  const tableContainer = document.getElementById("compare-table-container");
  tableContainer.innerHTML = "";

  const rows = [["Metric", ...ids]];
  const strategyStack = [];

  for (const id of ids) {
    let run;
    try {
      const res = await fetch(`/api/run/${id}`);
      run = await res.json();
    } catch {
      // fallback (simulate)
      run = {
        runId: id,
        alpha: +(Math.random() * 10 + 2).toFixed(2),
        confidence: +(Math.random() * 20 + 70).toFixed(2),
        strategy: ["DEFENSIVE", "NEUTRAL", "ACCUMULATE"][Math.floor(Math.random() * 3)],
        tacticalPlays: [],
        projectedImpact: null,
      };
    }

    strategyStack.push(run);
  }

  // Build comparison rows
  rows.push(["Strategy", ...strategyStack.map((r) => r.strategy)]);
  rows.push(["Alpha (%)", ...strategyStack.map((r) => r.alpha)]);
  rows.push(["Confidence (%)", ...strategyStack.map((r) => r.confidence)]);
  rows.push(["Tactical Plays", ...strategyStack.map((r) => r.tacticalPlays?.join(" | ") || "—")]);

  const table = document.createElement("table");
  table.className = "compare-table";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const el = document.createElement("td");
      el.textContent = cell;
      tr.appendChild(el);
    });
    table.appendChild(tr);
  });

  tableContainer.appendChild(table);
  document.getElementById("export-strategy-stack").disabled = false;

  window.strategyStack = strategyStack;
});

document.getElementById("export-strategy-stack").addEventListener("click", () => {
  const stack = window.strategyStack;
  const blob = new Blob([JSON.stringify(stack, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "strategy-stack.json";
  a.click();
  URL.revokeObjectURL(url);
});


