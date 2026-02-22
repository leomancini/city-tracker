import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, '../raw/countryInfo.txt'), 'utf-8');

const countries = {};
for (const line of raw.split('\n')) {
  if (line.startsWith('#') || !line.trim()) continue;
  const cols = line.split('\t');
  countries[cols[0]] = { name: cols[4], continent: cols[8] };
}

writeFileSync(
  join(__dirname, '../data/countries.json'),
  JSON.stringify(countries, null, 2)
);

console.log(`Wrote ${Object.keys(countries).length} countries`);
