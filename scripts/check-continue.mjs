/* global document */
import puppeteer from "puppeteer";

/**
 * Checks whether the Initialize flow's "Save & Continue" navigates away.
 * Usage: node scripts/check-continue.mjs http://127.0.0.1:62002
 */

const baseUrl = process.argv[2];
if (!baseUrl) {
  console.error("Usage: node scripts/check-continue.mjs <baseUrl>");
  process.exit(2);
}

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();

const log = (...args) => console.log("[check-continue]", ...args);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const findings = [];
page.on("console", (msg) => {
  if (msg.type() === "error") findings.push({ kind: "console.error", text: msg.text() });
});
page.on("pageerror", (err) => {
  findings.push({ kind: "pageerror", text: String(err?.stack || err) });
});

await page.goto(new URL("/initialize", baseUrl).toString(), {
  waitUntil: "domcontentloaded",
  timeout: 90_000,
});

// Try to select step 06 (Posture) so the primary CTA is "Save & Continue".
const clickedPosture = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button")).find((b) =>
    (b.textContent || "").includes("Posture")
  );
  if (!btn) return false;
  btn.click();
  return true;
});
if (clickedPosture) {
  await sleep(250);
  log("Clicked Posture step");
}

const hasSaveContinue = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button")).find((b) => {
    const t = (b.textContent || "").toLowerCase();
    return t.includes("save") && t.includes("continue");
  });
  return !!btn;
});

if (!hasSaveContinue) {
  log("Save & Continue button not found");
  await browser.close();
  process.exit(2);
}

const before = page.url();
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button")).find((b) => {
    const t = (b.textContent || "").toLowerCase();
    return t.includes("save") && t.includes("continue");
  });
  btn?.click();
});

await sleep(1500);
const after = page.url();

log("URL before:", before);
log("URL after: ", after);

if (findings.length) {
  log("Findings:");
  for (const f of findings) log(`- [${f.kind}] ${f.text}`);
}

await browser.close();

if (before === after) {
  process.exit(1);
}

