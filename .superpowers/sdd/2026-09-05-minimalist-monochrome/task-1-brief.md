# Task 1 Brief: Foundational Design Tokens, Typography & Global Paper Texture

Work from: `c:\Users\vangk\Documents\CodeProject\nihongo-master`

## Requirements:
1. In `src/app/layout.tsx`:
   - Import `Playfair_Display`, `Source_Serif_4`, `JetBrains_Mono` from `next/font/google`.
   - Setup font variables:
     ```typescript
     const playfair = Playfair_Display({
       subsets: ['latin', 'vietnamese'],
       variable: '--font-playfair',
       display: 'swap',
     });
     const sourceSerif = Source_Serif_4({
       subsets: ['latin', 'vietnamese'],
       variable: '--font-source-serif',
       display: 'swap',
     });
     const jetbrainsMono = JetBrains_Mono({
       subsets: ['latin', 'vietnamese'],
       variable: '--font-jetbrains-mono',
       display: 'swap',
     });
     ```
   - Apply `${playfair.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}` to `<html>` class.
   - Remove `themeBlockingScript` and `<ThemeInitializer />`.
   - Set `<meta name="theme-color" content="#000000" />`.
   - Update `<body>` to use `bg-background text-foreground font-body antialiased selection:bg-black selection:text-white`.

2. In `tailwind.config.ts`:
   - Define strict monochrome color tokens:
     ```typescript
     colors: {
       background: "#FFFFFF",
       foreground: "#000000",
       muted: "#F5F5F5",
       mutedForeground: "#525252",
       border: "#000000",
       borderLight: "#E5E5E5",
       accent: "#000000",
     }
     ```
   - Define font families:
     ```typescript
     fontFamily: {
       serif: ["var(--font-playfair)", "Georgia", "serif"],
       display: ["var(--font-playfair)", "Georgia", "serif"],
       body: ["var(--font-source-serif)", "Times New Roman", "serif"],
       mono: ["var(--font-jetbrains-mono)", "Menlo", "monospace"],
     }
     ```
   - Force all `borderRadius` to `'0px'`.
   - Force all `boxShadow` to `'none'`.

3. In `src/app/globals.css`:
   - Set `:root` variables:
     ```css
     :root {
       --background: #ffffff;
       --foreground: #000000;
       --muted: #f5f5f5;
       --muted-foreground: #525252;
       --border: #000000;
       --border-light: #e5e5e5;
     }
     ```
   - Enforce universal zero-radius and zero-shadow:
     ```css
     *, *::before, *::after {
       border-radius: 0px !important;
       box-shadow: none !important;
     }
     ```
   - Enforce focus state:
     ```css
     *:focus-visible {
       outline: 3px solid #000000 !important;
       outline-offset: 2px !important;
     }
     ```
   - Add Paper Texture overlay:
     ```css
     body::before {
       content: "";
       position: fixed;
       inset: 0;
       background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
       pointer-events: none;
       z-index: 9999;
     }
     ```

4. Verification:
   - Run `npm test` and `npm run build` to verify Next.js compiles without errors.
   - Commit changes: `feat(design): implement minimalist monochrome design tokens, typography, and paper texture`.
   - Write report to: `c:\Users\vangk\Documents\CodeProject\nihongo-master\.superpowers\sdd\2026-09-05-minimalist-monochrome\task-1-report.md`.
