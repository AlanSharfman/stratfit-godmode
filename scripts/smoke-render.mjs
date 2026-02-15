/* eslint-env node */

import { chromium } from "playwright";

const BASE_URL = process.env.SMOKE_URL || "http://localhost:5173";

const routes = ["/baseline", "/position", "/studio", "/scenarios"];

async function run() {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const results = [];

    for (const r of routes) {
        const url = `${BASE_URL}${r}`;
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForTimeout(300);

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
