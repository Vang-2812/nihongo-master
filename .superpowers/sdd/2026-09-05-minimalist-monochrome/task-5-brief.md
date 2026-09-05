# Task 5 Brief: Vocab Catalog & Lesson Detail Overhaul (/tango & /tango/[lessonId])

Work from: `c:\Users\vangk\Documents\CodeProject\nihongo-master`

## Requirements:

1. `src/components/vocab/VocabCard.tsx`:
   - Container: `border border-black bg-white p-4 sm:p-5 flex flex-col justify-between rounded-none shadow-none`.
   - Checkbox: sharp 90-degree square (`w-5 h-5 border border-black rounded-none`).
   - Japanese word: `font-serif text-xl sm:text-2xl font-bold text-black`.
   - Reading: `font-mono text-xs sm:text-sm text-mutedForeground tracking-wide`.
   - Sino-Vietnamese: `font-mono text-[11px] uppercase tracking-widest border border-black px-1.5 py-0.5 text-black`.
   - Meaning: `font-body text-base sm:text-lg text-black`.
   - Example box: `border-l-2 border-black pl-3 py-1 bg-muted my-2 rounded-none`.
   - Status button & SRS toggle: Sharp rectangular mono buttons with hover invert:
     - Status: `[ STATUS: NOT STARTED ]`, `[ STATUS: LEARNING ]`, `[ STATUS: MASTERED ]` with `border border-black px-2 py-1 font-mono text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-100`.
     - SRS: Inverted black `[ SRS: ACTIVE ]` or `[ + SRS ]` in `border border-black px-2 py-1 font-mono text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-100`.

2. `src/components/vocab/AudioButton.tsx`:
   - Sharp rectangular button or minimal icon button with `border border-black p-1.5 hover:bg-black hover:text-white transition-colors duration-100 rounded-none`.

3. `src/components/vocab/LessonDetailView.tsx`:
   - Section header with Playfair Display heading, lesson index badge `[ LESSON 01 ]`, 4px black divider rule.
   - Batch control toolbar: `border-2 border-black p-4 mb-6 flex flex-wrap items-center justify-between gap-4 bg-white`.
   - Action buttons: `[ + ADD ALL TO SRS ]`, `[ PRACTICE QUIZ ]`, `[ AI CLOZE EXERCISES ]` in bold uppercase mono with hover invert.

4. `src/app/tango/page.tsx`:
   - Luxury editorial book archive layout:
     - Header: "VOCABULARY ARCHIVE" / "単語帳" in Playfair Display serif, mono tracking-widest subtitle.
     - Textbook cards (Minna no Nihongo, Mimikara Oboeru, Soumatome): formatted like high-fashion monographs / book covers with crisp 2px black borders, large numbers, progress percentage in monospace, and hover inversion.

5. `src/app/tango/[lessonId]/page.tsx`:
   - Clean editorial header, back navigation link `[ ← BACK TO ARCHIVE ]`, lesson vocabulary list, and verification that static export produces all pages.

6. Verification:
   - Run `npm test` and `npm run build`.
   - Commit: `feat(vocab): style vocabulary catalog and lesson detail with editorial typography and hairlines`.
   - Write report to: `c:\Users\vangk\Documents\CodeProject\nihongo-master\.superpowers\sdd\2026-09-05-minimalist-monochrome\task-5-report.md`.
