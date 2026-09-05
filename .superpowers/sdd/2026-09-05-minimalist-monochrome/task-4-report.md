# Task 4 Report: Kanji Catalog & Detail Page Redesign (/kanji & /kanji/[character])

- **Status**: DONE
- **Date**: 2026-09-05
- **Commit Hash**: `8721a833b3624315f23ab94e63c4d941af0dae6f`
- **Branch**: `feat/minimalist-monochrome`

---

## 1. Summary of Work

Redesigned the Kanji catalog, grid system, stroke order practice writer, and character detail view to strictly align with the Minimalist Monochrome editorial design specification:

1. **Kanji Card (`src/components/kanji/KanjiCard.tsx`)**:
   - **Monochromatic Container**: High-contrast container `border border-black bg-white p-4 transition-colors duration-100 hover:bg-black hover:text-white group rounded-none shadow-none flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-black`.
   - **Dramatic Serif Character**: Enormous high-contrast serif character display `font-serif text-5xl sm:text-6xl text-black group-hover:text-white select-none`.
   - **Sino-Vietnamese Reading**: `font-serif text-sm sm:text-base font-bold uppercase tracking-widest text-black group-hover:text-white`.
   - **Meaning**: Clean subtitle in `font-body text-xs sm:text-sm text-mutedForeground group-hover:text-neutral-300 line-clamp-1`.
   - **Controls & Badges**:
     - Sharp rectangular selection checkbox (`w-5 h-5 border border-black rounded-none`).
     - Stroke count tag (`font-mono text-[10px] tracking-wider uppercase border border-black px-1.5 py-0.5 text-black group-hover:text-white group-hover:border-white`).
     - Minimalist audio button with 1.5px stroke and instant 100ms hover invert.
     - Sharp rectangular SRS toggle button (`[ + SRS ]` / `[ SRS: IN ]`) inverting on hover.
   - **Status Indicators**: Pure monochrome tags (`[ MASTERED ]`, `[ IN SRS ]`, `[ NEW ]`), removing all colored badges.
   - **Footer**: Hairline border `border-t border-borderLight group-hover:border-neutral-800 font-mono text-[11px]` with On/Kun previews and sharp level badge.

2. **Kanji Grid & Batch Action Bar (`src/components/kanji/KanjiGrid.tsx`)**:
   - **Sharp Grid Cells**: Uniform grid layout with sharp borders between cells (`gap-3 sm:gap-4`).
   - **Batch Action Bar**: `bg-white border-2 border-black p-4 mb-6 flex flex-wrap items-center justify-between gap-4 font-mono text-xs rounded-none shadow-none` featuring selection count, `[ CHỌN TẤT CẢ ]` / `[ BỎ CHỌN TẤT CẢ ]`, and `[ LUYỆN TẬP ]`.
   - **Monochrome Empty State**: Bounded by `border-2 border-dashed border-black bg-white p-12 rounded-none` with serif header and sharp rectangular reset button.

3. **Stroke Order Practice Writer (`src/components/kanji/StrokeOrderWriter.tsx`)**:
   - **Pure Black Ink Configuration**:
     - HanziWriter configured with `strokeColor: '#000000'`, `radicalColor: '#000000'`, `outlineColor: '#E5E5E5'`, `drawingColor: '#000000'`.
   - **Canvas Container**: `border-2 border-black bg-white rounded-none shadow-none` with hairline practice guidelines in `#E5E5E5`.
   - **Control Buttons**: Sharp rectangular buttons `border border-black bg-white hover:bg-black hover:text-white font-mono text-xs uppercase tracking-wider px-3 py-2 rounded-none transition-colors duration-100` (Hoạt họa, Tập viết, Đặt lại, Phát âm). Active quiz mode inverts cleanly to solid black.
   - **Status Banner**: Minimalist banner `border border-black bg-white text-black font-mono text-xs uppercase p-3 tracking-wide rounded-none` replacing all colored alert boxes.

4. **Kanji Catalog Page (`src/app/kanji/page.tsx`)**:
   - **Editorial Heading**: Playfair Display serif title `KHO HÁN TỰ`, mono subtitle, and heavy 4px black rule divider (`h-1 bg-black w-full`).
   - **JLPT Tabs (N5–N1)**: Sharp rectangular buttons `border border-black font-mono text-xs uppercase tracking-widest px-4 py-2.5 rounded-none transition-colors duration-100` (Active: `bg-black text-white`; Inactive: `bg-white text-black hover:bg-muted`).
   - **High-Contrast Statistics Grid**: Bounded by 2px solid black rules with column dividers (`border-t-2 border-b-2 border-black divide-y sm:divide-y-0 sm:divide-x divide-black py-4 grid grid-cols-2 lg:grid-cols-4`) showing total kanji, mastered, learning, and new.
   - **Search & Filter Controls**: Sharp rectangular inputs with `border-2 border-black focus:outline-none focus:ring-2 focus:ring-black rounded-none shadow-none font-mono text-xs` and sharp filter chips.
   - **Floating Selection Bar**: Sticky bottom bar in sharp monochrome `border-2 border-black bg-white text-black font-mono text-xs rounded-none shadow-none`.

5. **Kanji Detail View (`src/app/kanji/[character]/page.tsx` & `src/components/kanji/KanjiDetailView.tsx`)**:
   - **Back Navigation**: `[ ← BACK TO ARCHIVE ]` in `font-mono text-xs uppercase tracking-widest inline-flex items-center gap-2 hover:underline text-black`.
   - **Editorial Gallery Layout**:
     - Large character display (`font-serif text-7xl sm:text-8xl lg:text-9xl font-normal text-black leading-none`).
     - Dramatic Sino-Vietnamese typography (`font-serif text-3xl sm:text-4xl lg:text-5xl font-normal uppercase`).
     - Quick metrics strip with hairline column dividers (`border-t border-b border-black divide-x divide-black font-mono text-xs`).
     - Onyomi and Kunyomi cards with clean hairlines, mono tags, and instant audio invert buttons.
     - Radicals breakdown list with hairline row dividers (`divide-y divide-borderLight border-t border-b border-black`).
     - Compound words table with clean hairlines (`border-t border-b border-black divide-y divide-borderLight`).
     - Integrated `StrokeOrderWriter` in pure black ink.

---

## 2. Verification Results

- **Unit Tests (`npm test`)**:
  - Total Suites: 16
  - Total Tests: 62
  - Passing: 62 (100%)
  - Failing: 0
  - Duration: ~2.7s

- **Next.js Production Build (`npm run build`)**:
  - Next.js Version: 14.2.35
  - Typecheck & Linting: Passed with 0 errors
  - Static Page Generation: 2,184 / 2,184 pages prerendered successfully with 0 errors.
