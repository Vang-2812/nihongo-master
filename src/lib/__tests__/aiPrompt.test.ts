import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseClozeResponse, buildClozePrompt } from '../aiPrompt';

describe('AI Prompt & Parser Helpers', () => {
  it('builds prompt containing vocabulary list', () => {
    const prompt = buildClozePrompt('Bài 1', 'N5', [
      { id: '1', word: 'わたし', reading: 'わたし', meaning: 'tôi' },
    ]);
    assert.equal(prompt.system.includes('JSON'), true);
    assert.equal(prompt.user.includes('わたし'), true);
    assert.equal(prompt.user.includes('N5'), true);
  });

  it('correctly parses pure JSON array', () => {
    const raw = JSON.stringify([
      {
        id: '1',
        vocabId: 'v1',
        targetWord: 'わたし',
        targetReading: 'わたし',
        sentence: '（　　）はベトナム人です。',
        fullSentence: 'わたしはベトナム人です。',
        translation: 'Tôi là người Việt Nam.',
        options: ['わたし', 'あなた', 'かれ', 'せんせい'],
        correctIndex: 0,
        explanation: 'Tự giới thiệu bản thân.',
      },
    ]);
    const parsed = parseClozeResponse(raw);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].targetWord, 'わたし');
    assert.equal(parsed[0].options.length, 4);
  });

  it('cleans markdown codeblocks before parsing', () => {
    const rawWithMarkdown = `Here is the response:\n\`\`\`json\n[{"id":"1","vocabId":"v1","targetWord":"ほん","targetReading":"ほん","sentence":"（　　）を読みます。","fullSentence":"ほんを読みます。","translation":"Đọc sách.","options":["ほん","ペン","ノート","つくえ"],"correctIndex":0,"explanation":"ほん là sách."}]\n\`\`\``;
    const parsed = parseClozeResponse(rawWithMarkdown);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].targetWord, 'ほん');
    assert.equal(parsed[0].sentence.includes('（　　）'), true);
  });
});
