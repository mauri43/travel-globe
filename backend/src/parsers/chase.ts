import { ParserResult } from './types';
import { parseGeneric } from './generic';

export function parseChase(subject: string, body: string): ParserResult {
  const fullText = `${subject}\n${body}`;

  // Chase Trip ID pattern
  const tripIdMatch = fullText.match(/Trip\s*ID[:\s]*(\d+)/i);
  const tripId = tripIdMatch ? tripIdMatch[1] : undefined;

  // Chase airline confirmation pattern
  const confirmMatch = fullText.match(/(?:Airline\s+)?[Cc]onfirmation[:\s]*([A-Z0-9]{5,8})/i);
  const confirmation = confirmMatch ? confirmMatch[1] : undefined;

  // Chase route pattern - "Washington (IAD) ⇄ Reykjavik (KEF)" or "City (CODE) → City (CODE)"
  const routeMatch = fullText.match(
    /([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)\s*\(([A-Z]{3})\)\s*(?:⇄|↔|→|to|-)\s*([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)\s*\(([A-Z]{3})\)/i
  );

  // Detect airline from email content
  let airline = 'Unknown Airline';
  const airlinePatterns = [
    { pattern: /icelandair/i, name: 'Icelandair' },
    { pattern: /united/i, name: 'United Airlines' },
    { pattern: /american airlines/i, name: 'American Airlines' },
    { pattern: /delta/i, name: 'Delta Air Lines' },
    { pattern: /southwest/i, name: 'Southwest Airlines' },
    { pattern: /jetblue/i, name: 'JetBlue' },
    { pattern: /alaska airlines/i, name: 'Alaska Airlines' },
    { pattern: /spirit/i, name: 'Spirit Airlines' },
    { pattern: /frontier/i, name: 'Frontier Airlines' },
    { pattern: /british airways/i, name: 'British Airways' },
    { pattern: /lufthansa/i, name: 'Lufthansa' },
    { pattern: /air france/i, name: 'Air France' },
    { pattern: /klm/i, name: 'KLM' },
  ];

  for (const ap of airlinePatterns) {
    if (ap.pattern.test(fullText)) {
      airline = ap.name;
      break;
    }
  }

  // Date patterns for Chase
  // Format 1: "Thu, Feb 26, 2026 - Mon, Mar 02, 2026"
  // Format 2: "Depart : Thu, Feb 26, 2026"
  // Format 3: "Return : Mon, Mar 02, 2026"
  const monthMap: Record<string, string> = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
  };

  const dateMatches = fullText.match(
    /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/gi
  );

  const dates: string[] = [];
  if (dateMatches) {
    for (const dateStr of dateMatches) {
      const match = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i);
      if (match) {
        const month = monthMap[match[1].toLowerCase()];
        const day = match[2].padStart(2, '0');
        const year = match[3];
        const dateFormatted = `${year}-${month}-${day}`;
        if (!dates.includes(dateFormatted)) {
          dates.push(dateFormatted);
        }
      }
    }
  }

  // Sort dates to get departure first
  dates.sort();

  // Check for round trip indicators
  const hasRoundTripSymbol = /⇄|↔/.test(fullText);
  const hasReturn = /return/i.test(fullText);
  const isRoundTrip = hasRoundTripSymbol || hasReturn || dates.length >= 2;

  if (routeMatch) {
    const origin = routeMatch[2]; // Airport code
    const destination = routeMatch[4]; // Airport code

    return {
      success: true,
      flight: {
        origin,
        destination,
        departureDate: dates[0],
        returnDate: isRoundTrip && dates.length >= 2 ? dates[dates.length - 1] : undefined,
        isOneWay: !isRoundTrip,
        airline,
        confirmationNumber: confirmation,
        confidence: 0.9,
      },
      parserUsed: 'chase',
    };
  }

  // Try to find airport codes directly if route pattern didn't match
  const airportCodes = fullText.match(/\b([A-Z]{3})\b/g);
  if (airportCodes && airportCodes.length >= 2) {
    // Filter out common non-airport 3-letter words
    const nonAirportCodes = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'FRI', 'SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'USD', 'EUR', 'GBP'];
    const validCodes = airportCodes.filter(code => !nonAirportCodes.includes(code));

    if (validCodes.length >= 2) {
      return {
        success: true,
        flight: {
          origin: validCodes[0],
          destination: validCodes[1],
          departureDate: dates[0],
          returnDate: isRoundTrip && dates.length >= 2 ? dates[dates.length - 1] : undefined,
          isOneWay: !isRoundTrip,
          airline,
          confirmationNumber: confirmation,
          confidence: 0.75,
        },
        parserUsed: 'chase-fallback',
      };
    }
  }

  // Fall back to generic parser
  const genericResult = parseGeneric(subject, body);
  if (genericResult.success && genericResult.flight) {
    genericResult.flight.airline = airline !== 'Unknown Airline' ? airline : genericResult.flight.airline;
    genericResult.flight.confirmationNumber = confirmation || genericResult.flight.confirmationNumber;
    genericResult.parserUsed = 'chase-generic';
  }

  return genericResult;
}
