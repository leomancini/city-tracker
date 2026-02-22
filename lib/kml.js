import { DOMParser } from '@xmldom/xmldom';
import * as toGeoJSON from '@tmcw/togeojson';
import { findNearestCity } from './geo.js';
import { getCitiesArray } from './store.js';

export function parseKml(kmlString) {
  const doc = new DOMParser().parseFromString(kmlString, 'text/xml');
  const geojson = toGeoJSON.kml(doc);

  const cities = getCitiesArray();
  const results = [];

  for (const feature of geojson.features) {
    if (feature.geometry?.type !== 'Point') continue;
    const [lng, lat] = feature.geometry.coordinates;
    const name = feature.properties?.name || 'Unnamed';
    const match = findNearestCity(lat, lng, cities);

    results.push({
      kmlName: name,
      lat,
      lng,
      matchedCity: match.city ? {
        id: match.city.id,
        name: match.city.name,
        country: match.city.country,
        admin1: match.city.admin1,
      } : null,
      distanceKm: Math.round(match.distance * 10) / 10,
      withinThreshold: match.withinThreshold,
    });
  }

  return results;
}
