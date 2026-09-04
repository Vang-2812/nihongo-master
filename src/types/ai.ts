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
