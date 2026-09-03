import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useSRSStore, SRSCard, formatLocalDate } from '../srsStore';
import { useKanjiStore } from '../kanjiStore';
import { useVocabStore } from '../vocabStore';
import { useToastStore, toast } from '../toastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
  });

  it('should add and remove toasts', () => {
    const store = useToastStore.getState();
    const id = store.addToast('Test message', 'success');

    const toastsAfterAdd = useToastStore.getState().toasts;
    assert.equal(toastsAfterAdd.length, 1);
    assert.equal(toastsAfterAdd[0].id, id);
    assert.equal(toastsAfterAdd[0].message, 'Test message');
    assert.equal(toastsAfterAdd[0].type, 'success');

    useToastStore.getState().removeToast(id);
    const toastsAfterRemove = useToastStore.getState().toasts;
    assert.equal(toastsAfterRemove.length, 0);
  });

  it('should support toast helper methods', () => {
    toast.success('Thành công!');
    toast.error('Có lỗi xảy ra!');
    toast.info('Thông báo');

    const toasts = useToastStore.getState().toasts;
    assert.equal(toasts.length, 3);
    assert.equal(toasts[0].type, 'success');
    assert.equal(toasts[0].message, 'Thành công!');
    assert.equal(toasts[1].type, 'error');
    assert.equal(toasts[1].message, 'Có lỗi xảy ra!');
    assert.equal(toasts[2].type, 'info');
    assert.equal(toasts[2].message, 'Thông báo');
  });
});

