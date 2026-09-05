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
    <!-- Deep Warm Sumi Ink Canvas -->
    <linearGradient id="sumiBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1C1917" />
      <stop offset="100%" stop-color="#141210" />
    </linearGradient>

    <!-- Japanese Vermilion Red Sun Disc (Aka / Hinomaru) -->
    <radialGradient id="sunGrad" cx="256" cy="256" r="140" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#DC2626" />
      <stop offset="85%" stop-color="#B91C1C" />
      <stop offset="100%" stop-color="#991B1B" />
    </radialGradient>
  </defs>

  <!-- Base container: Squircle for standard app icon & preview -->
  <rect width="512" height="512" rx="112" fill="url(#sumiBg)" />
  <rect x="3" y="3" width="506" height="506" rx="109" stroke="#44403C" stroke-width="2" stroke-opacity="0.6" />

  <!-- Traditional Hinomaru Sun Disc -->
  <circle cx="256" cy="256" r="130" fill="url(#sunGrad)" />

  <!-- Subtle Zen Calligraphy Enso ring / Hairline alignment circle -->
  <circle cx="256" cy="256" r="152" stroke="#E7E5E4" stroke-width="1.5" stroke-opacity="0.25" stroke-dasharray="4 6" />

  <!-- Authentic Kanji '日' in Washi Cream (#FAFAF9) -->
  <g stroke="#FAFAF9" stroke-linecap="square" stroke-linejoin="miter">
    <!-- Left vertical upright -->
    <line x1="184" y1="156" x2="184" y2="356" stroke-width="22" />

    <!-- Top horizontal & Right vertical upright -->
    <path d="M 184 167 L 328 167 L 328 356" fill="none" stroke-width="22" />

    <!-- Middle crossbar -->
    <line x1="184" y1="256" x2="328" y2="256" stroke-width="20" />

    <!-- Bottom crossbar -->
    <line x1="184" y1="345" x2="328" y2="345" stroke-width="20" />
  </g>

  <!-- Traditional Japanese Hanko Seal (印鑑) in bottom right corner -->
  <g transform="translate(342, 342)">
    <rect x="0" y="0" width="46" height="46" rx="4" fill="#B91C1C" stroke="#FAFAF9" stroke-width="1.5" />
    <text x="23" y="32" font-family="'Playfair Display', 'Hiragino Mincho ProN', 'Source Serif 4', serif" font-size="24" font-weight="900" fill="#FAFAF9" text-anchor="middle">本</text>
  </g>
</svg>
`;

// 2. Maskable Icon SVG (Full bleed background without pre-rounded corners, 20% safe-zone margin)
const maskableIconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Deep Warm Sumi Ink Canvas -->
    <linearGradient id="sumiBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1C1917" />
      <stop offset="100%" stop-color="#141210" />
    </linearGradient>

    <!-- Japanese Vermilion Red Sun Disc (Aka / Hinomaru) -->
    <radialGradient id="sunGrad" cx="256" cy="256" r="140" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#DC2626" />
      <stop offset="85%" stop-color="#B91C1C" />
      <stop offset="100%" stop-color="#991B1B" />
    </radialGradient>
  </defs>

  <!-- Full bleed background for Android dynamic masking -->
  <rect width="512" height="512" fill="url(#sumiBg)" />

  <!-- Centered graphics scaled safely inside the safe zone -->
  <g transform="translate(256 256) scale(0.82) translate(-256 -256)">
    <!-- Traditional Hinomaru Sun Disc -->
    <circle cx="256" cy="256" r="130" fill="url(#sunGrad)" />

    <!-- Subtle Zen Calligraphy Enso ring -->
    <circle cx="256" cy="256" r="152" stroke="#E7E5E4" stroke-width="1.5" stroke-opacity="0.25" stroke-dasharray="4 6" />

    <!-- Authentic Kanji '日' in Washi Cream (#FAFAF9) -->
    <g stroke="#FAFAF9" stroke-linecap="square" stroke-linejoin="miter">
      <!-- Left vertical upright -->
      <line x1="184" y1="156" x2="184" y2="356" stroke-width="22" />

      <!-- Top horizontal & Right vertical upright -->
      <path d="M 184 167 L 328 167 L 328 356" fill="none" stroke-width="22" />

      <!-- Middle crossbar -->
      <line x1="184" y1="256" x2="328" y2="256" stroke-width="20" />

      <!-- Bottom crossbar -->
      <line x1="184" y1="345" x2="328" y2="345" stroke-width="20" />
    </g>

    <!-- Traditional Japanese Hanko Seal (印鑑) -->
    <g transform="translate(342, 342)">
      <rect x="0" y="0" width="46" height="46" rx="4" fill="#B91C1C" stroke="#FAFAF9" stroke-width="1.5" />
      <text x="23" y="32" font-family="'Playfair Display', 'Hiragino Mincho ProN', 'Source Serif 4', serif" font-size="24" font-weight="900" fill="#FAFAF9" text-anchor="middle">本</text>
    </g>
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
