function colorByStrategy(s) {
  return s === "ACCUMULATE" ? "#18D57F" : s === "DEFENSIVE" ? "#E53935" : "#3DE0F5";
}

async function loadRuns() {
  try {
    const res = await fetch("/api/decision-history");
    return await res.json();
  } catch {
    return Array.from({ length: 30 }, (_, i) => ({
      runId: `SIM-${i + 1}`,
      alpha: +(Math.random() * 15).toFixed(2),
      volatility: +(Math.random() * 20).toFixed(2),
      strategy: ["ACCUMULATE", "NEUTRAL", "DEFENSIVE"][i % 3],
      user: "system",
      timestamp: new Date().toISOString(),
    }));
  }
}

function showTooltip(event, d) {
  const tt = document.getElementById("tt");
  tt.style.display = "block";
  tt.innerHTML = `<strong>${d.runId}</strong><br>Strategy: ${d.strategy}<br>Alpha: ${d.alpha}%<br>Vol: ${d.volatility}%`;
  tt.style.left = (event.offsetX + 14) + "px";
  tt.style.top = (event.offsetY - 10) + "px";
}

function hideTooltip() {
  const tt = document.getElementById("tt");
  tt.style.display = "none";
}

document.addEventListener("DOMContentLoaded", async () => {
  const runs = await loadRuns();
  const root = document.getElementById("terrain");
  if (!root || !window.d3) return;

  const w = root.clientWidth || 900;
  const h = root.clientHeight || 520;

  const svg = d3
    .select("#terrain")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${w} ${h}`);

  const scaleVol = d3
    .scaleLinear()
    .domain([0, d3.max(runs, (d) => +d.volatility) || 30])
    .range([20, w - 20]);

  const scaleReturn = d3
    .scaleLinear()
    .domain([0, d3.max(runs, (d) => +d.alpha) || 20])
    .range([h - 20, 20]);

  svg
    .selectAll("circle")
    .data(runs)
    .enter()
    .append("circle")
    .attr("cx", (d) => scaleVol(+d.volatility))
    .attr("cy", (d) => scaleReturn(+d.alpha))
    .attr("r", 6)
    .attr("fill", (d) => colorByStrategy(d.strategy))
    .attr("opacity", 0.95)
    .on("mouseover", showTooltip)
    .on("mousemove", showTooltip)
    .on("mouseout", hideTooltip)
    .on("click", (event, d) => {
      window.location.href = `decision.html?run=${d.runId}`;
    });
});


