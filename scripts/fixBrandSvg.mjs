import fs from "node:fs";
import path from "node:path";

const target = path.resolve("public/brand/stratfit-logo.svg");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120">
  <defs>
    <linearGradient id="sfTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2a2f38"/>
      <stop offset="1" stop-color="#0b0f16"/>
    </linearGradient>
    <linearGradient id="sfSide" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#161b23"/>
      <stop offset="1" stop-color="#05070b"/>
    </linearGradient>
    <linearGradient id="sfGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#00eaff" stop-opacity=".15"/>
      <stop offset=".5" stop-color="#00eaff" stop-opacity=".65"/>
      <stop offset="1" stop-color="#00eaff" stop-opacity=".15"/>
    </linearGradient>
    <filter id="sfSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feColorMatrix in="b" type="matrix"
        values="0 0 0 0 0
                0 0 0 0 0.92
                0 0 0 0 1
                0 0 0 .55 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- mark -->
  <g transform="translate(22,18)">
    <!-- upper block -->
    <g>
      <path d="M46 0 L82 18 L46 36 L10 18 Z" fill="url(#sfTop)" stroke="rgba(255,255,255,.14)"/>
      <path d="M10 18 L46 36 L46 64 L10 46 Z" fill="url(#sfSide)" stroke="rgba(255,255,255,.08)"/>
      <path d="M82 18 L46 36 L46 64 L82 46 Z" fill="#0a0e14" stroke="rgba(255,255,255,.06)"/>
    </g>

    <!-- lower block -->
    <g transform="translate(0,36)">
      <path d="M46 0 L82 18 L46 36 L10 18 Z" fill="url(#sfTop)" opacity=".95" stroke="rgba(255,255,255,.14)"/>
      <path d="M10 18 L46 36 L46 64 L10 46 Z" fill="url(#sfSide)" stroke="rgba(255,255,255,.08)"/>
      <path d="M82 18 L46 36 L46 64 L82 46 Z" fill="#0a0e14" stroke="rgba(255,255,255,.06)"/>
    </g>

    <!-- cyan core -->
    <g filter="url(#sfSoftGlow)">
      <path d="M20 40 L46 53 L72 40 L46 27 Z" fill="url(#sfGlow)"/>
      <path d="M22 40 L46 52 L70 40" fill="none" stroke="rgba(0,234,255,.65)" stroke-width="2" stroke-linecap="round"/>
    </g>
  </g>

  <!-- wordmark -->
  <text x="140" y="70"
    fill="rgba(255,255,255,.92)"
    font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    font-size="38"
    font-weight="800"
    letter-spacing="4">STRATFIT</text>
</svg>
`;

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, svg, "utf8");
console.log("Wrote", target, "bytes", fs.statSync(target).size);


