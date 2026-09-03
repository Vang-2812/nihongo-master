import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getAllTextbooks,
  getTextbookById,
  getAllLessons,
  getLessonsByTextbook,
  getLessonById,
  getAllLessonIds,
  getAllVocab,
  getAdjacentLessons,
  getSinoVietnamese,
  searchVocab,
} from '../vocabData';

describe('Vocab Data Helper & Indexer', () => {
  it('should load all 4 textbooks with correct metadata', () => {
    const textbooks = getAllTextbooks();
    assert.strictEqual(textbooks.length, 4);

    const minnaN5 = getTextbookById('minna_n5');
    assert.ok(minnaN5);
    assert.strictEqual(minnaN5?.level, 'N5');
    assert.strictEqual(minnaN5?.lessonCount, 25);
    assert.ok((minnaN5?.vocabCount || 0) > 500);

    const minnaN4 = getTextbookById('minna_n4');
    assert.ok(minnaN4);
    assert.strictEqual(minnaN4?.level, 'N4');
    assert.strictEqual(minnaN4?.lessonCount, 25);

    const mimikara = getTextbookById('mimikara_n3');
    assert.ok(mimikara);
    assert.strictEqual(mimikara?.level, 'N3');
    assert.strictEqual(mimikara?.lessonCount, 64);

    const somatome = getTextbookById('somatome_n3');
    assert.ok(somatome);
    assert.strictEqual(somatome?.level, 'N3');
    assert.strictEqual(somatome?.lessonCount, 36);
  });

  it('should load all 150 lessons across all textbooks', () => {
    const lessons = getAllLessons();
    assert.strictEqual(lessons.length, 150);

    const lessonIds = getAllLessonIds();
    assert.strictEqual(lessonIds.length, 150);
    assert.ok(lessonIds.includes('minna_1'));
    assert.ok(lessonIds.includes('minna_25'));
    assert.ok(lessonIds.includes('minna_26'));
    assert.ok(lessonIds.includes('minna_50'));
    assert.ok(lessonIds.includes('mimikara_1'));
    assert.ok(lessonIds.includes('mimikara_64'));
    assert.ok(lessonIds.includes('somatome_1'));
    assert.ok(lessonIds.includes('somatome_36'));
  });

  it('should retrieve lesson details by ID with items and Sino-Vietnamese reading', () => {
    const lesson1 = getLessonById('minna_1');
    assert.ok(lesson1);
    assert.strictEqual(lesson1?.bookId, 'minna_n5');
    assert.strictEqual(lesson1?.lessonNumber, 1);
    assert.ok((lesson1?.items.length || 0) > 0);

    const firstItem = lesson1?.items[0];
    assert.ok(firstItem);
    assert.strictEqual(firstItem?.lessonId, 'minna_1');
    assert.strictEqual(firstItem?.level, 'N5');

    // Test Sino-Vietnamese extraction
    const watashiSino = getSinoVietnamese('私');
    assert.strictEqual(watashiSino, 'TƯ');

    const nihonSino = getSinoVietnamese('日本語');
    assert.ok(nihonSino.includes('NHẬT'));
    assert.ok(nihonSino.includes('BẢN'));
  });

  it('should navigate adjacent lessons correctly', () => {
    const adj1 = getAdjacentLessons('minna_1');
    assert.strictEqual(adj1.prev, null);
    assert.strictEqual(adj1.next?.id, 'minna_2');

    const adj2 = getAdjacentLessons('minna_2');
    assert.strictEqual(adj2.prev?.id, 'minna_1');
    assert.strictEqual(adj2.next?.id, 'minna_3');

    const lastId = getAllLessonIds()[149];
    const adjLast = getAdjacentLessons(lastId);
    assert.strictEqual(adjLast.next, null);
    assert.ok(adjLast.prev);
  });

  it('should filter lessons by textbook ID', () => {
    const n5Lessons = getLessonsByTextbook('minna_n5');
    assert.strictEqual(n5Lessons.length, 25);

    const n4Lessons = getLessonsByTextbook('minna_n4');
    assert.strictEqual(n4Lessons.length, 25);

    const mimikaraLessons = getLessonsByTextbook('mimikara_n3');
    assert.strictEqual(mimikaraLessons.length, 64);

    const somatomeLessons = getLessonsByTextbook('somatome_n3');
    assert.strictEqual(somatomeLessons.length, 36);
  });

  it('should search vocabulary by Japanese, reading, and Vietnamese meaning', () => {
    const results = searchVocab('私');
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.word.includes('私') || r.reading.includes('わたし')));

    const viResults = searchVocab('học sinh');
    assert.ok(viResults.length > 0);

    const lessonResults = searchVocab('tôi', 'minna_1');
    assert.ok(lessonResults.length > 0);
    assert.ok(lessonResults.every((r) => r.lessonId === 'minna_1'));
  });

  it('should load all 45 vocabulary items for Minna Lesson 1 from minna.json', () => {
    const lesson1 = getLessonById('minna_1');
    assert.ok(lesson1);
    assert.strictEqual(lesson1?.items.length, 45, 'Minna Lesson 1 should have exactly 45 items from minna.json');

    const words = lesson1?.items.map((it) => it.word);
    assert.ok(words?.includes('誰'));
    assert.ok(words?.includes('アメリカ'));
    assert.ok(words?.includes('日本'));
    assert.ok(words?.includes('中国'));
  });
});
