import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const USERS_DIR = join(DATA_DIR, 'users');

let citiesArray = [];
let citiesMap = new Map();
let countries = {};
let admin1 = {};

export async function loadData() {
  const [citiesRaw, countriesRaw, admin1Raw] = await Promise.all([
    readFile(join(DATA_DIR, 'cities.json'), 'utf-8'),
    readFile(join(DATA_DIR, 'countries.json'), 'utf-8'),
    readFile(join(DATA_DIR, 'admin1.json'), 'utf-8'),
  ]);

  citiesArray = JSON.parse(citiesRaw);
  citiesMap = new Map(citiesArray.map(c => [c.id, c]));
  countries = JSON.parse(countriesRaw);
  admin1 = JSON.parse(admin1Raw);

  console.log(`Loaded ${citiesArray.length} cities, ${Object.keys(countries).length} countries, ${Object.keys(admin1).length} admin1 codes`);
}

export function getCitiesArray() { return citiesArray; }
export function getCityById(id) { return citiesMap.get(id); }
export function getCountries() { return countries; }
export function getAdmin1() { return admin1; }

export function getCountryName(code) {
  return countries[code]?.name || code;
}

export function getContinent(countryCode) {
  return countries[countryCode]?.continent || 'XX';
}

export function getAdmin1Name(countryCode, admin1Code) {
  return admin1[`${countryCode}.${admin1Code}`] || admin1Code;
}

// User data operations
export async function listUsers() {
  if (!existsSync(USERS_DIR)) await mkdir(USERS_DIR, { recursive: true });
  const files = await readdir(USERS_DIR);
  return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
}

export async function getUser(username) {
  const filepath = join(USERS_DIR, `${username}.json`);
  if (!existsSync(filepath)) return null;
  return JSON.parse(await readFile(filepath, 'utf-8'));
}

export async function createUser(username) {
  if (!existsSync(USERS_DIR)) await mkdir(USERS_DIR, { recursive: true });
  const filepath = join(USERS_DIR, `${username}.json`);
  if (existsSync(filepath)) return null;
  const user = { username, createdAt: new Date().toISOString(), cities: [] };
  await writeFile(filepath, JSON.stringify(user, null, 2));
  return user;
}

export async function saveUser(user) {
  const filepath = join(USERS_DIR, `${user.username}.json`);
  await writeFile(filepath, JSON.stringify(user, null, 2));
}
