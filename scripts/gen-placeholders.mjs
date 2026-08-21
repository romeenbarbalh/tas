import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public", "images");

const gold1 = "#ffffff";
const gold2 = "#f4f4f5";
const accent = "#111111";

const team = [
  { id: "hairbydm", initials: "HD", bg1: gold1, bg2: gold2, accent, label: "Hair by DM", sub: "Braids & Weaves" },
  { id: "kenny-cutz", initials: "KC", bg1: gold1, bg2: gold2, accent, label: "Kenny Cutz", sub: "Precision 4K" },
  { id: "crespo", initials: "CR", bg1: gold1, bg2: gold2, accent, label: "Crespo", sub: "Barber" },
  { id: "gnk", initials: "GN", bg1: gold1, bg2: gold2, accent, label: "Gnk", sub: "Barber" },
  { id: "house-barber", initials: "HB", bg1: gold1, bg2: gold2, accent, label: "House.Barber", sub: "All Ages" },
  { id: "nbcutz", initials: "NB", bg1: gold1, bg2: gold2, accent, label: "NBCutz4K", sub: "4K Precision" },
  { id: "pretty-little-hair", initials: "PL", bg1: gold1, bg2: gold2, accent, label: "Pretty Little Hair", sub: "Women's Stylist" },
];

const gallery = [
  { id: 1, label: "Men's Cut", icon: "💈" },
  { id: 2, label: "Knotless Braids", icon: "🧵" },
  { id: 3, label: "Kids Cut", icon: "✂️" },
  { id: 4, label: "Fulani Braids", icon: "✨" },
  { id: 5, label: "Beard Trim", icon: "🪒" },
  { id: 6, label: "Soft Locs", icon: "💫" },
  { id: 7, label: "Brushing", icon: "🌟" },
  { id: 8, label: "Island Twist", icon: "🌴" },
];

function teamSvg({ initials, bg1, bg2, accent, label, sub }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bg1}" />
      <stop offset="100%" style="stop-color:${bg2}" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="70%">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:0.06" />
      <stop offset="100%" style="stop-color:${accent};stop-opacity:0" />
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="60" /></filter>
  </defs>
  <rect width="800" height="800" fill="url(#bg)" />
  <rect width="800" height="800" fill="url(#glow)" />
  <circle cx="400" cy="300" r="200" fill="none" stroke="${accent}" stroke-opacity="0.25" stroke-width="2" />
  <circle cx="400" cy="300" r="170" fill="none" stroke="${accent}" stroke-opacity="0.12" stroke-width="1" />
  <circle cx="400" cy="300" r="120" fill="${accent}" fill-opacity="0.06" />
  <text x="400" y="320" font-family="system-ui, sans-serif" font-size="120" font-weight="800" fill="${accent}" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  <text x="400" y="560" font-family="system-ui, sans-serif" font-size="44" font-weight="700" fill="#111111" text-anchor="middle">${label}</text>
  <text x="400" y="610" font-family="system-ui, sans-serif" font-size="28" font-weight="400" fill="#52525b" text-anchor="middle" letter-spacing="2">${sub}</text>
  <rect x="340" y="500" width="120" height="2" fill="${accent}" opacity="0.4" />
</svg>`;
}

function gallerySvg({ id, label, icon }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff" />
      <stop offset="100%" style="stop-color:#f4f4f5" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" style="stop-color:#111111;stop-opacity:0.07" />
      <stop offset="100%" style="stop-color:#111111;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)" />
  <rect width="800" height="1000" fill="url(#glow)" />
  <text x="400" y="480" font-family="system-ui, sans-serif" font-size="150" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <text x="400" y="640" font-family="system-ui, sans-serif" font-size="40" font-weight="700" fill="#111111" text-anchor="middle">${label}</text>
  <text x="400" y="690" font-family="system-ui, sans-serif" font-size="22" fill="#52525b" text-anchor="middle" letter-spacing="3">THE ARK STUDIO</text>
  <rect x="340" y="600" width="120" height="2" fill="#111111" opacity="0.4" />
</svg>`;
}

function aboutSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff" />
      <stop offset="100%" style="stop-color:#f4f4f5" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" style="stop-color:#111111;stop-opacity:0.07" />
      <stop offset="100%" style="stop-color:#111111;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)" />
  <rect width="800" height="1000" fill="url(#glow)" />
  <circle cx="400" cy="400" r="220" fill="none" stroke="#111111" stroke-opacity="0.25" stroke-width="2" />
  <circle cx="400" cy="400" r="180" fill="none" stroke="#111111" stroke-opacity="0.12" stroke-width="1" />
  <text x="400" y="410" font-family="system-ui, sans-serif" font-size="160" font-weight="800" fill="#111111" text-anchor="middle" dominant-baseline="middle">TAS</text>
  <text x="400" y="700" font-family="system-ui, sans-serif" font-size="42" font-weight="700" fill="#111111" text-anchor="middle">The Ark Studio</text>
  <text x="400" y="750" font-family="system-ui, sans-serif" font-size="26" fill="#52525b" text-anchor="middle" letter-spacing="3">VERVIERS · BELGIUM</text>
  <rect x="330" y="680" width="140" height="2" fill="#111111" opacity="0.4" />
</svg>`;
}

function heroPosterSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff" />
      <stop offset="100%" style="stop-color:#f4f4f5" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" style="stop-color:#111111;stop-opacity:0.06" />
      <stop offset="100%" style="stop-color:#111111;stop-opacity:0" />
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="80" /></filter>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)" />
  <rect width="1920" height="1080" fill="url(#glow)" />
  <circle cx="960" cy="460" r="300" fill="none" stroke="#111111" stroke-opacity="0.15" stroke-width="2" />
  <circle cx="960" cy="460" r="240" fill="none" stroke="#111111" stroke-opacity="0.08" stroke-width="1" />
  <text x="960" y="470" font-family="system-ui, sans-serif" font-size="120" font-weight="800" fill="#111111" text-anchor="middle" dominant-baseline="middle">TAS</text>
  <text x="960" y="640" font-family="system-ui, sans-serif" font-size="44" font-weight="400" fill="#111111" text-anchor="middle" letter-spacing="4">THE ARK STUDIO</text>
  <text x="960" y="800" font-family="system-ui, sans-serif" font-size="24" fill="#52525b" text-anchor="middle" letter-spacing="2">VERVIERS · BELGIUM</text>
</svg>`;
}

const files = {
  ...Object.fromEntries(team.map(t => [`team/${t.id}.svg`, teamSvg(t)])),
  ...Object.fromEntries(gallery.map(g => [`gallery/${g.id}.svg`, gallerySvg(g)])),
  "about.svg": aboutSvg(),
  "hero-poster.svg": heroPosterSvg(),
};

for (const [rel, content] of Object.entries(files)) {
  const dir = join(publicDir, dirname(rel));
  mkdirSync(dir, { recursive: true });
  const full = join(publicDir, rel);
  writeFileSync(full, content);
  console.log("✔", full);
}
console.log("\n✅ All placeholders generated:", Object.keys(files).length, "files");
