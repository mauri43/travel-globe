import { Router, Response } from 'express';
import { db } from '../config/firebase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get current user profile
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userDoc = await db().collection('users').doc(req.user!.uid).get();

    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      const userData = {
        email: req.user!.email,
        trustedEmails: [req.user!.email],
        createdAt: new Date().toISOString(),
      };
      await db().collection('users').doc(req.user!.uid).set(userData);
      return res.json(userData);
    }

    res.json(userDoc.data());
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update trusted emails
router.put('/trusted-emails', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { trustedEmails } = req.body;

    if (!Array.isArray(trustedEmails)) {
      return res.status(400).json({ error: 'trustedEmails must be an array' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = trustedEmails.filter((email: string) => emailRegex.test(email));

    // Always include the user's primary email
    if (!validEmails.includes(req.user!.email)) {
      validEmails.unshift(req.user!.email);
    }

    // Use set with merge to create document if it doesn't exist
    await db().collection('users').doc(req.user!.uid).set({
      email: req.user!.email,
      trustedEmails: validEmails,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    res.json({ trustedEmails: validEmails });
  } catch (error) {
    console.error('Error updating trusted emails:', error);
    res.status(500).json({ error: 'Failed to update trusted emails' });
  }
});

// Update tour completion status
router.put('/tour-completed', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { tourCompleted } = req.body;

    if (typeof tourCompleted !== 'boolean') {
      return res.status(400).json({ error: 'tourCompleted must be a boolean' });
    }

    await db().collection('users').doc(req.user!.uid).set({
      tourCompleted,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    res.json({ tourCompleted });
  } catch (error) {
    console.error('Error updating tour status:', error);
    res.status(500).json({ error: 'Failed to update tour status' });
  }
});

// Update default from city
router.put('/default-from-city', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { defaultFromCity } = req.body;

    if (!defaultFromCity || typeof defaultFromCity.name !== 'string' ||
        typeof defaultFromCity.lat !== 'number' || typeof defaultFromCity.lng !== 'number') {
      return res.status(400).json({ error: 'defaultFromCity must have name, lat, and lng' });
    }

    await db().collection('users').doc(req.user!.uid).set({
      defaultFromCity: {
        name: defaultFromCity.name,
        lat: defaultFromCity.lat,
        lng: defaultFromCity.lng,
      },
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    res.json({ defaultFromCity });
  } catch (error) {
    console.error('Error updating default from city:', error);
    res.status(500).json({ error: 'Failed to update default from city' });
  }
});

// Delete account and all data
router.delete('/account', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;

    // Delete all user's cities
    const citiesSnapshot = await db()
      .collection('cities')
      .where('userId', '==', userId)
      .get();

    const batch = db().batch();
    citiesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user document
    batch.delete(db().collection('users').doc(userId));

    await batch.commit();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
