# Task 6 Brief: SRS Flashcards & Quiz Modules Redesign (Monochrome Feedback States)

Work from: `c:\Users\vangk\Documents\CodeProject\nihongo-master`

## Requirements:

1. `src/components/srs/SRSFlashcard.tsx`:
   - 3D flip card container: Sharp rectangular shape, `border-2 border-black bg-white text-black rounded-none shadow-none`.
   - Front & Back: Pure white background with paper texture, high-contrast Playfair Display serif for Japanese characters (4xl-6xl), JetBrains Mono for furigana, readings, and labels.
   - Minimal monochrome action hints: `[ SPACE TO FLIP ]`, `[ R TO LISTEN ]`.

2. `src/components/srs/RatingButtons.tsx`:
   - 4 Sharp rectangular rating buttons:
     - `1 · AGAIN` (Học lại)
     - `2 · HARD` (Khó)
     - `3 · GOOD` (Tốt)
     - `4 · EASY` (Dễ)
   - Styling: `border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none`.
   - Hotkey badges: `[ 1 ]`, `[ 2 ]`, `[ 3 ]`, `[ 4 ]` in monospace.
   - Interval text: `[ +1 DAY ]`, `[ +6 DAYS ]` etc.
   - Zero colors (no rose, amber, blue, emerald).

3. `src/components/srs/SessionSummary.tsx`:
   - High-fashion editorial summary: Enormous Playfair Display title "SESSION COMPLETED" / "学習完了".
   - Stats grid with 4px black rules and 6xl serif numbers: cards reviewed, accuracy, streak, XP.
   - Action buttons: Inverted black button `[ CONTINUE TO DASHBOARD ]` and white button `[ REVIEW AGAIN ]`.

4. `src/components/quiz/MultipleChoiceQuiz.tsx`:
   - Choice buttons: sharp rectangular `border-2 border-black bg-white text-black hover:bg-muted transition-colors duration-100 rounded-none shadow-none`.
   - Feedback states:
     - Correct: Inverted solid black `bg-black text-white border-2 border-black` + `[ CORRECT ] ✓`.
     - Incorrect (selected): 4px thick black border, text line-through, `border-4 border-black bg-white text-black line-through` + `[ INCORRECT ] ✕`.
     - The true correct answer is revealed with solid black invert `bg-black text-white`.
     - Streak and XP counters in clean monospace badges `[ STREAK: 5 ]` and `[ +10 XP ]`.
   - Summary screen: Editorial layout with high-contrast trophy / stats breakdown.

5. `src/components/quiz/MatchingGame.tsx`:
   - Sharp matching tiles: `border-2 border-black bg-white text-black rounded-none shadow-none font-serif text-lg sm:text-xl`.
   - Selected state: `ring-2 ring-black bg-muted`.
   - Matched pair: Inverted solid black `bg-black text-white border-2 border-black` with smooth fade or checkmark.
   - Mismatched pair: Heavy double border / shake feedback without red color.

6. `src/components/quiz/WordBuilderQuiz.tsx`:
   - Target meaning display in Playfair Display serif.
   - Character tile bank: Sharp square letter blocks `border-2 border-black bg-white text-black font-serif text-2xl hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none`.
   - Assembled word slots: Underline or square box `border-b-2 border-black` or `border-2 border-black`.
   - Feedback: When complete and correct, invert to solid black `[ CORRECT ] ✓`.

7. `src/components/vocab/AIClozeQuizModal.tsx`:
   - Modal dialog following Task 2 Modal standards (4px black border, sharp header divider).
   - Translation toggle: `[ TRANSLATE: ON / OFF ]` in sharp mono.
   - Input/option buttons: Pure monochrome sharp rectangles.

8. Verification:
   - Run `npm test` and `npm run build`.
   - Commit: `feat(quiz): implement monochrome feedback states, sharp flashcards, and ai quiz modal`.
   - Write report to: `c:\Users\vangk\Documents\CodeProject\nihongo-master\.superpowers\sdd\2026-09-05-minimalist-monochrome\task-6-report.md`.
