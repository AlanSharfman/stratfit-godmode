// src/pitch/api/exportPitch.ts
// STRATFIT — PDF Export for Investor Pitch Deck
// Uses Puppeteer to render HTML slides to PDF

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { buildInvestorPitch } from "../buildInvestorPitch";
import type { InvestorPitch } from "../InvestorPitch";

// Format large numbers with commas
function formatNumber(n: number): string {
  return Math.round(n).toLocaleString();
}

// Format currency (millions)
function formatMillions(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(0)}K`;
  }
  return formatNumber(n);
}

// Render template with pitch data
function renderTemplate(template: string, pitch: InvestorPitch): string {
  let result = template;

  // Meta
  result = result.replace(/{{meta\.company}}/g, pitch.meta.company);
  result = result.replace(/{{meta\.date}}/g, pitch.meta.date);
  result = result.replace(/{{meta\.scenario}}/g, pitch.meta.scenario);

  // Executive Summary
  result = result.replace(/{{executiveSummary}}/g, pitch.executiveSummary || "No summary available.");

  // Base metrics
  result = result.replace(/{{base\.arr}}/g, formatMillions(pitch.base.arr));
  result = result.replace(/{{base\.revenue}}/g, formatMillions(pitch.base.revenue));
  result = result.replace(/{{base\.burn}}/g, formatNumber(pitch.base.burn));
  result = result.replace(/{{base\.runway}}/g, Math.round(pitch.base.runway).toString());
  result = result.replace(/{{base\.valuation}}/g, formatMillions(pitch.base.valuation));
  result = result.replace(/{{base\.risk}}/g, Math.round(pitch.base.risk).toString());
  result = result.replace(/{{base\.cac}}/g, formatNumber(pitch.base.cac));
  result = result.replace(/{{base\.ltv}}/g, formatNumber(pitch.base.ltv));
  result = result.replace(/{{base\.payback}}/g, Math.round(pitch.base.payback).toString());

  // Scenario metrics
  result = result.replace(/{{scenario\.arr}}/g, formatMillions(pitch.scenario.arr));
  result = result.replace(/{{scenario\.revenue}}/g, formatMillions(pitch.scenario.revenue));
  result = result.replace(/{{scenario\.burn}}/g, formatNumber(pitch.scenario.burn));
  result = result.replace(/{{scenario\.runway}}/g, Math.round(pitch.scenario.runway).toString());
  result = result.replace(/{{scenario\.valuation}}/g, formatMillions(pitch.scenario.valuation));
  result = result.replace(/{{scenario\.risk}}/g, Math.round(pitch.scenario.risk).toString());
  result = result.replace(/{{scenario\.cac}}/g, formatNumber(pitch.scenario.cac));
  result = result.replace(/{{scenario\.ltv}}/g, formatNumber(pitch.scenario.ltv));
  result = result.replace(/{{scenario\.payback}}/g, Math.round(pitch.scenario.payback).toString());

  // Computed values
  const ltvCacRatio = pitch.scenario.cac > 0 ? (pitch.scenario.ltv / pitch.scenario.cac).toFixed(1) : "N/A";
  result = result.replace(/{{scenario\.ltvCacRatio}}/g, ltvCacRatio);

  // Delta classes (positive/negative styling)
  result = result.replace(/{{arrDeltaClass}}/g, pitch.scenario.arr > pitch.base.arr ? "pos" : "neg");
  result = result.replace(/{{valuationDeltaClass}}/g, pitch.scenario.valuation > pitch.base.valuation ? "pos" : "neg");
  result = result.replace(/{{runwayDeltaClass}}/g, pitch.scenario.runway > pitch.base.runway ? "pos" : "neg");
  result = result.replace(/{{riskDeltaClass}}/g, pitch.scenario.risk < pitch.base.risk ? "pos" : "neg");
  result = result.replace(/{{burnDeltaClass}}/g, pitch.scenario.burn < pitch.base.burn ? "pos" : "neg");
  result = result.replace(/{{revenueDeltaClass}}/g, pitch.scenario.revenue > pitch.base.revenue ? "pos" : "neg");

  // Status labels
  const ltvCacNum = pitch.scenario.cac > 0 ? pitch.scenario.ltv / pitch.scenario.cac : 0;
  result = result.replace(/{{ltvCacClass}}/g, ltvCacNum >= 3 ? "pos" : "neg");
  result = result.replace(/{{ltvCacStatus}}/g, ltvCacNum >= 3 ? "Healthy" : "Needs improvement");
  result = result.replace(/{{paybackClass}}/g, pitch.scenario.payback <= 18 ? "pos" : "neg");
  result = result.replace(/{{paybackStatus}}/g, pitch.scenario.payback <= 18 ? "Efficient" : "Too long");

  // Mountain images
  result = result.replace(/{{mountain\.baseImage}}/g, pitch.mountain.baseImage || "");
  result = result.replace(/{{mountain\.scenarioImage}}/g, pitch.mountain.scenarioImage || "");
  result = result.replace(/{{mountain\.pathImage}}/g, pitch.mountain.pathImage || "");
  result = result.replace(/{{growthSpiderImage}}/g, "");
  result = result.replace(/{{pathSteps}}/g, "12"); // Placeholder

  // Growth spider (handle loop)
  const spiderMatch = result.match(/{{#growthSpider}}([\s\S]*?){{\/growthSpider}}/);
  if (spiderMatch) {
    const itemTemplate = spiderMatch[1];
    const items = pitch.growthSpider.map(item => 
      itemTemplate
        .replace(/{{metric}}/g, item.metric)
        .replace(/{{base}}/g, item.base.toFixed(0))
        .replace(/{{scenario}}/g, item.scenario.toFixed(0))
    ).join("");
    result = result.replace(/{{#growthSpider}}[\s\S]*?{{\/growthSpider}}/, items);
  }

  // Recommendations (handle loop)
  const recsMatch = result.match(/{{#recommendations}}([\s\S]*?){{\/recommendations}}/);
  if (recsMatch) {
    const itemTemplate = recsMatch[1];
    const items = pitch.recommendations.map(rec => 
      itemTemplate.replace(/{{\./g, rec).replace(/}}/g, "")
    ).join("");
    result = result.replace(/{{#recommendations}}[\s\S]*?{{\/recommendations}}/, items);
  }

  // Fallback: replace any remaining recommendations pattern
  result = result.replace(
    /{{#recommendations}}[\s\S]*?{{\/recommendations}}/,
    pitch.recommendations.map(r => `<li>${r}</li>`).join("")
  );

  return result;
}

export async function exportPitch(): Promise<string> {
  const pitch = buildInvestorPitch();

  const templateDir = path.join(process.cwd(), "src/pitch/templates");

  function loadTemplate(file: string): string {
    return fs.readFileSync(path.join(templateDir, file), "utf8");
  }

  // Load all slide templates
  const slides = [
    loadTemplate("slide-cover.html"),
    loadTemplate("slide-summary.html"),
    loadTemplate("slide-compare.html"),
    loadTemplate("slide-growth.html"),
    loadTemplate("slide-unit.html"),
    loadTemplate("slide-mountain.html"),
    loadTemplate("slide-recommendations.html"),
  ];

  const css = loadTemplate("style.css");

  // Render each slide with pitch data
  const htmlSlides = slides.map(slide => renderTemplate(slide, pitch)).join("\n");

  // Compose full HTML document
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>STRATFIT Investor Report - ${pitch.meta.company}</title>
  <style>
    ${css}
    
    /* Print-specific overrides */
    @media print {
      .slide {
        page-break-after: always;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="deck">
    ${htmlSlides}
  </div>
</body>
</html>
  `;

  // Launch Puppeteer and render PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  // Ensure output directory exists
  const outDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `STRATFIT-Investor-Report-${timestamp}.pdf`;
  const outPath = path.join(outDir, filename);

  await page.pdf({
    path: outPath,
    width: "1200px",
    height: "675px",
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  console.log(`✅ Investor deck exported to: ${outPath}`);

  return `/${filename}`;
}

// CLI runner (for direct execution)
if (require.main === module) {
  exportPitch()
    .then((url) => console.log(`PDF available at: ${url}`))
    .catch((err) => console.error("Export failed:", err));
}

