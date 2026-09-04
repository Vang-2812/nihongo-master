import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../route';
import { NextRequest } from 'next/server';

describe('AI Generate Exercises Route Validation', () => {
  it('returns 400 if API key is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai/generate-exercises', {
      method: 'POST',
      body: JSON.stringify({ words: [{ id: '1', word: 'わたし', reading: 'わたし', meaning: 'tôi' }] }),
    });
    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.includes('API Key'), true);
  });

  it('returns 400 if words array is empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai/generate-exercises', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'sk-test', words: [] }),
    });
    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.includes('từ vựng'), true);
  });
});
