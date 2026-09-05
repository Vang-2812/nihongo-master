# Minimalist Monochrome Editorial Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đại tu toàn bộ giao diện Nihongo Master sang phong cách "Minimalist Monochrome" (Editorial/High Fashion) lấy cảm hứng từ Vogue, Bottega Veneta và sách kiến trúc: đơn sắc nghiêm ngặt, typography kịch tính, 100% góc vuông 90°, không bóng đổ, texture in ấn mờ, và hiệu ứng đảo màu tức thì.

**Architecture:** Thiết lập nền tảng Design Tokens và Typography 3 font (`Playfair Display`, `Source Serif 4`, `JetBrains Mono`) qua `next/font/google` trong Next.js; áp dụng CSS toàn cục khóa cứng `border-radius: 0` và triệt tiêu `box-shadow`; bổ sung lớp paper texture vi mô; sau đó chuẩn hóa từng phân hệ UI (Navbar, Thẻ học, Bảng Kanji, Danh mục từ vựng, SRS SM-2, Quiz và Bài tập AI).

**Tech Stack:** Next.js 14 (App Router), `next/font/google`, Tailwind CSS 3, Lucide React (stroke 1.5px), Zustand, Hanzi Writer (Canvas monochrome).

**Spec:** docs/superpowers/specs/2026-09-05-minimalist-monochrome-design.md

## Global Constraints
- Bảng màu duy nhất 6 mã:
  - `background`: `#FFFFFF`
  - `foreground`: `#000000`
  - `muted`: `#F5F5F5`
  - `mutedForeground`: `#525252`
  - `border`: `#000000`
  - `borderLight`: `#E5E5E5`
  - `accent`: `#000000`
- Tuyệt đối cấm: Màu sắc ngoài đen/trắng, gradient, bo góc (border-radius > 0), đổ bóng (shadow), font sans-serif cho heading, animation easing dài.
- Tốc độ tương tác tức thời: 0–100ms hover invert.
- Chuẩn phản hồi Đúng/Sai trong Quiz: Đúng = đảo màu đen tuyền chữ trắng `[ CORRECT ] ✓`; Sai = viền 4px gạch ngang `[ INCORRECT ] ✕`.
- Tất cả unit tests và lệnh `npm run build` phải vượt qua 100% không có lỗi.

---

### Task 1: Foundational Design Tokens, Typography & Global Paper Texture

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Test: `npm run build` (kiểm tra load font & css)

**Interfaces:**
- Produces:
  - Font classes: `font-serif-display` (Playfair Display), `font-serif-body` (Source Serif 4), `font-mono` (JetBrains Mono)
  - Color tokens: `bg-background`, `text-foreground`, `border-border`, `border-borderLight`, `bg-muted`, `text-mutedForeground`
  - Global paper texture overlay & strict zero-radius / zero-shadow rule

- [ ] **Step 1: Cấu hình Google Fonts trong `src/app/layout.tsx`**

Import `Playfair_Display`, `Source_Serif_4`, `JetBrains_Mono` từ `next/font/google`:
```typescript
import { Playfair_Display, Source_Serif_4, JetBrains_Mono } from 'next/font/google';

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
Gắn các biến CSS font này vào thẻ `<html>` hoặc `<body>`.

- [ ] **Step 2: Cập nhật `tailwind.config.ts` với bảng màu và font family**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#000000",
        muted: "#F5F5F5",
        mutedForeground: "#525252",
        border: "#000000",
        borderLight: "#E5E5E5",
        accent: "#000000",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-source-serif)", "Times New Roman", "serif"],
        mono: ["var(--font-jetbrains-mono)", "Menlo", "monospace"],
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
      boxShadow: {
        none: 'none',
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 3: Cập nhật `src/app/globals.css`**

- Thêm CSS toàn cục triệt tiêu border-radius và box-shadow.
- Tạo lớp phủ Paper Texture bằng SVG noise siêu mờ:
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

- [ ] **Step 4: Kiểm tra build & commit**

```bash
git add src/app/layout.tsx tailwind.config.ts src/app/globals.css
git commit -m "feat(design): implement minimalist monochrome design tokens, typography, and paper texture"
```

---

### Task 2: Core UI Components Modernization (Navbar, Toast, ProgressBar, Modal)

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/ui/ToastContainer.tsx`
- Modify: `src/components/ui/ProgressBar.tsx`
- Modify: `src/components/ui/Modal.tsx`

