/* global document, window */

import puppeteer from "puppeteer";

const baseUrl = process.argv[2] || process.env.SMOKE_URL || "http://127.0.0.1:4173";
const findings = [];

function note(kind, text) {
  findings.push({ kind, text });
}

async function installErrorCollectors(page) {
  page.on("pageerror", (err) => {
    note("pageerror", String(err?.stack || err));
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text.includes("favicon") || text.includes("React DevTools")) return;
    note("console.error", text);
  });

  page.on("requestfailed", (req) => {
    note("requestfailed", `${req.url()} :: ${req.failure()?.errorText || "unknown"}`);
  });
}

async function expectPath(page, pathname, timeout = 20_000) {
  await page.waitForFunction(
    (expected) => globalThis.location?.pathname === expected,
    { timeout },
    pathname,
  );
}

async function flowAppBoot(page) {
  await page.goto(new URL("/", baseUrl).toString(), { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForFunction(() => {
    const root = globalThis.document?.getElementById("root");
    return !!root && root.children.length > 0;
  }, { timeout: 10_000 });
}

async function flowInitiateToPosition(page) {
  await page.goto(new URL("/initiate", baseUrl).toString(), { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForSelector('input[placeholder="Company Name"]', { timeout: 10_000 });
  await page.click('input[placeholder="Company Name"]', { clickCount: 3 });
  await page.type('input[placeholder="Company Name"]', "Smoke Test Labs");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const lock = btns.find((b) => (b.textContent || "").includes("LOCK BASELINE & ENTER STRATFIT"));
    lock?.click();
  });
  await expectPath(page, "/position", 25_000);
  await page.waitForSelector("canvas", { timeout: 15_000 });
}

async function flowCompareLoad(page) {
  await page.goto(new URL("/compare", baseUrl).toString(), { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForFunction(() => {
    return !!document.body && document.body.innerText.toUpperCase().includes("COMPARE");
  }, { timeout: 10_000 });
}

async function flowAiNetworkFailure(page) {
  await page.evaluateOnNewDocument(() => {
    window.localStorage.setItem("OPENAI_API_KEY", "smoke-test-key");
  });

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().includes("api.openai.com")) {
      req.respond({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "smoke failure" } }),
      });
      return;
    }
    req.continue();
  });

  await page.goto(new URL("/what-if", baseUrl).toString(), { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForSelector('input[placeholder="What strategic move do you want to simulate?"]', { timeout: 10_000 });
  await page.type(
    'input[placeholder="What strategic move do you want to simulate?"]',
    "Launch a new sales team in Germany next quarter",
  );
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const run = btns.find((b) => (b.textContent || "").includes("Run Simulation"));
    run?.click();
  });

  await page.waitForFunction(() => {
    const text = document.body?.innerText || "";
    return text.includes("Run Simulation") && text.length > 0;
  }, { timeout: 20_000 });

  await page.setRequestInterception(false);
}

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--ignore-gpu-blocklist",
      "--enable-webgl",
      "--use-gl=swiftshader",
    ],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30_000);
    await installErrorCollectors(page);

    await flowAppBoot(page);
    await flowInitiateToPosition(page);
    await flowCompareLoad(page);
    await flowAiNetworkFailure(page);
  } finally {
    await browser.close();
  }

  if (findings.length > 0) {
    console.log("Smoke CI findings:");
    for (const finding of findings) {
      console.log(`- [${finding.kind}] ${finding.text}`);
    }
  }

  const hardFail = findings.some((f) => f.kind === "pageerror" || f.kind === "requestfailed");
  if (hardFail) process.exit(1);
  console.log("Smoke CI OK");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
