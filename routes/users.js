import { Router } from 'express';
import { listUsers, getUser, createUser, saveUser, getCityById } from '../lib/store.js';
import { groupCities, enrichCity } from '../lib/grouping.js';

const router = Router();

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

router.get('/', async (req, res) => {
  const usernames = await listUsers();
  const users = [];
  for (const username of usernames) {
    const user = await getUser(username);
    if (user) users.push({ username: user.username, cityCount: user.cities.length, createdAt: user.createdAt });
  }
  res.json(users);
});

router.post('/', async (req, res) => {
  const { username } = req.body;
  if (!username || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-30 chars, lowercase alphanumeric and hyphens only' });
  }
  const user = await createUser(username);
  if (!user) return res.status(409).json({ error: 'Username already taken' });
  res.status(201).json(user);
});

router.get('/:username/cities', async (req, res) => {
  const user = await getUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const grouped = groupCities(user.cities);
  res.json(grouped);
});

router.post('/:username/cities', async (req, res) => {
  const user = await getUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { cityId } = req.body;
  if (!cityId) return res.status(400).json({ error: 'cityId is required' });

  const city = getCityById(cityId);
  if (!city) return res.status(404).json({ error: 'City not found' });

  if (user.cities.some(c => c.cityId === cityId)) {
    return res.status(409).json({ error: 'City already added' });
  }

  user.cities.push({ cityId, addedAt: new Date().toISOString(), note: req.body.note || '' });
  await saveUser(user);

  res.status(201).json(enrichCity(user.cities[user.cities.length - 1]));
});

router.delete('/:username/cities/:cityId', async (req, res) => {
  const user = await getUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const cityId = parseInt(req.params.cityId);
  const idx = user.cities.findIndex(c => c.cityId === cityId);
  if (idx === -1) return res.status(404).json({ error: 'City not in user list' });

  user.cities.splice(idx, 1);
  await saveUser(user);
  res.json({ ok: true });
});

export default router;
