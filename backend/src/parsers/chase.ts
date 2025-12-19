import { ParserResult } from './types';

export function parseChase(subject: string, body: string): ParserResult {
  const fullText = `${subject}\n${body}`;

  console.log('Chase parser processing email...');
  console.log('Subject:', subject);
  console.log('Body preview (first 500 chars):', body.substring(0, 500));

  // Chase Trip ID pattern
  const tripIdMatch = fullText.match(/Trip\s*ID[:\s#]*(\d+)/i);
  const tripId = tripIdMatch ? tripIdMatch[1] : undefined;

  // Chase airline confirmation pattern - "Airline confirmation: AMLIAI"
  const confirmMatch = fullText.match(/[Aa]irline\s+confirmation[:\s]*([A-Z0-9]{5,8})/);
  const confirmation = confirmMatch ? confirmMatch[1] : undefined;

  // Look for airport codes in parentheses - "Washington (IAD)" or "(KEF)"
  // This is more reliable than trying to match the full route pattern
  const airportCodesInParens = fullText.match(/\(([A-Z]{3})\)/g);
  let origin: string | null = null;
  let destination: string | null = null;

  console.log('Airport codes in parens found:', airportCodesInParens);

  if (airportCodesInParens && airportCodesInParens.length >= 2) {
    // Extract just the codes from "(IAD)" format
    const codes = airportCodesInParens.map(match => match.replace(/[()]/g, ''));
    origin = codes[0];
    destination = codes[1];
    console.log(`Found airport codes: ${origin} -> ${destination}`);
  } else {
    // Fallback: look for common route patterns like "IAD ⇄ KEF" or "IAD to KEF"
    const routeMatch = fullText.match(/([A-Z]{3})\s*(?:⇄|↔|→|->|to|-)\s*([A-Z]{3})/);
    if (routeMatch) {
      origin = routeMatch[1];
      destination = routeMatch[2];
      console.log(`Found airport codes via route pattern: ${origin} -> ${destination}`);
    } else {
      // Last resort: find all standalone 3-letter uppercase codes
      const allCodes = fullText.match(/\b[A-Z]{3}\b/g);
      console.log('All 3-letter codes found:', allCodes);
      // Filter to known airport code patterns (exclude common words)
      const excluded = ['THE', 'AND', 'FOR', 'YOU', 'ARE', 'NOT', 'HAS', 'WAS', 'USD', 'EST', 'PST', 'CST', 'MST', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const filteredCodes = allCodes?.filter(c => !excluded.includes(c)) || [];
      console.log('Filtered codes:', filteredCodes);
      if (filteredCodes.length >= 2) {
        origin = filteredCodes[0];
        destination = filteredCodes[1];
        console.log(`Found airport codes via fallback: ${origin} -> ${destination}`);
      }
    }
  }

  // Detect airline from email content
  let airline = 'Unknown Airline';
  const airlinePatterns = [
    { pattern: /icelandair/i, name: 'Icelandair' },
    { pattern: /united\s+airlines/i, name: 'United Airlines' },
    { pattern: /american\s+airlines/i, name: 'American Airlines' },
    { pattern: /delta\s+air/i, name: 'Delta Air Lines' },
    { pattern: /southwest/i, name: 'Southwest Airlines' },
    { pattern: /jetblue/i, name: 'JetBlue' },
    { pattern: /alaska\s+airlines/i, name: 'Alaska Airlines' },
    { pattern: /spirit\s+airlines/i, name: 'Spirit Airlines' },
    { pattern: /frontier/i, name: 'Frontier Airlines' },
    { pattern: /british\s+airways/i, name: 'British Airways' },
    { pattern: /lufthansa/i, name: 'Lufthansa' },
    { pattern: /air\s+france/i, name: 'Air France' },
    { pattern: /klm/i, name: 'KLM' },
  ];

  for (const ap of airlinePatterns) {
    if (ap.pattern.test(fullText)) {
      airline = ap.name;
      break;
    }
  }

  // Date parsing - look for patterns like "Feb 26, 2026" or "Thu, Feb 26, 2026"
  const monthMap: Record<string, string> = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
  };

  // Match dates like "Feb 26, 2026" or "Thu, Feb 26, 2026"
  const dateRegex = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/gi;
  const dateMatches = fullText.matchAll(dateRegex);

  const dates: string[] = [];
  for (const match of dateMatches) {
    const month = monthMap[match[1].toLowerCase()];
    const day = match[2].padStart(2, '0');
    const year = match[3];
    const dateFormatted = `${year}-${month}-${day}`;
    if (!dates.includes(dateFormatted)) {
      dates.push(dateFormatted);
    }
  }

  // Sort dates chronologically
  dates.sort();
  console.log(`Found dates: ${dates.join(', ')}`);

  // Check for round trip indicators
  const hasRoundTripSymbol = fullText.includes('⇄') || fullText.includes('↔');
  const hasReturn = /\breturn\b/i.test(fullText);
  const isRoundTrip = hasRoundTripSymbol || hasReturn || dates.length >= 2;

  if (origin && destination) {
    return {
      success: true,
      flight: {
        origin,
        destination,
        departureDate: dates[0] || undefined,
        returnDate: isRoundTrip && dates.length >= 2 ? dates[dates.length - 1] : undefined,
        isOneWay: !isRoundTrip,
        airline,
        confirmationNumber: confirmation,
        confidence: 0.9,
      },
      parserUsed: 'chase',
    };
  }

  console.log('Chase parser could not find airport codes, returning failure');
  return {
    success: false,
    error: 'Could not parse Chase Travel email',
    parserUsed: 'chase',
  };
}
