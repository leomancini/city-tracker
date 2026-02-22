import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, '../raw/admin1CodesASCII.txt'), 'utf-8');

const admin1 = {};
for (const line of raw.split('\n')) {
  if (!line.trim()) continue;
  const cols = line.split('\t');
  admin1[cols[0]] = cols[1];
}

writeFileSync(
  join(__dirname, '../data/admin1.json'),
  JSON.stringify(admin1, null, 2)
);

console.log(`Wrote ${Object.keys(admin1).length} admin1 codes`);
