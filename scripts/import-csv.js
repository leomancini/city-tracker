import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadData, createUser, getUser, saveUser, getCitiesArray } from '../lib/store.js';
import { findNearestCity } from '../lib/geo.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const csvPath = process.argv[2];
const username = process.argv[3] || 'leo';

if (!csvPath) {
  console.error('Usage: node scripts/import-csv.js <csv-path> [username]');
  process.exit(1);
}

await loadData();

// Ensure user exists
let user = await getUser(username);
if (!user) {
  user = await createUser(username);
  console.log(`Created user: ${username}`);
}

const csv = readFileSync(csvPath, 'utf-8');
const lines = csv.trim().split('\n').slice(1); // skip header

const cities = getCitiesArray();
const matched = new Map(); // cityId -> { city, sources[] }
let noMatch = 0;

for (const line of lines) {
  const wktMatch = line.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!wktMatch) continue;

  const lng = parseFloat(wktMatch[1]);
  const lat = parseFloat(wktMatch[2]);
  const nameMatch = line.match(/\),(.+?)(?:,|$)/);
  const placeName = nameMatch ? nameMatch[1].trim() : 'Unknown';

  const result = findNearestCity(lat, lng, cities, 100);
  if (result.city && result.withinThreshold) {
    if (!matched.has(result.city.id)) {
      matched.set(result.city.id, { city: result.city, sources: [] });
    }
    matched.get(result.city.id).sources.push(`${placeName} (${result.distance.toFixed(1)}km)`);
  } else {
    noMatch++;
    console.log(`  No match: ${placeName} (nearest: ${result.city?.name} at ${result.distance.toFixed(1)}km)`);
  }
}

// Add cities to user, skip duplicates
const existingIds = new Set(user.cities.map(c => c.cityId));
let added = 0;
let skipped = 0;

for (const [cityId, data] of matched) {
  if (existingIds.has(cityId)) {
    skipped++;
    continue;
  }
  user.cities.push({ cityId, addedAt: new Date().toISOString(), note: '' });
  added++;
}

await saveUser(user);

console.log(`\nResults:`);
console.log(`  CSV entries: ${lines.length}`);
console.log(`  Unique cities matched: ${matched.size}`);
console.log(`  Added to ${username}: ${added}`);
console.log(`  Already existed: ${skipped}`);
console.log(`  No match (>100km): ${noMatch}`);
console.log(`  Total cities for ${username}: ${user.cities.length}`);
