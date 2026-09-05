# Task 2 Brief: Core UI Components Modernization (Navbar, Toast, ProgressBar, Modal)

Work from: `c:\Users\vangk\Documents\CodeProject\nihongo-master`

## Requirements:

1. `src/components/layout/Navbar.tsx`:
   - Background: `#FFFFFF`, border-bottom: `border-b-2 border-black`.
   - Brand: "NIHONGO MASTER" in `font-serif tracking-tight font-extrabold text-xl sm:text-2xl text-black` with a small badge `[ ARCHIVE ]` in `font-mono text-[10px] tracking-widest uppercase border border-black px-1.5 py-0.5 ml-2`.
   - Links: (Trang chủ, Kanji, Từ vựng, Ôn tập, Quiz, Cài đặt) in `font-mono text-xs uppercase tracking-widest`.
   - Active state: `bg-black text-white px-3 py-1.5`.
   - Inactive hover: `hover:bg-muted text-black transition-colors duration-100`.
   - Remove ThemeToggle import and component.
   - Mobile menu: Sharp dropdown with `border-t border-black bg-white`, no rounded corners, no shadows.

2. `src/components/ui/ToastContainer.tsx`:
   - Toast card: `bg-white border-2 border-black p-4 text-black font-mono text-xs`.
   - Status badge: `[ SUCCESS ]`, `[ ERROR ]`, `[ WARNING ]`, `[ INFO ]` in bold uppercase mono.
   - Dismiss button: `[ X ]` with instant hover invert.

3. `src/components/ui/ProgressBar.tsx`:
   - Outer container: `border border-black bg-white h-2 sm:h-2.5 overflow-hidden`.
   - Fill: `bg-black h-full transition-all duration-100`.
   - Remove color variants (primary, emerald, purple, amber) and use solid black fill everywhere.

4. `src/components/ui/Modal.tsx`:
   - Backdrop: `fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4`.
   - Modal container: `bg-white border-2 sm:border-4 border-black w-full max-w-2xl p-6 sm:p-8 rounded-none shadow-none`.
   - Title: `font-serif text-2xl sm:text-3xl font-bold tracking-tight text-black`.
   - Divider: `border-b-2 border-black pb-4 mb-6`.
   - Close button: `border border-black px-2 py-1 font-mono text-xs hover:bg-black hover:text-white transition-colors duration-100`.

5. Verification:
   - Run `npm test` to verify all tests pass.
   - Run `npm run build` to verify no TS or rendering issues.
   - Commit: `feat(ui): convert navbar, toast, progressbar, and modal to minimalist monochrome`.
   - Write report to: `c:\Users\vangk\Documents\CodeProject\nihongo-master\.superpowers\sdd\2026-09-05-minimalist-monochrome\task-2-report.md`.
