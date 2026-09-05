import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSimilarityScore,
  detectSemanticCategory,
  selectDistractors,
} from '../distractorSelector';
import { QuizItem } from '@/components/quiz/MultipleChoiceQuiz';

describe('Distractor Selector - Semantic & Morphological Similarity', () => {
  it('detects semantic category for common Vietnamese patterns', () => {
    assert.equal(detectSemanticCategory('Thứ hai'), 'day_of_week');
    assert.equal(detectSemanticCategory('Thứ bảy'), 'day_of_week');
    assert.equal(detectSemanticCategory('Chủ nhật'), 'day_of_week');
    assert.equal(detectSemanticCategory('Buổi sáng'), 'time_period');
    assert.equal(detectSemanticCategory('Hôm nay'), 'time_period');
    assert.equal(detectSemanticCategory('Màu đỏ'), 'color');
    assert.equal(detectSemanticCategory('Bố / Ba'), 'family');
    assert.equal(detectSemanticCategory('Ai'), 'question');
  });

  it('scores high similarity between days of the week', () => {
    const monday: QuizItem = {
      id: '1',
      word: '月曜日',
      reading: 'げつようび',
      meaning: 'Thứ hai',
    };
    const tuesday: QuizItem = {
      id: '2',
      word: '火曜日',
      reading: 'かようび',
      meaning: 'Thứ ba',
    };
    const pencil: QuizItem = {
      id: '3',
      word: '鉛筆',
      reading: 'えんぴつ',
      meaning: 'Bút chì',
    };

    const scoreDays = calculateSimilarityScore(monday, tuesday);
    const scoreUnrelated = calculateSimilarityScore(monday, pencil);

    // Days share semantic group 'day_of_week', suffix '曜日', kanji '日', '曜', and prefix 'thứ'
    assert.ok(scoreDays >= 100, `Expected score >= 100 for days of week, got ${scoreDays}`);
    assert.ok(scoreUnrelated < 20, `Expected score < 20 for unrelated words, got ${scoreUnrelated}`);
    assert.ok(scoreDays > scoreUnrelated);
  });

  it('scores high similarity for shared Kanji characters and suffixes', () => {
    const teacher: QuizItem = {
      id: '10',
      word: '先生',
      reading: 'せんせい',
      meaning: 'Giáo viên, thầy cô',
    };
    const student: QuizItem = {
      id: '11',
      word: '学生',
      reading: 'がくせい',
      meaning: 'Học sinh, sinh viên',
    };
    const apple: QuizItem = {
      id: '12',
      word: 'りんご',
      reading: 'りんご',
      meaning: 'Quả táo',
    };

    const scoreKanji = calculateSimilarityScore(teacher, student);
    const scoreApple = calculateSimilarityScore(teacher, apple);

    assert.ok(scoreKanji >= 40, `Expected teacher-student score >= 40, got ${scoreKanji}`);
    assert.ok(scoreKanji > scoreApple);
  });

  it('selects similar distractors over unrelated ones', () => {
    const monday: QuizItem = {
      id: 'm1',
      word: '月曜日',
      reading: 'げつようび',
      meaning: 'Thứ hai',
    };

    const localPool: QuizItem[] = [
      monday,
      { id: 'm2', word: '火曜日', reading: 'かようび', meaning: 'Thứ ba' },
      { id: 'm3', word: '水曜日', reading: 'すいようび', meaning: 'Thứ tư' },
      { id: 'm4', word: '木曜日', reading: 'もくようび', meaning: 'Thứ năm' },
      { id: 'o1', word: '机', reading: 'つくえ', meaning: 'Cái bàn' },
      { id: 'o2', word: '椅子', reading: 'いす', meaning: 'Cái ghế' },
      { id: 'o3', word: '本', reading: 'ほん', meaning: 'Quyển sách' },
    ];

    const distractors = selectDistractors(monday, localPool);
    assert.equal(distractors.length, 3);

    // Should contain Tuesday, Wednesday, Thursday rather than table/chair/book
    assert.ok(distractors.includes('Thứ ba'));
    assert.ok(distractors.includes('Thứ tư'));
    assert.ok(distractors.includes('Thứ năm'));
    assert.ok(!distractors.includes('Thứ hai'), 'Must not include target itself');
    assert.ok(!distractors.includes('Cái bàn'), 'Should prioritize days of week over table');
  });

  it('expands to globalPool when localPool lacks similar distractors', () => {
    const monday: QuizItem = {
      id: 'm1',
      word: '月曜日',
      reading: 'げつようび',
      meaning: 'Thứ hai',
    };

    // localPool only has Monday and random objects
    const localPool: QuizItem[] = [
      monday,
      { id: 'o1', word: '机', reading: 'つくえ', meaning: 'Cái bàn' },
      { id: 'o2', word: '椅子', reading: 'いす', meaning: 'Cái ghế' },
      { id: 'o3', word: '本', reading: 'ほん', meaning: 'Quyển sách' },
    ];

    // globalPool has other days of the week
    const globalPool: QuizItem[] = [
      { id: 'g2', word: '火曜日', reading: 'かようび', meaning: 'Thứ ba' },
      { id: 'g3', word: '水曜日', reading: 'すいようび', meaning: 'Thứ tư' },
      { id: 'g4', word: '木曜日', reading: 'もくようび', meaning: 'Thứ năm' },
      { id: 'g5', word: '金曜日', reading: 'きんようび', meaning: 'Thứ sáu' },
    ];

    const distractors = selectDistractors(monday, localPool, globalPool);
    assert.equal(distractors.length, 3);

    // Should have picked days of week from globalPool!
    const dayCount = distractors.filter((d) => d.startsWith('Thứ')).length;
    assert.equal(dayCount, 3, 'Should pick all 3 distractors as days of the week from global pool');
  });
});
