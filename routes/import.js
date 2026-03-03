import { Router } from 'express';
import multer from 'multer';
import { parseKml } from '../lib/kml.js';
import { getUser, saveUser, getCityById } from '../lib/store.js';
import { enrichCity } from '../lib/grouping.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/:username/import/kml', upload.single('file'), async (req, res) => {
  const user = await getUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const kmlString = req.file.buffer.toString('utf-8');
  const results = parseKml(kmlString);
  res.json(results);
});

router.post('/:username/import/confirm', async (req, res) => {
  const user = await getUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { cityIds } = req.body;
  if (!Array.isArray(cityIds)) return res.status(400).json({ error: 'cityIds array required' });

  const existingIds = new Set(user.cities.map(c => c.cityId));
  let added = 0;

  for (const rawId of cityIds) {
    const cityId = Number(rawId);
    if (!cityId || !Number.isFinite(cityId)) continue;
    if (existingIds.has(cityId)) continue;
    if (!getCityById(cityId)) continue;
    user.cities.push({ cityId, addedAt: new Date().toISOString(), note: '' });
    existingIds.add(cityId);
    added++;
  }

  await saveUser(user);
  res.json({ added, total: user.cities.length });
});

export default router;
