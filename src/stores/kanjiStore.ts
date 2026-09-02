import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type KanjiLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type KanjiFilter = 'all' | 'known' | 'learning' | 'new';
export type KanjiStatus = 'known' | 'learning' | 'new';

export interface KanjiState {
  level: KanjiLevel;
  filter: KanjiFilter;
  search: string;
  kanjiStatus: Record<string, KanjiStatus>;

  setLevel: (level: KanjiLevel) => void;
  setFilter: (filter: KanjiFilter) => void;
  setSearch: (search: string) => void;
  setStatus: (char: string, status: KanjiStatus) => void;
  getKanjiStatus: (char: string) => KanjiStatus;
  resetKanjiProgress: () => void;
}

export const useKanjiStore = create<KanjiState>()(
  persist(
    (set, get) => ({
      level: 'N5',
      filter: 'all',
      search: '',
      kanjiStatus: {},

      setLevel: (level) => set({ level }),
      setFilter: (filter) => set({ filter }),
      setSearch: (search) => set({ search }),
      setStatus: (char, status) =>
        set((state) => ({
          kanjiStatus: {
            ...state.kanjiStatus,
            [char]: status,
          },
        })),
      getKanjiStatus: (char) => get().kanjiStatus[char] || 'new',
      resetKanjiProgress: () => set({ kanjiStatus: {} }),
    }),
    {
      name: 'nihongo_kanji_storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);
