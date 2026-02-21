/* global document */

import puppeteer from "puppeteer";

const BASE_URL = process.env.SMOKE_URL || "http://localhost:5173";

// Only routes that are expected to render a Three/WebGL <canvas>.
// (Other routes may be DOM-only and should not participate in the single-canvas check.)
const routes = ["/position", "/studio", "/scenarios"];

async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const results = [];

    for (const r of routes) {
        const url = `${BASE_URL}${r}`;
        await page.goto(url, { waitUntil: "networkidle0" });
        await page.waitForSelector("canvas", { timeout: 10_000 });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const canvasCount = await page.evaluate(() => document.querySelectorAll("canvas").length);

        results.push({ route: r, canvasCount });
    }

    console.table(results);

    const bad = results.filter((x) => x.canvasCount !== 1);
    if (bad.length) {
        console.error("FAIL: single-canvas rule violated:", bad);
        process.exit(1);
    }

    console.log("PASS: single-canvas rule across routes.");
    await browser.close();
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
