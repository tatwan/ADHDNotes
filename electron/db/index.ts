import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
export * from './schema';

import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function initDB() {
  if (db) return db;

  const documentsPath = app.getPath('documents');
  const dbDir = path.join(documentsPath, 'ADHDNotes', '_system');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'bookmarks.db');

  const sqlite = new Database(dbPath);
  db = drizzle(sqlite, { schema });

  // Simple manual migration for this setup
  // In a production app, we might use drizzle-kit migrate programmatically or a dedicated migration runner
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      title TEXT,
      description TEXT,
      content TEXT,
      favicon_url TEXT,
      is_processed INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  try {
    sqlite.exec(`ALTER TABLE bookmarks ADD COLUMN local_image_path TEXT;`);
  } catch (e) {
    // Ignore if column already exists
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS bookmarks_tags (
      bookmark_id INTEGER REFERENCES bookmarks(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER REFERENCES bookmarks(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      selector TEXT,
      color TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  return db;
}

export function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call initDB() first.");
  }
  return db;
}
