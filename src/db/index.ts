import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = process.env.TURSO_DATABASE_URL || 'file:nihongo.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

// Helper to auto-create tables on first run
let isInitialized = false;

export async function ensureDbInitialized() {
  if (isInitialized) return;

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sync_devices (
        sync_code TEXT PRIMARY KEY,
        device_name TEXT DEFAULT 'Thiết bị cá nhân',
        created_at INTEGER NOT NULL,
        last_sync_at INTEGER NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_sync_data (
        sync_code TEXT PRIMARY KEY,
        cards_data TEXT NOT NULL,
        stats_data TEXT NOT NULL,
        kanji_status TEXT NOT NULL,
        vocab_progress TEXT NOT NULL,
        preferences TEXT NOT NULL,
        version INTEGER DEFAULT 1 NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (sync_code) REFERENCES sync_devices(sync_code) ON DELETE CASCADE
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS textbooks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        level TEXT NOT NULL,
        description TEXT,
        total_lessons INTEGER DEFAULT 0 NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        textbook_id TEXT NOT NULL,
        lesson_number INTEGER NOT NULL,
        title TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS vocab_items (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        word TEXT NOT NULL,
        reading TEXT NOT NULL,
        meaning TEXT NOT NULL,
        sino_vietnamese TEXT,
        romaji TEXT,
        level TEXT
      );
    `);

    isInitialized = true;
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
  }
}
