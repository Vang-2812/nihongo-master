# Task 3 Brief: Dashboard Hero & Large-Scale Stats Overhaul (src/app/page.tsx)

Work from: `c:\Users\vangk\Documents\CodeProject\nihongo-master`

## Requirements:
1. Editorial Hero Section:
   - Enormous dramatic serif heading:
     `<h1 className="font-serif text-6xl sm:text-8xl lg:text-9xl font-normal tracking-tighter text-black leading-none uppercase">NIHONGO ARCHIVE</h1>`
     or with large Japanese characters `<span className="block font-serif text-5xl sm:text-7xl lg:text-8xl mt-2 tracking-normal">日本語マスター</span>`.
   - Subtitle in `font-mono text-xs sm:text-sm tracking-widest text-mutedForeground uppercase mt-4 max-w-xl`:
     `[ REPOSITORY OF JAPANESE VOCABULARY & KANJI · SPACED REPETITION SYSTEM · JLPT N5–N1 ]`
   - Section divider: `<div className="h-1 bg-black w-full my-10 sm:my-14" />`

2. High-Impact Statistics Grid:
   - 4-column or 2x2 grid (`border-t-2 border-b-2 border-black divide-y sm:divide-y-0 sm:divide-x divide-black py-4`):
     - Due for Review: `<div className="font-serif text-5xl sm:text-7xl font-light text-black tracking-tight">{dueCount}</div>` + `<div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-mutedForeground mt-1">[ REVIEWS DUE ]</div>`
     - Day Streak: `{streak}` + `[ DAY STREAK ]`
     - Total XP: `{totalXp}` + `[ XP ACCUMULATED ]`
     - Total Cards: `{totalCards}` + `[ CARDS IN SRS ]`

3. Primary Action Callout:
   - If `dueCount > 0`:
     A bold inverted black block card:
     `<div className="border-2 border-black bg-black text-white p-6 sm:p-10 my-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">`
     With big Playfair heading: "HÔM NAY CÓ {dueCount} THẺ CẦN ÔN TẬP"
     And button: `border border-white bg-white text-black hover:bg-black hover:text-white px-8 py-3.5 font-mono text-xs uppercase tracking-widest transition-colors duration-100`
   - If `dueCount === 0`:
     A clean white card with border-2 border-black: "ĐÃ HOÀN THÀNH TẤT CẢ ÔN TẬP HÔM NAY".

4. 4 High-Contrast Quick Navigation Cards:
   - Kanji Catalog (`/kanji`), Vocabulary Library (`/tango`), Flashcard Center (`/review`), Quiz & Mini Games (`/review/quiz`).
   - Rectangular cards: `border-2 border-black bg-white p-6 sm:p-8 hover:bg-black hover:text-white transition-colors duration-100 group`.
   - Sharp mono index: `01 / KANJI`, `02 / TANGO`, `03 / SRS REVIEW`, `04 / QUIZLET`.

5. Verification:
   - Run `npm test` and `npm run build`.
   - Commit: `feat(dashboard): apply editorial high-contrast layout and dramatic serif scale to homepage`.
   - Write report to: `c:\Users\vangk\Documents\CodeProject\nihongo-master\.superpowers\sdd\2026-09-05-minimalist-monochrome\task-3-report.md`.
