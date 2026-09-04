import test, { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db, ensureDbInitialized } from '../../db';
import { syncDevices, userSyncData, textbooks, lessons, vocabItems } from '../../db/schema';
import { eq } from 'drizzle-orm';

describe('SQLite Database & Sync Engine', () => {
  before(async () => {
    await ensureDbInitialized();
  });

  it('should have textbooks and lessons in SQLite database', async () => {
    const allTextbooks = await db.select().from(textbooks);
    assert.ok(allTextbooks.length >= 4, 'Should have at least 4 textbooks');

    const minnaN5 = await db
      .select()
      .from(textbooks)
      .where(eq(textbooks.id, 'minna_n5'))
      .limit(1);
    assert.equal(minnaN5.length, 1);
    assert.equal(minnaN5[0].level, 'N5');
  });

  it('should query vocabulary items from SQLite database with correct metadata', async () => {
    const vocabList = await db
      .select()
      .from(vocabItems)
      .where(eq(vocabItems.lessonId, 'minna_1'))
      .limit(5);

    assert.ok(vocabList.length > 0, 'Should have vocabulary items for Minna Lesson 1');
    assert.ok(vocabList[0].word, 'Vocab item should have Japanese word');
    assert.ok(vocabList[0].meaning, 'Vocab item should have Vietnamese meaning');
  });

  it('should register a device and record sync data', async () => {
    const testCode = 'NH-TEST1';
    const now = Date.now();

    // Clean up if existing
    await db.delete(syncDevices).where(eq(syncDevices.syncCode, testCode));

    // Insert device
    await db.insert(syncDevices).values({
      syncCode: testCode,
      deviceName: 'Test Machine',
      createdAt: now,
      lastSyncAt: now,
    });

    // Insert sync payload
    await db.insert(userSyncData).values({
      syncCode: testCode,
      cardsData: JSON.stringify({ vocab_1: { id: 'vocab_1', interval: 1, easeFactor: 2.5 } }),
      statsData: JSON.stringify({ streak: 5, totalXp: 120, totalReviews: 10 }),
      kanjiStatus: JSON.stringify({ 水: 'mastered' }),
      vocabProgress: JSON.stringify({ completedLessons: ['minna_1'] }),
      preferences: JSON.stringify({ dailyNewLimit: 20 }),
      version: 1,
      updatedAt: now,
    });

    // Verify query
    const saved = await db
      .select()
      .from(userSyncData)
      .where(eq(userSyncData.syncCode, testCode))
      .limit(1);

    assert.equal(saved.length, 1);
    const parsedCards = JSON.parse(saved[0].cardsData);
    assert.ok(parsedCards.vocab_1, 'Should contain test card');
    const parsedStats = JSON.parse(saved[0].statsData);
    assert.equal(parsedStats.streak, 5);

    // Clean up
    await db.delete(syncDevices).where(eq(syncDevices.syncCode, testCode));
  });
});
