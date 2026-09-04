import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Devices or user accounts linked by a unique Sync Code (e.g. NH-88291)
 */
export const syncDevices = sqliteTable('sync_devices', {
  syncCode: text('sync_code').primaryKey(),
  deviceName: text('device_name').default('Thiết bị cá nhân'),
  createdAt: integer('created_at').notNull(),
  lastSyncAt: integer('last_sync_at').notNull(),
});

/**
 * User progress data for multi-device sync (SRS SM-2, Kanji, Vocab, XP, Streaks)
 */
export const userSyncData = sqliteTable('user_sync_data', {
  syncCode: text('sync_code')
    .primaryKey()
    .references(() => syncDevices.syncCode, { onDelete: 'cascade' }),
  cardsData: text('cards_data').notNull(), // JSON string of SRSCard map
  statsData: text('stats_data').notNull(), // JSON string of SRSStats
  kanjiStatus: text('kanji_status').notNull(), // JSON string of KanjiStatus map
  vocabProgress: text('vocab_progress').notNull(), // JSON string of completed lessons & vocab status
  preferences: text('preferences').notNull(), // JSON string of study preferences
  version: integer('version').default(1).notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/**
 * Scalable Course / Textbook storage
 */
export const textbooks = sqliteTable('textbooks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  level: text('level').notNull(),
  description: text('description'),
  totalLessons: integer('total_lessons').default(0).notNull(),
});

/**
 * Lessons within textbooks
 */
export const lessons = sqliteTable('lessons', {
  id: text('id').primaryKey(),
  textbookId: text('textbook_id').notNull(),
  lessonNumber: integer('lesson_number').notNull(),
  title: text('title').notNull(),
});

/**
 * Vocabulary items database
 */
export const vocabItems = sqliteTable('vocab_items', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id').notNull(),
  word: text('word').notNull(),
  reading: text('reading').notNull(),
  meaning: text('meaning').notNull(),
  sinoVietnamese: text('sino_vietnamese'),
  romaji: text('romaji'),
  level: text('level'),
});

/**
 * AI Generated Lesson Exercises (Cloze questions)
 */
export const aiLessonExercises = sqliteTable('ai_lesson_exercises', {
  id: text('id').primaryKey(), // `${lessonId}_${syncCode}`
  lessonId: text('lesson_id').notNull(),
  syncCode: text('sync_code').notNull(),
  model: text('model').notNull(),
  totalExercises: integer('total_exercises').notNull(),
  exercisesData: text('exercises_data').notNull(), // JSON stringified ClozeExerciseItem[]
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

