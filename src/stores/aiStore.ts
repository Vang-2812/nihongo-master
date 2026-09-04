import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIConfig, ClozeExerciseItem, AILessonExerciseSet } from '@/types/ai';

interface AIState {
  config: AIConfig;
  cachedExercises: Record<string, AILessonExerciseSet>;
  setConfig: (config: Partial<AIConfig>) => void;
  saveExercisesToCache: (lessonId: string, exercises: ClozeExerciseItem[], model: string, syncCode?: string) => void;
  getExercisesFromCache: (lessonId: string) => AILessonExerciseSet | null;
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

      setConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),

      saveExercisesToCache: (lessonId, exercises, model, syncCode = 'local') =>
        set((state) => ({
          cachedExercises: {
            ...state.cachedExercises,
            [lessonId]: {
              lessonId,
              syncCode,
              model,
              exercises,
              updatedAt: Date.now(),
            },
          },
        })),

      getExercisesFromCache: (lessonId) => {
        return get().cachedExercises[lessonId] || null;
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
      }),
    }
  )
);
