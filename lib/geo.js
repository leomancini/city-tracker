const R = 6371; // Earth radius in km

export function haversine(lat1, lng1, lat2, lng2) {
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestCity(lat, lng, cities, maxDistKm = 50) {
  let best = null;
  let bestDist = Infinity;

  for (const city of cities) {
    const dist = haversine(lat, lng, city.lat, city.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }

  if (bestDist > maxDistKm) return { city: best, distance: bestDist, withinThreshold: false };
  return { city: best, distance: bestDist, withinThreshold: true };
}
