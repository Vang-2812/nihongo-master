import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

describe('AI Exercises Database API Route', () => {
  it('validates input for POST request', async () => {
    const postReq = new NextRequest('http://localhost:3000/api/ai/exercises', {
      method: 'POST',
      body: JSON.stringify({ lessonId: '', exercises: [] }),
    });
    const postRes = await POST(postReq);
    assert.equal(postRes.status, 400);
    const json = await postRes.json();
    assert.equal(json.success, false);
  });

  it('validates input for GET request', async () => {
    const getReq = new NextRequest('http://localhost:3000/api/ai/exercises');
    const getRes = await GET(getReq);
    assert.equal(getRes.status, 400);
    const json = await getRes.json();
    assert.equal(json.success, false);
  });

  it('saves and retrieves exercises successfully', async () => {
    const mockExercises = [
      {
        id: 'ex_test_1',
        vocabId: 'item_1',
        targetWord: 'わたし',
        targetReading: 'わたし',
        sentence: '（　　）はナムです。',
        fullSentence: 'わたしはナムです。',
        translation: 'Tôi là Nam.',
        options: ['わたし', 'あなた', 'かれ', 'かのじょ'],
        correctIndex: 0,
        explanation: 'Giới thiệu bản thân dùng わたし',
      },
    ];

    const postReq = new NextRequest('http://localhost:3000/api/ai/exercises', {
      method: 'POST',
      body: JSON.stringify({
        lessonId: 'test_lesson_db',
        syncCode: 'TEST_SYNC',
        model: 'deepseek-chat',
        exercises: mockExercises,
      }),
    });
    const postRes = await POST(postReq);
    assert.equal(postRes.status, 200);
    const postJson = await postRes.json();
    assert.equal(postJson.success, true);
    assert.equal(postJson.count, 1);

    // Retrieve via GET
    const getReq = new NextRequest(
      'http://localhost:3000/api/ai/exercises?lessonId=test_lesson_db&syncCode=TEST_SYNC'
    );
    const getRes = await GET(getReq);
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.equal(getJson.success, true);
    assert.equal(getJson.found, true);
    assert.equal(getJson.totalExercises, 1);
    assert.equal(getJson.exercises[0].targetWord, 'わたし');
  });
});
