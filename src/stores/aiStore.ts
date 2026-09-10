import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIConfig, ClozeExerciseItem, AILessonExerciseSet } from '@/types/ai';

interface AIState {
  config: AIConfig;
  cachedExercises: Record<string, AILessonExerciseSet>;
  cachedGlobalExercises: Record<string, AILessonExerciseSet>;
  cachedCustomExercises: Record<string, AILessonExerciseSet>;
  setConfig: (config: Partial<AIConfig>) => void;
  saveExercisesToCache: (lessonId: string, exercises: ClozeExerciseItem[], model: string, syncCode?: string) => void;
  getExercisesFromCache: (lessonId: string) => AILessonExerciseSet | null;
  saveGlobalExercises: (lessonId: string, exercises: ClozeExerciseItem[], model: string) => void;
  getGlobalExercises: (lessonId: string) => AILessonExerciseSet | null;
  saveCustomExercises: (lessonId: string, exercises: ClozeExerciseItem[], model: string, syncCode?: string) => void;
  getCustomExercises: (lessonId: string) => AILessonExerciseSet | null;
  toggleTranslationSetting: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      config: {
        endpointUrl: 'https://api.deepseek.com/v1',
        apiKey: '',
        modelName: 'deepseek-chat',
        showTranslationInQuiz: true,
      },
      cachedExercises: {},
      cachedGlobalExercises: {},
      cachedCustomExercises: {},

      setConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),

      saveExercisesToCache: (lessonId, exercises, model, syncCode = 'local') => {
        const item: AILessonExerciseSet = {
          lessonId,
          syncCode,
          model,
          exercises,
          updatedAt: Date.now(),
        };
        set((state) => ({
          cachedExercises: {
            ...state.cachedExercises,
            [lessonId]: item,
          },
          ...(syncCode === 'global'
            ? {
                cachedGlobalExercises: {
                  ...state.cachedGlobalExercises,
                  [lessonId]: item,
                },
              }
            : {
                cachedCustomExercises: {
                  ...state.cachedCustomExercises,
                  [lessonId]: item,
                },
              }),
        }));
      },

      getExercisesFromCache: (lessonId) => {
        return get().cachedExercises[lessonId] || null;
      },

      saveGlobalExercises: (lessonId, exercises, model) => {
        const item: AILessonExerciseSet = {
          lessonId,
          syncCode: 'global',
          model,
          exercises,
          updatedAt: Date.now(),
        };
        set((state) => ({
          cachedGlobalExercises: {
            ...state.cachedGlobalExercises,
            [lessonId]: item,
          },
          cachedExercises: {
            ...state.cachedExercises,
            [lessonId]: item,
          },
        }));
      },

      getGlobalExercises: (lessonId) => {
        return get().cachedGlobalExercises[lessonId] || null;
      },

      saveCustomExercises: (lessonId, exercises, model, syncCode = 'local') => {
        const item: AILessonExerciseSet = {
          lessonId,
          syncCode,
          model,
          exercises,
          updatedAt: Date.now(),
        };
        set((state) => ({
          cachedCustomExercises: {
            ...state.cachedCustomExercises,
            [lessonId]: item,
          },
          cachedExercises: {
            ...state.cachedExercises,
            [lessonId]: item,
          },
        }));
      },

      getCustomExercises: (lessonId) => {
        return get().cachedCustomExercises[lessonId] || null;
      },

      toggleTranslationSetting: () =>
        set((state) => ({
          config: {
            ...state.config,
            showTranslationInQuiz: !state.config.showTranslationInQuiz,
          },
        })),
    }),
    {
      name: 'nihongo_ai_store',
      partialize: (state) => ({
        config: state.config,
        cachedExercises: state.cachedExercises,
        cachedGlobalExercises: state.cachedGlobalExercises,
        cachedCustomExercises: state.cachedCustomExercises,
      }),
    }
  )
);
