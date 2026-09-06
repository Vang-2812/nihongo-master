import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { breakdownJapaneseWord } from '@/components/quiz/WordBuilderQuiz';

describe('Word Builder & Kana Breakdown Logic', () => {
  it('should correctly break down single Kanji words and compounds', () => {
    assert.deepEqual(breakdownJapaneseWord('月曜日'), ['月', '曜', '日']);
    assert.deepEqual(breakdownJapaneseWord('学生'), ['学', '生']);
    assert.deepEqual(breakdownJapaneseWord('私'), ['私']);
  });

  it('should correctly break down standard Hiragana words', () => {
    assert.deepEqual(breakdownJapaneseWord('げつようび'), ['げ', 'つ', 'よ', 'う', 'び']);
    assert.deepEqual(breakdownJapaneseWord('がくせい'), ['が', 'く', 'せ', 'い']);
    assert.deepEqual(breakdownJapaneseWord('わたし'), ['わ', 'た', 'し']);
  });

  it('should correctly preserve compound moras (yoon) as single units', () => {
    assert.deepEqual(breakdownJapaneseWord('きょう'), ['きょ', 'う']);
    assert.deepEqual(breakdownJapaneseWord('しゃしん'), ['しゃ', 'し', 'ん']);
    assert.deepEqual(breakdownJapaneseWord('ちょっと'), ['ちょ', 'っ', 'と']);
    assert.deepEqual(breakdownJapaneseWord('びょういん'), ['びょ', 'う', 'い', 'ん']);
    assert.deepEqual(breakdownJapaneseWord('じゅぎょう'), ['じゅ', 'ぎょ', 'う']);
  });

  it('should correctly break down Katakana words including long vowels and compound sounds', () => {
    assert.deepEqual(breakdownJapaneseWord('コーヒー'), ['コ', 'ー', 'ヒ', 'ー']);
    assert.deepEqual(breakdownJapaneseWord('チョコレート'), ['チョ', 'コ', 'レ', 'ー', 'ト']);
    assert.deepEqual(breakdownJapaneseWord('シャツ'), ['シャ', 'ツ']);
  });

  it('should compute appropriate targetWord based on answerType mode', () => {
    const item = {
      id: 'item_1',
      word: '月曜日',
      reading: 'げつようび',
      meaning: 'Thứ hai',
    };

    const wordModeTarget = item.word;
    const kanaModeTarget = item.reading || item.word;

    assert.equal(wordModeTarget, '月曜日');
    assert.equal(kanaModeTarget, 'げつようび');

    const wordChars = breakdownJapaneseWord(wordModeTarget);
    const kanaChars = breakdownJapaneseWord(kanaModeTarget);

    assert.deepEqual(wordChars, ['月', '曜', '日']);
    assert.deepEqual(kanaChars, ['げ', 'つ', 'よ', 'う', 'び']);
  });

  it('should fall back to word if reading is not provided', () => {
    const item = {
      id: 'item_2',
      word: 'ひらがな',
      reading: '',
      meaning: 'Chữ hiragana',
    };

    const kanaModeTarget = item.reading || item.word;
    assert.equal(kanaModeTarget, 'ひらがな');
    assert.deepEqual(breakdownJapaneseWord(kanaModeTarget), ['ひ', 'ら', 'が', 'な']);
  });
});
