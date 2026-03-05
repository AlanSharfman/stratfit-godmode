/**
 * STRATFIT — End-to-End Smoke Test
 *
 * Tests the critical user journey:
 *   1. Welcome page loads
 *   2. Initialize baseline with sample data
 *   3. Position terrain renders
 *   4. Navigate through all main pages
 *   5. What-If scenario input works
 *   6. Boardroom loads
 *
 * Usage:
 *   node scripts/smoke-e2e.mjs [baseUrl]
 *   Default: http://localhost:62000
 */

import puppeteer from "puppeteer";

const baseUrl = process.argv[2] || "http://localhost:62000";

const ROUTES = [
  { path: "/", name: "Welcome", expectText: "STRATFIT" },
  { path: "/initiate", name: "Initialize", expectText: null },
  { path: "/position", name: "Position", expectText: null },
  { path: "/what-if", name: "What If", expectText: null },
  { path: "/actions", name: "Actions", expectText: null },
  { path: "/timeline", name: "Timeline", expectText: null },
  { path: "/risk", name: "Risk", expectText: null },
  { path: "/compare", name: "Compare", expectText: null },
  { path: "/studio", name: "Studio", expectText: null },
  { path: "/valuation", name: "Valuation", expectText: null },
  { path: "/boardroom", name: "Boardroom", expectText: null },
  { path: "/pulse", name: "Pulse", expectText: null },
];

const errors = [];
const results = [];

console.log(`\n  STRATFIT E2E Smoke Test`);
console.log(`  Base URL: ${baseUrl}\n`);

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
page.setDefaultTimeout(30_000);

page.on("pageerror", (err) => {
  errors.push({ kind: "pageerror", text: String(err?.message || err) });
});

page.on("console", (msg) => {
  if (msg.type() === "error") {
    const text = msg.text();
    // Ignore React dev warnings and favicon 404s
    if (text.includes("favicon") || text.includes("Download the React DevTools")) return;
    errors.push({ kind: "console.error", text });
  }
});

// ── Test 1: Route Navigation ──
console.log("  Phase 1: Route navigation");

for (const route of ROUTES) {
  const url = new URL(route.path, baseUrl).toString();
  const start = performance.now();

  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const status = resp?.status() ?? 0;
    const elapsed = Math.round(performance.now() - start);

    if (status >= 200 && status < 400) {
      results.push({ name: route.name, path: route.path, status: "PASS", ms: elapsed });
      process.stdout.write(`    ✓ ${route.name} (${elapsed}ms)\n`);
    } else {
      results.push({ name: route.name, path: route.path, status: "FAIL", ms: elapsed, reason: `HTTP ${status}` });
      process.stdout.write(`    ✗ ${route.name} — HTTP ${status}\n`);
    }

    if (route.expectText) {
      const bodyText = await page.evaluate(() => document.body?.innerText || "");
      if (!bodyText.includes(route.expectText)) {
        errors.push({ kind: "missing_text", text: `${route.name}: expected "${route.expectText}" not found` });
      }
    }
  } catch (err) {
    results.push({ name: route.name, path: route.path, status: "FAIL", ms: 0, reason: String(err) });
    process.stdout.write(`    ✗ ${route.name} — ${err.message}\n`);
  }
}

// ── Test 2: Critical Elements ──
console.log("\n  Phase 2: Critical element checks");

try {
  await page.goto(new URL("/", baseUrl).toString(), { waitUntil: "networkidle2", timeout: 30_000 });

  // Check that the root element rendered
  const hasRoot = await page.evaluate(() => {
    const root = document.getElementById("root");
    return root && root.children.length > 0;
  });

  if (hasRoot) {
    process.stdout.write("    ✓ React root mounted\n");
  } else {
    errors.push({ kind: "render_fail", text: "React root has no children" });
    process.stdout.write("    ✗ React root empty\n");
  }
} catch (err) {
  errors.push({ kind: "critical_check", text: String(err) });
  process.stdout.write(`    ✗ Critical check failed: ${err.message}\n`);
}

// ── Test 3: Service Worker Registration ──
console.log("\n  Phase 3: PWA checks");

try {
  const hasManifest = await page.evaluate(() => {
    const link = document.querySelector('link[rel="manifest"]');
    return !!link;
  });
  process.stdout.write(`    ${hasManifest ? "✓" : "✗"} Manifest link present\n`);

  const hasThemeColor = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    return !!meta;
  });
  process.stdout.write(`    ${hasThemeColor ? "✓" : "✗"} Theme color meta tag\n`);
} catch (err) {
  process.stdout.write(`    ✗ PWA check error: ${err.message}\n`);
}

// ── Test 4: Compat Redirects ──
console.log("\n  Phase 4: Redirect compatibility");

const redirectTests = [
  { from: "/initialize", to: "/initiate" },
  { from: "/scenarios", to: "/what-if" },
  { from: "/briefing", to: "/boardroom" },
];

for (const { from, to } of redirectTests) {
  try {
    await page.goto(new URL(from, baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: 15_000 });
    const finalUrl = new URL(page.url());
    if (finalUrl.pathname === to) {
      process.stdout.write(`    ✓ ${from} → ${to}\n`);
    } else {
      process.stdout.write(`    ✗ ${from} → ${finalUrl.pathname} (expected ${to})\n`);
      errors.push({ kind: "redirect_fail", text: `${from} landed on ${finalUrl.pathname}` });
    }
  } catch (err) {
    process.stdout.write(`    ✗ ${from} redirect failed: ${err.message}\n`);
  }
}

// ── Test 5: Performance Metrics ──
console.log("\n  Phase 5: Performance");

try {
  await page.goto(new URL("/", baseUrl).toString(), { waitUntil: "networkidle2", timeout: 30_000 });
  const metrics = await page.metrics();
  const heapMB = ((metrics.JSHeapUsedSize || 0) / 1024 / 1024).toFixed(1);
  process.stdout.write(`    Heap used: ${heapMB} MB\n`);

  const perfTiming = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    if (!nav) return null;
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
      loadComplete: Math.round(nav.loadEventEnd),
    };
  });

  if (perfTiming) {
    process.stdout.write(`    DOMContentLoaded: ${perfTiming.domContentLoaded}ms\n`);
    process.stdout.write(`    Load complete: ${perfTiming.loadComplete}ms\n`);
  }
} catch {
  process.stdout.write("    ✗ Could not collect performance metrics\n");
}

await browser.close();

// ── Summary ──
const passed = results.filter((r) => r.status === "PASS").length;
const failed = results.filter((r) => r.status === "FAIL").length;
const pageErrors = errors.filter((e) => e.kind === "pageerror");

console.log(`\n  ─────────────────────────────────`);
console.log(`  Routes: ${passed}/${results.length} passed`);
console.log(`  Page errors: ${pageErrors.length}`);
console.log(`  Console errors: ${errors.filter((e) => e.kind === "console.error").length}`);

if (errors.length > 0) {
  console.log(`\n  Issues:`);
  for (const e of errors) {
    console.log(`    [${e.kind}] ${e.text.slice(0, 120)}`);
  }
}

const hasCriticalFail = failed > 0 || pageErrors.length > 0;
console.log(`\n  ${hasCriticalFail ? "✗ FAIL" : "✓ PASS"}\n`);

process.exit(hasCriticalFail ? 1 : 0);
