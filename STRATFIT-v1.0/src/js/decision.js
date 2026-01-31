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
  const sendOmsBtn = document.getElementById("send-to-oms");

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
      if (sendOmsBtn) sendOmsBtn.disabled = true;
    } else {
      governance.status = "Pending";
      if (decisionStatusEl) decisionStatusEl.textContent = "Pending";
      if (sendOmsBtn) sendOmsBtn.disabled = true;
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
        if (sendOmsBtn) sendOmsBtn.disabled = false;
      });
    }
  }

  renderComments();
  updateGovernanceStatus();

  // OMS send (only when locked)
  if (sendOmsBtn) {
    sendOmsBtn.disabled = true;
    sendOmsBtn.addEventListener("click", async () => {
      if (governance.status !== "Locked") {
        alert("Decision must be Locked before sending to OMS.");
        return;
      }
      if (!runData || !selectedStrategy) {
        alert("Select a strategy first.");
        return;
      }

      // Prompt for instrument weights (JSON object)
      // Example: {"US 10Y":0.35,"Gold":0.40,"Cash":0.25}
      const weightsRaw = prompt("OMS Weights (JSON). Example: {\"US 10Y\":0.35,\"Gold\":0.40,\"Cash\":0.25}");
      if (!weightsRaw) return;
      let weights;
      try {
        weights = JSON.parse(weightsRaw);
      } catch {
        alert("Invalid JSON weights.");
        return;
      }

      const payload = {
        runId: String(runId || runData.runId || ""),
        strategy: String(selectedStrategy || "").toUpperCase(),
        weights,
        alpha: Number(runData.alpha),
        confidence: Number(runData.confidence),
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
    try {
      const res = await fetch(`/api/run/${encodeURIComponent(runId)}`);
      runData = await res.json();
    } catch {
      runData = {
        runId,
        alpha: +(Math.random() * 10 + 2).toFixed(2),
        confidence: +(Math.random() * 15 + 70).toFixed(2),
        volatility: +(Math.random() * 5 + 10).toFixed(2),
        status: "NEUTRAL",
        drivers: [
          { name: "FX Headwind", impact: -4.2 },
          { name: "CAPEX Drag", impact: 2.3 },
          { name: "Revenue Growth", impact: 6.1 },
        ],
        percentiles: {
          p10: [85, 82, 79, 76, 74, 73, 72, 71],
          p50: [100, 103, 106, 108, 110, 112, 113, 114],
          p90: [118, 125, 132, 138, 145, 151, 156, 160],
        },
      };
    }
  }

  // Local verdict engine (trained from /data/decision-history.json)
  // Use dynamic import so we don't have to convert this entire script to type="module".
  if (runData && aiRec) {
    try {
      const mod = await import("./verdict-engine.js");
      const runMeta = {
        alpha: Number(runData.alpha),
        volatility: Number(runData.volatility ?? 14.8),
        skew: Number(runData.skew ?? -0.2),
      };
      const v = await mod.generateVerdict(runMeta);
      if (aiReason) {
        aiReason.textContent =
          (aiReason.textContent ? aiReason.textContent + " | " : "") +
          `Verdict Engine: ${v.verdict} (${v.confidence}%)`;
      }
    } catch (err) {
      console.warn("Verdict engine unavailable.", err);
    }
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

      // Optional: generate a PDF packet locally when commit succeeds.
      if (window.exportPageAsPDF) {
        await window.exportPageAsPDF(`strategy-${decision.runId}.pdf`);
      }

      await loadAuditLog();
    } catch (err) {
      alert("❌ Failed to submit decision.");
      console.error(err);
    }
  });

  await loadAuditLog();
});

// PDF generation handled via ../src/js/pdf.js (html2pdf on-demand)

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


