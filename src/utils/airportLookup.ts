// Airport data lookup utility
// Uses embedded common airports + fallback to API

interface AirportInfo {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// Common airports embedded for fast lookup (covers ~90% of cases)
const COMMON_AIRPORTS: Record<string, AirportInfo> = {
  // United States
  ATL: { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta', country: 'United States', lat: 33.6407, lng: -84.4277 },
  LAX: { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', lat: 33.9425, lng: -118.4081 },
  ORD: { code: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'United States', lat: 41.9742, lng: -87.9073 },
  DFW: { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'United States', lat: 32.8998, lng: -97.0403 },
  DEN: { code: 'DEN', name: 'Denver International', city: 'Denver', country: 'United States', lat: 39.8561, lng: -104.6737 },
  JFK: { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', lat: 40.6413, lng: -73.7781 },
  SFO: { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States', lat: 37.6213, lng: -122.379 },
  SEA: { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'United States', lat: 47.4502, lng: -122.3088 },
  LAS: { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', country: 'United States', lat: 36.086, lng: -115.1537 },
  MCO: { code: 'MCO', name: 'Orlando International', city: 'Orlando', country: 'United States', lat: 28.4312, lng: -81.3081 },
  EWR: { code: 'EWR', name: 'Newark Liberty International', city: 'Newark', country: 'United States', lat: 40.6895, lng: -74.1745 },
  MIA: { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'United States', lat: 25.7959, lng: -80.287 },
  PHX: { code: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', country: 'United States', lat: 33.4373, lng: -112.0078 },
  IAH: { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'United States', lat: 29.9902, lng: -95.3368 },
  BOS: { code: 'BOS', name: 'Boston Logan International', city: 'Boston', country: 'United States', lat: 42.3656, lng: -71.0096 },
  MSP: { code: 'MSP', name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', country: 'United States', lat: 44.8848, lng: -93.2223 },
  DTW: { code: 'DTW', name: 'Detroit Metropolitan', city: 'Detroit', country: 'United States', lat: 42.2162, lng: -83.3554 },
  FLL: { code: 'FLL', name: 'Fort Lauderdale-Hollywood', city: 'Fort Lauderdale', country: 'United States', lat: 26.0742, lng: -80.1506 },
  PHL: { code: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', country: 'United States', lat: 39.8744, lng: -75.2424 },
  LGA: { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', lat: 40.7769, lng: -73.874 },
  BWI: { code: 'BWI', name: 'Baltimore/Washington International', city: 'Baltimore', country: 'United States', lat: 39.1774, lng: -76.6684 },
  SLC: { code: 'SLC', name: 'Salt Lake City International', city: 'Salt Lake City', country: 'United States', lat: 40.7899, lng: -111.9791 },
  DCA: { code: 'DCA', name: 'Ronald Reagan Washington National', city: 'Washington', country: 'United States', lat: 38.8512, lng: -77.0402 },
  IAD: { code: 'IAD', name: 'Washington Dulles International', city: 'Washington', country: 'United States', lat: 38.9531, lng: -77.4565 },
  SAN: { code: 'SAN', name: 'San Diego International', city: 'San Diego', country: 'United States', lat: 32.7338, lng: -117.1933 },
  TPA: { code: 'TPA', name: 'Tampa International', city: 'Tampa', country: 'United States', lat: 27.9756, lng: -82.5333 },
  PDX: { code: 'PDX', name: 'Portland International', city: 'Portland', country: 'United States', lat: 45.5898, lng: -122.5951 },
  HNL: { code: 'HNL', name: 'Daniel K. Inouye International', city: 'Honolulu', country: 'United States', lat: 21.3187, lng: -157.9225 },
  BNA: { code: 'BNA', name: 'Nashville International', city: 'Nashville', country: 'United States', lat: 36.1263, lng: -86.6774 },
  AUS: { code: 'AUS', name: 'Austin-Bergstrom International', city: 'Austin', country: 'United States', lat: 30.1975, lng: -97.6664 },
  STL: { code: 'STL', name: 'St. Louis Lambert International', city: 'St. Louis', country: 'United States', lat: 38.7487, lng: -90.37 },
  RDU: { code: 'RDU', name: 'Raleigh-Durham International', city: 'Raleigh', country: 'United States', lat: 35.8801, lng: -78.7875 },
  SJC: { code: 'SJC', name: 'San Jose International', city: 'San Jose', country: 'United States', lat: 37.3626, lng: -121.9291 },
  OAK: { code: 'OAK', name: 'Oakland International', city: 'Oakland', country: 'United States', lat: 37.7213, lng: -122.2208 },
  MSY: { code: 'MSY', name: 'Louis Armstrong New Orleans', city: 'New Orleans', country: 'United States', lat: 29.9934, lng: -90.258 },
  CLE: { code: 'CLE', name: 'Cleveland Hopkins International', city: 'Cleveland', country: 'United States', lat: 41.4117, lng: -81.8498 },
  SMF: { code: 'SMF', name: 'Sacramento International', city: 'Sacramento', country: 'United States', lat: 38.6954, lng: -121.5908 },
  PIT: { code: 'PIT', name: 'Pittsburgh International', city: 'Pittsburgh', country: 'United States', lat: 40.4915, lng: -80.2329 },
  IND: { code: 'IND', name: 'Indianapolis International', city: 'Indianapolis', country: 'United States', lat: 39.7173, lng: -86.2944 },
  CMH: { code: 'CMH', name: 'John Glenn Columbus International', city: 'Columbus', country: 'United States', lat: 39.998, lng: -82.8919 },
  MCI: { code: 'MCI', name: 'Kansas City International', city: 'Kansas City', country: 'United States', lat: 39.2976, lng: -94.7139 },
  SAT: { code: 'SAT', name: 'San Antonio International', city: 'San Antonio', country: 'United States', lat: 29.5337, lng: -98.4698 },
  RSW: { code: 'RSW', name: 'Southwest Florida International', city: 'Fort Myers', country: 'United States', lat: 26.5362, lng: -81.7552 },
  SNA: { code: 'SNA', name: 'John Wayne Airport', city: 'Santa Ana', country: 'United States', lat: 33.6762, lng: -117.8674 },
  DAL: { code: 'DAL', name: 'Dallas Love Field', city: 'Dallas', country: 'United States', lat: 32.8471, lng: -96.8518 },
  HOU: { code: 'HOU', name: 'William P. Hobby Airport', city: 'Houston', country: 'United States', lat: 29.6454, lng: -95.2789 },
  MDW: { code: 'MDW', name: 'Chicago Midway', city: 'Chicago', country: 'United States', lat: 41.786, lng: -87.7524 },
  BUR: { code: 'BUR', name: 'Hollywood Burbank Airport', city: 'Burbank', country: 'United States', lat: 34.1975, lng: -118.3585 },
  ANC: { code: 'ANC', name: 'Ted Stevens Anchorage', city: 'Anchorage', country: 'United States', lat: 61.1743, lng: -149.9962 },
  OGG: { code: 'OGG', name: 'Kahului Airport', city: 'Maui', country: 'United States', lat: 20.8986, lng: -156.4305 },
  JAX: { code: 'JAX', name: 'Jacksonville International', city: 'Jacksonville', country: 'United States', lat: 30.4941, lng: -81.6879 },
  ABQ: { code: 'ABQ', name: 'Albuquerque International', city: 'Albuquerque', country: 'United States', lat: 35.0402, lng: -106.6094 },

  // Europe
  LHR: { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'United Kingdom', lat: 51.47, lng: -0.4543 },
  CDG: { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479 },
  AMS: { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lng: 4.7683 },
  FRA: { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622 },
  MAD: { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain', lat: 40.4983, lng: -3.5676 },
  BCN: { code: 'BCN', name: 'Barcelona-El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lng: 2.0833 },
  FCO: { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino', city: 'Rome', country: 'Italy', lat: 41.8003, lng: 12.2389 },
  MUC: { code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3537, lng: 11.775 },
  LGW: { code: 'LGW', name: 'London Gatwick', city: 'London', country: 'United Kingdom', lat: 51.1537, lng: -0.1821 },
  ORY: { code: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France', lat: 48.7262, lng: 2.3652 },
  ZRH: { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4582, lng: 8.5555 },
  VIE: { code: 'VIE', name: 'Vienna International', city: 'Vienna', country: 'Austria', lat: 48.1103, lng: 16.5697 },
  CPH: { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', lat: 55.6180, lng: 12.6508 },
  DUB: { code: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', lat: 53.4264, lng: -6.2499 },
  LIS: { code: 'LIS', name: 'Lisbon Portela', city: 'Lisbon', country: 'Portugal', lat: 38.7756, lng: -9.1354 },
  ARN: { code: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden', lat: 59.6498, lng: 17.9238 },
  OSL: { code: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway', lat: 60.1976, lng: 11.1004 },
  HEL: { code: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'Finland', lat: 60.3172, lng: 24.9633 },
  BRU: { code: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', lat: 50.9014, lng: 4.4844 },
  ATH: { code: 'ATH', name: 'Athens International', city: 'Athens', country: 'Greece', lat: 37.9364, lng: 23.9445 },
  PRG: { code: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic', lat: 50.1008, lng: 14.26 },
  WAW: { code: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', country: 'Poland', lat: 52.1657, lng: 20.9671 },
  IST: { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lng: 28.7519 },
  MXP: { code: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy', lat: 45.63, lng: 8.7231 },
  EDI: { code: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom', lat: 55.95, lng: -3.3725 },
  MAN: { code: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom', lat: 53.3537, lng: -2.275 },

  // Asia
  NRT: { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan', lat: 35.7653, lng: 140.3864 },
  HND: { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', lat: 35.5494, lng: 139.7798 },
  PEK: { code: 'PEK', name: 'Beijing Capital', city: 'Beijing', country: 'China', lat: 40.0799, lng: 116.6031 },
  PVG: { code: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai', country: 'China', lat: 31.1443, lng: 121.8083 },
  HKG: { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong', lat: 22.308, lng: 113.9185 },
  ICN: { code: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea', lat: 37.4602, lng: 126.4407 },
  SIN: { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915 },
  BKK: { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lng: 100.7501 },
  KUL: { code: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lng: 101.7072 },
  DEL: { code: 'DEL', name: 'Indira Gandhi International', city: 'New Delhi', country: 'India', lat: 28.5562, lng: 77.1 },
  BOM: { code: 'BOM', name: 'Chhatrapati Shivaji', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656 },
  DXB: { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lng: 55.3657 },
  DOH: { code: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6081 },
  AUH: { code: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.433, lng: 54.6511 },
  TPE: { code: 'TPE', name: 'Taiwan Taoyuan', city: 'Taipei', country: 'Taiwan', lat: 25.0797, lng: 121.2342 },
  MNL: { code: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines', lat: 14.5086, lng: 121.0198 },
  CGK: { code: 'CGK', name: 'Soekarno-Hatta International', city: 'Jakarta', country: 'Indonesia', lat: -6.1256, lng: 106.6558 },
  KIX: { code: 'KIX', name: 'Kansai International', city: 'Osaka', country: 'Japan', lat: 34.4347, lng: 135.244 },

  // Oceania
  SYD: { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', lat: -33.9399, lng: 151.1753 },
  MEL: { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.6690, lng: 144.8410 },
  BNE: { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', lat: -27.3842, lng: 153.1175 },
  PER: { code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', lat: -31.9403, lng: 115.9668 },
  AKL: { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', lat: -37.0082, lng: 174.7850 },

  // Americas (non-US)
  YYZ: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada', lat: 43.6777, lng: -79.6248 },
  YVR: { code: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada', lat: 49.1947, lng: -123.1792 },
  YUL: { code: 'YUL', name: 'Montréal-Trudeau', city: 'Montreal', country: 'Canada', lat: 45.4706, lng: -73.7408 },
  YYC: { code: 'YYC', name: 'Calgary International', city: 'Calgary', country: 'Canada', lat: 51.1215, lng: -114.0076 },
  MEX: { code: 'MEX', name: 'Mexico City International', city: 'Mexico City', country: 'Mexico', lat: 19.4363, lng: -99.0721 },
  CUN: { code: 'CUN', name: 'Cancún International', city: 'Cancún', country: 'Mexico', lat: 21.0365, lng: -86.8771 },
  GRU: { code: 'GRU', name: 'São Paulo-Guarulhos', city: 'São Paulo', country: 'Brazil', lat: -23.4356, lng: -46.4731 },
  GIG: { code: 'GIG', name: 'Rio de Janeiro-Galeão', city: 'Rio de Janeiro', country: 'Brazil', lat: -22.8099, lng: -43.2506 },
  EZE: { code: 'EZE', name: 'Ministro Pistarini', city: 'Buenos Aires', country: 'Argentina', lat: -34.8222, lng: -58.5358 },
  SCL: { code: 'SCL', name: 'Santiago International', city: 'Santiago', country: 'Chile', lat: -33.393, lng: -70.7858 },
  BOG: { code: 'BOG', name: 'El Dorado International', city: 'Bogotá', country: 'Colombia', lat: 4.7016, lng: -74.1469 },
  LIM: { code: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'Peru', lat: -12.0219, lng: -77.1143 },
  PTY: { code: 'PTY', name: 'Tocumen International', city: 'Panama City', country: 'Panama', lat: 9.0714, lng: -79.3835 },
  SJO: { code: 'SJO', name: 'Juan Santamaría International', city: 'San José', country: 'Costa Rica', lat: 9.9939, lng: -84.2088 },

  // Africa & Middle East
  JNB: { code: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa', lat: -26.1392, lng: 28.246 },
  CPT: { code: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa', lat: -33.9715, lng: 18.6021 },
  CAI: { code: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'Egypt', lat: 30.1219, lng: 31.4056 },
  CMN: { code: 'CMN', name: 'Mohammed V International', city: 'Casablanca', country: 'Morocco', lat: 33.3675, lng: -7.5898 },
  NBO: { code: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', lat: -1.3192, lng: 36.9278 },
  ADD: { code: 'ADD', name: 'Addis Ababa Bole', city: 'Addis Ababa', country: 'Ethiopia', lat: 8.9779, lng: 38.7993 },
  TLV: { code: 'TLV', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel', lat: 32.0055, lng: 34.8854 },
  AMM: { code: 'AMM', name: 'Queen Alia International', city: 'Amman', country: 'Jordan', lat: 31.7226, lng: 35.9932 },
  RUH: { code: 'RUH', name: 'King Khalid International', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.9576, lng: 46.6988 },
  JED: { code: 'JED', name: 'King Abdulaziz International', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.6796, lng: 39.1565 },
};

// Cache for API lookups
const apiCache: Record<string, AirportInfo> = {};

export async function lookupAirport(code: string): Promise<AirportInfo | null> {
  const normalizedCode = code.toUpperCase().trim();

  // Check embedded data first
  if (COMMON_AIRPORTS[normalizedCode]) {
    return COMMON_AIRPORTS[normalizedCode];
  }

  // Check API cache
  if (apiCache[normalizedCode]) {
    return apiCache[normalizedCode];
  }

  // Try API lookup (using a free airport API)
  try {
    const response = await fetch(
      `https://airport-data.com/api/ap_info.json?iata=${normalizedCode}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.error || !data.latitude || !data.longitude) {
      return null;
    }

    const airportInfo: AirportInfo = {
      code: normalizedCode,
      name: data.name || normalizedCode,
      city: data.location?.split(',')[0]?.trim() || data.name || normalizedCode,
      country: data.country || 'Unknown',
      lat: parseFloat(data.latitude),
      lng: parseFloat(data.longitude),
    };

    // Cache for future use
    apiCache[normalizedCode] = airportInfo;

    return airportInfo;
  } catch (error) {
    console.error(`Failed to lookup airport ${normalizedCode}:`, error);
    return null;
  }
}

export function isValidAirportCode(code: string): boolean {
  return /^[A-Z]{3}$/i.test(code.trim());
}
