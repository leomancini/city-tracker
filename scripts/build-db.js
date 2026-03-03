import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'cities.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`DROP TABLE IF EXISTS cities`);
db.exec(`
  CREATE TABLE cities (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    ascii TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    country TEXT NOT NULL,
    admin1 TEXT NOT NULL DEFAULT '',
    population INTEGER NOT NULL DEFAULT 0,
    custom INTEGER NOT NULL DEFAULT 0
  )
`);

db.exec(`CREATE INDEX idx_cities_name ON cities(name COLLATE NOCASE)`);
db.exec(`CREATE INDEX idx_cities_ascii ON cities(ascii COLLATE NOCASE)`);
db.exec(`CREATE INDEX idx_cities_lat ON cities(lat)`);
db.exec(`CREATE INDEX idx_cities_lng ON cities(lng)`);

const insert = db.prepare(`
  INSERT OR IGNORE INTO cities (id, name, ascii, lat, lng, country, admin1, population, custom)
  VALUES (@id, @name, @ascii, @lat, @lng, @country, @admin1, @population, @custom)
`);

const cities = JSON.parse(readFileSync(join(DATA_DIR, 'cities.json'), 'utf-8'));

const insertAll = db.transaction((rows, custom) => {
  for (const c of rows) {
    insert.run({
      id: c.id,
      name: c.name,
      ascii: c.ascii || c.name,
      lat: c.lat,
      lng: c.lng,
      country: c.country,
      admin1: c.admin1 || '',
      population: c.population || 0,
      custom: custom ? 1 : 0,
    });
  }
});

insertAll(cities, false);
console.log(`Inserted ${cities.length} cities from cities.json`);

const customPath = join(DATA_DIR, 'custom-cities.json');
if (existsSync(customPath)) {
  const custom = JSON.parse(readFileSync(customPath, 'utf-8'));
  insertAll(custom, true);
  console.log(`Inserted ${custom.length} custom cities`);
}

const count = db.prepare('SELECT COUNT(*) as count FROM cities').get();
console.log(`Total cities in DB: ${count.count}`);

db.close();
