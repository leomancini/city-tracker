import { getCityById, getCountryName, getContinent, getAdmin1Name } from './store.js';

const CONTINENT_NAMES = {
  AF: 'Africa',
  AN: 'Antarctica',
  AS: 'Asia',
  EU: 'Europe',
  ME: 'Middle East',
  NA: 'North America',
  OC: 'Oceania',
  SA: 'South America',
  XX: 'Unknown',
};

const MIDDLE_EAST_COUNTRIES = new Set([
  'IL', 'PS', 'JO', 'LB', 'SY', 'IQ', 'IR', 'SA', 'KW',
  'BH', 'QA', 'AE', 'OM', 'YE', 'TR', 'CY', 'EG',
]);

export function enrichCity(userCity) {
  const city = getCityById(userCity.cityId);
  if (!city) return null;
  return {
    ...city,
    addedAt: userCity.addedAt,
    note: userCity.note || '',
    countryName: getCountryName(city.country),
    continent: getContinent(city.country),
    admin1Name: getAdmin1Name(city.country, city.admin1),
  };
}

export function groupCities(userCities) {
  const enriched = userCities
    .map(enrichCity)
    .filter(Boolean);

  const continentMap = {};

  for (const city of enriched) {
    const contCode = MIDDLE_EAST_COUNTRIES.has(city.country) ? 'ME' : city.continent;
    if (!continentMap[contCode]) {
      continentMap[contCode] = { code: contCode, name: CONTINENT_NAMES[contCode] || contCode, countries: {} };
    }

    const countryCode = city.country;
    const cont = continentMap[contCode];
    if (!cont.countries[countryCode]) {
      cont.countries[countryCode] = {
        code: countryCode,
        name: city.countryName,
        states: countryCode === 'US' ? {} : null,
        cities: countryCode === 'US' ? null : [],
      };
    }

    const country = cont.countries[countryCode];
    if (countryCode === 'US') {
      const stateCode = city.admin1;
      if (!country.states[stateCode]) {
        country.states[stateCode] = {
          code: stateCode,
          name: city.admin1Name,
          cities: [],
        };
      }
      country.states[stateCode].cities.push(city);
    } else {
      country.cities.push(city);
    }
  }

  // Convert maps to sorted arrays
  const result = Object.values(continentMap)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(cont => ({
      ...cont,
      countries: Object.values(cont.countries)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(country => {
          if (country.code === 'US') {
            return {
              ...country,
              states: Object.values(country.states)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(state => ({
                  ...state,
                  cities: state.cities.sort((a, b) => a.name.localeCompare(b.name)),
                })),
              cities: undefined,
            };
          }
          return {
            ...country,
            states: undefined,
            cities: country.cities.sort((a, b) => a.name.localeCompare(b.name)),
          };
        }),
    }));

  return { continents: result, totalCities: enriched.length };
}
