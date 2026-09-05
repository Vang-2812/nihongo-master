# Muted Japanese Aesthetic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebalance the application interface from stark pure monochrome to a refined, warm Japanese aesthetic (Wabi-Sabi) with a warm paper canvas (#FAFAF9), soft sumi ink (#1C1917), 1px subtle borders (#E7E5E4), and semantic muted pastel tones for status, quiz feedback, and JLPT levels.

**Architecture:** Update Tailwind design tokens and CSS variables in `globals.css` and `tailwind.config.ts`, then systematically refactor layout, catalogs, flashcards, quizlet modes, and settings to apply semantic muted color tokens and 1px borders while preserving the Inter/Playfair typography and 0px border radius.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Zustand, Lucide React, Node.js test runner (`tsx --test`).

**Spec:** `docs/superpowers/specs/2026-09-05-muted-japanese-aesthetic-redesign.md`

## Global Constraints

- **Surface & Text Tokens:** Background `#FAFAF9` (Stone-50), Foreground `#1C1917` (Stone-900), Cards `#FFFFFF`.
- **Border Treatment:** Replace heavy 2px/4px black borders with clean 1px borders (`border-stone-200` subtle, `border-stone-800` strong).
- **Semantic Muted Japanese Palette:**
  - Sage Matcha: `bg-emerald-50 text-emerald-800 border-emerald-200` (Mastered / Correct / Easy)
  - Sakura Coral: `bg-rose-50 text-rose-800 border-rose-200` (Incorrect / Learning Again / Danger)
  - Muted Aoi: `bg-indigo-50 text-indigo-800 border-indigo-200` (In SRS / Learning / Good)
  - Warm Ochre: `bg-amber-50 text-amber-800 border-amber-200` (Streak / XP / Hard / N3)
- **JLPT Level Tags:** N5 (`emerald-50`), N4 (`sky-50`), N3 (`amber-50`), N2 (`purple-50`), N1 (`rose-50`).
- **Typography:** Retain `Playfair Display` for serif headings, `Inter` for sans body/Vietnamese, `JetBrains Mono` for metadata.
- **Zero Regressions:** 62/62 unit tests must pass; `npm run build` must generate all 2,184 static export pages without errors.

---

### Task 1: Foundational Design Tokens & CSS Variables

**Files:**
- Modify: `src/app/globals.css:1-60`
- Modify: `tailwind.config.ts:1-40`

**Interfaces:**
- Consumes: Tailwind CSS theme configuration and CSS custom properties.
- Produces: Updated `--background`, `--foreground`, `--card`, `--muted`, and Tailwind color aliases (`stone`, `sage`, `coral`, `indigo`, `ochre`).

- [ ] **Step 1: Update globals.css color tokens**
Set `--background: #FAFAF9`, `--foreground: #1C1917`, `--card: #FFFFFF`, `--muted: #F5F5F4`, `--muted-foreground: #78716C`, and `--border: #E7E5E4`.

- [ ] **Step 2: Update tailwind.config.ts**
Ensure Tailwind color extensions map correctly to CSS variables and Stone/Neutral scales.

- [ ] **Step 3: Run unit tests to verify zero regressions**
Run `npm test` and verify 62/62 tests pass.

- [ ] **Step 4: Commit**
```bash
git add src/app/globals.css tailwind.config.ts
git commit -m "feat(design): implement muted japanese aesthetic tokens and warm paper background"
```

---

### Task 2: Core Navigation & Global UI Kit

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/ui/ToastContainer.tsx`
- Modify: `src/components/ui/ProgressBar.tsx`
- Modify: `src/components/ui/Modal.tsx`

**Interfaces:**
- Consumes: Global color tokens and 1px border rules.
- Produces: Polished Navbar with soft border and subtle active pill, Toast container with muted semantic alerts, smooth progress bar, and 1px border modal.

- [ ] **Step 1: Refactor Navbar.tsx**
Update background to `bg-white/95 backdrop-blur-sm border-b border-stone-200`, active link to `bg-stone-900 text-white px-3 py-1.5`, archive badge to `bg-stone-100 text-stone-700 border border-stone-300`.

- [ ] **Step 2: Refactor ToastContainer.tsx**
Replace stark black borders with `border border-stone-200 shadow-sm`, and apply soft semantic background pills for SUCCESS (`emerald-50 text-emerald-800`), ERROR (`rose-50 text-rose-800`), and INFO (`indigo-50 text-indigo-800`).

- [ ] **Step 3: Refactor ProgressBar.tsx & Modal.tsx**
Update container border to `border border-stone-200`, fill to `bg-stone-900` or `bg-emerald-600`, and modal to `border border-stone-300 bg-white`.

- [ ] **Step 4: Run unit tests to verify Toast & UI component tests**
Run `npm test` and verify useToastStore passes.

- [ ] **Step 5: Commit**
```bash
git add src/components/layout/Navbar.tsx src/components/ui/ToastContainer.tsx src/components/ui/ProgressBar.tsx src/components/ui/Modal.tsx
git commit -m "feat(ui): style navbar, toasts, progressbar, and modal with muted tones and 1px borders"
```

---

### Task 3: Dashboard Hero & Large-Scale Stats Overhaul

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `useSRSStore` (cards, stats, due cards count).
- Produces: Refined editorial homepage with warm paper background, soft borders, muted indigo due reviews card, warm amber streak/XP stats, and 4 quick-action cards.

- [ ] **Step 1: Refactor Dashboard header & 1px section rules**
Update main hero to use Sumi ink text `#1C1917`, change `h-1 bg-black` divider to `h-px bg-stone-300`, and set stats grid borders to `border border-stone-200 divide-stone-200`.