describe('useSRSStore', () => {
  beforeEach(() => {
    useSRSStore.getState().resetProgress();
  });

  it('should add a single card with default SM-2 parameters', () => {
    const store = useSRSStore.getState();
    store.addCard({
      id: 'vocab_1',
      cardType: 'vocab',
      contentId: 1,
      level: 'N5',
    });

    const cards = useSRSStore.getState().cards;
    const card = cards['vocab_1'];

    assert.ok(card);
    assert.equal(card.id, 'vocab_1');
    assert.equal(card.cardType, 'vocab');
    assert.equal(card.level, 'N5');
    assert.equal(card.status, 'new');
    assert.equal(card.interval, 0);
    assert.equal(card.easeFactor, 2.5);
    assert.equal(card.repetitions, 0);
    assert.equal(card.lastReviewed, null);
    assert.equal(card.reviewCount, 0);
  });

  it('should add multiple cards in batch', () => {
    const store = useSRSStore.getState();
    store.addCards([
      { id: 'kanji_日', cardType: 'kanji', contentId: '日', level: 'N5' },
      { id: 'kanji_月', cardType: 'kanji', contentId: '月', level: 'N5' },
      { id: 'kanji_木', cardType: 'kanji', contentId: '木', level: 'N5' },
    ]);

    const cards = useSRSStore.getState().cards;
    assert.equal(Object.keys(cards).length, 3);
    assert.ok(cards['kanji_日']);
    assert.ok(cards['kanji_月']);
    assert.ok(cards['kanji_木']);
  });

  it('should calculate due cards with daily new limit correctly', () => {
    const store = useSRSStore.getState();
    store.setDailyNewLimit(2);

    store.addCards([
      { id: 'v1', cardType: 'vocab', contentId: 1, level: 'N5' },
      { id: 'v2', cardType: 'vocab', contentId: 2, level: 'N5' },
      { id: 'v3', cardType: 'vocab', contentId: 3, level: 'N5' },
      { id: 'v4', cardType: 'vocab', contentId: 4, level: 'N5' },
    ]);

    // Only 2 new cards should be due according to dailyNewLimit
    const dueCards = useSRSStore.getState().getDueCards();
    assert.equal(dueCards.length, 2);
    assert.equal(useSRSStore.getState().getDueCount(), 2);
  });

  it('should review card and update SM-2 parameters, XP, and stats', () => {
    const store = useSRSStore.getState();
    store.addCard({
      id: 'vocab_apple',
      cardType: 'vocab',
      contentId: 100,
      level: 'N5',
    });

    const result = store.reviewCard('vocab_apple', 3); // Rating 3 (Good)

    assert.equal(result.xpEarned, 5);
    assert.ok(result.nextDueDate);

    const state = useSRSStore.getState();
    const updatedCard = state.cards['vocab_apple'];
    assert.equal(updatedCard.repetitions, 1);
    assert.equal(updatedCard.interval, 1);
    assert.equal(updatedCard.reviewCount, 1);
    assert.equal(updatedCard.status, 'learning');
    assert.equal(updatedCard.lastReviewed, formatLocalDate());

    assert.equal(state.stats.totalXp, 5);
    assert.equal(state.stats.totalReviews, 1);
    assert.equal(state.stats.streak, 1);
    assert.equal(state.stats.lastActiveDate, formatLocalDate());
  });

  it('should handle streak progression: today review, consecutive day review, missed day review', () => {
    const store = useSRSStore.getState();
    store.addCard({
      id: 'vocab_test',
      cardType: 'vocab',
      contentId: 200,
      level: 'N4',
    });

    // 1. Initial review today
    store.reviewCard('vocab_test', 3);
    assert.equal(useSRSStore.getState().stats.streak, 1);

    // 2. Review again on the same day -> streak stays 1
    store.reviewCard('vocab_test', 3);
    assert.equal(useSRSStore.getState().stats.streak, 1);
    assert.equal(useSRSStore.getState().stats.totalReviews, 2);

    // 3. Simulate yesterday as last active date -> review should increment streak to 2
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = formatLocalDate(yesterday);

    useSRSStore.setState((s) => ({
      stats: { ...s.stats, lastActiveDate: yesterdayStr, streak: 1 },
    }));

    store.reviewCard('vocab_test', 4); // Easy
    assert.equal(useSRSStore.getState().stats.streak, 2);

    // 4. Simulate older than yesterday (e.g. 3 days ago) -> review should reset streak to 1
    const threeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
    const threeDaysAgoStr = formatLocalDate(threeDaysAgo);

    useSRSStore.setState((s) => ({
      stats: { ...s.stats, lastActiveDate: threeDaysAgoStr, streak: 5 },
    }));

    store.reviewCard('vocab_test', 3);
    assert.equal(useSRSStore.getState().stats.streak, 1);
  });

  it('should export and import data correctly', () => {
    const store = useSRSStore.getState();
    store.addCard({
      id: 'k1',
      cardType: 'kanji',
      contentId: '水',
      level: 'N5',
    });
    store.reviewCard('k1', 4);

    const exported = store.exportData();
    assert.ok(exported.cards['k1']);
    assert.equal(exported.stats.totalReviews, 1);

    // Reset store
    store.resetProgress();
    assert.equal(Object.keys(useSRSStore.getState().cards).length, 0);
    assert.equal(useSRSStore.getState().stats.totalReviews, 0);

    // Re-import
    store.importData(exported);
    assert.ok(useSRSStore.getState().cards['k1']);
    assert.equal(useSRSStore.getState().stats.totalReviews, 1);
    assert.equal(useSRSStore.getState().cards['k1'].repetitions, 1);
  });

  it('should remove a card', () => {
    const store = useSRSStore.getState();
    store.addCard({ id: 'temp_card', cardType: 'vocab', contentId: 999, level: 'N5' });
    assert.ok(useSRSStore.getState().cards['temp_card']);

    store.removeCard('temp_card');
    assert.equal(useSRSStore.getState().cards['temp_card'], undefined);
  });

  it('should add XP and update streak via addXp', () => {
    const store = useSRSStore.getState();
    assert.equal(store.stats.totalXp, 0);

    store.addXp(15);
    const updated = useSRSStore.getState();
    assert.equal(updated.stats.totalXp, 15);
    assert.equal(updated.stats.streak, 1);
    assert.equal(updated.stats.lastActiveDate, formatLocalDate());

    store.addXp(10);
    assert.equal(useSRSStore.getState().stats.totalXp, 25);
  });

  it('should toggle and persist soundEffects preference', () => {
    const store = useSRSStore.getState();
    assert.equal(store.soundEffects, true);

    store.setSoundEffects(false);
    assert.equal(useSRSStore.getState().soundEffects, false);

    store.setSoundEffects(true);
    assert.equal(useSRSStore.getState().soundEffects, true);
  });
});