**Interfaces:**
- Produces:
  - Navbar: High-contrast white bar, 2px solid black border-bottom, Playfair serif logo, JetBrains Mono uppercase links, no dark mode toggle.
  - Toast: Crisp black-bordered alert boxes, uppercase mono status badges.
  - ProgressBar: 1px black outline, solid black progress fill.
  - Modal: 2px/4px solid black border, sharp header divider, zero border-radius.

- [ ] **Step 1: Cập nhật `Navbar.tsx`**
- [ ] **Step 2: Cập nhật `ToastContainer.tsx`**
- [ ] **Step 3: Cập nhật `ProgressBar.tsx`**
- [ ] **Step 4: Cập nhật `Modal.tsx`**
- [ ] **Step 5: Kiểm tra và commit**

```bash
git add src/components/layout/Navbar.tsx src/components/ui/ToastContainer.tsx src/components/ui/ProgressBar.tsx src/components/ui/Modal.tsx
git commit -m "feat(ui): convert navbar, toast, progressbar, and modal to minimalist monochrome"
```

---

### Task 3: Dashboard Hero & Large-Scale Stats Overhaul (`/`)

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces:
  - Editorial Hero title (Playfair Display 7xl-9xl "THE NIHONGO ARCHIVE" / "日本語")
  - Heavy 4px black section rule
  - High-impact statistics grid with 6xl-7xl serif numbers and uppercase mono labels
  - 4 high-contrast navigation cards with instant 100ms hover inversion

