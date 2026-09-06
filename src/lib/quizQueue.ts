/**
 * Utility functions for Quizlet Mastery Queue
 * Guarantees that every item is correctly answered before the session completes.
 */

/**
 * Re-inserts an item into the remaining queue at a random position.
 * Ensures the item is spaced ahead by at least `minOffset` questions if possible,
 * preventing immediate repetition while ensuring it appears again.
 *
 * @param queue The current queue of quiz questions
 * @param currentIndex The current active index in the queue
 * @param item The question item that was answered incorrectly
 * @param minOffset Minimum question distance from currentIndex (default: 2)
 * @returns A new queue array with the item re-inserted
 */
export function reinsertQuestion<T>(
  queue: T[],
  currentIndex: number,
  item: T,
  minOffset = 2
): T[] {
  const newQueue = [...queue];
  const remainingCount = newQueue.length - (currentIndex + 1);

  if (remainingCount <= 0) {
    // If we're at the very end of the queue, append it to the end
    newQueue.push(item);
    return newQueue;
  }

  // Calculate the valid index range for insertion
  // We want to insert between [currentIndex + 1 + startOffset, newQueue.length]
  const startOffset = Math.min(minOffset, remainingCount);
  const minInsertIndex = currentIndex + 1 + startOffset;
  const maxInsertIndex = newQueue.length;

  const insertIndex =
    minInsertIndex >= maxInsertIndex
      ? newQueue.length
      : Math.floor(Math.random() * (maxInsertIndex - minInsertIndex + 1)) + minInsertIndex;

  newQueue.splice(insertIndex, 0, item);
  return newQueue;
}
