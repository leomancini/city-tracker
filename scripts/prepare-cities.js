import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Step 1: Parse cities
const raw = readFileSync(join(__dirname, '../raw/cities15000.txt'), 'utf-8');
const cities = raw.trim().split('\n').map(line => {
  const cols = line.split('\t');
  return {
    id: parseInt(cols[0]),
    name: cols[1],
    ascii: cols[2],
    lat: parseFloat(cols[4]),
    lng: parseFloat(cols[5]),
    country: cols[8],
    admin1: cols[10],
    population: parseInt(cols[14]) || 0,
  };
}).sort((a, b) => b.population - a.population);

const cityIds = new Set(cities.map(c => c.id));
console.log(`Parsed ${cities.length} cities`);

// Step 2: Extract English names from alternateNamesV2.txt
// Format: alternateNameId \t geonameId \t isolanguage \t alternate name \t isPreferredName \t isShortName \t isColloquial \t isHistoric
const englishCandidates = new Map(); // geonameId -> [{ name, isPreferred, isShort }]

const rl = createInterface({
  input: createReadStream(join(__dirname, '../raw/alternateNamesV2.txt')),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  const cols = line.split('\t');
  const geonameId = parseInt(cols[1]);
  if (!cityIds.has(geonameId)) continue;
  if (cols[2] !== 'en') continue;

  const altName = cols[3];
  const isPreferred = cols[4] === '1';
  const isShort = cols[5] === '1';
  const isColloquial = cols[6] === '1';
  const isHistoric = cols[7] === '1';

  if (isColloquial || isHistoric) continue;

  if (!englishCandidates.has(geonameId)) englishCandidates.set(geonameId, []);
  englishCandidates.get(geonameId).push({ name: altName, isPreferred, isShort });
}

// Pick best English name for each city
const englishNames = new Map();
for (const [id, candidates] of englishCandidates) {
  // If only one candidate, use it
  if (candidates.length === 1) {
    englishNames.set(id, candidates[0]);
    continue;
  }
  // Priority: isShort > shortest name among non-short candidates
  const short = candidates.find(c => c.isShort);
  if (short) {
    englishNames.set(id, short);
    continue;
  }
  // Pick the shortest name (prefer common English names like "Frankfurt" over "Frankfurt am Main")
  candidates.sort((a, b) => a.name.length - b.name.length);
  englishNames.set(id, candidates[0]);
}

console.log(`Found English names for ${englishNames.size} cities`);

// Step 3: Apply English names (skip China — keep original names)
let renamed = 0;
for (const city of cities) {
  if (city.country === 'CN') continue;
  const en = englishNames.get(city.id);
  if (en && en.name !== city.name) {
    city.name = en.name;
    renamed++;
  }
}

console.log(`Renamed ${renamed} cities to English names`);

writeFileSync(
  join(__dirname, '../data/cities.json'),
  JSON.stringify(cities)
);

console.log(`Wrote ${cities.length} cities`);
