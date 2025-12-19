import { ParserResult } from './types';

// Common patterns for flight confirmations
const AIRPORT_CODE_PATTERN = /\b([A-Z]{3})\b/g;
const DATE_PATTERNS = [
  // MM/DD/YYYY or MM-DD-YYYY
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
  // Month DD, YYYY
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/gi,
  // DD Month YYYY
  /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/gi,
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
];

const MONTH_MAP: Record<string, string> = {
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
  'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
  'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
};

function parseDate(dateStr: string): string | null {
  // Try different date formats

  // MM/DD/YYYY or MM-DD-YYYY
  let match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const [_, month, day, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Month DD, YYYY
  match = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i);
  if (match) {
    const [_, monthName, day, year] = match;
    const month = MONTH_MAP[monthName.toLowerCase().substring(0, 3)];
    return `${year}-${month}-${day.padStart(2, '0')}`;
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
  for (const pattern of ROUTE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const match = regex.exec(text);
    if (match) {
      // Different capture group positions based on pattern
      if (match.length >= 5) {
        // Pattern with city names and codes
        return { origin: match[2], destination: match[4] };
      } else if (match.length >= 3) {
        return { origin: match[1], destination: match[2] };
      }
    }
  }

  // Fallback: find all airport codes and assume first is origin, last is destination
  const codes: string[] = [];
  let match;
  const codeRegex = new RegExp(AIRPORT_CODE_PATTERN.source, AIRPORT_CODE_PATTERN.flags);
  while ((match = codeRegex.exec(text)) !== null) {
    const code = match[1];
    // Filter out common non-airport codes
    if (!['THE', 'AND', 'FOR', 'YOU', 'ARE', 'NOT', 'HAS', 'WAS', 'USD', 'EST', 'PST', 'CST', 'MST'].includes(code)) {
      if (!codes.includes(code)) {
        codes.push(code);
      }
    }
  }

  if (codes.length >= 2) {
    return { origin: codes[0], destination: codes[codes.length - 1] };
  }

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
