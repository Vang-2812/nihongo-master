import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

function applyThemeClass(isDark: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function getSystemIsDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (newTheme: ThemeMode) => {
        let isDark = false;
        if (newTheme === 'dark') {
          isDark = true;
        } else if (newTheme === 'light') {
          isDark = false;
        } else {
          isDark = getSystemIsDark();
        }

        applyThemeClass(isDark);
        set({
          theme: newTheme,
          resolvedTheme: isDark ? 'dark' : 'light',
        });
      },

      toggleTheme: () => {
        const current = get().theme;
        let next: ThemeMode = 'dark';
        if (current === 'dark') next = 'light';
        else if (current === 'light') next = 'system';
        else next = 'dark';

        get().setTheme(next);
      },

      initTheme: () => {
        const current = get().theme;
        let isDark = false;
        if (current === 'dark') {
          isDark = true;
        } else if (current === 'light') {
          isDark = false;
        } else {
          isDark = getSystemIsDark();
        }

        applyThemeClass(isDark);
        set({ resolvedTheme: isDark ? 'dark' : 'light' });

        // Listen for system changes if mode is 'system'
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const listener = (e: MediaQueryListEvent) => {
            if (get().theme === 'system') {
              applyThemeClass(e.matches);
              set({ resolvedTheme: e.matches ? 'dark' : 'light' });
            }
          };

          try {
            mediaQuery.addEventListener('change', listener);
          } catch (e) {
            // Safari / Older browsers fallback
            mediaQuery.addListener(listener);
          }
        }
      },
    }),
    {
      name: 'nihongo_theme',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
