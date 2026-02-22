import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
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

writeFileSync(
  join(__dirname, '../data/cities.json'),
  JSON.stringify(cities)
);

console.log(`Wrote ${cities.length} cities`);
