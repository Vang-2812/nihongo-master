# Task 4 Brief: Kanji Catalog & Detail Page Redesign (/kanji & /kanji/[character])

Work from: `c:\Users\vangk\Documents\CodeProject\nihongo-master`

## Requirements:

1. `src/components/kanji/KanjiCard.tsx`:
   - Card container: `border border-black bg-white p-4 transition-colors duration-100 hover:bg-black hover:text-white group rounded-none shadow-none flex flex-col justify-between`.
   - Selection checkbox: sharp 90-degree square (`w-5 h-5 border border-black rounded-none`).
   - Stroke count badge: `font-mono text-[10px] tracking-wider uppercase border border-black px-1.5 py-0.5 group-hover:border-white`.
   - Audio & SRS toggle buttons:
     - Audio button: mono or 1.5px stroke icon, `border border-black p-1 hover:bg-black hover:text-white group-hover:border-white group-hover:hover:bg-white group-hover:hover:text-black`.
     - SRS toggle button: `font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-black group-hover:border-white`.
       - When learning/added: inverted solid black (or solid white on hover) `[ SRS: IN ]`.
       - When new: `[ + SRS ]`.
   - Character display: Enormous high-contrast serif `font-serif text-5xl sm:text-6xl text-black group-hover:text-white select-none`.
   - Sino-Vietnamese reading: `font-serif text-sm sm:text-base font-bold uppercase tracking-widest text-black group-hover:text-white`.
   - Meaning: `font-body text-xs sm:text-sm text-mutedForeground group-hover:text-neutral-300 line-clamp-1`.
   - Footer: hairline border `border-t border-borderLight group-hover:border-neutral-800 pt-2 font-mono text-[11px]`.
   - Level indicator: `font-mono font-bold text-[10px] border border-black px-1 group-hover:border-white`.

2. `src/components/kanji/KanjiGrid.tsx`:
   - Grid layout: sharp borders between cells or unified grid lines.
   - Batch action bar: `bg-white border-2 border-black p-4 mb-6 flex items-center justify-between font-mono text-xs`.

3. `src/components/kanji/StrokeOrderWriter.tsx`:
   - HanziWriter options:
     - `strokeColor: '#000000'`
     - `radicalColor: '#000000'`
     - `outlineColor: '#E5E5E5'`
     - `drawingColor: '#000000'`
   - Canvas container: `border-2 border-black bg-white rounded-none shadow-none`.
   - Practice grid guidelines: hairline lines in `#E5E5E5`.
   - Control buttons: sharp rectangular `border border-black bg-white hover:bg-black hover:text-white font-mono text-xs uppercase tracking-wider px-3 py-2 rounded-none transition-colors duration-100`.
   - Status banner: `border border-black bg-white text-black font-mono text-xs uppercase p-3 tracking-wide rounded-none`.

4. `src/app/kanji/page.tsx`:
   - Header: Playfair Display serif title, mono subtitle, 4px heavy black rule.
   - JLPT Level tabs (N5, N4, N3, N2, N1): sharp tab buttons `border border-black font-mono text-xs uppercase tracking-widest px-4 py-2`. Active: `bg-black text-white`. Inactive: `bg-white text-black hover:bg-muted`.
   - Search & Filter bar: Sharp rectangular inputs with `border-2 border-black focus:outline-none focus:ring-2 focus:ring-black rounded-none`.

5. `src/app/kanji/[character]/page.tsx`:
   - Editorial gallery detail layout:
     - Back button: `font-mono text-xs uppercase tracking-widest inline-flex items-center gap-2 hover:underline`.
     - Large character display & Sino-Vietnamese reading with dramatic typography.
     - Readings (Onyomi, Kunyomi) formatted with hairline dividers.
     - Stroke Order Writer integration in pure black ink.
     - Compound words table: clean lines `border-t border-b border-black divide-y divide-borderLight`.

6. Verification:
   - Run `npm test` and `npm run build`.
   - Commit: `feat(kanji): convert kanji catalog, grid, stroke writer, and detail view to minimalist monochrome`.
   - Write report to: `c:\Users\vangk\Documents\CodeProject\nihongo-master\.superpowers\sdd\2026-09-05-minimalist-monochrome\task-4-report.md`.
