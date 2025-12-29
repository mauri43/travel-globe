import { getIdToken } from './firebase';
import type { City } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getIdToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Cities API
export async function getCities(): Promise<City[]> {
  const data = await fetchWithAuth('/api/cities');
  // Transform backend format to frontend format
  return data.map((city: any) => ({
    id: city.id,
    name: city.name,
    country: city.country,
    coordinates: { lat: city.lat, lng: city.lng },
    flewFrom: city.flewFromName ? {
      name: city.flewFromName,
      coordinates: { lat: city.flewFromLat, lng: city.flewFromLng },
    } : undefined,
    isOneWay: city.isOneWay,
    tripName: city.tripName,
    dates: city.dates,
    photos: city.photos,
    videos: city.videos,
    memories: city.memories,
    tags: city.tags,
    status: city.status,
    missingFields: city.missingFields,
  }));
}

export async function createCity(city: Omit<City, 'id'>): Promise<City> {
  const backendCity = {
    name: city.name,
    country: city.country,
    lat: city.coordinates.lat,
    lng: city.coordinates.lng,
    flewFromName: city.flewFrom?.name,
    flewFromLat: city.flewFrom?.coordinates.lat,
    flewFromLng: city.flewFrom?.coordinates.lng,
    isOneWay: city.isOneWay,
    tripName: city.tripName,
    dates: city.dates,
    photos: city.photos,
    videos: city.videos,
    memories: city.memories,
    tags: city.tags,
  };

  const data = await fetchWithAuth('/api/cities', {
    method: 'POST',
    body: JSON.stringify(backendCity),
  });

  return {
    id: data.id,
    name: data.name,
    country: data.country,
    coordinates: { lat: data.lat, lng: data.lng },
    flewFrom: data.flewFromName ? {
      name: data.flewFromName,
      coordinates: { lat: data.flewFromLat, lng: data.flewFromLng },
    } : undefined,
    isOneWay: data.isOneWay,
    tripName: data.tripName,
    dates: data.dates,
    photos: data.photos,
    videos: data.videos,
    memories: data.memories,
    tags: data.tags,
  };
}

export async function updateCity(id: string, updates: Partial<City>): Promise<City> {
  const backendUpdates: Record<string, any> = {};

  if (updates.name !== undefined) backendUpdates.name = updates.name;
  if (updates.country !== undefined) backendUpdates.country = updates.country;
  if (updates.coordinates !== undefined) {
    backendUpdates.lat = updates.coordinates.lat;
    backendUpdates.lng = updates.coordinates.lng;
  }
  if (updates.flewFrom !== undefined) {
    backendUpdates.flewFromName = updates.flewFrom?.name;
    backendUpdates.flewFromLat = updates.flewFrom?.coordinates.lat;
    backendUpdates.flewFromLng = updates.flewFrom?.coordinates.lng;
  }
  if (updates.isOneWay !== undefined) backendUpdates.isOneWay = updates.isOneWay;
  if (updates.tripName !== undefined) backendUpdates.tripName = updates.tripName;
  if (updates.dates !== undefined) backendUpdates.dates = updates.dates;
  if (updates.photos !== undefined) backendUpdates.photos = updates.photos;
  if (updates.videos !== undefined) backendUpdates.videos = updates.videos;
  if (updates.memories !== undefined) backendUpdates.memories = updates.memories;
  if (updates.tags !== undefined) backendUpdates.tags = updates.tags;

  const data = await fetchWithAuth(`/api/cities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(backendUpdates),
  });

  return {
    id: data.id,
    name: data.name,
    country: data.country,
    coordinates: { lat: data.lat, lng: data.lng },
    flewFrom: data.flewFromName ? {
      name: data.flewFromName,
      coordinates: { lat: data.flewFromLat, lng: data.flewFromLng },
    } : undefined,
    isOneWay: data.isOneWay,
    tripName: data.tripName,
    dates: data.dates,
    photos: data.photos,
    videos: data.videos,
    memories: data.memories,
    tags: data.tags,
  };
}

export async function deleteCity(id: string): Promise<void> {
  await fetchWithAuth(`/api/cities/${id}`, {
    method: 'DELETE',
  });
}

// User API
export async function getUserProfile() {
  return fetchWithAuth('/api/auth/me');
}

export async function updateTrustedEmails(emails: string[]) {
  return fetchWithAuth('/api/auth/trusted-emails', {
    method: 'PUT',
    body: JSON.stringify({ trustedEmails: emails }),
  });
}

export async function deleteAccount() {
  return fetchWithAuth('/api/auth/account', {
    method: 'DELETE',
  });
}

export async function updateTourCompleted(completed: boolean) {
  return fetchWithAuth('/api/auth/tour-completed', {
    method: 'PUT',
    body: JSON.stringify({ tourCompleted: completed }),
  });
}

export async function updateDefaultFromCity(city: { name: string; lat: number; lng: number }) {
  return fetchWithAuth('/api/auth/default-from-city', {
    method: 'PUT',
    body: JSON.stringify({ defaultFromCity: city }),
  });
}

// Delete all cities for the user
export async function deleteAllCities(): Promise<void> {
  await fetchWithAuth('/api/cities', {
    method: 'DELETE',
  });
}

// Bulk create cities (for CSV import)
export async function bulkCreateCities(cities: Omit<City, 'id'>[]): Promise<City[]> {
  const backendCities = cities.map(city => ({
    name: city.name,
    country: city.country,
    lat: city.coordinates.lat,
    lng: city.coordinates.lng,
    flewFromName: city.flewFrom?.name,
    flewFromLat: city.flewFrom?.coordinates.lat,
    flewFromLng: city.flewFrom?.coordinates.lng,
    isOneWay: city.isOneWay,
    tripName: city.tripName,
    dates: city.dates,
    photos: city.photos || [],
    videos: city.videos || [],
    memories: city.memories || '',
    tags: city.tags || [],
  }));

  const data = await fetchWithAuth('/api/cities/bulk', {
    method: 'POST',
    body: JSON.stringify({ cities: backendCities }),
  });

  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    country: item.country,
    coordinates: { lat: item.lat, lng: item.lng },
    flewFrom: item.flewFromName ? {
      name: item.flewFromName,
      coordinates: { lat: item.flewFromLat, lng: item.flewFromLng },
    } : undefined,
    isOneWay: item.isOneWay,
    tripName: item.tripName,
    dates: item.dates,
    photos: item.photos,
    videos: item.videos,
    memories: item.memories,
    tags: item.tags,
  }));
}
