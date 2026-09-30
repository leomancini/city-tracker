import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { loadData } from './lib/store.js';
import apiRouter from './routes/api.js';
import { syncAllUsers } from './lib/mymaps.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3121;

app.use(cors());
app.use(express.json());

await loadData();

app.use('/api', apiRouter);

// Serve React app in production
const clientDist = path.join(__dirname, 'client-dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Periodically pull linked Google My Maps maps into their users' lists.
// Set MYMAPS_SYNC_MINUTES=0 to turn the background sync off.
const syncMinutes = Number(process.env.MYMAPS_SYNC_MINUTES ?? 360);
if (syncMinutes > 0) {
  const run = () => syncAllUsers().catch(err => console.error('[mymaps] sync failed:', err));
  setTimeout(run, 30_000);
  setInterval(run, syncMinutes * 60_000);
  console.log(`My Maps auto-sync every ${syncMinutes} minutes`);
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
