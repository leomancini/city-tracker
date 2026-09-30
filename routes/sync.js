import { Router } from 'express';
import { getUser, saveUser } from '../lib/store.js';
import { getSyncSource, setSyncSource, clearSyncSource, syncUser, MyMapsError } from '../lib/mymaps.js';

const router = Router();

function sendError(res, err) {
  if (err instanceof MyMapsError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  console.error(err);
  return res.status(500).json({ error: 'Sync failed' });
}

router.get('/:username/sync-source', async (req, res) => {
  const user = await getUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ source: getSyncSource(user) });
});

router.put('/:username/sync-source', async (req, res) => {
  const user = await getUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  try {
    const source = setSyncSource(user, req.body?.url);
    await saveUser(user);
    res.json({ source });
  } catch (err) {
    sendError(res, err);
  }
});

router.delete('/:username/sync-source', async (req, res) => {
  const user = await getUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  clearSyncSource(user);
  await saveUser(user);
  res.json({ ok: true });
});

// Pull the linked map and add any new cities. Pass { "dryRun": true } to
// preview without changing the list.
router.post('/:username/sync', async (req, res) => {
  const user = await getUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  try {
    const result = await syncUser(user, { dryRun: Boolean(req.body?.dryRun) });
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
