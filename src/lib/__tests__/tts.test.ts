import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { speakJapanese, stopJapaneseSpeech, sanitizeJapaneseText } from '../tts';

describe('TTS Utility', () => {
  it('should safely sanitize Japanese text for speech', () => {
    assert.equal(sanitizeJapaneseText('た.べる'), 'たべる');
    assert.equal(sanitizeJapaneseText('-やま'), 'やま');
    assert.equal(sanitizeJapaneseText('  水  '), '水');
    assert.equal(sanitizeJapaneseText(''), '');
  });

  it('should safely handle speakJapanese in SSR/Node environment without crashing', () => {
    assert.doesNotThrow(() => {
      speakJapanese('こんにちは');
      speakJapanese('');
      speakJapanese('   ');
    });
  });

  it('should safely handle stopJapaneseSpeech in SSR/Node environment without crashing', () => {
    assert.doesNotThrow(() => {
      stopJapaneseSpeech();
    });
  });
});
