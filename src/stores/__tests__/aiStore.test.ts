import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useAIStore } from '../aiStore';

describe('AI Store', () => {
  beforeEach(() => {
    useAIStore.setState({
      config: {
        endpointUrl: 'https://api.deepseek.com/v1',
        apiKey: '',
        modelName: 'deepseek-chat',
        showTranslationInQuiz: true,
      },
      cachedExercises: {},
    });
  });

  it('updates AI configuration properly', () => {
    useAIStore.getState().setConfig({
      apiKey: 'sk-test-123456',
      modelName: 'deepseek-v4-flash',
    });

    const state = useAIStore.getState();
    assert.equal(state.config.apiKey, 'sk-test-123456');
    assert.equal(state.config.modelName, 'deepseek-v4-flash');
    assert.equal(state.config.endpointUrl, 'https://api.deepseek.com/v1');
    assert.equal(state.config.showTranslationInQuiz, true);
  });

  it('caches and retrieves exercises by lessonId', () => {
    const mockExercises = [
      {
        id: 'ex_1',
        vocabId: 'minna_1_1',
        targetWord: 'わたし',
        targetReading: 'わたし',
        sentence: '（　　）は学生です。',
        fullSentence: 'わたしは学生です。',
        translation: 'Tôi là học sinh.',
        options: ['わたし', 'あなた', 'せんせい', 'だれ'],
        correctIndex: 0,
        explanation: 'Dùng わたし để chỉ bản thân.',
      },
    ];

    useAIStore.getState().saveExercisesToCache('minna_lesson_1', mockExercises, 'deepseek-chat');
    const cached = useAIStore.getState().getExercisesFromCache('minna_lesson_1');

    assert.notEqual(cached, null);
    assert.equal(cached?.exercises.length, 1);
    assert.equal(cached?.exercises[0].targetWord, 'わたし');
  });

  it('toggles translation setting', () => {
    assert.equal(useAIStore.getState().config.showTranslationInQuiz, true);
    useAIStore.getState().toggleTranslationSetting();
    assert.equal(useAIStore.getState().config.showTranslationInQuiz, false);
    useAIStore.getState().toggleTranslationSetting();
    assert.equal(useAIStore.getState().config.showTranslationInQuiz, true);
  });
});
