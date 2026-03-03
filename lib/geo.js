import { stmts } from './db.js';

const R = 6371; // Earth radius in km

export function haversine(lat1, lng1, lat2, lng2) {
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function boundingBox(lat, lng, distKm) {
  const latDelta = distKm / 111.32;
  const lngDelta = distKm / (111.32 * Math.cos(lat * Math.PI / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

export function findNearestCity(lat, lng, maxDistKm = 50) {
  // Try progressively wider bounding boxes
  const distances = [maxDistKm, maxDistKm * 2, maxDistKm * 4];

  for (const dist of distances) {
    const box = boundingBox(lat, lng, dist);
    const candidates = stmts.inBoundingBox.all(box.minLat, box.maxLat, box.minLng, box.maxLng);

    if (candidates.length > 0) {
      let best = null;
      let bestDist = Infinity;

      for (const city of candidates) {
        const d = haversine(lat, lng, city.lat, city.lng);
        if (d < bestDist) {
          bestDist = d;
          best = city;
        }
      }

      if (bestDist <= maxDistKm) {
        return { city: best, distance: bestDist, withinThreshold: true };
      }
      return { city: best, distance: bestDist, withinThreshold: false };
    }
  }

  return { city: null, distance: Infinity, withinThreshold: false };
}
