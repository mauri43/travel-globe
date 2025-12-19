import { Router, Request, Response } from 'express';
import multer from 'multer';
import { simpleParser, ParsedMail } from 'mailparser';
import { db } from '../config/firebase';
import { parseFlightEmail } from '../parsers';
import { geocode } from '../services/geocoding';

const router = Router();

// Multer setup for parsing multipart form data (SendGrid sends emails this way)
const upload = multer();

// Default origin (Washington, DC) when no origin specified
const DEFAULT_ORIGIN = {
  name: 'Washington, DC',
  lat: 38.9072,
  lng: -77.0369,
  country: 'United States',
};

// SendGrid Inbound Parse webhook
router.post('/inbound', upload.any(), async (req: Request, res: Response) => {
  try {
    console.log('Received email webhook');

    // SendGrid sends email data as form fields
    const {
      from,
      to,
      subject,
      text,
      html,
      email: rawEmail, // Full MIME message if "POST the raw, full MIME message" is checked
    } = req.body;

    let emailFrom = from;
    let emailSubject = subject;
    let emailBody = text || '';

    // If raw email is provided, parse it
    if (rawEmail) {
      try {
        const parsed: ParsedMail = await simpleParser(rawEmail);
        emailFrom = parsed.from?.text || from;
        emailSubject = parsed.subject || subject;
        emailBody = parsed.text || text || '';
      } catch (parseError) {
        console.error('Error parsing raw email:', parseError);
      }
    }

    // Extract sender's email address
    const senderEmailMatch = emailFrom.match(/<([^>]+)>/) || [null, emailFrom];
    const senderEmail = senderEmailMatch[1]?.toLowerCase().trim();

    if (!senderEmail) {
      console.error('Could not extract sender email');
      return res.status(400).json({ error: 'Invalid sender email' });
    }

    console.log(`Processing email from: ${senderEmail}, subject: ${emailSubject}`);

    // Find user by trusted email
    const usersSnapshot = await db()
      .collection('users')
      .where('trustedEmails', 'array-contains', senderEmail)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log(`No user found for email: ${senderEmail}`);
      // Return 200 to prevent SendGrid from retrying
      return res.status(200).json({ message: 'No matching user found' });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    console.log(`Found user: ${userId}`);

    // Parse the flight email
    const parseResult = await parseFlightEmail(emailFrom, emailSubject, emailBody);

    if (!parseResult.success || !parseResult.flight) {
      console.log('Failed to parse flight details, creating pending review entry');

      // Create a pending review city entry
      const now = new Date().toISOString();
      await db().collection('cities').add({
        userId,
        name: 'Unknown Destination',
        country: '',
        lat: 0,
        lng: 0,
        dates: [],
        photos: [],
        videos: [],
        memories: '',
        tags: [],
        status: 'pending_review',
        missingFields: ['name', 'coordinates', 'dates'],
        source: 'email',
        parseError: parseResult.error || 'Could not parse flight details',
        rawSubject: emailSubject, // Help user identify which email
        createdAt: now,
        updatedAt: now,
      });

      return res.status(200).json({ message: 'Email received, pending review' });
    }

    const flight = parseResult.flight;
    console.log('Parsed flight:', flight);

    // Geocode origin
    let originData = DEFAULT_ORIGIN;
    if (flight.origin) {
      const geocoded = await geocode(flight.origin);
      if (geocoded) {
        originData = {
          name: geocoded.city,
          lat: geocoded.lat,
          lng: geocoded.lng,
          country: geocoded.country,
        };
      }
    }

    // Geocode destination
    let destinationData = null;
    if (flight.destination) {
      const geocoded = await geocode(flight.destination);
      if (geocoded) {
        destinationData = {
          name: geocoded.city,
          lat: geocoded.lat,
          lng: geocoded.lng,
          country: geocoded.country,
        };
      }
    }

    // Determine status and missing fields
    const missingFields: string[] = [];
    if (!destinationData) missingFields.push('coordinates');
    if (!flight.departureDate) missingFields.push('dates');

    const status = missingFields.length > 0 ? 'pending_review' : 'complete';

    // Create the city entry
    const now = new Date().toISOString();
    const cityData = {
      userId,
      name: destinationData?.name || flight.destination || 'Unknown',
      country: destinationData?.country || '',
      lat: destinationData?.lat || 0,
      lng: destinationData?.lng || 0,
      flewFromName: originData.name,
      flewFromLat: originData.lat,
      flewFromLng: originData.lng,
      isOneWay: flight.isOneWay,
      tripName: '',
      dates: [flight.departureDate, flight.returnDate].filter(Boolean) as string[],
      photos: [],
      videos: [],
      memories: '',
      tags: [],
      status,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
      source: 'email',
      airline: flight.airline,
      parserUsed: parseResult.parserUsed,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db().collection('cities').add(cityData);
    console.log(`Created city entry: ${docRef.id} with status: ${status}`);

    // Email is processed - we don't store the raw email content
    res.status(200).json({
      message: 'Email processed successfully',
      cityId: docRef.id,
      status,
    });
  } catch (error) {
    console.error('Email webhook error:', error);
    // Return 200 to prevent SendGrid from retrying (we don't want duplicate entries)
    res.status(200).json({ error: 'Processing error', details: String(error) });
  }
});

// Health check for email endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'email' });
});

// Test endpoint to verify webhook is reachable
router.post('/test', upload.any(), (req: Request, res: Response) => {
  console.log('Test webhook received:', {
    body: req.body,
    files: req.files,
    headers: req.headers,
  });
  res.json({
    success: true,
    message: 'Webhook is working',
    receivedFields: Object.keys(req.body || {}),
  });
});

// Debug endpoint to check recent email-sourced cities
router.get('/debug/recent', async (req: Request, res: Response) => {
  try {
    // Simple query without compound index
    const citiesSnapshot = await db()
      .collection('cities')
      .where('source', '==', 'email')
      .limit(20)
      .get();

    const cities = citiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      count: cities.length,
      cities,
    });
  } catch (error) {
    res.json({ error: String(error) });
  }
});

export default router;
