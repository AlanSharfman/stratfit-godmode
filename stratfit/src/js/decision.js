document.addEventListener("DOMContentLoaded", async () => {
  const runId = new URLSearchParams(window.location.search).get("run") || localStorage.getItem("lockedRun");
  const runElem = document.getElementById("decision-runid");
  runElem.textContent = runId || "No run loaded";

  const summaryBox = document.getElementById("decision-summary");
  const exportBtn = document.getElementById("export-decision");
  const aiRec = document.getElementById("ai-recommendation");
  const aiReason = document.getElementById("ai-reasoning");

  let selectedStrategy = null;
  let runData = null;
  let suggested = null;
  const selectedPlays = [];

  let governance = {
    status: "Pending",
    approvals: [],
    comments: []
  };

  const PLAY_IMPACTS = {
    "Hedge FX exposure": {
      volatilityAdj: -2.5,
      confidenceAdj: +4.0,
      alphaAdj: 0
    },
    "Shorten bond duration": {
      volatilityAdj: -1.2,
      confidenceAdj: +1.5,
      alphaAdj: -0.3
    },
    "Defer capex by 2 quarters": {
      alphaAdj: +0.7,
      confidenceAdj: +0.5,
      volatilityAdj: 0
    },
    "Increase equity allocation": {
      alphaAdj: +1.5,
      volatilityAdj: +1.2,
      confidenceAdj: -1.0
    },
    "Deploy idle cash": {
      alphaAdj: +0.9,
      confidenceAdj: +0.3
    },
    "Extend duration exposure": {
      alphaAdj: +0.4,
      volatilityAdj: +0.5
    }
  };

  const PLAYBOOKS = {
    ACCUMULATE: [
      "Increase equity allocation",
      "Deploy idle cash",
      "Extend duration exposure"
    ],
    DEFENSIVE: [
      "Hedge FX exposure",
      "Shorten bond duration",
      "Defer capex by 2 quarters"
    ],
    NEUTRAL: [
      "Hold allocation steady",
      "Monitor volatility corridors",
      "Tighten stop-loss triggers"
    ]
  };

  // Permissions: only approver can commit/export
  if (!window.currentUser || window.currentUser.role !== "approver") {
    exportBtn.disabled = true;
    exportBtn.innerText = "🔒 Requires Approval Role";
  }

  // Governance UI
  const decisionStatusEl = document.getElementById("decision-status");
  const commentList = document.getElementById("comment-list");
  const commentInput = document.getElementById("comment-input");
  const submitCommentBtn = document.getElementById("submit-comment");

  const approveBtn = document.getElementById("btn-approve");
  const lockBtn = document.getElementById("btn-lock-final");

  function renderComments() {
    if (!commentList) return;
    commentList.innerHTML = "";
    governance.comments.forEach(c => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${c.user}</strong> (${c.role})<br>${c.text}<br><small>${new Date(c.timestamp).toLocaleString()}</small>`;
      commentList.appendChild(li);
    });
  }

  function updateGovernanceStatus() {
    if (governance.approvals.length >= 2) {
      governance.status = "Approved";
      if (decisionStatusEl) decisionStatusEl.textContent = "Approved ✅";
      if (lockBtn) lockBtn.style.display = "inline-block";
    } else {
      governance.status = "Pending";
      if (decisionStatusEl) decisionStatusEl.textContent = "Pending";
    }
  }

  if (submitCommentBtn && commentInput) {
    submitCommentBtn.addEventListener("click", () => {
      const text = commentInput.value.trim();
      if (!text) return;

      const comment = {
        user: (window.currentUser && window.currentUser.username) ? window.currentUser.username : "unknown",
        role: (window.currentUser && window.currentUser.role) ? window.currentUser.role : "unknown",
        timestamp: new Date().toISOString(),
        text
      };

      governance.comments.push(comment);
      commentInput.value = "";
      renderComments();
    });
  }

  if (approveBtn) {
    const role = window.currentUser?.role;
    if (["approver", "committee"].includes(role)) {
      approveBtn.addEventListener("click", () => {
        const username = window.currentUser?.username || "unknown";
        if (!governance.approvals.includes(username)) {
          governance.approvals.push(username);
        }
        updateGovernanceStatus();
      });
    } else {
      approveBtn.disabled = true;
    }
  }

  if (lockBtn) {
    const role = window.currentUser?.role;
    if (role === "committee") {
      lockBtn.style.display = "inline-block";
      lockBtn.addEventListener("click", () => {
        governance.status = "Locked";
        if (decisionStatusEl) decisionStatusEl.textContent = "Locked ✅";
        if (approveBtn) approveBtn.disabled = true;
        lockBtn.disabled = true;
      });
    }
  }

  renderComments();
  updateGovernanceStatus();

  function suggestStrategy(data) {
    const alpha = data.alpha;
    const confidence = data.confidence;
    const tailRisk = data.drivers.find(d => d.name.toLowerCase().includes("fx"))?.impact || 0;
    const numNegDrivers = data.drivers.filter(d => d.impact < 0).length;

    let strategy = "NEUTRAL";
    let reason = [];

    if (alpha > 10 && confidence > 85 && numNegDrivers === 0) {
      strategy = "ACCUMULATE";
      reason.push("Strong alpha and high certainty.");
    } else if (alpha < 5 || tailRisk < -5 || numNegDrivers > 2) {
      strategy = "DEFENSIVE";
      if (alpha < 5) reason.push("Low alpha");
      if (tailRisk < -5) reason.push("High FX risk");
      if (numNegDrivers > 2) reason.push("Multiple negative drivers");
    } else {
      reason.push("Balanced outlook with moderate signals.");
    }

    return {
      strategy,
      explanation: reason.join(" + ")
    };
  }

  if (runId) {
    const res = await fetch("../src/data/run-snapshot.json");
    runData = await res.json();
  }

  function recalculateImpact() {
    if (!runData) return;

    let alpha = runData.alpha;
    let volatility = runData.volatility || 14.8; // fallback default
    let confidence = runData.confidence;

    selectedPlays.forEach(play => {
      const mod = PLAY_IMPACTS[play];
      if (!mod) return;

      alpha += mod.alphaAdj || 0;
      volatility += mod.volatilityAdj || 0;
      confidence += mod.confidenceAdj || 0;
    });

    const alphaEl = document.getElementById("proj-alpha");
    const volEl = document.getElementById("proj-volatility");
    const confEl = document.getElementById("proj-confidence");

    if (alphaEl) alphaEl.textContent = `${alpha.toFixed(2)}%`;
    if (volEl) volEl.textContent = `${volatility.toFixed(2)}%`;
    if (confEl) confEl.textContent = `${confidence.toFixed(2)}%`;

    // Optional: Store for export
    window.projectedImpact = {
      alpha, volatility, confidence
    };
  }

  function generateProjectedFunnel(alpha, volatility) {
    const base = 100;
    const horizon = 8;
    const projected = { p10: [], p50: [], p90: [] };

    for (let t = 0; t < horizon; t++) {
      const drift = alpha / 100;
      const vol = volatility / 100;

      const mean = base * Math.pow(1 + drift, t);
      const std = mean * vol * 0.5; // scaled spread

      projected.p50.push(mean);
      projected.p10.push(mean - std);
      projected.p90.push(mean + std);
    }

    return projected;
  }

  function drawBaseFunnelFromPercentiles() {
    const svg = document.getElementById("funnel-svg");
    if (!svg || !runData || !runData.percentiles) return;

    const p10 = runData.percentiles.p10;
    const p50 = runData.percentiles.p50;
    const p90 = runData.percentiles.p90;

    const maxVal = Math.max(...p90);
    const height = 140;

    const toPoints = (arr) =>
      arr
        .map((v, i) => {
          const x = i * 40 + 10;
          const y = height - (Number(v) / maxVal) * height;
          return `${x},${y}`;
        })
        .join(" ");

    svg.innerHTML = "";

    const band = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const top = toPoints(p90);
    const bottom = toPoints(p10).split(" ").reverse().join(" ");
    band.setAttribute("points", top + " " + bottom);
    band.setAttribute("fill", "#3DE0F555");
    band.setAttribute("stroke", "none");
    svg.appendChild(band);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("points", toPoints(p50));
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "#18D57F");
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);
  }

  // AI suggestion panel
  if (aiRec) {
    if (!runData) {
      aiRec.textContent = "Recommended: —";
      if (aiReason) aiReason.textContent = "No run loaded.";
    } else {
      const { strategy, explanation } = suggestStrategy(runData);
      suggested = strategy;
      aiRec.textContent = `Recommended: ${strategy}`;
      if (aiReason) aiReason.textContent = explanation;
    }
  }

  // Tactical playbook (based on suggested strategy)
  const playbookPanel = document.getElementById("playbook-panel");
  const playList = document.getElementById("play-options");
  if (playbookPanel && playList) {
    playList.innerHTML = "";
    selectedPlays.length = 0;

    if (suggested && PLAYBOOKS[suggested]) {
      playbookPanel.style.display = "block";
      PLAYBOOKS[suggested].forEach(play => {
        const li = document.createElement("li");
        li.textContent = play;

        li.addEventListener("click", () => {
          li.classList.toggle("selected");
          if (li.classList.contains("selected")) {
            selectedPlays.push(play);
          } else {
            const i = selectedPlays.indexOf(play);
            if (i !== -1) selectedPlays.splice(i, 1);
          }
          recalculateImpact();
        });

        playList.appendChild(li);
      });
    } else {
      playbookPanel.style.display = "none";
    }
  }

  // Initialize projection once (even with no plays selected)
  recalculateImpact();
  drawBaseFunnelFromPercentiles();

  const overlayToggle = document.getElementById("toggle-overlay");
  if (overlayToggle) {
    overlayToggle.addEventListener("change", (e) => {
      const svg = document.getElementById("funnel-svg");
      if (!svg || !window.projectedImpact) return;

      // Remove previous overlay if any
      svg.querySelectorAll(".funnel-overlay").forEach((el) => el.remove());

      const checked = e && e.target && e.target.checked;
      if (checked) {
        const proj = generateProjectedFunnel(
          window.projectedImpact.alpha,
          window.projectedImpact.volatility
        );

        const toPoints = (arr) =>
          arr
            .map((v, i) => {
              const x = i * 40 + 10;
              const y = 140 - (Number(v) / 160) * 140;
              return `${x},${y}`;
            })
            .join(" ");

        // Median overlay
        const p50 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        p50.setAttribute("points", toPoints(proj.p50));
        p50.setAttribute("class", "funnel-overlay");
        svg.appendChild(p50);

        // Funnel band overlay (p10/p90 area)
        const overlayBand = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const top = toPoints(proj.p90);
        const bottom = toPoints(proj.p10).split(" ").reverse().join(" ");
        overlayBand.setAttribute("points", top + " " + bottom);
        overlayBand.setAttribute("fill", "#9C27B033");
        overlayBand.setAttribute("class", "funnel-overlay");
        svg.appendChild(overlayBand);
      }
    });
  }

  document.querySelectorAll(".strategy-btn").forEach(btn => {
    // Optional: mark suggested strategy
    if (suggested && btn.dataset.choice && btn.dataset.choice.toLowerCase() === suggested.toLowerCase()) {
      btn.style.border = "2px solid #18D57F";
      btn.title = "Suggested";
    }

    btn.addEventListener("click", () => {
      if (!runData) {
        alert("No run loaded.");
        return;
      }
      selectedStrategy = btn.dataset.choice;
      summaryBox.innerHTML = `
        <h3>Selected Strategy: ${selectedStrategy.toUpperCase()}</h3>
        <p>Alpha: ${runData.alpha}%</p>
        <p>Confidence: ${runData.confidence}%</p>
        <p>Drivers: ${runData.drivers.map(d => d.name).join(", ")}</p>
        <p>Decision Timestamp: ${new Date().toISOString()}</p>
      `;
      if (window.currentUser && window.currentUser.role === "approver") {
        exportBtn.disabled = false;
      }
    });
  });

  exportBtn.addEventListener("click", async () => {
    if (!runData || !selectedStrategy) return;
    if (!window.currentUser || window.currentUser.role !== "approver") return;

    const timestamp = new Date().toISOString();
    const decision = {
      runId: runId,
      strategy: String(selectedStrategy || "").toUpperCase(),
      alpha: runData.alpha,
      confidence: runData.confidence,
      drivers: runData.drivers,
      timestamp: timestamp,
      user: window.currentUser.username,
      tacticalPlays: selectedPlays,
      projectedImpact: window.projectedImpact || null,
      governance
    };

    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(decision)
      });

      if (!res.ok) throw new Error("Backend error");

      alert("✅ Decision committed to server.");
      summaryBox.innerHTML += `<p style="color: #18D57F;">✓ Committed</p>`;

      // Optional: still generate a PDF packet locally when commit succeeds.
      // Comment out if you want server-only.
      generateDecisionPDF(decision);

      await loadAuditLog();
    } catch (err) {
      alert("❌ Failed to submit decision.");
      console.error(err);
    }
  });

  await loadAuditLog();
});

async function generateDecisionPDF(decision) {
  const jspdfNs = window.jspdf;
  if (!jspdfNs || !jspdfNs.jsPDF) {
    alert("jsPDF not loaded. Ensure ../src/js/libs/jspdf.umd.min.js is included before decision.js.");
    return;
  }

  const { jsPDF } = jspdfNs;
  const doc = new jsPDF();

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text("STRATFIT Strategy Decision Packet", 20, 20);

  doc.setFontSize(12);
  doc.setFont("Helvetica", "normal");

  doc.text(`Run ID: ${decision.runId}`, 20, 40);
  doc.text(`Strategy: ${String(decision.strategy || "").toUpperCase()}`, 20, 50);
  doc.text(`Alpha: ${decision.alpha}%`, 20, 60);
  doc.text(`Confidence: ${decision.confidence}%`, 20, 70);
  doc.text(`Drivers: ${decision.drivers.map(d => d.name).join(", ")}`, 20, 80);
  doc.text(`Timestamp: ${decision.timestamp}`, 20, 90);

  if (decision.projectedImpact) {
    doc.text("Projected Alpha: " + decision.projectedImpact.alpha.toFixed(2) + "%", 20, 110);
    doc.text("Projected Confidence: " + decision.projectedImpact.confidence.toFixed(2) + "%", 20, 120);
    doc.text("Projected Volatility: " + decision.projectedImpact.volatility.toFixed(2) + "%", 20, 130);
  }

  doc.save(`strategy-${decision.runId}.pdf`);
}

async function loadAuditLog() {
  const list = document.getElementById("audit-list");
  if (!list) return;

  list.innerHTML = "";

  try {
    const res = await fetch("/api/decision-history");
    const history = await res.json();

    history.reverse().forEach(entry => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${String(entry.strategy || "").toUpperCase()}</strong> |
        Run: ${entry.runId} |
        Alpha: ${entry.alpha}% |
        By: ${entry.user} |
        <em>${new Date(entry.timestamp).toLocaleString()}</em>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load audit trail", err);
  }
}


