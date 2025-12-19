import { ParserResult } from './types';
import { isValidAirportCode, findAirportCodes } from './airport-codes';

// Common patterns for flight confirmations
const DATE_PATTERNS = [
  // MM/DD/YYYY or MM-DD-YYYY
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
  // Month DD, YYYY (English)
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/gi,
  // DD Month YYYY (English)
  /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})/gi,
  // Spanish: DD Mes. YYYY (e.g., "23 Ene. 2025")
  /(\d{1,2})\s+(Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)\.?\s+(\d{4})/gi,
  // Spanish: Mes DD, YYYY
  /(Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/gi,
  // YYYY-MM-DD (ISO)
  /(\d{4})-(\d{2})-(\d{2})/g,
];

const ROUTE_PATTERNS = [
  // "From: ABC To: XYZ" or "From ABC to XYZ"
  /from[:\s]+([A-Z]{3})\s+to[:\s]+([A-Z]{3})/gi,
  // "ABC → XYZ" or "ABC -> XYZ" or "ABC - XYZ"
  /([A-Z]{3})\s*(?:→|->|–|-|to)\s*([A-Z]{3})/gi,
  // "Departing: ABC" ... "Arriving: XYZ"
  /depart(?:ing|ure)?[:\s]+([A-Z]{3})[\s\S]*?arriv(?:ing|al)?[:\s]+([A-Z]{3})/gi,
  // City names with airports "Washington (DCA) to Paris (CDG)"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(([A-Z]{3})\)\s*(?:to|→|->|-)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(([A-Z]{3})\)/gi,
];

const CONFIRMATION_PATTERNS = [
  /confirmation[:\s#]+([A-Z0-9]{5,8})/gi,
  /booking\s+(?:code|reference|number)[:\s#]+([A-Z0-9]{5,8})/gi,
  /record\s+locator[:\s#]+([A-Z0-9]{5,8})/gi,
  /PNR[:\s#]+([A-Z0-9]{6})/gi,
  // Spanish patterns
  /c[oó]digo\s+de\s+reserva[:\s#]+([A-Z0-9]{5,8})/gi,
  /reserva[:\s#]+([A-Z0-9]{5,8})/gi,
  /n[uú]mero\s+de\s+confirmaci[oó]n[:\s#]+([A-Z0-9]{5,8})/gi,
];

const MONTH_MAP: Record<string, string> = {
  // English
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
  'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
  'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
  // Spanish
  'ene': '01', 'abr': '04', 'ago': '08', 'dic': '12',
  // Note: feb, mar, may, jun, jul, sep, oct, nov are same in Spanish
};

function parseDate(dateStr: string): string | null {
  // Try different date formats

  // MM/DD/YYYY or MM-DD-YYYY
  let match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const [_, month, day, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Month DD, YYYY (English)
  match = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (match) {
    const [_, monthName, day, year] = match;
    const month = MONTH_MAP[monthName.toLowerCase().substring(0, 3)];
    if (month) return `${year}-${month}-${day.padStart(2, '0')}`;
  }

  // DD Month YYYY (English or Spanish) - e.g., "23 Ene. 2025" or "23 Jan 2025"
  match = dateStr.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Abr|Ago|Dic)[a-z]*\.?\s+(\d{4})/i);
  if (match) {
    const [_, day, monthName, year] = match;
    const month = MONTH_MAP[monthName.toLowerCase().substring(0, 3)];
    if (month) return `${year}-${month}-${day.padStart(2, '0')}`;
  }

  // YYYY-MM-DD
  match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return match[0];
  }

  return null;
}

function extractDates(text: string): string[] {
  const dates: string[] = [];

  for (const pattern of DATE_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const parsed = parseDate(match[0]);
      if (parsed && !dates.includes(parsed)) {
        dates.push(parsed);
      }
    }
  }

  // Sort dates chronologically
  return dates.sort();
}

function extractRoute(text: string): { origin: string; destination: string } | null {
  // First, try route patterns that match valid airport codes
  for (const pattern of ROUTE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const match = regex.exec(text);
    if (match) {
      let origin: string | null = null;
      let destination: string | null = null;

      // Different capture group positions based on pattern
      if (match.length >= 5) {
        // Pattern with city names and codes
        origin = match[2].toUpperCase();
        destination = match[4].toUpperCase();
      } else if (match.length >= 3) {
        origin = match[1].toUpperCase();
        destination = match[2].toUpperCase();
      }

      // Only return if both are valid airport codes
      if (origin && destination && isValidAirportCode(origin) && isValidAirportCode(destination)) {
        console.log(`Found valid route via pattern: ${origin} -> ${destination}`);
        return { origin, destination };
      }
    }
  }

  // Fallback: find all VALID airport codes in the text
  const validCodes = findAirportCodes(text);
  console.log(`Found valid airport codes in text: ${validCodes.join(', ')}`);

  if (validCodes.length >= 2) {
    // First code is origin, second is destination (for round trips, codes often repeat)
    const origin = validCodes[0];
    const destination = validCodes[1];
    console.log(`Using codes: ${origin} -> ${destination}`);
    return { origin, destination };
  }

  console.log('Could not find valid airport codes');
  return null;
}

function extractConfirmation(text: string): string | null {
  for (const pattern of CONFIRMATION_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const match = regex.exec(text);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function isRoundTrip(text: string, dates: string[]): boolean {
  const lowerText = text.toLowerCase();

  // Explicit indicators
  if (lowerText.includes('round trip') || lowerText.includes('roundtrip') || lowerText.includes('round-trip')) {
    return true;
  }
  if (lowerText.includes('one way') || lowerText.includes('oneway') || lowerText.includes('one-way')) {
    return false;
  }

  // If we found 2+ dates, likely round trip
  if (dates.length >= 2) {
    return true;
  }

  // Check for return flight indicators
  if (lowerText.includes('return') || lowerText.includes('returning')) {
    return true;
  }

  return false;
}

export function parseGeneric(subject: string, body: string): ParserResult {
  const fullText = `${subject}\n${body}`;

  // Extract route
  const route = extractRoute(fullText);
  if (!route) {
    return {
      success: false,
      error: 'Could not extract flight route',
      parserUsed: 'generic',
    };
  }

  // Extract dates
  const dates = extractDates(fullText);

  // Determine if round trip
  const roundTrip = isRoundTrip(fullText, dates);

  // Extract confirmation number
  const confirmation = extractConfirmation(fullText);

  // Calculate confidence based on what we found
  let confidence = 0.3; // Base confidence
  if (route.origin && route.destination) confidence += 0.3;
  if (dates.length > 0) confidence += 0.2;
  if (confirmation) confidence += 0.1;

  return {
    success: true,
    flight: {
      origin: route.origin,
      destination: route.destination,
      departureDate: dates[0] || undefined,
      returnDate: roundTrip && dates[1] ? dates[1] : undefined,
      isOneWay: !roundTrip,
      confirmationNumber: confirmation || undefined,
      confidence,
    },
    parserUsed: 'generic',
  };
}
