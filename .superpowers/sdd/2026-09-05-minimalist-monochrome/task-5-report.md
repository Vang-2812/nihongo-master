# Task 5 Report: Vocab Catalog & Lesson Detail Overhaul (/tango & /tango/[lessonId])

- **Status**: DONE
- **Date**: 2026-09-05
- **Commit Hash**: `b2d8ab3d32e0eda97157048dddff20014faf4ef0`
- **Branch**: `feat/minimalist-monochrome`

---

## 1. Summary of Work

Redesigned the Vocabulary Catalog (`/tango`), Lesson Detail page (`/tango/[lessonId]`), and related components to strictly align with the Minimalist Monochrome editorial design specification:

1. **Vocab Card (`src/components/vocab/VocabCard.tsx`)**:
   - **Sharp Monochromatic Container**: `border border-black bg-white p-4 sm:p-5 flex flex-col justify-between rounded-none shadow-none transition-colors duration-100` (with `border-2 border-black bg-neutral-100` for active selection state).
   - **Sharp Selection Checkbox**: Sharp 90-degree square (`w-5 h-5 border border-black rounded-none`) with high-contrast active fill (`bg-black text-white` with crisp check icon).
   - **Japanese Word Typography**: `font-serif text-xl sm:text-2xl font-bold text-black tracking-tight`.
   - **Furigana / Reading**: `font-mono text-xs sm:text-sm text-mutedForeground tracking-wide`.
   - **Sino-Vietnamese Badge**: `font-mono text-[11px] uppercase tracking-widest border border-black px-1.5 py-0.5 text-black`.
   - **Word Type Badge**: `font-mono text-[10px] uppercase tracking-wider border border-black px-1.5 py-0.5 text-black`.
   - **Vietnamese Meaning**: `font-body text-base sm:text-lg text-black leading-snug`.
   - **Example Box**: `border-l-2 border-black pl-3 py-1 bg-muted my-2 rounded-none text-xs sm:text-sm` with serif Japanese text and audio playback.
   - **Sharp Rectangular Action Buttons (100ms Hover Inversion)**:
     - Status cycle: `[ STATUS: NOT STARTED ]`, `[ STATUS: LEARNING ]`, `[ STATUS: MASTERED ]` with `border border-black px-2 py-1 font-mono text-xs uppercase tracking-wider transition-colors duration-100 rounded-none` (Mastered: `bg-black text-white hover:bg-white hover:text-black`).
     - SRS toggle: Inverted `[ SRS: ACTIVE ]` or `[ + SRS ]` in `border border-black px-2 py-1 font-mono text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-100 rounded-none`.
   - **Color Removal**: Completely eliminated all legacy color tints (emerald, amber, purple, indigo, slate tints).

2. **Audio Button (`src/components/vocab/AudioButton.tsx`)**:
   - Sharp rectangular button with `border border-black p-1.5 hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none`.
   - Active speech playback state cleanly inverts to solid black (`bg-black text-white border-black`).
   - Completely eliminated rounded-full, indigo/purple pulses, bounce animations, and colored waves.

3. **Lesson Detail View (`src/components/vocab/LessonDetailView.tsx`)**:
   - **Sticky Editorial Header**: Clean navigation bar with `[ ← BACK TO ARCHIVE ]` in uppercase tracking-widest mono and quick access buttons.
   - **Section Header**: Playfair Display serif heading, lesson index badge `[ LESSON 01 ]`, JLPT level badge `[ N5 ]`, and heavy 4px black rule divider (`h-1 bg-black w-full`).
   - **Summary Metrics Strip**: Clean summary metrics with hairline dividers (`border-t-2 border-b-2 border-black divide-y sm:divide-y-0 sm:divide-x divide-black py-4 grid grid-cols-2 lg:grid-cols-4`).
   - **Batch Control Toolbar**: `border-2 border-black p-4 mb-6 flex flex-wrap items-center justify-between gap-4 bg-white rounded-none shadow-none`.
   - **Action Buttons**: `[ + ADD ALL TO SRS ]`, `[ PRACTICE QUIZ ]`, `[ AI CLOZE EXERCISES ]` in bold uppercase mono with hover invert (`border-2 border-black font-mono text-xs uppercase tracking-wider font-bold transition-colors duration-100 rounded-none`).
   - **Search & Filter Controls**: Sharp 2px black border with mono input and rectangular filter chips (`[ ALL ]`, `[ NEW ]`, `[ LEARNING ]`, `[ MASTERED ]`, `[ SRS ]`).
   - **Adjacent Lesson Navigation**: Hairline top border with `[ ← BÀI TRƯỚC ]` and `[ BÀI TIẾP → ]` in sharp rectangular mono buttons.

4. **Tango Catalog Page (`src/app/tango/page.tsx`)**:
   - **Editorial Book Archive Header**:
     - Header: "VOCABULARY ARCHIVE" / "単語帳" in Playfair Display serif, mono tracking-widest subtitle, and 4px heavy black divider.
     - High-contrast summary metrics strip with hairlines (`border-t-2 border-b-2 border-black divide-y sm:divide-y-0 sm:divide-x divide-black py-4 grid grid-cols-2 lg:grid-cols-4`).
   - **High-Fashion Monograph Book Covers**:
     - 4 standard textbooks (Minna no Nihongo I & II, Mimikara Oboeru N3, Soumatome N3) formatted like high-fashion monographs / book covers with crisp 2px black borders, large numbers (`01`, `02`, `03`, `04`), progress percentage in monospace, and instant hover inversion.
   - **Search & Filter Bar**: Sharp 2px black border, mono search input, and sharp status filter chips.
   - **Lesson Catalog Grid**: Sharp grid of lesson cards with sharp black borders, serif titles, monospace metrics (`[ 45 TỪ VỰNG ]`, `[ 85% ]`), and `[ VÀO HỌC BÀI → ]`.

5. **Tango Lesson Detail Page (`src/app/tango/[lessonId]/page.tsx`)**:
   - Updated metadata to editorial style (`[ N5 ] Bài 01 · Minna no Nihongo I | TANGO ARCHIVE`).
   - Preserved `generateStaticParams` for all 150 lessons.

---

## 2. Verification Results

- **Unit Tests (`npm test`)**:
  - Total Suites: 16
  - Total Tests: 62
  - Passing: 62 (100%)
  - Failing: 0
  - Duration: ~3.0s

- **Next.js Production Build (`npm run build`)**:
  - Next.js Version: 14.2.35
  - Typecheck & Linting: Passed with 0 errors
  - Static Page Generation: 2,184 / 2,184 pages prerendered successfully with 0 errors (including all 150 `/tango/[lessonId]` pages).
