<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topFace" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#555;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#111;stop-opacity:1" />
    </linearGradient>
    
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <path d="M100 130 L170 110 L170 150 L100 170 Z" fill="#161616" stroke="#000" stroke-width="0.5" />
  <path d="M100 130 L30 110 L30 150 L100 170 Z" fill="#2a2a2a" stroke="#000" stroke-width="0.5" />
  <path d="M100 130 L170 110 L100 90 L30 110 Z" fill="#b0ffff" filter="url(#glow)" />

  <path d="M100 70 L170 50 L170 90 L100 110 Z" fill="#161616" stroke="#000" stroke-width="0.5" />
  <path d="M100 70 L30 50 L30 90 L100 110 Z" fill="#2a2a2a" stroke="#000" stroke-width="0.5" />
  <path d="M100 70 L170 50 L100 30 L30 50 Z" fill="url(#topFace)" stroke="#666" stroke-width="0.5" />
</svg>