- [ ] **Step 2: Apply soft pastel accents to Stats Grid**
Add warm ochre accent to Streak (`text-amber-700`), amber to XP (`text-amber-700`), and muted indigo to SRS cards count.

- [ ] **Step 3: Refactor Primary Due Reviews Action Card**
When cards are due, render a soft indigo card (`bg-indigo-50/70 border border-indigo-200 text-stone-900`) with an indigo action button (`bg-indigo-900 hover:bg-indigo-800 text-white`).

- [ ] **Step 4: Refactor 4 Navigation Cards**
Update cards `01 / KANJI`, `02 / TANGO`, `03 / SRS REVIEW`, `04 / QUIZLET` to `border border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50/80 transition-all`.

- [ ] **Step 5: Run tests and commit**
Run `npm test` and commit:
```bash
git add src/app/page.tsx
git commit -m "feat(dashboard): apply warm paper background, 1px rules, and muted accents to homepage"
```

---

### Task 4: Kanji Catalog & Detail Page Redesign

**Files:**
- Modify: `src/components/kanji/KanjiCard.tsx`
- Modify: `src/components/kanji/KanjiGrid.tsx`
- Modify: `src/app/kanji/page.tsx`
- Modify: `src/components/kanji/KanjiDetailView.tsx`
- Modify: `src/components/kanji/StrokeOrderWriter.tsx`

**Interfaces:**
- Consumes: Kanji data (`KanjiItem`), `useKanjiStore`, `useSRSStore`.
- Produces: Kanji cards with muted pastel status chips, JLPT level tabs (N5-N1) in semantic colors, and refined HanziWriter canvas.

- [ ] **Step 1: Refactor KanjiCard.tsx status badges & SRS toggle**
Map status to:
- `ĐÃ THUỘC`: `bg-emerald-50 text-emerald-800 border border-emerald-200`
- `ĐANG HỌC`: `bg-indigo-50 text-indigo-800 border border-indigo-200`
- `CHƯA HỌC`: `bg-stone-100 text-stone-600 border border-stone-200`
- `+ SRS`: `border border-stone-300 bg-white text-stone-800 hover:bg-stone-100`
- `SRS ✓`: `bg-indigo-50 text-indigo-800 border border-indigo-200`
Change card border to `border border-stone-200 hover:border-stone-400`.

- [ ] **Step 2: Refactor JLPT Level Tabs in kanji/page.tsx**
Apply semantic pastel colors to level tabs:
- N5: `bg-emerald-50 text-emerald-800 border-emerald-300`
- N4: `bg-sky-50 text-sky-800 border-sky-300`
- N3: `bg-amber-50 text-amber-800 border-amber-300`
- N2: `bg-purple-50 text-purple-800 border-purple-300`
- N1: `bg-rose-50 text-rose-800 border-rose-300`

- [ ] **Step 3: Refactor StrokeOrderWriter.tsx & KanjiDetailView.tsx**
Set HanziWriter canvas container to `border border-stone-300 bg-white`, outline color `#E7E5E4`, stroke color `#1C1917`. Update compound words table with `divide-stone-200`.

- [ ] **Step 4: Run tests and commit**
Run `npm test` and commit:
```bash
git add src/components/kanji/ src/app/kanji/
git commit -m "feat(kanji): apply semantic muted badges, pastel jlpt tabs, and stone borders to kanji"
```

---

### Task 5: Vocab Catalog, Lesson Detail & AI Cloze Modal

**Files:**
- Modify: `src/app/tango/page.tsx`
- Modify: `src/app/tango/[lessonId]/page.tsx`
- Modify: `src/components/vocab/VocabCard.tsx`
- Modify: `src/components/vocab/LessonDetailView.tsx`
- Modify: `src/components/vocab/AIClozeQuizModal.tsx`

