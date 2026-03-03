import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'cities.db');

const db = new Database(DB_PATH, { readonly: false });
db.pragma('journal_mode = WAL');

export const stmts = {
  getById: db.prepare('SELECT * FROM cities WHERE id = ?'),

  search: db.prepare(`
    SELECT *, CASE
      WHEN name LIKE ? COLLATE NOCASE THEN 0
      WHEN ascii LIKE ? COLLATE NOCASE THEN 0
      ELSE 1
    END AS rank
    FROM cities
    WHERE name LIKE ? COLLATE NOCASE OR ascii LIKE ? COLLATE NOCASE
    ORDER BY rank, population DESC
    LIMIT ?
  `),

  inBoundingBox: db.prepare(`
    SELECT * FROM cities
    WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
  `),

  insertCustom: db.prepare(`
    INSERT OR IGNORE INTO cities (id, name, ascii, lat, lng, country, admin1, population, custom)
    VALUES (@id, @name, @ascii, @lat, @lng, @country, @admin1, @population, 1)
  `),

  count: db.prepare('SELECT COUNT(*) as count FROM cities'),
};

export function getCityCount() {
  return stmts.count.get().count;
}

export default db;
