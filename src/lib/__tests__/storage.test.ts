import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAndParseBackup } from '../storage';

describe('Storage Backup Validation', () => {
  it('should successfully validate valid backup with cards and stats', () => {
    const validJson = JSON.stringify({
      version: 1,
      exportedAt: '2026-09-02T12:00:00Z',
      cards: { 'card-1': { repetitions: 2, interval: 6 } },
      stats: { totalXP: 100, streak: 5 },
    });

    const result = validateAndParseBackup(validJson);
    assert.equal(result.success, true);
    assert.ok(result.data);
    assert.equal(result.data.version, 1);
  });

  it('should return error for invalid JSON string', () => {
    const result = validateAndParseBackup('{ invalid json: ');
    assert.equal(result.success, false);
    assert.ok(result.error?.includes('Lỗi phân tích JSON'));
  });

  it('should return error for empty or non-string input', () => {
    // @ts-expect-error testing invalid input
    const result1 = validateAndParseBackup(null);
    assert.equal(result1.success, false);

    const result2 = validateAndParseBackup('');
    assert.equal(result2.success, false);
  });

  it('should return error when backup does not contain cards or stats', () => {
    const invalidJson = JSON.stringify({
      foo: 'bar',
      randomData: 123,
    });

    const result = validateAndParseBackup(invalidJson);
    assert.equal(result.success, false);
    assert.ok(result.error?.includes('thiếu thông tin bắt buộc'));
  });
});
