import { Router } from 'express';
import { getCitiesArray, getCountryName, getAdmin1Name } from '../lib/store.js';

const router = Router();

router.get('/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  if (!q) return res.json([]);

  const cities = getCitiesArray();
  const results = [];

  for (const city of cities) {
    if (results.length >= limit) break;
    const nameLower = city.name.toLowerCase();
    const asciiLower = city.ascii.toLowerCase();
    if (nameLower.startsWith(q) || asciiLower.startsWith(q) ||
        nameLower.includes(q) || asciiLower.includes(q)) {
      results.push({
        id: city.id,
        name: city.name,
        country: city.country,
        countryName: getCountryName(city.country),
        admin1: city.admin1,
        admin1Name: getAdmin1Name(city.country, city.admin1),
        lat: city.lat,
        lng: city.lng,
        population: city.population,
      });
    }
  }

  res.json(results);
});

export default router;
