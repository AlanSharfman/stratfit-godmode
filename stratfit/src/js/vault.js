document.addEventListener("DOMContentLoaded", async () => {
  const table = document.querySelector("#vault-table tbody");
  const filter = document.getElementById("filter-strategy");

  let history = [];

  try {
    const res = await fetch("/api/decision-history");
    history = await res.json();
  } catch (e) {
    console.warn("Fallback to localStorage");
    history = JSON.parse(localStorage.getItem("decisionAudit") || "[]");
  }

  function render(filtered) {
    table.innerHTML = "";
    filtered.forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.runId}</td>
        <td>${entry.strategy}</td>
        <td>${entry.alpha}%</td>
        <td>${entry.confidence}%</td>
        <td>${entry.user || "n/a"}</td>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td><a href="decision.html?run=${entry.runId}">View</a></td>
      `;
      table.appendChild(row);
    });
  }

  render(history);

  filter.addEventListener("change", () => {
    const val = filter.value;
    const filtered = val ? history.filter(e => e.strategy === val) : history;
    render(filtered);
  });

  document.getElementById("export-csv").addEventListener("click", () => {
    const rows = [
      ["Run ID", "Strategy", "Alpha", "Confidence", "User", "Timestamp"],
      ...history.map(e => [
        e.runId, e.strategy, e.alpha, e.confidence,
        e.user || "n/a", new Date(e.timestamp).toISOString()
      ])
    ];

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `stratfit-decisions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
});