**Interfaces:**
- Consumes: Vocab data, `useVocabStore`, `useAIStore`, `useSRSStore`.
- Produces: Textbook monographs with JLPT pastel badges, vocab cards with soft status tags, and AI cloze quiz modal with sage green/coral rose feedback states.

- [ ] **Step 1: Refactor tango/page.tsx textbook cards**
Style textbook cards with 1px stone borders, soft pastel level tags, and muted progress bar indicators.

- [ ] **Step 2: Refactor VocabCard.tsx & LessonDetailView.tsx**
Update VocabCard container to `border border-stone-200`, example box to `bg-stone-50 border-l-2 border-stone-400`, status tags to semantic muted colors, and lesson toolbar with 1px stone borders.

- [ ] **Step 3: Refactor AIClozeQuizModal.tsx**
Update question card to `border border-stone-300 bg-white`, correct feedback to `bg-emerald-50 text-emerald-900 border-2 border-emerald-500`, incorrect to `bg-rose-50 text-rose-900 border-2 border-rose-400 line-through`, and explanation box to `bg-emerald-50/60 border border-emerald-200`.

- [ ] **Step 4: Run tests and commit**
Run `npm test` and commit:
```bash
git add src/app/tango/ src/components/vocab/
git commit -m "feat(vocab): add muted japanese palette to vocab cards, lesson views, and ai quiz modal"
```

---

### Task 6: SRS Flashcards, Quiz Modes & Settings Overhaul

**Files:**
- Modify: `src/components/srs/SRSFlashcard.tsx`
- Modify: `src/components/srs/RatingButtons.tsx`
- Modify: `src/components/srs/SessionSummary.tsx`
- Modify: `src/app/review/page.tsx`
- Modify: `src/app/review/quiz/page.tsx`
- Modify: `src/components/quiz/MultipleChoiceQuiz.tsx`
- Modify: `src/components/quiz/MatchingGame.tsx`
- Modify: `src/components/quiz/WordBuilderQuiz.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/components/settings/AISettingsSection.tsx`
- Modify: `src/components/sync/SyncSettingsSection.tsx`

**Interfaces:**
- Consumes: `useSRSStore`, SM-2 algorithm, quiz game state, settings and sync state.
- Produces: Complete flashcard and quiz ecosystem with soft pastel feedback, 4 semantic SM-2 rating buttons, and a polished settings page with soft warning states.

- [ ] **Step 1: Refactor RatingButtons.tsx to 4 Muted Semantic Colors**
- `1 · HỌC LẠI`: `bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100`
- `2 · KHÓ`: `bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100`
- `3 · NHỚ`: `bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100`
- `4 · DỄ`: `bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100`

- [ ] **Step 2: Refactor SRSFlashcard.tsx & SessionSummary.tsx**
Set card surface to `bg-white border border-stone-200`, hotkey badges to `bg-stone-100 text-stone-700`, summary accuracy and cards reviewed to soft emerald/indigo pills.

- [ ] **Step 3: Refactor MultipleChoiceQuiz, MatchingGame & WordBuilderQuiz**
- Multiple Choice: Options default `border border-stone-300 hover:bg-stone-50`, correct `bg-emerald-50 text-emerald-900 border-2 border-emerald-500`, incorrect `bg-rose-50 text-rose-900 border-2 border-rose-400 line-through`.
- Matching Game: Selected `bg-indigo-50 text-indigo-900 border-2 border-indigo-500`, matched `bg-emerald-50 text-emerald-800 border-emerald-300`, mismatch `bg-rose-50 text-rose-800 border-rose-300`.
- Word Builder: Letter bank `border border-stone-300 hover:bg-stone-100`, success `bg-emerald-50 border-emerald-400 text-emerald-900`.

- [ ] **Step 4: Refactor Settings, AI Settings & Sync Sections**
Danger zone changed from pitch black to `bg-rose-50/40 border border-rose-200`, reset button `bg-rose-600 hover:bg-rose-700 text-white`. AI & Sync inputs set to `border border-stone-300`.

- [ ] **Step 5: Run full test suite & static build verification**
Run `npm test` (verify 62/62 pass).
Run `npm run build` (verify all 2,184 static pages compile cleanly with 0 errors).

- [ ] **Step 6: Commit**
```bash
git add src/components/srs/ src/components/quiz/ src/app/review/ src/app/settings/ src/components/settings/ src/components/sync/
git commit -m "feat(srs-quiz-settings): apply muted japanese color feedback to flashcards, quizlet, and settings"
```
