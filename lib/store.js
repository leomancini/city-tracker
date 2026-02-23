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

const CUSTOM_CITIES_PATH = join(DATA_DIR, 'custom-cities.json');

export async function loadData() {
  const [citiesRaw, countriesRaw, admin1Raw] = await Promise.all([
    readFile(join(DATA_DIR, 'cities.json'), 'utf-8'),
    readFile(join(DATA_DIR, 'countries.json'), 'utf-8'),
    readFile(join(DATA_DIR, 'admin1.json'), 'utf-8'),
  ]);

  citiesArray = JSON.parse(citiesRaw);
  countries = JSON.parse(countriesRaw);
  admin1 = JSON.parse(admin1Raw);

  // Load custom cities (added via GeoNames API) if file exists
  if (existsSync(CUSTOM_CITIES_PATH)) {
    const custom = JSON.parse(await readFile(CUSTOM_CITIES_PATH, 'utf-8'));
    citiesArray.push(...custom);
  }

  citiesMap = new Map(citiesArray.map(c => [c.id, c]));

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

export function addCityToStore(city) {
  if (citiesMap.has(city.id)) return;
  citiesArray.push(city);
  citiesMap.set(city.id, city);
}

export async function saveCustomCity(city) {
  let custom = [];
  if (existsSync(CUSTOM_CITIES_PATH)) {
    custom = JSON.parse(await readFile(CUSTOM_CITIES_PATH, 'utf-8'));
  }
  if (custom.some(c => c.id === city.id)) return;
  custom.push(city);
  await writeFile(CUSTOM_CITIES_PATH, JSON.stringify(custom, null, 2));
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
