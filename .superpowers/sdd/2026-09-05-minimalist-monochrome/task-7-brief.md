# Task 7 Brief: Settings Page Modernization & End-to-End Build Verification

Work from: `c:\Users\vangk\Documents\CodeProject\nihongo-master`

## Requirements:

1. `src/app/settings/page.tsx`:
   - Editorial Header: "SYSTEM PREFERENCES & ARCHIVE MANAGEMENT" in Playfair Display serif.
   - Preference selectors: sharp rectangular mono buttons `border border-black px-3 py-1.5 font-mono text-xs uppercase`. Selected: `bg-black text-white`.
   - Backup & Restore:
     - Export Backup: `border-2 border-black bg-white text-black hover:bg-black hover:text-white px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100`.
     - Import Backup: Sharp file dropzone or button.
   - Danger Zone:
     - Container: `border-4 border-black p-6 sm:p-8 bg-white`.
     - Heading: `font-serif text-2xl font-bold uppercase tracking-tight text-black`.
     - Warning text: `font-body text-sm text-mutedForeground`.
     - Confirmation input: `border-2 border-black p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black rounded-none`.
     - Reset button: Inverted solid black or double border `border-2 border-black bg-black text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors duration-100`.

2. `src/components/settings/AISettingsSection.tsx`:
   - API Key & Model inputs: `border-2 border-black p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-black bg-white rounded-none`.
   - Save button: `border border-black px-4 py-2 font-mono text-xs uppercase tracking-widest bg-black text-white hover:bg-white hover:text-black transition-colors duration-100`.

3. `src/components/sync/SyncSettingsSection.tsx`:
   - Cloud sync controls: Sharp mono buttons, clean table-like list of sync history or statuses.

4. Verification & End-to-End Audit:
   - Run `npm test` and verify 62/62 tests pass.
   - Run `npm run build` and verify all static export pages build cleanly.
   - Verify that no remaining colored elements exist in any UI component.
   - Commit: `feat(settings): convert settings, ai config, and sync sections to minimalist monochrome`.
   - Write report to: `c:\Users\vangk\Documents\CodeProject\nihongo-master\.superpowers\sdd\2026-09-05-minimalist-monochrome\task-7-report.md`.
