import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSM2, SM2Input } from '../sm2';

describe('SM-2 Spaced Repetition Algorithm', () => {
  const baseDate = new Date('2026-09-02T12:00:00Z');

  it('should reset repetitions to 0 and interval to 1 on Rating 1 (Again)', () => {
    const input: SM2Input = {
      rating: 1,
      repetitions: 5,
      interval: 30,
      easeFactor: 2.5,
    };

    const result = calculateSM2(input, baseDate);

    assert.equal(result.repetitions, 0);
    assert.equal(result.interval, 1);
    assert.equal(result.xpEarned, 1);
    assert.equal(result.dueDate, '2026-09-03');
    // delta = 0.1 - (5-1)*(0.08 + 4*0.02) = 0.1 - 4*0.16 = 0.1 - 0.64 = -0.54
    // ef = 2.5 - 0.54 = 1.96
    assert.equal(result.easeFactor, 1.96);
  });

  it('should follow progression 1 -> 6 -> 15 on consecutive Rating 3 (Good) reviews', () => {
    // Review 1 (from fresh card: reps=0, interval=0, ef=2.5)
    const review1 = calculateSM2({
      rating: 3,
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
    }, baseDate);

    assert.equal(review1.repetitions, 1);
    assert.equal(review1.interval, 1);
    assert.equal(review1.xpEarned, 5);
    // q=4 => delta = 0.1 - (1)*(0.08 + 0.02) = 0 => ef = 2.5
    assert.equal(review1.easeFactor, 2.5);
    assert.equal(review1.dueDate, '2026-09-03');

    // Review 2
    const review2 = calculateSM2({
      rating: 3,
      repetitions: review1.repetitions,
      interval: review1.interval,
      easeFactor: review1.easeFactor,
    }, baseDate);

    assert.equal(review2.repetitions, 2);
    assert.equal(review2.interval, 6);
    assert.equal(review2.xpEarned, 5);
    assert.equal(review2.easeFactor, 2.5);
    assert.equal(review2.dueDate, '2026-09-08');

    // Review 3
    const review3 = calculateSM2({
      rating: 3,
      repetitions: review2.repetitions,
      interval: review2.interval,
      easeFactor: review2.easeFactor,
    }, baseDate);

    assert.equal(review3.repetitions, 3);
    assert.equal(review3.interval, 15); // Math.round(6 * 2.5) = 15
    assert.equal(review3.xpEarned, 5);
    assert.equal(review3.easeFactor, 2.5);
    assert.equal(review3.dueDate, '2026-09-17');
  });

  it('should enforce EaseFactor floor at 1.3', () => {
    const input: SM2Input = {
      rating: 1,
      repetitions: 1,
      interval: 1,
      easeFactor: 1.4,
    };

    // delta is -0.54, 1.4 - 0.54 = 0.86 < 1.3 => must clamp to 1.3
    const result = calculateSM2(input, baseDate);

    assert.equal(result.easeFactor, 1.3);
    assert.equal(result.repetitions, 0);
    assert.equal(result.interval, 1);
  });

  it('should calculate correct XP and delta for Rating 2 (Hard)', () => {
    const input: SM2Input = {
      rating: 2,
      repetitions: 2,
      interval: 6,
      easeFactor: 2.5,
    };

    // q=3 => delta = 0.1 - (2)*(0.08 + 2*0.02) = 0.1 - 2*0.12 = 0.1 - 0.24 = -0.14
    // ef = 2.5 - 0.14 = 2.36
    // interval = Math.round(6 * 2.36) = 14
    const result = calculateSM2(input, baseDate);

    assert.equal(result.xpEarned, 3);
    assert.equal(result.repetitions, 3);
    assert.equal(result.easeFactor, 2.36);
    assert.equal(result.interval, 14);
  });

  it('should calculate correct XP and delta for Rating 4 (Easy)', () => {
    const input: SM2Input = {
      rating: 4,
      repetitions: 2,
      interval: 6,
      easeFactor: 2.5,
    };

    // q=5 => delta = 0.1 - (0) = 0.10
    // ef = 2.5 + 0.10 = 2.6
    // interval = Math.round(6 * 2.6) = 16
    const result = calculateSM2(input, baseDate);

    assert.equal(result.xpEarned, 8);
    assert.equal(result.repetitions, 3);
    assert.equal(result.easeFactor, 2.6);
    assert.equal(result.interval, 16);
  });
});
