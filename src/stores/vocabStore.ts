import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LessonProgressStatus = 'not_started' | 'learning' | 'complete';
export type VocabLearningStatus = 'not_started' | 'learning' | 'known';

export interface VocabState {
  lessonProgress: Record<string, LessonProgressStatus>;
  vocabStatus: Record<string, VocabLearningStatus>;

  setLessonStatus: (lessonId: string, status: LessonProgressStatus) => void;
  setVocabStatus: (vocabId: string | number, status: VocabLearningStatus) => void;
  getLessonStatus: (lessonId: string) => LessonProgressStatus;
  getVocabStatus: (vocabId: string | number) => VocabLearningStatus;
  resetVocabProgress: () => void;
}

export const useVocabStore = create<VocabState>()(
  persist(
    (set, get) => ({
      lessonProgress: {},
      vocabStatus: {},

      setLessonStatus: (lessonId, status) =>
        set((state) => ({
          lessonProgress: {
            ...state.lessonProgress,
            [lessonId]: status,
          },
        })),
      setVocabStatus: (vocabId, status) =>
        set((state) => ({
          vocabStatus: {
            ...state.vocabStatus,
            [String(vocabId)]: status,
          },
        })),
      getLessonStatus: (lessonId) => get().lessonProgress[lessonId] || 'not_started',
      getVocabStatus: (vocabId) => get().vocabStatus[String(vocabId)] || 'not_started',
      resetVocabProgress: () => set({ lessonProgress: {}, vocabStatus: {} }),
    }),
    {
      name: 'nihongo_vocab_storage',
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
