/* global window */
import puppeteer from "puppeteer";

/**
 * Minimal smoke test:
 * - Loads a set of routes
 * - Captures console errors + page errors
 * - Fails if any route returns non-2xx or throws pageerror
 *
 * Optional: evidence-based simulation stress test
 * - Re-runs the Monte Carlo simulation N times
 * - Reports JS heap usage deltas + long task summary
 *
 * Usage:
 *   node scripts/smoke.mjs http://localhost:4173
 *   node scripts/smoke.mjs http://localhost:4173 --simulate-runs 10
 */

const argv = process.argv.slice(2);
const baseUrl = argv[0];
if (!baseUrl) {
  console.error("Usage: node scripts/smoke.mjs <baseUrl>");
  process.exit(2);
}

const getArgValue = (flag) => {
  const idx = argv.indexOf(flag);
  if (idx === -1) return null;
  return argv[idx + 1] ?? null;
};

const simulateRuns = Number(getArgValue("--simulate-runs") ?? "0") || 0;

const routes = [
  "/",
  "/compare",
  "/impact",
  "/simulate",
  "/memo",
  "/decide",
];

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();

// Install long-task collector on every navigation.
await page.evaluateOnNewDocument(() => {
  window.__longTasks = [];
  try {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__longTasks.push({ name: entry.name, duration: entry.duration, startTime: entry.startTime });
      }
    });
    obs.observe({ entryTypes: ["longtask"] });
  } catch {
    // PerformanceObserver/longtask may not be available in all modes.
  }
});

const getHeap = async () => {
  const metrics = await page.metrics();
  return {
    JSHeapUsedSize: metrics.JSHeapUsedSize,
    JSHeapTotalSize: metrics.JSHeapTotalSize,
  };
};

const getLongTaskSummary = async () => {
  const tasks = await page.evaluate(() => {
    return Array.isArray(window.__longTasks) ? window.__longTasks : [];
  });

  if (!tasks.length) return { count: 0, maxMs: 0, totalMs: 0 };
  let maxMs = 0;
  let totalMs = 0;
  for (const t of tasks) {
    const d = Number(t.duration) || 0;
    totalMs += d;
    if (d > maxMs) maxMs = d;
  }
  return { count: tasks.length, maxMs, totalMs };
};

const findings = [];
page.on("console", (msg) => {
  const type = msg.type();
  if (type === "error") findings.push({ kind: "console.error", text: msg.text() });
});
page.on("pageerror", (err) => {
  findings.push({ kind: "pageerror", text: String(err?.stack || err) });
});
page.on("requestfailed", (req) => {
  findings.push({
    kind: "requestfailed",
    text: `${req.url()} :: ${req.failure()?.errorText || "unknown error"}`,
  });
});

let ok = true;

for (const path of routes) {
  const url = new URL(path, baseUrl).toString();
  const resp = await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 }).catch((e) => {
    ok = false;
    findings.push({ kind: "goto_failed", text: `${url} :: ${String(e)}` });
    return null;
  });

  if (!resp) continue;

  const status = resp.status();
  if (status < 200 || status >= 300) {
    ok = false;
    findings.push({ kind: "bad_status", text: `${url} :: HTTP ${status}` });
  }

  if (path === "/simulate" && simulateRuns > 0) {
    const rerunSelector = 'button[title="Re-run Simulation"]';
    const completeTimeoutMs = 180_000;

    // Wait for the initial simulation run to complete.
    await page.waitForSelector(rerunSelector, { timeout: completeTimeoutMs }).catch((e) => {
      ok = false;
      findings.push({ kind: "simulate_timeout", text: `Initial completion timeout :: ${String(e)}` });
    });

    const heap0 = await getHeap();
    const heapSamples = [{ run: 0, ...heap0 }];

    for (let i = 1; i <= simulateRuns; i++) {
      // Click rerun once the button exists (only rendered on complete).
      await page.click(rerunSelector).catch((e) => {
        ok = false;
        findings.push({ kind: "simulate_click_failed", text: `Run ${i} :: ${String(e)}` });
      });

      // Running state shows a loading panel; it may appear quickly.
      await page.waitForSelector('.simulate-loading', { timeout: 10_000 }).catch(() => { });

      // Wait for completion (rerun button re-appears).
      await page.waitForSelector(rerunSelector, { timeout: completeTimeoutMs }).catch((e) => {
        ok = false;
        findings.push({ kind: "simulate_timeout", text: `Run ${i} completion timeout :: ${String(e)}` });
      });

      heapSamples.push({ run: i, ...(await getHeap()) });
    }

    const longTasks = await getLongTaskSummary();

    const first = heapSamples[0];
    const last = heapSamples[heapSamples.length - 1];
    const heapDelta = (last.JSHeapUsedSize ?? 0) - (first.JSHeapUsedSize ?? 0);

    console.log("\nSimulation stress report:");
    console.log(`- Runs: ${simulateRuns}`);
    console.log(`- Heap used start: ${(first.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Heap used end:   ${(last.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Heap delta:      ${(heapDelta / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Long tasks:      ${longTasks.count} (max ${longTasks.maxMs.toFixed(1)}ms, total ${longTasks.totalMs.toFixed(1)}ms)`);
  }
}

await browser.close();

if (findings.length) {
  console.log(`Smoke findings for ${baseUrl}:`);
  for (const f of findings) console.log(`- [${f.kind}] ${f.text}`);
}

if (!ok || findings.some((f) => f.kind === "pageerror")) {
  process.exit(1);
}

console.log(`Smoke OK for ${baseUrl}`);

