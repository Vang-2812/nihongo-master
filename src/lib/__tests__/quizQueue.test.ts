import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reinsertQuestion } from '../quizQueue';

describe('Quizlet Mastery Queue (reinsertQuestion)', () => {
  it('should append item to end if currentIndex is at the last element', () => {
    const queue = ['A', 'B', 'C'];
    const result = reinsertQuestion(queue, 2, 'C');

    assert.equal(result.length, 4);
    assert.deepEqual(result.slice(0, 3), ['A', 'B', 'C']);
    assert.equal(result[3], 'C');
  });

  it('should append item to end if queue has only one element', () => {
    const queue = ['A'];
    const result = reinsertQuestion(queue, 0, 'A');

    assert.equal(result.length, 2);
    assert.deepEqual(result, ['A', 'A']);
  });

  it('should re-insert item into remaining queue after current index with offset', () => {
    const queue = ['A', 'B', 'C', 'D', 'E'];
    // currentIndex = 1 (item 'B'). Remaining items after index 1 are 'C', 'D', 'E' (indices 2, 3, 4)
    // minOffset = 2 means insertion should be at least 2 items ahead (index 4 or 5)
    for (let i = 0; i < 20; i++) {
      const result = reinsertQuestion(queue, 1, 'B', 2);
      assert.equal(result.length, 6);
      // 'A' and 'B' at 0 and 1 are untouched
      assert.equal(result[0], 'A');
      assert.equal(result[1], 'B');
      // The immediate next question at index 2 must NOT be the re-inserted 'B'
      assert.equal(result[2], 'C');
      // 'B' must be at index 4 or 5
      const newPos = result.lastIndexOf('B');
      assert.ok(newPos >= 3, `Expected newPos >= 3, got ${newPos}`);
    }
  });

  it('should handle small remaining count gracefully', () => {
    const queue = ['A', 'B', 'C'];
    // currentIndex = 1 (item 'B'). Only 1 remaining item 'C' (index 2).
    // startOffset = Math.min(2, 1) = 1 -> inserted at index 3 (after 'C')
    const result = reinsertQuestion(queue, 1, 'B', 2);
    assert.equal(result.length, 4);
    assert.deepEqual(result, ['A', 'B', 'C', 'B']);
  });

  it('should not mutate original queue', () => {
    const original = ['A', 'B'];
    const copy = [...original];
    reinsertQuestion(original, 0, 'A');
    assert.deepEqual(original, copy);
  });
});
