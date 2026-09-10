export interface ClozeExerciseItem {
  id: string;
  vocabId: string;
  targetWord: string;
  targetReading: string;
  sentence: string;
  fullSentence: string;
  translation: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AILessonExerciseSet {
  lessonId: string;
  syncCode: string;
  model: string;
  exercises: ClozeExerciseItem[];
  updatedAt: number;
}

export interface AIConfig {
  endpointUrl: string;
  apiKey: string;
  modelName: string;
  showTranslationInQuiz: boolean;
}

export type ExerciseSourceType = 'global' | 'custom';
export type ClozeQuizMode = 'choice' | 'audio_builder';

export interface ExerciseSetDetail {
  lessonId: string;
  syncCode: string;
  model: string;
  totalExercises: number;
  exercises: ClozeExerciseItem[];
  updatedAt: number;
}

export interface ExerciseApiResponse {
  success: boolean;
  found: boolean;
  lessonId?: string;
  syncCode?: string;
  model?: string;
  totalExercises?: number;
  exercises?: ClozeExerciseItem[] | null;
  source?: ExerciseSourceType | 'none';
  global?: ExerciseSetDetail | null;
  custom?: ExerciseSetDetail | null;
  updatedAt?: number;
  error?: string;
  message?: string;
}
