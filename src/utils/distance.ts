/**
 * Calculate the distance between two coordinates using the Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Default origin: Washington, DC
 */
export const DEFAULT_ORIGIN = {
  name: 'Washington, DC',
  coordinates: {
    lat: 38.9072,
    lng: -77.0369,
  },
};

/**
 * Calculate total miles traveled from all cities
 * By default assumes round trip (doubles the distance)
 * If isOneWay is true, only counts one-way distance
 */
export function calculateTotalMiles(
  cities: Array<{
    coordinates: { lat: number; lng: number };
    flewFrom?: {
      coordinates: { lat: number; lng: number };
    };
    isOneWay?: boolean;
  }>
): number {
  return cities.reduce((total, city) => {
    const origin = city.flewFrom?.coordinates || DEFAULT_ORIGIN.coordinates;
    const oneWayDistance = calculateDistance(
      origin.lat,
      origin.lng,
      city.coordinates.lat,
      city.coordinates.lng
    );
    // Double for round trip unless marked as one-way
    const tripDistance = city.isOneWay ? oneWayDistance : oneWayDistance * 2;
    return total + tripDistance;
  }, 0);
}
