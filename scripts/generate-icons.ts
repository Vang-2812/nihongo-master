import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.join(process.cwd(), 'public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Standard App Icon SVG (with rounded corners for favicon and web preview)
const standardIconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>
    <linearGradient id="sunGrad" x1="160" y1="130" x2="352" y2="382" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#fb7185" />
    </linearGradient>
    <linearGradient id="kanjiGrad" x1="140" y1="120" x2="372" y2="392" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
    <filter id="shadow" x="100" y="90" width="312" height="340" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#1e1b4b" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Base rounded container -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)" />
  <rect x="4" y="4" width="504" height="504" rx="116" stroke="rgba(255,255,255,0.2)" stroke-width="4" />

  <!-- Subtle Japanese Sun motif behind character -->
  <circle cx="256" cy="256" r="115" fill="url(#sunGrad)" opacity="0.88" />
  <circle cx="256" cy="256" r="130" stroke="rgba(255,255,255,0.15)" stroke-width="3" stroke-dasharray="8 8" />

  <!-- Stylized Kanji '日' (Nihon / Sun / Japan) -->
  <g filter="url(#shadow)">
    <!-- Outer rectangle frame of '日' -->
    <rect x="166" y="146" width="180" height="220" rx="16" fill="none" stroke="url(#kanjiGrad)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />
    <!-- Middle crossbar -->
    <line x1="166" y1="256" x2="346" y2="256" stroke="url(#kanjiGrad)" stroke-width="24" stroke-linecap="round" />
    <!-- Bottom crossbar accent -->
    <line x1="150" y1="366" x2="362" y2="366" stroke="url(#kanjiGrad)" stroke-width="12" stroke-linecap="round" opacity="0.4" />
  </g>

  <!-- Modern Star / Sparkle Accent -->
  <path d="M375 130 C375 145 385 155 400 155 C385 155 375 165 375 180 C375 165 365 155 350 155 C365 155 375 145 375 130 Z" fill="#fde047" opacity="0.95" />
</svg>
`;

// 2. Maskable Icon SVG (Full bleed background without pre-rounded corners, 20% safe-zone margin)
const maskableIconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>
    <linearGradient id="sunGrad" x1="160" y1="130" x2="352" y2="382" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#fb7185" />
    </linearGradient>
    <linearGradient id="kanjiGrad" x1="140" y1="120" x2="372" y2="392" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
    <filter id="shadow" x="100" y="90" width="312" height="340" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#1e1b4b" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Full bleed background for Android dynamic masking -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Centered graphics scaled safely inside the 60% safe zone (center 360x360) -->
  <g transform="translate(256 256) scale(0.85) translate(-256 -256)">
    <!-- Sun motif -->
    <circle cx="256" cy="256" r="115" fill="url(#sunGrad)" opacity="0.9" />
    <circle cx="256" cy="256" r="130" stroke="rgba(255,255,255,0.2)" stroke-width="3" stroke-dasharray="8 8" />

    <!-- Kanji '日' -->
    <g filter="url(#shadow)">
      <rect x="166" y="146" width="180" height="220" rx="16" fill="none" stroke="url(#kanjiGrad)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />
      <line x1="166" y1="256" x2="346" y2="256" stroke="url(#kanjiGrad)" stroke-width="24" stroke-linecap="round" />
    </g>

    <!-- Sparkle -->
    <path d="M375 130 C375 145 385 155 400 155 C385 155 375 165 375 180 C375 165 365 155 350 155 C365 155 375 145 375 130 Z" fill="#fde047" />
  </g>
</svg>
`;

async function generate() {
  console.log('🎨 Generating PWA App Icons & Logos...');

  // Save SVGs
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardIconSvg.trim());
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), standardIconSvg.trim());

  // Generate 512x512 standard PNG
  await sharp(Buffer.from(standardIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512.png'));

  // Generate 192x192 standard PNG
  await sharp(Buffer.from(standardIconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192x192.png'));

  // Generate 512x512 Maskable PNG
  await sharp(Buffer.from(maskableIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'maskable-icon-512x512.png'));

  // Generate 180x180 Apple Touch Icon
  await sharp(Buffer.from(standardIconSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  // Generate 32x32 Favicon PNG
  await sharp(Buffer.from(standardIconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  console.log('✅ Generated all icons in public/icons/:');
  console.log('  - icon-192x192.png');
  console.log('  - icon-512x512.png');
  console.log('  - maskable-icon-512x512.png');
  console.log('  - apple-touch-icon.png');
  console.log('  - favicon.svg');
}

generate().catch(console.error);
