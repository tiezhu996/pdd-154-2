import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const appliedMigrations = db
    .prepare('SELECT filename FROM migrations')
    .all() as { filename: string }[];
  const appliedFilenames = new Set(appliedMigrations.map((m) => m.filename));

  for (const file of migrationFiles) {
    if (!appliedFilenames.has(file)) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      db.exec(sql);
      db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file);
      console.log(`Applied migration: ${file}`);
    }
  }
}

runMigrations();

export default db;
