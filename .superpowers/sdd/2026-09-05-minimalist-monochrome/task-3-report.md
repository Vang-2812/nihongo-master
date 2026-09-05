# Task 3 Report: Dashboard Hero & Large-Scale Stats Overhaul (src/app/page.tsx)

- **Status**: DONE
- **Date**: 2026-09-05
- **Commit Hash**: `a0a1ed6f0a75db79eb89d11af57ad9bf045d5886`
- **Branch**: `feat/minimalist-monochrome`

---

## 1. Summary of Work

Refactored `src/app/page.tsx` from the ground up to follow the Minimalist Monochrome editorial high-fashion aesthetic:

1. **Editorial Hero Section**:
   - Enormous dramatic serif heading:
     `font-serif text-6xl sm:text-8xl lg:text-9xl font-normal tracking-tighter text-black leading-none uppercase` ("NIHONGO ARCHIVE")
     with large Japanese subtitle block `font-serif text-5xl sm:text-7xl lg:text-8xl mt-2 tracking-normal` ("日本語マスター").
   - Monospace subtitle tracking-widest:
     `font-mono text-xs sm:text-sm tracking-widest text-mutedForeground uppercase mt-4 max-w-xl`
     `[ REPOSITORY OF JAPANESE VOCABULARY & KANJI · SPACED REPETITION SYSTEM · JLPT N5–N1 ]`.
   - Heavy 4px black section rule divider:
     `<div className="h-1 bg-black w-full my-10 sm:my-14" />`.

2. **High-Impact Statistics Grid**:
   - Bounded by 2px solid black rules with responsive column dividers:
     `border-t-2 border-b-2 border-black divide-y sm:divide-y-0 sm:divide-x divide-black py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
   - Dramatic serif numerical scale (`font-serif text-5xl sm:text-7xl font-light text-black tracking-tight leading-none`) paired with sharp monospace uppercase labels:
     - `[ REVIEWS DUE ]`: `{dueCount}` with vocabulary and kanji due count breakdown.
     - `[ DAY STREAK ]`: `{streak}` with active streak indicator.
     - `[ XP ACCUMULATED ]`: `{totalXp}` with level & current level XP progress.
     - `[ CARDS IN SRS ]`: `{totalCards}` with reviewed and learning cards breakdown.

3. **Primary Action Callout**:
   - When reviews are due (`dueCount > 0`):
     - Bold inverted solid black card: `border-2 border-black bg-black text-white p-6 sm:p-10 my-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-none shadow-none`.
     - Heading: "HÔM NAY CÓ {dueCount} THẺ CẦN ÔN TẬP" in `font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight uppercase`.
     - Inverting CTA button: `border border-white bg-white text-black hover:bg-black hover:text-white px-8 py-3.5 font-mono text-xs uppercase tracking-widest transition-colors duration-100 rounded-none shadow-none`.
   - When reviews are caught up (`dueCount === 0`):
     - Clean white card with `border-2 border-black bg-white text-black p-6 sm:p-10 my-8 rounded-none shadow-none`.
     - Heading: "ĐÃ HOÀN THÀNH TẤT CẢ ÔN TẬP HÔM NAY" with direct navigation links to `/tango`, `/kanji`, and `/review/quiz`.

4. **4 High-Contrast Quick Navigation Cards**:
   - Structured grid layout with `border-2 border-black bg-white p-6 sm:p-8 hover:bg-black hover:text-white transition-colors duration-100 group rounded-none shadow-none flex flex-col justify-between`.
   - Sharp mono index:
     - `01 / KANJI` (`/kanji`) with large kanji watermark `字` and level tags `[ N5 · N4 · N3 · N2 · N1 ]`.
     - `02 / TANGO` (`/tango`) with large kanji watermark `語` and textbook tags `[ MINNA · MIMIKARA · SOMATOME ]`.
     - `03 / SRS REVIEW` (`/review`) with large kanji watermark `記` and SRS tags `[ SM-2 · FLASHCARDS · {dueCount} DUE ]`.
     - `04 / QUIZLET` (`/review/quiz`) with large kanji watermark `問` and mode tags `[ TRẮC NGHIỆM · GHÉP THẺ · GHÉP CHỮ ]`.

5. **Editorial Data Management & Utility Footer**:
   - Bottom utility bar for backup export (`XUẤT JSON`), import (`NHẬP SAO LƯU`), and link to system settings (`/settings`).
   - Retained JSON backup/restore `Modal` with monochrome styling (`rounded-none`, `border-2 border-black`, `focus:ring-0`).

6. **Design System Adherence**:
   - Zero rounded corners (`rounded-none` throughout).
   - Zero drop shadows (`shadow-none` throughout).
   - Strict 6-color monochrome palette (#000000, #FFFFFF, #F5F5F5, #525252, #E5E5E5).
   - Instant 100ms hover transitions.

---

## 2. Verification Results

- **Unit Tests (`npm test`)**:
  - Total Suites: 16
  - Total Tests: 62
  - Passing: 62 (100%)
  - Failing: 0
  - Duration: ~3.2s

- **Next.js Production Build (`npm run build`)**:
  - Compilation: Successful (`next build`)
  - Typecheck & Linting: Passed with 0 errors
  - Static Page Generation: 2,184 / 2,184 pages prerendered successfully with 0 errors.
