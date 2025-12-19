import { ParserResult } from './types';
import { isValidAirportCode, findAirportCodes } from './airport-codes';

export function parseRyanair(subject: string, body: string): ParserResult {
  const fullText = `${subject}\n${body}`;

  console.log('Ryanair parser processing email...');

  // Ryanair confirmation/reservation code - usually 6 alphanumeric chars
  const confirmMatch = fullText.match(/(?:Reservation|Booking|Confirmation)[:\s]*([A-Z0-9]{6})/i)
    || fullText.match(/\b([A-Z0-9]{6})\b/); // Fallback to find standalone 6-char codes
  const confirmation = confirmMatch ? confirmMatch[1] : undefined;

  // Look for airport codes in parentheses - "(FCO)" or "(BCN)"
  const airportCodesInParens = fullText.match(/\(([A-Z]{3})\)/g);
  let origin: string | null = null;
  let destination: string | null = null;

  console.log('Airport codes in parens found:', airportCodesInParens);

  if (airportCodesInParens && airportCodesInParens.length >= 2) {
    // Extract codes and validate them
    const codes = airportCodesInParens
      .map(match => match.replace(/[()]/g, ''))
      .filter(code => isValidAirportCode(code));

    console.log('Valid codes extracted:', codes);

    if (codes.length >= 2) {
      origin = codes[0];
      destination = codes[1];
      console.log(`Found valid airport codes: ${origin} -> ${destination}`);
    }
  }

  // Fallback: find all valid airport codes in text
  if (!origin || !destination) {
    const validCodes = findAirportCodes(fullText);
    console.log('Fallback - valid codes in text:', validCodes);

    if (validCodes.length >= 2) {
      origin = validCodes[0];
      destination = validCodes[1];
    }
  }

  // Date parsing - Ryanair uses format like "Thu, 03 Feb 22" or "03 Feb 22"
  const monthMap: Record<string, string> = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
  };

  // Match dates like "03 Feb 22" or "Thu, 03 Feb 22"
  const dateRegex = /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})/gi;
  const dateMatches = [...fullText.matchAll(dateRegex)];

  const dates: string[] = [];
  for (const match of dateMatches) {
    const day = match[1].padStart(2, '0');
    const month = monthMap[match[2].toLowerCase()];
    let year = match[3];
    // Handle 2-digit years
    if (year.length === 2) {
      year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    }
    const dateFormatted = `${year}-${month}-${day}`;
    if (!dates.includes(dateFormatted)) {
      dates.push(dateFormatted);
    }
  }

  // Sort dates chronologically
  dates.sort();
  console.log(`Found dates: ${dates.join(', ')}`);

  // Determine if round trip
  const isRoundTrip = dates.length >= 2 || /return|round\s*trip/i.test(fullText);

  if (origin && destination) {
    return {
      success: true,
      flight: {
        origin,
        destination,
        departureDate: dates[0] || undefined,
        returnDate: isRoundTrip && dates.length >= 2 ? dates[1] : undefined,
        isOneWay: !isRoundTrip,
        airline: 'Ryanair',
        confirmationNumber: confirmation,
        confidence: 0.9,
      },
      parserUsed: 'ryanair',
    };
  }

  console.log('Ryanair parser could not find airport codes, returning failure');
  return {
    success: false,
    error: 'Could not parse Ryanair email',
    parserUsed: 'ryanair',
  };
}
