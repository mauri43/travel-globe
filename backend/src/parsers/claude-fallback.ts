import Anthropic from '@anthropic-ai/sdk';
import { ParserResult, ParsedFlight } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a flight confirmation email parser. Extract flight information from emails and return ONLY valid JSON.

Your task:
1. Identify the ORIGIN airport/city (where the journey STARTS, not layovers)
2. Identify the FINAL DESTINATION (where the journey ENDS, not layovers)
3. Extract departure date and return date if applicable
4. Determine if it's one-way or round-trip
5. Extract airline name if mentioned
6. Extract confirmation/booking number if present

IMPORTANT:
- Skip layover cities - only include origin and final destination
- For example: "DCA → JFK → Paris" should be origin: DCA, destination: Paris (JFK is a layover)
- Use airport codes (3 letters) when available, otherwise use city names
- Dates should be in YYYY-MM-DD format
- If you cannot determine something with confidence, set it to null

Respond with ONLY this JSON structure, no other text:
{
  "origin": "ABC or City Name",
  "destination": "XYZ or City Name",
  "departureDate": "YYYY-MM-DD or null",
  "returnDate": "YYYY-MM-DD or null",
  "isOneWay": true/false,
  "airline": "Airline Name or null",
  "confirmationNumber": "ABC123 or null",
  "confidence": 0.0-1.0
}`;

export async function parseWithClaude(
  from: string,
  subject: string,
  body: string
): Promise<ParserResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: 'Anthropic API key not configured',
      parserUsed: 'claude-fallback',
    };
  }

  try {
    // Truncate body if too long to save tokens
    const truncatedBody = body.length > 5000 ? body.substring(0, 5000) + '...' : body;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Parse this flight confirmation email:

From: ${from}
Subject: ${subject}

Body:
${truncatedBody}`,
        },
      ],
    });

    // Extract text content from response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'Could not parse JSON from Claude response',
        parserUsed: 'claude-fallback',
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.origin || !parsed.destination) {
      return {
        success: false,
        error: 'Claude could not extract origin/destination',
        parserUsed: 'claude-fallback',
      };
    }

    const flight: ParsedFlight = {
      origin: parsed.origin,
      destination: parsed.destination,
      departureDate: parsed.departureDate || undefined,
      returnDate: parsed.returnDate || undefined,
      isOneWay: parsed.isOneWay ?? true,
      airline: parsed.airline || undefined,
      confirmationNumber: parsed.confirmationNumber || undefined,
      confidence: parsed.confidence || 0.7,
    };

    return {
      success: true,
      flight,
      parserUsed: 'claude-fallback',
    };
  } catch (error) {
    console.error('Claude parsing error:', error);
    return {
      success: false,
      error: `Claude parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      parserUsed: 'claude-fallback',
    };
  }
}
