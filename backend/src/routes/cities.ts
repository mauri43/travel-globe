import { Router, Response } from 'express';
import { db } from '../config/firebase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// City interface
interface City {
  id?: string;
  userId: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  flewFromName?: string;
  flewFromLat?: number;
  flewFromLng?: number;
  isOneWay?: boolean;
  tripName?: string;
  dates: string[];
  photos: string[];
  videos: string[];
  memories: string;
  tags: string[];
  status: 'complete' | 'pending_review';
  missingFields?: string[];
  source: 'manual' | 'email';
  createdAt: string;
  updatedAt: string;
}

// Get all cities for the authenticated user
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db()
      .collection('cities')
      .where('userId', '==', req.user!.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const cities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(cities);
  } catch (error) {
    console.error('Error getting cities:', error);
    res.status(500).json({ error: 'Failed to get cities' });
  }
});

// Get a single city
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const doc = await db().collection('cities').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'City not found' });
    }

    const city = doc.data();

    // Ensure user owns this city
    if (city?.userId !== req.user!.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ id: doc.id, ...city });
  } catch (error) {
    console.error('Error getting city:', error);
    res.status(500).json({ error: 'Failed to get city' });
  }
});

// Create a new city
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      country,
      lat,
      lng,
      flewFromName,
      flewFromLat,
      flewFromLng,
      isOneWay,
      tripName,
      dates,
      photos,
      videos,
      memories,
      tags,
    } = req.body;

    // Validate required fields
    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Name and coordinates are required' });
    }

    const now = new Date().toISOString();

    const cityData: Omit<City, 'id'> = {
      userId: req.user!.uid,
      name,
      country: country || '',
      lat,
      lng,
      flewFromName,
      flewFromLat,
      flewFromLng,
      isOneWay: isOneWay || false,
      tripName: tripName || '',
      dates: dates || [],
      photos: photos || [],
      videos: videos || [],
      memories: memories || '',
      tags: tags || [],
      status: 'complete',
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db().collection('cities').add(cityData);

    res.status(201).json({ id: docRef.id, ...cityData });
  } catch (error) {
    console.error('Error creating city:', error);
    res.status(500).json({ error: 'Failed to create city' });
  }
});

// Update a city
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const docRef = db().collection('cities').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'City not found' });
    }

    const existingCity = doc.data();

    // Ensure user owns this city
    if (existingCity?.userId !== req.user!.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {
      ...req.body,
      userId: req.user!.uid, // Prevent changing ownership
      updatedAt: new Date().toISOString(),
    };

    // If updating a pending_review city and all required fields are present, mark as complete
    if (existingCity.status === 'pending_review') {
      const { name, lat, lng, dates } = { ...existingCity, ...updateData };
      if (name && lat !== undefined && lng !== undefined && dates?.length > 0) {
        updateData.status = 'complete';
        updateData.missingFields = [];
      }
    }

    await docRef.update(updateData);

    res.json({ id: doc.id, ...existingCity, ...updateData });
  } catch (error) {
    console.error('Error updating city:', error);
    res.status(500).json({ error: 'Failed to update city' });
  }
});

// Delete all cities for the authenticated user
router.delete('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db()
      .collection('cities')
      .where('userId', '==', req.user!.uid)
      .get();

    if (snapshot.empty) {
      return res.json({ message: 'No cities to delete', deleted: 0 });
    }

    // Delete in batches (Firestore limit is 500 per batch)
    const batch = db().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ message: 'All cities deleted successfully', deleted: snapshot.size });
  } catch (error) {
    console.error('Error deleting all cities:', error);
    res.status(500).json({ error: 'Failed to delete cities' });
  }
});

// Delete a city
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const docRef = db().collection('cities').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'City not found' });
    }

    const city = doc.data();

    // Ensure user owns this city
    if (city?.userId !== req.user!.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await docRef.delete();

    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ error: 'Failed to delete city' });
  }
});

export default router;
