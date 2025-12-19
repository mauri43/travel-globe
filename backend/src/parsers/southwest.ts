import { ParserResult } from './types';
import { parseGeneric } from './generic';

export function parseSouthwest(subject: string, body: string): ParserResult {
  const fullText = `${subject}\n${body}`;

  // Southwest confirmation number - 6 characters
  const confirmMatch = fullText.match(/confirmation\s*#?\s*:?\s*([A-Z0-9]{6})/i);
  const confirmation = confirmMatch ? confirmMatch[1] : undefined;

  // Southwest route - "DEPARTS: City (ABC)" ... "ARRIVES: City (XYZ)"
  const departsMatch = fullText.match(/departs?[:\s]+([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)\s*\(([A-Z]{3})\)/i);
  const arrivesMatch = fullText.match(/arrives?[:\s]+([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)\s*\(([A-Z]{3})\)/i);

  // Alternative: direct code pattern
  const routeMatch = fullText.match(/([A-Z]{3})\s*(?:to|→|-|–)\s*([A-Z]{3})/i);

  // Date patterns - Southwest uses "Day, Mon DD"
  const dateMatches = fullText.match(
    /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:,?\s+(\d{4}))?/gi
  );

  const monthMap: Record<string, string> = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
  };

  const currentYear = new Date().getFullYear().toString();
  const dates: string[] = [];

  if (dateMatches) {
    for (const dateStr of dateMatches) {
      const match = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:,?\s+(\d{4}))?/i);
      if (match) {
        const month = monthMap[match[1].toLowerCase().substring(0, 3)];
        const day = match[2].padStart(2, '0');
        const year = match[3] || currentYear;
        const dateKey = `${year}-${month}-${day}`;
        if (!dates.includes(dateKey)) dates.push(dateKey);
      }
    }
  }

  let origin: string | null = null;
  let destination: string | null = null;

  if (departsMatch && arrivesMatch) {
    origin = departsMatch[2];
    destination = arrivesMatch[2];
  } else if (routeMatch) {
    origin = routeMatch[1];
    destination = routeMatch[2];
  }

  if (origin && destination) {
    const isRoundTrip = fullText.toLowerCase().includes('round trip') ||
      fullText.toLowerCase().includes('roundtrip') ||
      dates.length >= 2;

    return {
      success: true,
      flight: {
        origin,
        destination,
        departureDate: dates[0],
        returnDate: isRoundTrip && dates[1] ? dates[1] : undefined,
        isOneWay: !isRoundTrip,
        airline: 'Southwest Airlines',
        confirmationNumber: confirmation,
        confidence: 0.85,
      },
      parserUsed: 'southwest',
    };
  }

  const genericResult = parseGeneric(subject, body);
  if (genericResult.success && genericResult.flight) {
    genericResult.flight.airline = 'Southwest Airlines';
    genericResult.flight.confirmationNumber = confirmation || genericResult.flight.confirmationNumber;
    genericResult.parserUsed = 'southwest-generic';
  }

  return genericResult;
}
