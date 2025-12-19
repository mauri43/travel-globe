import { ParserResult } from './types';
import { parseGeneric } from './generic';

export function parseUnited(subject: string, body: string): ParserResult {
  const fullText = `${subject}\n${body}`;

  // United confirmation pattern
  const confirmMatch = fullText.match(/confirmation[:\s#]*([A-Z0-9]{6})/i);
  const confirmation = confirmMatch ? confirmMatch[1] : undefined;

  // United route patterns - they typically show "ORIGIN to DESTINATION"
  // Example: "Washington, DC (IAD) to Paris (CDG)"
  const routeMatch = fullText.match(
    /([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)\s*\(([A-Z]{3})\)\s*(?:to|→)\s*([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)\s*\(([A-Z]{3})\)/i
  );

  // Date pattern for United - "Mon, Jan 15, 2024"
  const dateMatches = fullText.match(
    /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/gi
  );

  const monthMap: Record<string, string> = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
  };

  const dates: string[] = [];
  if (dateMatches) {
    for (const dateStr of dateMatches) {
      const match = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i);
      if (match) {
        const month = monthMap[match[1].toLowerCase()];
        const day = match[2].padStart(2, '0');
        const year = match[3];
        dates.push(`${year}-${month}-${day}`);
      }
    }
  }

  if (routeMatch) {
    const origin = routeMatch[2]; // Airport code
    const destination = routeMatch[4]; // Airport code

    // Check for round trip
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
        airline: 'United Airlines',
        confirmationNumber: confirmation,
        confidence: 0.85,
      },
      parserUsed: 'united',
    };
  }

  // Fall back to generic parser
  const genericResult = parseGeneric(subject, body);
  if (genericResult.success && genericResult.flight) {
    genericResult.flight.airline = 'United Airlines';
    genericResult.flight.confirmationNumber = confirmation || genericResult.flight.confirmationNumber;
    genericResult.parserUsed = 'united-generic';
  }

  return genericResult;
}
