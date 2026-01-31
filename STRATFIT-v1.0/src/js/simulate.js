console.log("SIMULATE UI loaded.");

function renderSimulationData(data) {
  // Global metadata
  const metaRunId = document.getElementById('meta-runid');
  if (!metaRunId) return; // Not the simulate page (module placeholders reuse this script)

  document.getElementById('meta-runid').textContent = data.runId;
  document.getElementById('meta-iterations').textContent = data.iterations.toLocaleString();
  document.getElementById('meta-horizon').textContent = data.horizon;
  document.getElementById('meta-seed').textContent = data.seed;
  document.getElementById('meta-hash').textContent = data.modelHash;
  document.getElementById('meta-timestamp').textContent = new Date(data.timestamp).toLocaleString();

  // Verdict strip
  document.getElementById('verdict-status').textContent = data.status;
  document.getElementById('verdict-alpha').textContent = `+${data.alpha.toFixed(1)}%`;
  document.getElementById('verdict-confidence').textContent = `${data.confidence.toFixed(1)}%`;

  // Driver bars
  const driverContainer = document.getElementById('driver-container');
  if (driverContainer) driverContainer.innerHTML = "";
  data.drivers.forEach(driver => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    
    const label = document.createElement('label');
    label.textContent = driver.name;

    const fill = document.createElement('div');
    fill.className = 'bar__fill';
    fill.style.width = Math.abs(driver.impact) * 8 + '%'; // Scale factor

    // Assign class by impact direction
    if (driver.impact < 0) fill.classList.add('bar--red');
    else if (driver.impact > 5) fill.classList.add('bar--emerald');
    else fill.classList.add('bar--indigo');

    bar.appendChild(label);
    bar.appendChild(fill);
    driverContainer.appendChild(bar);
  });

  // --- Draw Monte Carlo Funnel ---
  const svg = document.getElementById("funnel-svg");
  if (!svg) return;
  const { p10, p50, p90 } = data.percentiles;

  function toPoints(arr, height) {
    const maxVal = Math.max(...p90);
    return arr.map((v, i) => {
      const x = i * 40 + 10;
      const y = height - (v / maxVal) * height;
      return `${x},${y}`;
    }).join(" ");
  }

  // Clear SVG
  svg.innerHTML = '';

  // Draw area between 10th and 90th
  const band = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  const top = toPoints(p90, 140);
  const bottom = toPoints(p10, 140).split(' ').reverse().join(' ');
  band.setAttribute("points", top + " " + bottom);
  band.setAttribute("fill", "#3DE0F555");
  band.setAttribute("stroke", "none");
  svg.appendChild(band);

  // Draw median line (50th percentile)
  const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  line.setAttribute("points", toPoints(p50, 140));
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#18D57F");
  line.setAttribute("stroke-width", "2");
  svg.appendChild(line);

  // Hover points for p50
  p50.forEach((val, i) => {
    const x = i * 40 + 10;
    const y = 140 - (val / Math.max(...p90)) * 140;

    const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    point.setAttribute("cx", x);
    point.setAttribute("cy", y);
    point.setAttribute("r", 4);
    point.setAttribute("fill", "#18D57F");
    point.setAttribute("data-index", i);
    point.setAttribute("data-value", val.toFixed(2));
    point.style.cursor = "pointer";

    point.addEventListener("mouseover", e => {
      const tooltip = document.getElementById("funnel-tooltip");
      tooltip.style.display = "block";
      tooltip.innerHTML = `T+${i} → ${val.toFixed(2)}%`;
    });

    point.addEventListener("mousemove", e => {
      const tooltip = document.getElementById("funnel-tooltip");
      tooltip.style.left = (e.pageX + 10) + "px";
      tooltip.style.top = (e.pageY - 20) + "px";
    });

    point.addEventListener("mouseleave", () => {
      document.getElementById("funnel-tooltip").style.display = "none";
    });

    svg.appendChild(point);
  });
}

async function loadSimulationData() {
  const urlParams = new URLSearchParams(window.location.search);
  const runId = urlParams.get("run") || localStorage.getItem("lockedRun") || "SF-2026-X9";

  let data;
  try {
    const res = await fetch(`/api/run/${encodeURIComponent(runId)}`);
    data = await res.json();
  } catch {
    // Fallback stub so the static package works without backend/data files
    data = {
      runId,
      iterations: 100000,
      horizon: "36mo",
      seed: "0x921",
      modelHash: "7eaf...92",
      timestamp: new Date().toISOString(),
      status: "ACCUMULATE",
      alpha: 12.4,
      confidence: 92.1,
      drivers: [
        { name: "FX Headwind", impact: -6.0 },
        { name: "CAPEX Drag", impact: 4.0 },
        { name: "Revenue Growth", impact: 8.0 },
      ],
      percentiles: {
        p10: [85, 82, 79, 76, 74, 73, 72, 71],
        p50: [100, 103, 106, 108, 110, 112, 113, 114],
        p90: [118, 125, 132, 138, 145, 151, 156, 160],
      },
    };
  }

  renderSimulationData(data);
}

function injectReplayData(data) {
  renderSimulationData(data);
}

loadSimulationData();

// Live sensors (optional; used for downstream pages like Monitor / Terrain)
// This keeps Simulate compatible as a classic script (non-module).
(async function () {
  try {
    const mod = await import("./live-feed.js");
    const sensors = await mod.getLiveSensors();
    window.liveSensors = sensors;
    console.log("Live sensors:", sensors);
  } catch (err) {
    console.warn("Live sensors unavailable.", err);
  }
})();

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const module = btn.innerText.toLowerCase();
    const runId = document.getElementById('meta-runid')?.textContent || localStorage.getItem("lockedRun") || "";
    window.location.href = `${module}.html?run=${encodeURIComponent(runId)}`;
  });
});

const lockBtn = document.getElementById("btn-lock");
if (lockBtn) {
  lockBtn.addEventListener("click", () => {
    const runId = document.getElementById('meta-runid')?.textContent || "";
    localStorage.setItem("lockedRun", runId);
    lockBtn.textContent = "LOCKED ✅";
    lockBtn.disabled = true;
  });
}

const replaySelect = document.getElementById("replay-mode");
if (replaySelect) {
  replaySelect.addEventListener("change", async (e) => {
    const mode = e.target.value;
    if (!mode) return;

    try {
      const data = await fetch(`/api/replay/${mode}`).then(r => r.json());
      injectReplayData(data);
    } catch (err) {
      alert("Replay unavailable (missing /api/replay endpoint).");
      console.error(err);
    }
  });
}


