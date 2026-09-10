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
    assert.equal(getJson.custom.totalExercises, 1);
  });

  it('returns both global and custom exercises when both exist', async () => {
    const globalExercises = [
      {
        id: 'global_1',
        vocabId: 'item_g1',
        targetWord: 'がくせい',
        targetReading: 'がくせい',
        sentence: 'わたしは（　　）です。',
        fullSentence: 'わたしはがくせいです。',
        translation: 'Tôi là học sinh.',
        options: ['がくせい', 'せんせい', 'いしゃ', 'かいしゃいん'],
        correctIndex: 0,
        explanation: 'Từ chỉ học sinh',
      },
    ];

    const customExercises = [
      {
        id: 'custom_1',
        vocabId: 'item_c1',
        targetWord: 'せんせい',
        targetReading: 'せんせい',
        sentence: 'あのかたは（　　）です。',
        fullSentence: 'あのかたはせんせいです。',
        translation: 'Vị kia là giáo viên.',
        options: ['せんせい', 'がくせい', 'いしゃ', 'ぎんこういん'],
        correctIndex: 0,
        explanation: 'Từ chỉ giáo viên',
      },
    ];

    // Seed global
    await POST(
      new NextRequest('http://localhost:3000/api/ai/exercises', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: 'dual_lesson_test',
          syncCode: 'global',
          model: 'deepseek-chat',
          exercises: globalExercises,
        }),
      })
    );

    // Seed custom
    await POST(
      new NextRequest('http://localhost:3000/api/ai/exercises', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: 'dual_lesson_test',
          syncCode: 'USER_SYNC_XYZ',
          model: 'deepseek-chat',
          exercises: customExercises,
        }),
      })
    );

    // Query with user sync code
    const getRes = await GET(
      new NextRequest('http://localhost:3000/api/ai/exercises?lessonId=dual_lesson_test&syncCode=USER_SYNC_XYZ')
    );
    assert.equal(getRes.status, 200);
    const json = await getRes.json();

    assert.equal(json.success, true);
    assert.equal(json.found, true);
    assert.notEqual(json.global, null);
    assert.equal(json.global.exercises[0].targetWord, 'がくせい');
    assert.notEqual(json.custom, null);
    assert.equal(json.custom.exercises[0].targetWord, 'せんせい');
    assert.equal(json.source, 'custom');
  });
});
