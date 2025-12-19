export interface ParsedFlight {
  origin: string;        // Airport code or city name
  destination: string;   // Airport code or city name (final destination, not layovers)
  departureDate?: string; // ISO date string
  returnDate?: string;    // ISO date string (if round trip)
  isOneWay: boolean;
  airline?: string;
  confirmationNumber?: string;
  confidence: number;     // 0-1, how confident we are in the parse
}

export interface ParserResult {
  success: boolean;
  flight?: ParsedFlight;
  error?: string;
  parserUsed: string;
}
