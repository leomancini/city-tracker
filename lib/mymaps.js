import { parseKml } from './kml.js';
import { getUser, saveUser, listUsers } from './store.js';

const MID_RE = /^[A-Za-z0-9_-]{10,}$/;
const FETCH_TIMEOUT_MS = 20_000;

// Accepts any Google My Maps URL (edit, viewer, embed) or a bare map id and
// returns the map id, or null if none can be found.
export function parseMyMapsMid(input) {
  const raw = (input || '').trim();
  if (!raw) return null;
  if (MID_RE.test(raw)) return raw;

  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!/(^|\.)google\.[a-z.]+$/i.test(url.hostname)) return null;
  if (!url.pathname.startsWith('/maps/d/')) return null;

  const mid = url.searchParams.get('mid');
  return mid && MID_RE.test(mid) ? mid : null;
}

export function myMapsKmlUrl(mid) {
  return `https://www.google.com/maps/d/kml?mid=${encodeURIComponent(mid)}&forcekml=1`;
}

export function myMapsViewerUrl(mid) {
  return `https://www.google.com/maps/d/viewer?mid=${encodeURIComponent(mid)}`;
}

export class MyMapsError extends Error {
  constructor(message, code, status = 502) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// Downloads the map as KML. Google only serves this for maps shared as
// "anyone with the link"; private maps come back as a 403 or a redirect to
// the login page, which we turn into a readable error.
export async function fetchMyMapsKml(mid) {
  let res;
  try {
    res = await fetch(myMapsKmlUrl(mid), {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': 'city-tracker/1.0 (+my-maps-sync)' },
    });
  } catch (err) {
    throw new MyMapsError(`Could not reach Google My Maps: ${err.message}`, 'network');
  }

  if (res.status === 403 || (res.status >= 300 && res.status < 400)) {
    throw new MyMapsError(
      'Google returned "forbidden" for this map. In My Maps, click Share and set link sharing to "Anyone with the link", then try again.',
      'private',
      403,
    );
  }
  if (res.status === 404) {
    throw new MyMapsError('Google could not find a map with this id.', 'not_found', 404);
  }
  if (!res.ok) {
    throw new MyMapsError(`Google My Maps responded with HTTP ${res.status}.`, 'http');
  }

  const body = await res.text();
  if (!/<kml[\s>]/i.test(body)) {
    throw new MyMapsError('Google did not return KML for this map. Check that the map is shared with "Anyone with the link".', 'not_kml');
  }
  return body;
}

// Applies a KML document to a user's city list. Adds every placemark that
// matches a known city within the distance threshold and is not already on the
// list. Never removes anything. Mutates `user`; the caller saves it.
export function applyKmlToUser(user, kmlString) {
  const placemarks = parseKml(kmlString);
  const existingIds = new Set(user.cities.map(c => c.cityId));
  const seenThisRun = new Set();
  const added = [];
  const alreadyListed = [];
  const unmatched = [];
  const now = new Date().toISOString();

  for (const pm of placemarks) {
    const city = pm.matchedCity;
    if (!city || !pm.withinThreshold) {
      unmatched.push({
        kmlName: pm.kmlName,
        lat: pm.lat,
        lng: pm.lng,
        nearest: city ? { id: city.id, name: city.name, country: city.country, distanceKm: pm.distanceKm } : null,
      });
      continue;
    }
    if (seenThisRun.has(city.id)) continue;
    seenThisRun.add(city.id);

    const entry = { id: city.id, name: city.name, country: city.country, admin1: city.admin1, kmlName: pm.kmlName, distanceKm: pm.distanceKm };
    if (existingIds.has(city.id)) {
      alreadyListed.push(entry);
      continue;
    }
    user.cities.push({ cityId: city.id, addedAt: now, note: '', source: 'mymaps' });
    existingIds.add(city.id);
    added.push(entry);
  }

  return {
    placemarks: placemarks.length,
    added,
    alreadyListed,
    unmatched,
    total: user.cities.length,
  };
}

export function getSyncSource(user) {
  return user.syncSource || null;
}

export function setSyncSource(user, input) {
  const mid = parseMyMapsMid(input);
  if (!mid) {
    throw new MyMapsError(
      'That does not look like a Google My Maps link. Paste the URL from the address bar while viewing or editing the map.',
      'bad_url',
      400,
    );
  }
  const prev = user.syncSource && user.syncSource.mid === mid ? user.syncSource : {};
  user.syncSource = {
    ...prev,
    type: 'google-my-maps',
    mid,
    url: myMapsViewerUrl(mid),
    updatedAt: new Date().toISOString(),
  };
  return user.syncSource;
}

export function clearSyncSource(user) {
  delete user.syncSource;
}

// Fetches the user's linked map and applies it. With dryRun the list is not
// changed and nothing is saved, but the report shows what would happen.
export async function syncUser(user, { dryRun = false } = {}) {
  const source = getSyncSource(user);
  if (!source) throw new MyMapsError('No Google My Maps link is set for this user.', 'no_source', 400);

  const startedAt = new Date().toISOString();
  let kml;
  try {
    kml = await fetchMyMapsKml(source.mid);
  } catch (err) {
    if (!dryRun) {
      user.syncSource.lastAttemptAt = startedAt;
      user.syncSource.lastError = err.message;
      await saveUser(user);
    }
    throw err;
  }

  const working = dryRun ? { ...user, cities: user.cities.map(c => ({ ...c })) } : user;
  const report = applyKmlToUser(working, kml);

  if (!dryRun) {
    user.syncSource.lastAttemptAt = startedAt;
    user.syncSource.lastSyncedAt = startedAt;
    user.syncSource.lastError = null;
    user.syncSource.lastResult = {
      placemarks: report.placemarks,
      added: report.added.length,
      alreadyListed: report.alreadyListed.length,
      unmatched: report.unmatched.length,
    };
    await saveUser(user);
  }

  return { ...report, dryRun, syncedAt: startedAt, source: user.syncSource };
}

// Syncs every user that has a linked map. Errors are logged per user so one
// private map does not stop the rest.
export async function syncAllUsers({ log = console } = {}) {
  const usernames = await listUsers();
  const results = [];
  for (const username of usernames) {
    const user = await getUser(username);
    if (!user || !getSyncSource(user)) continue;
    try {
      const r = await syncUser(user);
      log.log(`[mymaps] ${username}: +${r.added.length} added, ${r.alreadyListed.length} already listed, ${r.unmatched.length} unmatched`);
      results.push({ username, ok: true, added: r.added.length });
    } catch (err) {
      log.warn(`[mymaps] ${username}: ${err.message}`);
      results.push({ username, ok: false, error: err.message });
    }
  }
  return results;
}
