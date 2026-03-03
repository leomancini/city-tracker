import { Router } from 'express';
import { getCountryName, getAdmin1Name } from '../lib/store.js';
import { stmts } from '../lib/db.js';

const router = Router();

const GEONAMES_USER = process.env.GEONAMES_USERNAME || 'demo';

function formatCity(city) {
  return {
    id: city.id,
    name: city.name,
    country: city.country,
    countryName: getCountryName(city.country),
    admin1: city.admin1,
    admin1Name: getAdmin1Name(city.country, city.admin1),
    lat: city.lat,
    lng: city.lng,
    population: city.population,
  };
}

async function searchGeoNames(q, maxRows) {
  const url = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(q)}&maxRows=${maxRows}&featureClass=P&style=MEDIUM&lang=en&username=${GEONAMES_USER}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.geonames) return [];
  return data.geonames.map(g => ({
    id: g.geonameId,
    name: g.name,
    ascii: g.asciiName || g.name,
    country: g.countryCode,
    admin1: g.adminCode1 || '',
    lat: parseFloat(g.lat),
    lng: parseFloat(g.lng),
    population: g.population || 0,
  }));
}

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  if (!q || q.length < 2) return res.json([]);

  const startsPattern = `${q}%`;
  const containsPattern = `%${q}%`;
  const rows = stmts.search.all(startsPattern, startsPattern, containsPattern, containsPattern, limit);

  const results = rows.map(formatCity);
  const seenIds = new Set(rows.map(r => r.id));

  // GeoNames API fallback when local results are insufficient
  if (results.length < limit) {
    try {
      const geoResults = await searchGeoNames(q, limit - results.length);
      for (const city of geoResults) {
        if (results.length >= limit) break;
        if (seenIds.has(city.id)) continue;
        results.push(formatCity(city));
        seenIds.add(city.id);
      }
    } catch {
      // Silently fall back to local results only
    }
  }

  res.json(results);
});

export default router;
