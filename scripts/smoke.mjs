import puppeteer from "puppeteer";

/**
 * Minimal smoke test:
 * - Loads a set of routes
 * - Captures console errors + page errors
 * - Fails if any route returns non-2xx or throws pageerror
 *
 * Usage:
 *   node scripts/smoke.mjs http://localhost:4173
 */

const baseUrl = process.argv[2];
if (!baseUrl) {
  console.error("Usage: node scripts/smoke.mjs <baseUrl>");
  process.exit(2);
}

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

