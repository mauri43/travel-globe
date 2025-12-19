// Airport codes to city names mapping (common ones)
const AIRPORT_CODES: Record<string, { city: string; country: string; lat: number; lng: number }> = {
  // US Major
  'DCA': { city: 'Washington, DC', country: 'United States', lat: 38.9072, lng: -77.0369 },
  'IAD': { city: 'Washington, DC', country: 'United States', lat: 38.9072, lng: -77.0369 },
  'BWI': { city: 'Baltimore', country: 'United States', lat: 39.2904, lng: -76.6122 },
  'JFK': { city: 'New York City', country: 'United States', lat: 40.7128, lng: -74.0060 },
  'LGA': { city: 'New York City', country: 'United States', lat: 40.7128, lng: -74.0060 },
  'EWR': { city: 'Newark', country: 'United States', lat: 40.7357, lng: -74.1724 },
  'LAX': { city: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437 },
  'SFO': { city: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194 },
  'ORD': { city: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
  'MDW': { city: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
  'ATL': { city: 'Atlanta', country: 'United States', lat: 33.7490, lng: -84.3880 },
  'DFW': { city: 'Dallas', country: 'United States', lat: 32.7767, lng: -96.7970 },
  'DEN': { city: 'Denver', country: 'United States', lat: 39.7392, lng: -104.9903 },
  'SEA': { city: 'Seattle', country: 'United States', lat: 47.6062, lng: -122.3321 },
  'MIA': { city: 'Miami', country: 'United States', lat: 25.7617, lng: -80.1918 },
  'BOS': { city: 'Boston', country: 'United States', lat: 42.3601, lng: -71.0589 },
  'PHX': { city: 'Phoenix', country: 'United States', lat: 33.4484, lng: -112.0740 },
  'LAS': { city: 'Las Vegas', country: 'United States', lat: 36.1699, lng: -115.1398 },
  'MCO': { city: 'Orlando', country: 'United States', lat: 28.5383, lng: -81.3792 },
  'MSP': { city: 'Minneapolis', country: 'United States', lat: 44.9778, lng: -93.2650 },
  'DTW': { city: 'Detroit', country: 'United States', lat: 42.3314, lng: -83.0458 },
  'PHL': { city: 'Philadelphia', country: 'United States', lat: 39.9526, lng: -75.1652 },
  'SAN': { city: 'San Diego', country: 'United States', lat: 32.7157, lng: -117.1611 },
  'HNL': { city: 'Honolulu', country: 'United States', lat: 21.3069, lng: -157.8583 },
  'AUS': { city: 'Austin', country: 'United States', lat: 30.2672, lng: -97.7431 },
  'IAH': { city: 'Houston', country: 'United States', lat: 29.7604, lng: -95.3698 },

  // Europe
  'LHR': { city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  'LGW': { city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  'CDG': { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  'ORY': { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  'AMS': { city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  'FRA': { city: 'Frankfurt', country: 'Germany', lat: 50.1109, lng: 8.6821 },
  'MUC': { city: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.5820 },
  'FCO': { city: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
  'BCN': { city: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734 },
  'MAD': { city: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  'DUB': { city: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603 },
  'CPH': { city: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683 },
  'ARN': { city: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
  'OSL': { city: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522 },
  'HEL': { city: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384 },
  'ZRH': { city: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
  'VIE': { city: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },
  'PRG': { city: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378 },
  'LIS': { city: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393 },
  'ATH': { city: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275 },
  'IST': { city: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
  'KEF': { city: 'Reykjavik', country: 'Iceland', lat: 64.1466, lng: -21.9426 },

  // Asia
  'NRT': { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  'HND': { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  'ICN': { city: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780 },
  'PEK': { city: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
  'PVG': { city: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
  'HKG': { city: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694 },
  'SIN': { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  'BKK': { city: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  'DEL': { city: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.2090 },
  'DXB': { city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  'SYD': { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  'MEL': { city: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
  'AKL': { city: 'Auckland', country: 'New Zealand', lat: -36.8509, lng: 174.7645 },

  // Americas
  'YYZ': { city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  'YVR': { city: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207 },
  'MEX': { city: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332 },
  'CUN': { city: 'Cancun', country: 'Mexico', lat: 21.1619, lng: -86.8515 },
  'GRU': { city: 'Sao Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
  'EZE': { city: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
  'LIM': { city: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428 },
  'BOG': { city: 'Bogota', country: 'Colombia', lat: 4.7110, lng: -74.0721 },
  'SCL': { city: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693 },
  'SJU': { city: 'San Juan', country: 'Puerto Rico', lat: 18.4655, lng: -66.1057 },
};

export interface GeocodedLocation {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// Try to geocode from airport code first
export function geocodeAirportCode(code: string): GeocodedLocation | null {
  const upperCode = code.toUpperCase().trim();
  const location = AIRPORT_CODES[upperCode];

  if (location) {
    return {
      city: location.city,
      country: location.country,
      lat: location.lat,
      lng: location.lng,
    };
  }

  return null;
}

// Geocode using Google Places API
export async function geocodeCity(cityName: string): Promise<GeocodedLocation | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.error('Google Places API key not configured');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityName)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json() as {
      status: string;
      results: Array<{
        geometry: { location: { lat: number; lng: number } };
        address_components: Array<{ long_name: string; types: string[] }>;
      }>;
    };

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const { lat, lng } = result.geometry.location;

      // Extract city and country from address components
      let city = cityName;
      let country = '';

      for (const component of result.address_components) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
      }

      return { city, country, lat, lng };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Main geocoding function - tries airport code first, then full geocoding
export async function geocode(location: string): Promise<GeocodedLocation | null> {
  // Try as airport code first (3 letters)
  if (location.length === 3) {
    const airportResult = geocodeAirportCode(location);
    if (airportResult) return airportResult;
  }

  // Extract airport code if in format "City (ABC)" or "ABC - City"
  const codeMatch = location.match(/\(([A-Z]{3})\)|^([A-Z]{3})\s*[-–]/i);
  if (codeMatch) {
    const code = codeMatch[1] || codeMatch[2];
    const airportResult = geocodeAirportCode(code);
    if (airportResult) return airportResult;
  }

  // Fall back to Google geocoding
  return geocodeCity(location);
}
