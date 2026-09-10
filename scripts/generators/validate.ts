import { ClozeExerciseItem } from '../../src/types/ai';
import { getLessonById } from '../../src/lib/vocabData';

export function validateExercises(lessonId: string, exercises: ClozeExerciseItem[]): void {
  const lesson = getLessonById(lessonId);
  if (!lesson) {
    throw new Error(`Lesson ${lessonId} not found in vocabData`);
  }

  if (exercises.length !== lesson.items.length) {
    throw new Error(
      `Exercise count mismatch for ${lessonId}: expected ${lesson.items.length}, got ${exercises.length}`
    );
  }

  exercises.forEach((item, idx) => {
    const expectedVocabId = lesson.items[idx].id;
    if (item.vocabId !== expectedVocabId) {
      throw new Error(`Item ${idx} in ${lessonId}: expected vocabId ${expectedVocabId}, got ${item.vocabId}`);
    }

    if (!item.id || item.id !== `cloze_${expectedVocabId}`) {
      throw new Error(`Item ${idx} in ${lessonId}: expected id cloze_${expectedVocabId}, got ${item.id}`);
    }

    if (!item.targetWord || !item.targetReading) {
      throw new Error(`Item ${idx} (${item.vocabId}): missing targetWord or targetReading`);
    }

    if (!item.sentence.includes('（　　）')) {
      throw new Error(`Item ${idx} (${item.vocabId}): sentence does not contain '（　　）': ${item.sentence}`);
    }

    if (!Array.isArray(item.options) || item.options.length !== 4) {
      throw new Error(`Item ${idx} (${item.vocabId}): options must have exactly 4 items`);
    }

    if (new Set(item.options).size !== 4) {
      throw new Error(`Item ${idx} (${item.vocabId}): options has duplicate choices: ${JSON.stringify(item.options)}`);
    }

    if (item.correctIndex < 0 || item.correctIndex > 3) {
      throw new Error(`Item ${idx} (${item.vocabId}): correctIndex must be 0, 1, 2, or 3, got ${item.correctIndex}`);
    }

    const correctChoice = item.options[item.correctIndex];
    const filled = item.sentence.replace('（　　）', correctChoice);
    if (filled !== item.fullSentence) {
      throw new Error(
        `Item ${idx} (${item.vocabId}): fill mismatch!\nSentence: ${item.sentence}\nChoice: ${correctChoice}\nFilled: ${filled}\nFull:   ${item.fullSentence}`
      );
    }

    if (!item.translation || item.translation.trim().length === 0) {
      throw new Error(`Item ${idx} (${item.vocabId}): missing translation`);
    }

    if (!item.explanation || item.explanation.trim().length === 0) {
      throw new Error(`Item ${idx} (${item.vocabId}): missing explanation`);
    }
  });

  console.log(`✅ ${lessonId}: All ${exercises.length} exercises passed validation!`);
}