describe('useKanjiStore', () => {
  beforeEach(() => {
    useKanjiStore.getState().resetKanjiProgress();
  });

  it('should update level, filter, search, and kanji status', () => {
    const store = useKanjiStore.getState();

    store.setLevel('N3');
    assert.equal(useKanjiStore.getState().level, 'N3');

    store.setFilter('learning');
    assert.equal(useKanjiStore.getState().filter, 'learning');

    store.setSearch('日本語');
    assert.equal(useKanjiStore.getState().search, '日本語');

    store.setStatus('漢', 'learning');
    store.setStatus('字', 'known');

    assert.equal(store.getKanjiStatus('漢'), 'learning');
    assert.equal(store.getKanjiStatus('字'), 'known');
    assert.equal(store.getKanjiStatus('未'), 'new'); // Default new

    store.resetKanjiProgress();
    assert.equal(store.getKanjiStatus('漢'), 'new');
  });

  it('should bulk import kanji progress', () => {
    const store = useKanjiStore.getState();
    store.importKanjiProgress({
      '日': 'known',
      '月': 'learning',
    });

    assert.equal(useKanjiStore.getState().getKanjiStatus('日'), 'known');
    assert.equal(useKanjiStore.getState().getKanjiStatus('月'), 'learning');
  });
});

describe('useVocabStore', () => {
  beforeEach(() => {
    useVocabStore.getState().resetVocabProgress();
  });

  it('should track lesson progress and vocab learning status', () => {
    const store = useVocabStore.getState();

    store.setLessonStatus('minna_lesson_1', 'learning');
    store.setLessonStatus('minna_lesson_2', 'complete');

    assert.equal(store.getLessonStatus('minna_lesson_1'), 'learning');
    assert.equal(store.getLessonStatus('minna_lesson_2'), 'complete');
    assert.equal(store.getLessonStatus('minna_lesson_3'), 'not_started');

    store.setVocabStatus(101, 'learning');
    store.setVocabStatus('102', 'known');

    assert.equal(store.getVocabStatus(101), 'learning');
    assert.equal(store.getVocabStatus(102), 'known');
    assert.equal(store.getVocabStatus(103), 'not_started');

    store.resetVocabProgress();
    assert.equal(store.getLessonStatus('minna_lesson_1'), 'not_started');
    assert.equal(store.getVocabStatus(101), 'not_started');
  });

  it('should bulk import lesson and vocab progress', () => {
    const store = useVocabStore.getState();
    store.importVocabProgress({
      lessonProgress: { minna_1: 'complete' },
      vocabStatus: { '1': 'known', '2': 'learning' },
    });

    assert.equal(useVocabStore.getState().getLessonStatus('minna_1'), 'complete');
    assert.equal(useVocabStore.getState().getVocabStatus(1), 'known');
    assert.equal(useVocabStore.getState().getVocabStatus(2), 'learning');
  });

  it('should synchronize SM-2 recordReview with vocabStore learning status', () => {
    useVocabStore.getState().resetVocabProgress();
    useSRSStore.getState().resetProgress();

    const vocabId = 'minna_1_0';
    assert.equal(useVocabStore.getState().getVocabStatus(vocabId), 'not_started');

    // First review with rating 3 (Good) -> repetitions = 1 -> 'learning'
    useSRSStore.getState().recordReview('vocab', vocabId, 3, 'N5');

    const card = useSRSStore.getState().cards[`vocab_${vocabId}`];
    assert.ok(card);
    assert.equal(card.repetitions, 1);
    assert.equal(card.status, 'learning');
    assert.equal(useVocabStore.getState().getVocabStatus(vocabId), 'learning');

    // Second review with rating 3 (Good) -> repetitions = 2 -> graduates to 'review' -> 'known'
    useSRSStore.getState().recordReview('vocab', vocabId, 3, 'N5');

    const cardAfter2 = useSRSStore.getState().cards[`vocab_${vocabId}`];
    assert.equal(cardAfter2.repetitions, 2);
    assert.equal(cardAfter2.status, 'review');
    assert.equal(useVocabStore.getState().getVocabStatus(vocabId), 'known');

    // Third review with rating 1 (Again) -> resets repetitions = 0 -> 'learning'
    useSRSStore.getState().recordReview('vocab', vocabId, 1, 'N5');

    const cardAfterFail = useSRSStore.getState().cards[`vocab_${vocabId}`];
    assert.equal(cardAfterFail.repetitions, 0);
    assert.equal(cardAfterFail.interval, 1);
    assert.equal(cardAfterFail.status, 'learning');
    assert.equal(useVocabStore.getState().getVocabStatus(vocabId), 'learning');
  });
});
