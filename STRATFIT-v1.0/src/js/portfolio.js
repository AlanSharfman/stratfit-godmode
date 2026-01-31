document.addEventListener("DOMContentLoaded", () => {
  const portfolio = [];

  const addBtn = document.getElementById("add-run");
  const addInput = document.getElementById("add-run-id");
  const saveBtn = document.getElementById("save-portfolio");
  const sendOmsBtn = document.getElementById("send-portfolio-oms");
  const blendedEl = document.getElementById("blended-output");

  let lastExportedModel = null;

  function weightedAvg(runs, field, total) {
    return runs.reduce((acc, r) => acc + Number(r[field] || 0) * (Number(r.weight || 0) / total), 0);
  }

  function computeBlended() {
    const totalWeight = portfolio.reduce((sum, r) => sum + Number(r.weight || 0), 0);
    if (!totalWeight) {
      blendedEl.textContent = "—";
      return;
    }

    const alpha = weightedAvg(portfolio, "alpha", totalWeight);
    const confidence = weightedAvg(portfolio, "confidence", totalWeight);
    const volatility = weightedAvg(portfolio, "volatility", totalWeight);

    blendedEl.textContent =
      `Alpha: ${alpha.toFixed(2)}% | Confidence: ${confidence.toFixed(2)}% | Volatility: ${volatility.toFixed(2)}%`;
  }

  function renderTable() {
    const tbody = document.querySelector("#portfolio-table tbody");
    tbody.innerHTML = "";

    portfolio.forEach((run, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${run.runId}</td>
        <td>${run.strategy}</td>
        <td>${run.alpha}%</td>
        <td>${run.confidence}%</td>
        <td><input type="number" min="0" max="100" step="1" value="${run.weight}" data-idx="${idx}" /></td>
        <td><button class="btn" data-remove="${idx}">Remove</button></td>
      `;
      tbody.appendChild(tr);
    });

    // Attach listeners
    tbody.querySelectorAll('input[type="number"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        const idx = +e.target.dataset.idx;
        portfolio[idx].weight = +e.target.value;
        computeBlended();
      });
    });

    tbody.querySelectorAll("button[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = +btn.dataset.remove;
        portfolio.splice(idx, 1);
        renderTable();
        computeBlended();
      });
    });
  }

  addBtn.addEventListener("click", async () => {
    const runId = addInput.value.trim();
    if (!runId) return;

    let runData;
    try {
      const res = await fetch(`/api/run/${runId}`);
      runData = await res.json();
    } catch {
      // Simulated fallback
      runData = {
        runId,
        strategy: ["DEFENSIVE", "NEUTRAL", "ACCUMULATE"][Math.floor(Math.random() * 3)],
        alpha: +(Math.random() * 10 + 2).toFixed(2),
        confidence: +(Math.random() * 20 + 70).toFixed(2),
        volatility: +(Math.random() * 5 + 10).toFixed(2),
      };
    }

    runData.weight = 0; // initial weight
    portfolio.push(runData);
    renderTable();
    computeBlended();
    addInput.value = "";
  });

  saveBtn.addEventListener("click", () => {
    const name = prompt("Model Name (e.g. Model A)");
    const version = prompt("Version (e.g. v1.0)");
    const user = (window.currentUser && window.currentUser.username) ? window.currentUser.username : "unknown";

    if (!name || !version) return alert("Name and version required.");

    const totalWeight = portfolio.reduce((sum, r) => sum + Number(r.weight || 0), 0);
    if (!totalWeight) return alert("Set weights before exporting.");

    const model = {
      name,
      version,
      createdBy: user,
      createdAt: new Date().toISOString(),
      runs: portfolio,
      blended: {
        alpha: weightedAvg(portfolio, "alpha", totalWeight),
        confidence: weightedAvg(portfolio, "confidence", totalWeight),
        volatility: weightedAvg(portfolio, "volatility", totalWeight),
      },
      status: "Draft", // or "Final"
      reviewers: [],
      lock: false,
    };

    lastExportedModel = model;
    if (sendOmsBtn) sendOmsBtn.disabled = false;

    const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${String(name).replace(/\\s+/g, "_")}_${version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  if (sendOmsBtn) {
    sendOmsBtn.disabled = true;
    sendOmsBtn.addEventListener("click", async () => {
      if (!lastExportedModel) {
        alert("Export the portfolio first.");
        return;
      }

      const totalWeight = lastExportedModel.runs.reduce((sum, r) => sum + Number(r.weight || 0), 0);
      if (!totalWeight) {
        alert("Set weights first.");
        return;
      }

      // Treat portfolio weights as allocation weights for OMS payload (by runId)
      const weights = {};
      lastExportedModel.runs.forEach((r) => {
        weights[r.runId] = Number(r.weight || 0) / totalWeight;
      });

      const payload = {
        runId: `${String(lastExportedModel.name).replace(/\\s+/g, "_")}_${lastExportedModel.version}`,
        strategy: "PORTFOLIO",
        weights,
        alpha: Number(lastExportedModel.blended?.alpha || 0),
        confidence: Number(lastExportedModel.blended?.confidence || 0),
        approvedBy: window.currentUser?.username,
        timestamp: new Date().toISOString(),
      };

      if (window.sendToOms) {
        await window.sendToOms(payload);
      } else {
        alert("OMS client missing (oms.js not loaded).");
      }
    });
  }
});


