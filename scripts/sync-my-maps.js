// Pull a user's linked Google My Maps map into their city list.
//   node scripts/sync-my-maps.js <username> [my-maps-url]   sync one user (optionally set/replace the link first)
//   node scripts/sync-my-maps.js --all                      sync every user with a linked map
import { loadData, getUser, saveUser } from '../lib/store.js';
import { setSyncSource, syncUser, syncAllUsers } from '../lib/mymaps.js';

const [arg, url] = process.argv.slice(2);

if (!arg) {
  console.error('Usage: node scripts/sync-my-maps.js <username> [my-maps-url] | --all');
  process.exit(1);
}

await loadData();

if (arg === '--all') {
  const results = await syncAllUsers();
  if (results.length === 0) console.log('No users have a linked map.');
  process.exit(results.some(r => !r.ok) ? 1 : 0);
}

const user = await getUser(arg);
if (!user) {
  console.error(`User not found: ${arg}`);
  process.exit(1);
}

if (url) {
  const source = setSyncSource(user, url);
  await saveUser(user);
  console.log(`Linked ${arg} to ${source.url}`);
}

try {
  const r = await syncUser(user);
  console.log(`\n${r.placemarks} placemarks on the map`);
  console.log(`  Added: ${r.added.length}`);
  for (const c of r.added) console.log(`    + ${c.name}, ${c.country}  (from "${c.kmlName}", ${c.distanceKm}km)`);
  console.log(`  Already listed: ${r.alreadyListed.length}`);
  console.log(`  Unmatched: ${r.unmatched.length}`);
  for (const u of r.unmatched) {
    const near = u.nearest ? `nearest ${u.nearest.name} at ${u.nearest.distanceKm}km` : 'no city nearby';
    console.log(`    ? ${u.kmlName}  (${near})`);
  }
  console.log(`  Total cities for ${arg}: ${r.total}`);
} catch (err) {
  console.error(`\nSync failed: ${err.message}`);
  process.exit(1);
}
