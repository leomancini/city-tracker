const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function searchCities(q) {
  return request(`/cities/search?q=${encodeURIComponent(q)}&limit=10`);
}

export function listUsers() {
  return request('/users');
}

export function createUser(username) {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export function getUserCities(username) {
  return request(`/users/${encodeURIComponent(username)}/cities`);
}

export function addCity(username, cityId) {
  return request(`/users/${encodeURIComponent(username)}/cities`, {
    method: 'POST',
    body: JSON.stringify({ cityId }),
  });
}

export function removeCity(username, cityId) {
  return request(`/users/${encodeURIComponent(username)}/cities/${cityId}`, {
    method: 'DELETE',
  });
}

export async function uploadKml(username, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/users/${encodeURIComponent(username)}/import/kml`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export function confirmImport(username, cityIds) {
  return request(`/users/${encodeURIComponent(username)}/import/confirm`, {
    method: 'POST',
    body: JSON.stringify({ cityIds }),
  });
}
