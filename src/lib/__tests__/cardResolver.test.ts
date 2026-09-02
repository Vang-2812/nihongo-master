import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCardContent } from '../cardResolver';
import { SRSCard } from '@/stores/srsStore';

describe('Card Resolver for SRS Flashcards', () => {
  it('should resolve vocabulary card content accurately', () => {
    const vocabCard: SRSCard = {
      id: 'vocab_minna_1_0',
      cardType: 'vocab',
      contentId: 'minna_1_0',
      level: 'N5',
      status: 'learning',
      interval: 1,
      easeFactor: 2.5,
      repetitions: 1,
      dueDate: '2026-09-02',
      lastReviewed: null,
      reviewCount: 1,
    };

    const content = resolveCardContent(vocabCard);
    assert.equal(content.cardType, 'vocab');
    assert.equal(content.level, 'N5');
    assert.ok(content.title);
    assert.ok(content.meaning);
  });

  it('should resolve kanji card content accurately with Sino-Vietnamese reading', () => {
    const kanjiCard: SRSCard = {
      id: 'kanji_木',
      cardType: 'kanji',
      contentId: '木',
      level: 'N5',
      status: 'new',
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      dueDate: '2026-09-02',
      lastReviewed: null,
      reviewCount: 0,
    };

    const content = resolveCardContent(kanjiCard);
    assert.equal(content.cardType, 'kanji');
    assert.equal(content.title, '木');
    assert.equal(content.sinoVietnamese, 'MỘC');
    assert.ok(content.meaning);
    assert.ok(content.reading);
  });

  it('should provide robust fallback for unknown cards', () => {
    const unknownCard: SRSCard = {
      id: 'vocab_unknown_999',
      cardType: 'vocab',
      contentId: 'unknown_999',
      level: 'N5',
      status: 'new',
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      dueDate: '2026-09-02',
      lastReviewed: null,
      reviewCount: 0,
    };

    const content = resolveCardContent(unknownCard);
    assert.equal(content.title, 'unknown_999');
    assert.ok(content.meaning);
  });
});
