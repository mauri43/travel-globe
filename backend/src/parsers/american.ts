import { ParserResult } from './types';
import { parseGeneric } from './generic';

export function parseAmerican(subject: string, body: string): ParserResult {
  const fullText = `${subject}\n${body}`;

  // American Airlines confirmation - 6 character record locator
  const confirmMatch = fullText.match(/record\s+locator[:\s]*([A-Z0-9]{6})/i) ||
    fullText.match(/confirmation[:\s#]*([A-Z0-9]{6})/i);
  const confirmation = confirmMatch ? confirmMatch[1] : undefined;

  // American route patterns
  const routeMatch = fullText.match(
    /([A-Z]{3})\s*(?:to|→|-|–)\s*([A-Z]{3})/i
  );

  // Date patterns
  const dateMatches = fullText.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/gi
  );

  const monthMap: Record<string, string> = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
  };

  const dates: string[] = [];
  if (dateMatches) {
    for (const dateStr of dateMatches) {
      const match = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i);
      if (match) {
        const month = monthMap[match[1].toLowerCase().substring(0, 3)];
        const day = match[2].padStart(2, '0');
        const year = match[3];
        const dateKey = `${year}-${month}-${day}`;
        if (!dates.includes(dateKey)) dates.push(dateKey);
      }
    }
  }

  if (routeMatch) {
    const origin = routeMatch[1];
    const destination = routeMatch[2];

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
        airline: 'American Airlines',
        confirmationNumber: confirmation,
        confidence: 0.85,
      },
      parserUsed: 'american',
    };
  }

  const genericResult = parseGeneric(subject, body);
  if (genericResult.success && genericResult.flight) {
    genericResult.flight.airline = 'American Airlines';
    genericResult.flight.confirmationNumber = confirmation || genericResult.flight.confirmationNumber;
    genericResult.parserUsed = 'american-generic';
  }

  return genericResult;
}