- [ ] **Step 1: Refactor `src/app/page.tsx` với layout editorial kịch tính**
- [ ] **Step 2: Chạy kiểm thử và build**
- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(dashboard): apply editorial high-contrast layout and dramatic serif scale to homepage"
```

---

### Task 4: Kanji Catalog & Detail Page Redesign (`/kanji` & `/kanji/[character]`)

**Files:**
- Modify: `src/components/kanji/KanjiCard.tsx`
- Modify: `src/components/kanji/KanjiGrid.tsx`
- Modify: `src/components/kanji/StrokeOrderWriter.tsx`
- Modify: `src/app/kanji/page.tsx`
- Modify: `src/app/kanji/[character]/page.tsx`

**Interfaces:**
- Produces:
  - Architectural grid dividing lines (`divide-x divide-y divide-black border border-black`)
  - Kanji cell hover inversion (black fill, white character)
  - Stroke order canvas with pure black strokes on crisp white background
  - Gallery-style character detail layout

- [ ] **Step 1: Refactor `KanjiCard.tsx` và `KanjiGrid.tsx`**
- [ ] **Step 2: Refactor `StrokeOrderWriter.tsx` sang nét vẽ đơn sắc mực in**
- [ ] **Step 3: Refactor `src/app/kanji/page.tsx` và `src/app/kanji/[character]/page.tsx`**
- [ ] **Step 4: Commit**

```bash
git add src/components/kanji/ src/app/kanji/
git commit -m "feat(kanji): convert kanji catalog, grid, stroke writer, and detail view to minimalist monochrome"
```

---

### Task 5: Vocab Catalog & Lesson Detail Overhaul (`/tango` & `/tango/[lessonId]`)

**Files:**
- Modify: `src/components/vocab/VocabCard.tsx`
- Modify: `src/components/vocab/AudioButton.tsx`
- Modify: `src/components/vocab/LessonDetailView.tsx`
- Modify: `src/app/tango/page.tsx`
- Modify: `src/app/tango/[lessonId]/page.tsx`

**Interfaces:**
- Produces:
  - Luxury book spine / editorial catalog design for textbooks
  - Crisp table-style vocabulary items with hairline separators
  - Sharp rectangular action buttons (`[ ADD TO SRS ]`, `[ QUIZLET ]`, `[ AI EXERCISES ]`)

- [ ] **Step 1: Refactor `VocabCard.tsx` và `AudioButton.tsx`**
- [ ] **Step 2: Refactor `LessonDetailView.tsx`**
- [ ] **Step 3: Refactor `src/app/tango/page.tsx`**
- [ ] **Step 4: Commit**

```bash
git add src/components/vocab/ src/app/tango/
git commit -m "feat(vocab): style vocabulary catalog and lesson detail with editorial typography and hairlines"
```

---

### Task 6: SRS Flashcards & Quiz Modules Redesign (Monochrome Feedback States)

**Files:**
- Modify: `src/components/srs/SRSFlashcard.tsx`
- Modify: `src/components/srs/RatingButtons.tsx`
- Modify: `src/components/srs/SessionSummary.tsx`
- Modify: `src/components/quiz/MultipleChoiceQuiz.tsx`
- Modify: `src/components/quiz/MatchingGame.tsx`
- Modify: `src/components/quiz/WordBuilderQuiz.tsx`
- Modify: `src/components/vocab/AIClozeQuizModal.tsx`

**Interfaces:**
- Produces:
  - 3D Flashcard with sharp rectangular borders and high-contrast typography
  - Rating buttons: `[ 1 · AGAIN ]`, `[ 2 · HARD ]`, `[ 3 · GOOD ]`, `[ 4 · EASY ]`
  - Quiz feedback: Invert for `[ CORRECT ] ✓`, double/thick border + strike for `[ INCORRECT ] ✕`
  - AI Cloze quiz modal with monochrome translation toggle `[ TRANSLATE: ON / OFF ]`

- [ ] **Step 1: Refactor `SRSFlashcard.tsx`, `RatingButtons.tsx`, `SessionSummary.tsx`**
- [ ] **Step 2: Refactor `MultipleChoiceQuiz.tsx`, `MatchingGame.tsx`, `WordBuilderQuiz.tsx`**
- [ ] **Step 3: Refactor `AIClozeQuizModal.tsx`**
- [ ] **Step 4: Commit**

```bash
git add src/components/srs/ src/components/quiz/ src/components/vocab/AIClozeQuizModal.tsx
git commit -m "feat(quiz): implement monochrome feedback states, sharp flashcards, and ai quiz modal"
```

---

### Task 7: Settings Page Modernization & End-to-End Build Verification

**Files:**
- Modify: `src/app/settings/page.tsx`
- Modify: `src/components/settings/AISettingsSection.tsx`
- Modify: `src/components/sync/SyncSettingsSection.tsx`
- Test: Full test suite `npm test` & static build `npm run build`

**Interfaces:**
- Produces:
  - Sharp black-bordered inputs with 2px/4px focus outlines
  - Clean monochrome backup and sync controls
  - 100% passing tests and production build verification

- [ ] **Step 1: Refactor `src/app/settings/page.tsx`, `AISettingsSection.tsx`, `SyncSettingsSection.tsx`**
- [ ] **Step 2: Run all unit tests**
Run: `npm test`
Expected: 62/62 tests passing
- [ ] **Step 3: Run Next.js production build**
Run: `npm run build`
Expected: 2,184 pages build successfully with 0 errors
- [ ] **Step 4: Commit**

```bash
git add src/app/settings/page.tsx src/components/settings/ src/components/sync/
git commit -m "feat(settings): convert settings, ai config, and sync sections to minimalist monochrome"
```
