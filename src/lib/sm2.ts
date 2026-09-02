export interface SM2Input {
  rating: 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy
  repetitions: number;
  interval: number;
  easeFactor: number;
}

export interface SM2Output {
  repetitions: number;
  interval: number;
  easeFactor: number;
  dueDate: string; // YYYY-MM-DD
  xpEarned: number;
}

/**
 * Calculates updated SM-2 Spaced Repetition parameters based on user recall rating.
 *
 * Ratings:
 * - 1: Again (q=1, xp=1) - Failed recall, reset interval & reps
 * - 2: Hard  (q=3, xp=3) - Difficult recall
 * - 3: Good  (q=4, xp=5) - Successful recall
 * - 4: Easy  (q=5, xp=8) - Perfect recall
 *
 * @param input Previous SM2 parameters and current rating
 * @param now Optional date for deterministic testing, defaults to current time
 */
export function calculateSM2(input: SM2Input, now: Date = new Date()): SM2Output {
  const { rating, repetitions: prevReps, interval: prevInterval, easeFactor: prevEF } = input;

  let q = 1;
  let xpEarned = 1;

  switch (rating) {
    case 1:
      q = 1;
      xpEarned = 1;
      break;
    case 2:
      q = 3;
      xpEarned = 3;
      break;
    case 3:
      q = 4;
      xpEarned = 5;
      break;
    case 4:
      q = 5;
      xpEarned = 8;
      break;
  }

  // SM-2 Ease Factor calculation
  const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const easeFactor = Math.max(1.3, parseFloat((prevEF + efDelta).toFixed(2)));

  let repetitions: number;
  let interval: number;

  if (rating === 1) {
    repetitions = 0;
    interval = 1;
  } else {
    if (prevReps === 0) {
      interval = 1;
    } else if (prevReps === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * easeFactor);
    }
    repetitions = prevReps + 1;
  }

  const targetDate = new Date(now.getTime());
  targetDate.setDate(targetDate.getDate() + interval);
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const dueDate = `${yyyy}-${mm}-${dd}`;

  return {
    repetitions,
    interval,
    easeFactor,
    dueDate,
    xpEarned,
  };
}
