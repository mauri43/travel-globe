import { ParsedFlight, ParserResult } from './types';
import { parseUnited } from './united';
import { parseAmerican } from './american';
import { parseSouthwest } from './southwest';
import { parseSpirit } from './spirit';
import { parseFrontier } from './frontier';
import { parseDelta } from './delta';
import { parseChase } from './chase';
import { parseRyanair } from './ryanair';
import { parseGeneric } from './generic';
import { parseWithClaude } from './claude-fallback';

// Detect which airline the email is from based on sender/content
function detectAirline(from: string, subject: string, body: string): string | null {
  const content = `${from} ${subject} ${body}`.toLowerCase();

  // Check for booking sites FIRST - they mention airline names but should use their own parsers
  if (content.includes('chase travel') || content.includes('chasetravel.com') || content.includes('chase.com/travel') || content.includes('trip id') || content.includes('travel reservation center')) {
    return 'chase';
  }
  if (content.includes('expedia.com')) return 'expedia';
  if (content.includes('kayak.com')) return 'kayak';
  if (content.includes('google.com/travel') || content.includes('google flights')) return 'google';
  if (content.includes('booking.com')) return 'booking';
  if (content.includes('priceline.com')) return 'priceline';

  // Then check for direct airline emails
  if (content.includes('ryanair.com') || content.includes('ryanair')) {
    return 'ryanair';
  }
  if (content.includes('avianca.com') || content.includes('avianca')) {
    return 'avianca';
  }
  if (content.includes('united.com') || content.includes('united airlines')) {
    return 'united';
  }
  if (content.includes('aa.com') || content.includes('american airlines')) {
    return 'american';
  }
  if (content.includes('southwest.com') || content.includes('southwest airlines')) {
    return 'southwest';
  }
  if (content.includes('spirit.com') || content.includes('spirit airlines')) {
    return 'spirit';
  }
  if (content.includes('flyfrontier.com') || content.includes('frontier airlines')) {
    return 'frontier';
  }
  if (content.includes('delta.com') || content.includes('delta air')) {
    return 'delta';
  }
  if (content.includes('icelandair.com') || content.includes('icelandair')) {
    return 'icelandair';
  }
  if (content.includes('jetblue.com') || content.includes('jetblue')) {
    return 'jetblue';
  }

  return null;
}

// Get the appropriate parser for an airline
function getParser(airline: string): ((subject: string, body: string) => ParserResult) | null {
  const parsers: Record<string, (subject: string, body: string) => ParserResult> = {
    'united': parseUnited,
    'american': parseAmerican,
    'southwest': parseSouthwest,
    'spirit': parseSpirit,
    'frontier': parseFrontier,
    'delta': parseDelta,
    'chase': parseChase,
    'ryanair': parseRyanair,
  };

  return parsers[airline] || null;
}

export async function parseFlightEmail(
  from: string,
  subject: string,
  body: string
): Promise<ParserResult> {
  console.log('parseFlightEmail called with subject:', subject);

  // First, try to detect the airline
  const airline = detectAirline(from, subject, body);
  console.log('Detected airline/source:', airline);

  // If we detected an airline, try its specific parser
  if (airline) {
    const parser = getParser(airline);
    if (parser) {
      console.log('Using parser for:', airline);
      const result = parser(subject, body);
      console.log('Parser result:', JSON.stringify(result, null, 2));
      if (result.success && result.flight && result.flight.confidence >= 0.7) {
        return result;
      }
      console.log('Parser failed or low confidence, trying generic...');
    }
  }

  // Try generic pattern matching
  console.log('Using generic parser');
  const genericResult = parseGeneric(subject, body);
  console.log('Generic result:', JSON.stringify(genericResult, null, 2));
  if (genericResult.success && genericResult.flight && genericResult.flight.confidence >= 0.6) {
    return genericResult;
  }

  // Fall back to Claude AI parsing
  console.log('Falling back to Claude for email parsing');
  const claudeResult = await parseWithClaude(from, subject, body);

  return claudeResult;
}

export { ParsedFlight, ParserResult };
