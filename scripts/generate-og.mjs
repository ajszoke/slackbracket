import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#050a18"/>
      <stop offset="100%" stop-color="#0b1020"/>
    </linearGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00f0ff"/>
      <stop offset="100%" stop-color="#7c4dff"/>
    </linearGradient>
    <linearGradient id="subtitle" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <!-- Chaos spectrum gradient -->
    <linearGradient id="chaos-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1e40af"/>
      <stop offset="25%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="75%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glow-line">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <!-- Pulse orbs — big and visible -->
    <radialGradient id="orb-user" cx="15%" cy="25%" r="45%">
      <stop offset="0%" stop-color="rgba(0,240,255,0.28)"/>
      <stop offset="60%" stop-color="rgba(0,240,255,0.08)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <radialGradient id="orb-ai" cx="85%" cy="75%" r="45%">
      <stop offset="0%" stop-color="rgba(124,77,255,0.28)"/>
      <stop offset="60%" stop-color="rgba(124,77,255,0.08)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Pulse orbs -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#orb-user)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#orb-ai)"/>

  <!-- Bracket lines — LEFT side (two regions stacked) -->
  <g opacity="0.6" stroke-width="2" fill="none" filter="url(#glow-line)">
    <!-- Top-left region (East = cyan) -->
    <g stroke="#00f0ff">
      <!-- R1 pairs -->
      <line x1="50" y1="120" x2="120" y2="120"/>
      <line x1="50" y1="170" x2="120" y2="170"/>
      <line x1="120" y1="120" x2="120" y2="170"/>
      <line x1="120" y1="145" x2="180" y2="145"/>

      <line x1="50" y1="220" x2="120" y2="220"/>
      <line x1="50" y1="270" x2="120" y2="270"/>
      <line x1="120" y1="220" x2="120" y2="270"/>
      <line x1="120" y1="245" x2="180" y2="245"/>

      <!-- R2 merge -->
      <line x1="180" y1="145" x2="180" y2="245"/>
      <line x1="180" y1="195" x2="240" y2="195"/>
    </g>

    <!-- Bottom-left region (South = teal) -->
    <g stroke="#2dd4bf">
      <line x1="50" y1="360" x2="120" y2="360"/>
      <line x1="50" y1="410" x2="120" y2="410"/>
      <line x1="120" y1="360" x2="120" y2="410"/>
      <line x1="120" y1="385" x2="180" y2="385"/>

      <line x1="50" y1="460" x2="120" y2="460"/>
      <line x1="50" y1="510" x2="120" y2="510"/>
      <line x1="120" y1="460" x2="120" y2="510"/>
      <line x1="120" y1="485" x2="180" y2="485"/>

      <line x1="180" y1="385" x2="180" y2="485"/>
      <line x1="180" y1="435" x2="240" y2="435"/>
    </g>

    <!-- Top-right region (West = indigo) -->
    <g stroke="#818cf8">
      <line x1="1150" y1="120" x2="1080" y2="120"/>
      <line x1="1150" y1="170" x2="1080" y2="170"/>
      <line x1="1080" y1="120" x2="1080" y2="170"/>
      <line x1="1080" y1="145" x2="1020" y2="145"/>

      <line x1="1150" y1="220" x2="1080" y2="220"/>
      <line x1="1150" y1="270" x2="1080" y2="270"/>
      <line x1="1080" y1="220" x2="1080" y2="270"/>
      <line x1="1080" y1="245" x2="1020" y2="245"/>

      <line x1="1020" y1="145" x2="1020" y2="245"/>
      <line x1="1020" y1="195" x2="960" y2="195"/>
    </g>

    <!-- Bottom-right region (Midwest = sky) -->
    <g stroke="#38bdf8">
      <line x1="1150" y1="360" x2="1080" y2="360"/>
      <line x1="1150" y1="410" x2="1080" y2="410"/>
      <line x1="1080" y1="360" x2="1080" y2="410"/>
      <line x1="1080" y1="385" x2="1020" y2="385"/>

      <line x1="1150" y1="460" x2="1080" y2="460"/>
      <line x1="1150" y1="510" x2="1080" y2="510"/>
      <line x1="1080" y1="460" x2="1080" y2="510"/>
      <line x1="1080" y1="485" x2="1020" y2="485"/>

      <line x1="1020" y1="385" x2="1020" y2="485"/>
      <line x1="1020" y1="435" x2="960" y2="435"/>
    </g>

    <!-- Final Four connectors (purple) -->
    <g stroke="#a78bfa">
      <line x1="240" y1="195" x2="240" y2="435"/>
      <line x1="240" y1="315" x2="300" y2="315"/>

      <line x1="960" y1="195" x2="960" y2="435"/>
      <line x1="960" y1="315" x2="900" y2="315"/>
    </g>
  </g>

  <!-- Title: SLACKBRACKET -->
  <text x="600" y="270" text-anchor="middle"
        font-family="system-ui, sans-serif" font-weight="800"
        font-size="88" letter-spacing="8" fill="url(#title)"
        filter="url(#glow)">SLACKBRACKET</text>

  <!-- Year: 2026 -->
  <text x="600" y="340" text-anchor="middle"
        font-family="system-ui, sans-serif" font-weight="600"
        font-size="42" letter-spacing="16" fill="url(#subtitle)"
        opacity="0.7">2026</text>

  <!-- Tagline -->
  <text x="600" y="415" text-anchor="middle"
        font-family="system-ui, sans-serif" font-weight="400"
        font-size="28" fill="#7785a2" letter-spacing="2">March Madness. Your way.</text>

  <!-- Chaos spectrum bar with slider thumb -->
  <rect x="400" y="455" width="400" height="5" rx="2.5" fill="url(#chaos-bar)" opacity="0.7"/>
  <!-- Slider thumb — positioned ~70% right for "moving right" energy -->
  <circle cx="680" cy="457" r="8" fill="#eff4ff" stroke="#f59e0b" stroke-width="2"
          filter="url(#glow-line)"/>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("apps/web/public/og.png");
console.log("Generated apps/web/public/og.png (1200x630)");
