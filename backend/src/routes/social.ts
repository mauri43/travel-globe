import { Router, Response } from 'express';
import { db } from '../config/firebase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  ProfileVisibility,
  FlightTagPermission,
  FriendshipDocument,
  FollowDocument,
  NotificationDocument,
  SharedFlightDocument,
  PublicUserProfile,
  FriendWithProfile,
  PublicFlight,
  SharedFlightPending,
} from '../types/social';

const router = Router();

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Get user's relationship with another user
async function getRelationship(currentUid: string, targetUid: string) {
  const relationship = {
    isFriend: false,
    friendshipId: undefined as string | undefined,
    isFollowing: false,
    isFollowedBy: false,
    hasPendingRequest: false,
    pendingRequestDirection: undefined as 'incoming' | 'outgoing' | undefined,
  };

  // Check friendship
  const friendshipQuery = await db()
    .collection('friendships')
    .where('userIds', 'array-contains', currentUid)
    .get();

  for (const doc of friendshipQuery.docs) {
    const data = doc.data() as FriendshipDocument;
    if (data.userIds.includes(targetUid)) {
      if (data.status === 'accepted') {
        relationship.isFriend = true;
        relationship.friendshipId = doc.id;
      } else if (data.status === 'pending') {
        relationship.hasPendingRequest = true;
        relationship.friendshipId = doc.id;
        relationship.pendingRequestDirection = data.requestedBy === currentUid ? 'outgoing' : 'incoming';
      }
      break;
    }
  }

  // Check follows
  const followingDoc = await db()
    .collection('follows')
    .doc(`${currentUid}_${targetUid}`)
    .get();
  relationship.isFollowing = followingDoc.exists;

  const followedByDoc = await db()
    .collection('follows')
    .doc(`${targetUid}_${currentUid}`)
    .get();
  relationship.isFollowedBy = followedByDoc.exists;

  return relationship;
}

// Create notification
async function createNotification(
  recipientUid: string,
  type: NotificationDocument['type'],
  data: NotificationDocument['data']
) {
  const notification: Omit<NotificationDocument, 'id'> = {
    recipientUid,
    type,
    data,
    read: false,
    createdAt: new Date().toISOString(),
  };

  await db().collection('notifications').add(notification);

  // Increment unread count
  await db().collection('users').doc(recipientUid).update({
    unreadNotificationCount: (await import('firebase-admin')).firestore.FieldValue.increment(1),
  });
}

// ==========================================
// USERNAME ENDPOINTS
// ==========================================

// Check if username is available
router.get('/username/check/:username', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.params.username.toLowerCase().trim();

    // Validate username format (3-20 chars, alphanumeric + underscore)
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.json({
        available: false,
        error: 'Username must be 3-20 characters, only letters, numbers, and underscores',
      });
    }

    const usernameDoc = await db().collection('usernames').doc(username).get();

    if (!usernameDoc.exists) {
      return res.json({ available: true });
    }

    // If it exists but belongs to current user, it's "available" for them
    const data = usernameDoc.data();
    if (data?.uid === req.user!.uid) {
      return res.json({ available: true, currentlyYours: true });
    }

    // Suggest alternatives
    const suggestion = `${username}${Math.floor(Math.random() * 999)}`;
    return res.json({ available: false, suggestion });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Failed to check username availability' });
  }
});

// Set or update username
router.put('/username', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.body;
    const newUsername = username?.toLowerCase().trim();

    // Validate
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!newUsername || !usernameRegex.test(newUsername)) {
      return res.status(400).json({
        error: 'Username must be 3-20 characters, only letters, numbers, and underscores',
      });
    }

    const userId = req.user!.uid;
    const batch = db().batch();

    // Get current user to check if they already have a username
    const userDoc = await db().collection('users').doc(userId).get();
    const currentUsername = userDoc.data()?.username?.toLowerCase();

    // Check if new username is taken (by someone else)
    const existingUsername = await db().collection('usernames').doc(newUsername).get();
    if (existingUsername.exists && existingUsername.data()?.uid !== userId) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    // Delete old username reservation if exists
    if (currentUsername && currentUsername !== newUsername) {
      batch.delete(db().collection('usernames').doc(currentUsername));
    }

    // Reserve new username
    batch.set(db().collection('usernames').doc(newUsername), {
      uid: userId,
      username: username, // Keep original casing
      createdAt: new Date().toISOString(),
    });

    // Update user document
    batch.update(db().collection('users').doc(userId), {
      username: username, // Keep original casing
      updatedAt: new Date().toISOString(),
    });

    await batch.commit();

    res.json({ username });
  } catch (error) {
    console.error('Error setting username:', error);
    res.status(500).json({ error: 'Failed to set username' });
  }
});

// ==========================================
// PROFILE ENDPOINTS
// ==========================================

// Get public profile by username
router.get('/profile/:username', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.params.username.toLowerCase();

    // Find user by username
    const usernameDoc = await db().collection('usernames').doc(username).get();
    if (!usernameDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUid = usernameDoc.data()!.uid;
    const userDoc = await db().collection('users').doc(targetUid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data()!;
    const relationship = await getRelationship(req.user!.uid, targetUid);

    const profile: PublicUserProfile = {
      uid: targetUid,
      username: userData.username || username,
      displayName: userData.displayName,
      profileVisibility: userData.profileVisibility || 'private',
      friendCount: userData.friendCount || 0,
      followerCount: userData.followerCount || 0,
      followingCount: userData.followingCount || 0,
      relationship,
    };

    res.json(profile);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get public globe (flight paths only)
router.get('/profile/:username/globe', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.params.username.toLowerCase();

    // Find user by username
    const usernameDoc = await db().collection('usernames').doc(username).get();
    if (!usernameDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUid = usernameDoc.data()!.uid;
    const userDoc = await db().collection('users').doc(targetUid).get();
    const userData = userDoc.data()!;

    const relationship = await getRelationship(req.user!.uid, targetUid);

    // Check access permissions
    const isPrivate = userData.profileVisibility === 'private';
    const canViewGlobe = relationship.isFriend || (!isPrivate && relationship.isFollowing);

    if (!canViewGlobe && req.user!.uid !== targetUid) {
      return res.status(403).json({
        error: isPrivate ? 'This profile is private' : 'You must follow or be friends to view this globe',
      });
    }

    // Get user's cities (flight paths only - no personal details)
    const citiesSnapshot = await db()
      .collection('cities')
      .where('userId', '==', targetUid)
      .get();

    const flights: PublicFlight[] = citiesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        flewFrom: {
          lat: data.flewFromLat || data.lat,
          lng: data.flewFromLng || data.lng,
          name: data.flewFromName || data.name,
        },
        destination: {
          lat: data.lat,
          lng: data.lng,
          name: data.name,
          country: data.country,
        },
      };
    });

    // Determine what level of detail to return
    const isFriend = relationship.isFriend;

    res.json({
      flights,
      accessLevel: isFriend ? 'friend' : 'follower',
    });
  } catch (error) {
    console.error('Error getting globe:', error);
    res.status(500).json({ error: 'Failed to get globe' });
  }
});

// Get full globe details (for friends only)
router.get('/profile/:username/globe/details', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.params.username.toLowerCase();

    // Find user by username
    const usernameDoc = await db().collection('usernames').doc(username).get();
    if (!usernameDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUid = usernameDoc.data()!.uid;
    const relationship = await getRelationship(req.user!.uid, targetUid);

    // Only friends can see full details
    if (!relationship.isFriend && req.user!.uid !== targetUid) {
      return res.status(403).json({ error: 'Only friends can view full flight details' });
    }

    // Get user's cities with full details
    const citiesSnapshot = await db()
      .collection('cities')
      .where('userId', '==', targetUid)
      .get();

    const cities = citiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ cities });
  } catch (error) {
    console.error('Error getting globe details:', error);
    res.status(500).json({ error: 'Failed to get globe details' });
  }
});

// Update profile visibility
router.put('/settings/visibility', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { visibility } = req.body;

    if (visibility !== 'public' && visibility !== 'private') {
      return res.status(400).json({ error: 'Visibility must be "public" or "private"' });
    }

    await db().collection('users').doc(req.user!.uid).update({
      profileVisibility: visibility,
      updatedAt: new Date().toISOString(),
    });

    res.json({ profileVisibility: visibility });
  } catch (error) {
    console.error('Error updating visibility:', error);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
});

// Update flight tag default
router.put('/settings/flight-tag-default', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { flightTagDefault } = req.body;

    const validValues: FlightTagPermission[] = ['approve_required', 'auto_approve', 'auto_deny'];
    if (!validValues.includes(flightTagDefault)) {
      return res.status(400).json({ error: 'Invalid flight tag default value' });
    }

    await db().collection('users').doc(req.user!.uid).update({
      flightTagDefault,
      updatedAt: new Date().toISOString(),
    });

    res.json({ flightTagDefault });
  } catch (error) {
    console.error('Error updating flight tag default:', error);
    res.status(500).json({ error: 'Failed to update flight tag default' });
  }
});

// ==========================================
// SEARCH ENDPOINTS
// ==========================================

// Search users by username
router.get('/search/users', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const query = (req.query.q as string)?.toLowerCase().trim();
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }

    // Search usernames that start with query
    const usernamesSnapshot = await db()
      .collection('usernames')
      .where('__name__', '>=', query)
      .where('__name__', '<=', query + '\uf8ff')
      .limit(limit)
      .get();

    const users: PublicUserProfile[] = [];

    for (const doc of usernamesSnapshot.docs) {
      const data = doc.data();
      if (data.uid === req.user!.uid) continue; // Skip self

      const userDoc = await db().collection('users').doc(data.uid).get();
      if (!userDoc.exists) continue;

      const userData = userDoc.data()!;
      const relationship = await getRelationship(req.user!.uid, data.uid);

      users.push({
        uid: data.uid,
        username: userData.username || doc.id,
        displayName: userData.displayName,
        profileVisibility: userData.profileVisibility || 'private',
        friendCount: userData.friendCount || 0,
        followerCount: userData.followerCount || 0,
        followingCount: userData.followingCount || 0,
        relationship,
      });
    }

    res.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// ==========================================
// FRIEND ENDPOINTS
// ==========================================

// Get all friends
router.get('/friends', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;

    const friendshipsSnapshot = await db()
      .collection('friendships')
      .where('userIds', 'array-contains', userId)
      .where('status', '==', 'accepted')
      .get();

    const friends: FriendWithProfile[] = [];

    for (const doc of friendshipsSnapshot.docs) {
      const data = doc.data() as FriendshipDocument;
      const friendUid = data.user1Uid === userId ? data.user2Uid : data.user1Uid;

      const friendDoc = await db().collection('users').doc(friendUid).get();
      if (!friendDoc.exists) continue;

      const friendData = friendDoc.data()!;

      // Get the override for the current user
      const override = data.user1Uid === userId
        ? data.user1FlightTagOverride
        : data.user2FlightTagOverride;

      friends.push({
        uid: friendUid,
        username: friendData.username || '',
        displayName: friendData.displayName,
        profileVisibility: friendData.profileVisibility || 'private',
        friendCount: friendData.friendCount || 0,
        followerCount: friendData.followerCount || 0,
        followingCount: friendData.followingCount || 0,
        relationship: {
          isFriend: true,
          friendshipId: doc.id,
          isFollowing: false,
          isFollowedBy: false,
          hasPendingRequest: false,
        },
        friendshipId: doc.id,
        friendSince: data.respondedAt || data.createdAt,
        flightTagOverride: override,
      });
    }

    res.json({ friends });
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Get pending friend requests (incoming)
router.get('/friends/requests', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;

    const requestsSnapshot = await db()
      .collection('friendships')
      .where('userIds', 'array-contains', userId)
      .where('status', '==', 'pending')
      .get();

    const requests = [];

    for (const doc of requestsSnapshot.docs) {
      const data = doc.data() as FriendshipDocument;

      // Only include incoming requests
      if (data.requestedBy === userId) continue;

      const requesterDoc = await db().collection('users').doc(data.requestedBy).get();
      if (!requesterDoc.exists) continue;

      const requesterData = requesterDoc.data()!;

      requests.push({
        friendshipId: doc.id,
        from: {
          uid: data.requestedBy,
          username: requesterData.username || '',
          displayName: requesterData.displayName,
        },
        requestedAt: data.requestedAt,
      });
    }

    res.json({ requests });
  } catch (error) {
    console.error('Error getting friend requests:', error);
    res.status(500).json({ error: 'Failed to get friend requests' });
  }
});

// Get sent friend requests (outgoing)
router.get('/friends/sent', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;

    const requestsSnapshot = await db()
      .collection('friendships')
      .where('requestedBy', '==', userId)
      .where('status', '==', 'pending')
      .get();

    const requests = [];

    for (const doc of requestsSnapshot.docs) {
      const data = doc.data() as FriendshipDocument;
      const targetUid = data.user1Uid === userId ? data.user2Uid : data.user1Uid;

      const targetDoc = await db().collection('users').doc(targetUid).get();
      if (!targetDoc.exists) continue;

      const targetData = targetDoc.data()!;

      requests.push({
        friendshipId: doc.id,
        to: {
          uid: targetUid,
          username: targetData.username || '',
          displayName: targetData.displayName,
        },
        requestedAt: data.requestedAt,
      });
    }

    res.json({ requests });
  } catch (error) {
    console.error('Error getting sent requests:', error);
    res.status(500).json({ error: 'Failed to get sent requests' });
  }
});

// Send friend request
router.post('/friends/request', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.body;
    const userId = req.user!.uid;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find target user
    const usernameDoc = await db().collection('usernames').doc(username.toLowerCase()).get();
    if (!usernameDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUid = usernameDoc.data()!.uid;

    if (targetUid === userId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existingFriendship = await db()
      .collection('friendships')
      .where('userIds', 'array-contains', userId)
      .get();

    for (const doc of existingFriendship.docs) {
      const data = doc.data() as FriendshipDocument;
      if (data.userIds.includes(targetUid)) {
        if (data.status === 'accepted') {
          return res.status(400).json({ error: 'Already friends' });
        }
        if (data.status === 'pending') {
          return res.status(400).json({ error: 'Friend request already pending' });
        }
      }
    }

    // Create friendship document with sorted UIDs
    const sortedUids = [userId, targetUid].sort() as [string, string];
    const now = new Date().toISOString();

    const friendship: Omit<FriendshipDocument, 'id'> = {
      userIds: sortedUids,
      user1Uid: sortedUids[0],
      user2Uid: sortedUids[1],
      status: 'pending',
      requestedBy: userId,
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const friendshipRef = await db().collection('friendships').add(friendship);

    // Get current user's username for notification
    const currentUserDoc = await db().collection('users').doc(userId).get();
    const currentUsername = currentUserDoc.data()?.username || '';

    // Create notification for target user
    await createNotification(targetUid, 'friend_request', {
      fromUid: userId,
      fromUsername: currentUsername,
      friendshipId: friendshipRef.id,
    });

    res.json({ friendshipId: friendshipRef.id });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Respond to friend request
router.post('/friends/respond', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { friendshipId, action } = req.body;
    const userId = req.user!.uid;

    if (!friendshipId || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const friendshipRef = db().collection('friendships').doc(friendshipId);
    const friendshipDoc = await friendshipRef.get();

    if (!friendshipDoc.exists) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const data = friendshipDoc.data() as FriendshipDocument;

    // Verify user is the recipient
    if (!data.userIds.includes(userId) || data.requestedBy === userId) {
      return res.status(403).json({ error: 'Cannot respond to this request' });
    }

    if (data.status !== 'pending') {
      return res.status(400).json({ error: 'Request already responded to' });
    }

    const now = new Date().toISOString();

    if (action === 'accept') {
      const batch = db().batch();

      // Update friendship
      batch.update(friendshipRef, {
        status: 'accepted',
        respondedAt: now,
        updatedAt: now,
      });

      // Increment friend counts for both users
      const FieldValue = (await import('firebase-admin')).firestore.FieldValue;
      batch.update(db().collection('users').doc(data.user1Uid), {
        friendCount: FieldValue.increment(1),
      });
      batch.update(db().collection('users').doc(data.user2Uid), {
        friendCount: FieldValue.increment(1),
      });

      await batch.commit();

      // Get current user's username for notification
      const currentUserDoc = await db().collection('users').doc(userId).get();
      const currentUsername = currentUserDoc.data()?.username || '';

      // Notify requester
      await createNotification(data.requestedBy, 'friend_request_accepted', {
        fromUid: userId,
        fromUsername: currentUsername,
        friendshipId,
      });

      res.json({ status: 'accepted' });
    } else {
      // Decline - just update status
      await friendshipRef.update({
        status: 'declined',
        respondedAt: now,
        updatedAt: now,
      });

      res.json({ status: 'declined' });
    }
  } catch (error) {
    console.error('Error responding to friend request:', error);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// Remove friend
router.delete('/friends/:friendshipId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user!.uid;

    const friendshipRef = db().collection('friendships').doc(friendshipId);
    const friendshipDoc = await friendshipRef.get();

    if (!friendshipDoc.exists) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    const data = friendshipDoc.data() as FriendshipDocument;

    if (!data.userIds.includes(userId)) {
      return res.status(403).json({ error: 'Cannot remove this friendship' });
    }

    const batch = db().batch();

    // Delete friendship
    batch.delete(friendshipRef);

    // Decrement friend counts if was accepted
    if (data.status === 'accepted') {
      const FieldValue = (await import('firebase-admin')).firestore.FieldValue;
      batch.update(db().collection('users').doc(data.user1Uid), {
        friendCount: FieldValue.increment(-1),
      });
      batch.update(db().collection('users').doc(data.user2Uid), {
        friendCount: FieldValue.increment(-1),
      });
    }

    await batch.commit();

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// Set per-friend flight tag override
router.put('/friends/:friendshipId/flight-override', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { friendshipId } = req.params;
    const { override } = req.body;
    const userId = req.user!.uid;

    const validValues: (FlightTagPermission | null)[] = ['approve_required', 'auto_approve', 'auto_deny', null];
    if (!validValues.includes(override)) {
      return res.status(400).json({ error: 'Invalid override value' });
    }

    const friendshipRef = db().collection('friendships').doc(friendshipId);
    const friendshipDoc = await friendshipRef.get();

    if (!friendshipDoc.exists) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    const data = friendshipDoc.data() as FriendshipDocument;

    if (!data.userIds.includes(userId)) {
      return res.status(403).json({ error: 'Cannot modify this friendship' });
    }

    // Determine which field to update
    const field = data.user1Uid === userId ? 'user1FlightTagOverride' : 'user2FlightTagOverride';

    if (override === null) {
      // Remove override
      const FieldValue = (await import('firebase-admin')).firestore.FieldValue;
      await friendshipRef.update({
        [field]: FieldValue.delete(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await friendshipRef.update({
        [field]: override,
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({ override });
  } catch (error) {
    console.error('Error setting flight override:', error);
    res.status(500).json({ error: 'Failed to set flight override' });
  }
});

// ==========================================
// FOLLOWER ENDPOINTS
// ==========================================

// Get followers
router.get('/followers', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;

    const followsSnapshot = await db()
      .collection('follows')
      .where('followedUid', '==', userId)
      .get();

    const followers: PublicUserProfile[] = [];

    for (const doc of followsSnapshot.docs) {
      const data = doc.data() as FollowDocument;
      const followerDoc = await db().collection('users').doc(data.followerUid).get();
      if (!followerDoc.exists) continue;

      const followerData = followerDoc.data()!;
      const relationship = await getRelationship(userId, data.followerUid);

      followers.push({
        uid: data.followerUid,
        username: followerData.username || '',
        displayName: followerData.displayName,
        profileVisibility: followerData.profileVisibility || 'private',
        friendCount: followerData.friendCount || 0,
        followerCount: followerData.followerCount || 0,
        followingCount: followerData.followingCount || 0,
        relationship,
      });
    }

    res.json({ followers });
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({ error: 'Failed to get followers' });
  }
});

// Get following
router.get('/following', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;

    const followsSnapshot = await db()
      .collection('follows')
      .where('followerUid', '==', userId)
      .get();

    const following: PublicUserProfile[] = [];

    for (const doc of followsSnapshot.docs) {
      const data = doc.data() as FollowDocument;
      const followedDoc = await db().collection('users').doc(data.followedUid).get();
      if (!followedDoc.exists) continue;

      const followedData = followedDoc.data()!;
      const relationship = await getRelationship(userId, data.followedUid);

      following.push({
        uid: data.followedUid,
        username: followedData.username || '',
        displayName: followedData.displayName,
        profileVisibility: followedData.profileVisibility || 'private',
        friendCount: followedData.friendCount || 0,
        followerCount: followedData.followerCount || 0,
        followingCount: followedData.followingCount || 0,
        relationship,
      });
    }

    res.json({ following });
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({ error: 'Failed to get following' });
  }
});

// Follow a user
router.post('/follow', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.body;
    const userId = req.user!.uid;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find target user
    const usernameDoc = await db().collection('usernames').doc(username.toLowerCase()).get();
    if (!usernameDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUid = usernameDoc.data()!.uid;

    if (targetUid === userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if target profile is public
    const targetDoc = await db().collection('users').doc(targetUid).get();
    const targetData = targetDoc.data()!;

    if (targetData.profileVisibility === 'private') {
      return res.status(403).json({ error: 'Cannot follow private profiles' });
    }

    // Check if already following
    const followId = `${userId}_${targetUid}`;
    const existingFollow = await db().collection('follows').doc(followId).get();
    if (existingFollow.exists) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    const batch = db().batch();

    // Create follow document
    batch.set(db().collection('follows').doc(followId), {
      followerUid: userId,
      followedUid: targetUid,
      createdAt: new Date().toISOString(),
    });

    // Update counts
    const FieldValue = (await import('firebase-admin')).firestore.FieldValue;
    batch.update(db().collection('users').doc(userId), {
      followingCount: FieldValue.increment(1),
    });
    batch.update(db().collection('users').doc(targetUid), {
      followerCount: FieldValue.increment(1),
    });

    await batch.commit();

    // Get current user's username for notification
    const currentUserDoc = await db().collection('users').doc(userId).get();
    const currentUsername = currentUserDoc.data()?.username || '';

    // Create notification
    await createNotification(targetUid, 'new_follower', {
      followerUid: userId,
      followerUsername: currentUsername,
    });

    res.json({ message: 'Now following' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
router.delete('/follow/:username', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.params.username.toLowerCase();
    const userId = req.user!.uid;

    // Find target user
    const usernameDoc = await db().collection('usernames').doc(username).get();
    if (!usernameDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUid = usernameDoc.data()!.uid;
    const followId = `${userId}_${targetUid}`;

    const followDoc = await db().collection('follows').doc(followId).get();
    if (!followDoc.exists) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    const batch = db().batch();

    // Delete follow document
    batch.delete(db().collection('follows').doc(followId));

    // Update counts
    const FieldValue = (await import('firebase-admin')).firestore.FieldValue;
    batch.update(db().collection('users').doc(userId), {
      followingCount: FieldValue.increment(-1),
    });
    batch.update(db().collection('users').doc(targetUid), {
      followerCount: FieldValue.increment(-1),
    });

    await batch.commit();

    res.json({ message: 'Unfollowed' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// ==========================================
// NOTIFICATION ENDPOINTS
// ==========================================

// Get notifications
router.get('/notifications', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    let query = db()
      .collection('notifications')
      .where('recipientUid', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (unreadOnly) {
      query = query.where('read', '==', false);
    }

    const notificationsSnapshot = await query.get();

    const notifications = notificationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get unread count
    const unreadSnapshot = await db()
      .collection('notifications')
      .where('recipientUid', '==', userId)
      .where('read', '==', false)
      .count()
      .get();

    res.json({
      notifications,
      unreadCount: unreadSnapshot.data().count,
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notifications as read
router.post('/notifications/mark-read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user!.uid;

    if (notificationIds === 'all') {
      // Mark all as read
      const unreadSnapshot = await db()
        .collection('notifications')
        .where('recipientUid', '==', userId)
        .where('read', '==', false)
        .get();

      const batch = db().batch();
      unreadSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      // Reset unread count
      batch.update(db().collection('users').doc(userId), {
        unreadNotificationCount: 0,
      });

      await batch.commit();
    } else if (Array.isArray(notificationIds)) {
      const batch = db().batch();
      let markedCount = 0;

      for (const id of notificationIds) {
        const notifRef = db().collection('notifications').doc(id);
        const notifDoc = await notifRef.get();

        if (notifDoc.exists && notifDoc.data()?.recipientUid === userId && !notifDoc.data()?.read) {
          batch.update(notifRef, { read: true });
          markedCount++;
        }
      }

      // Decrement unread count
      if (markedCount > 0) {
        const FieldValue = (await import('firebase-admin')).firestore.FieldValue;
        batch.update(db().collection('users').doc(userId), {
          unreadNotificationCount: FieldValue.increment(-markedCount),
        });
      }

      await batch.commit();
    }

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Get unread notification count
router.get('/notifications/count', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;

    const countSnapshot = await db()
      .collection('notifications')
      .where('recipientUid', '==', userId)
      .where('read', '==', false)
      .count()
      .get();

    res.json({ count: countSnapshot.data().count });
  } catch (error) {
    console.error('Error getting notification count:', error);
    res.status(500).json({ error: 'Failed to get notification count' });
  }
});

// ==========================================
// FLIGHT SHARING ENDPOINTS
// ==========================================

// Share a flight with friends
router.post('/flights/:cityId/share', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { cityId } = req.params;
    const { friendUsernames } = req.body;
    const userId = req.user!.uid;

    if (!Array.isArray(friendUsernames) || friendUsernames.length === 0) {
      return res.status(400).json({ error: 'At least one friend username is required' });
    }

    // Verify city belongs to user
    const cityDoc = await db().collection('cities').doc(cityId).get();
    if (!cityDoc.exists || cityDoc.data()?.userId !== userId) {
      return res.status(404).json({ error: 'City not found' });
    }

    const cityData = cityDoc.data()!;

    // Get current user data
    const currentUserDoc = await db().collection('users').doc(userId).get();
    const currentUserData = currentUserDoc.data()!;

    // Validate all usernames are friends
    const friendUids: string[] = [];
    for (const username of friendUsernames) {
      const usernameDoc = await db().collection('usernames').doc(username.toLowerCase()).get();
      if (!usernameDoc.exists) {
        return res.status(400).json({ error: `User ${username} not found` });
      }

      const friendUid = usernameDoc.data()!.uid;

      // Check friendship
      const relationship = await getRelationship(userId, friendUid);
      if (!relationship.isFriend) {
        return res.status(400).json({ error: `${username} is not your friend` });
      }

      friendUids.push(friendUid);
    }

    const now = new Date().toISOString();

    // Create or update shared flight
    const participants: Record<string, any> = {
      [userId]: {
        cityId,
        status: 'added',
        addedToGlobe: true,
        invitedAt: now,
      },
    };

    // Check each friend's permission settings and set initial status
    for (let i = 0; i < friendUids.length; i++) {
      const friendUid = friendUids[i];
      const friendDoc = await db().collection('users').doc(friendUid).get();
      const friendData = friendDoc.data()!;

      // Get friendship to check for per-friend override
      const friendshipQuery = await db()
        .collection('friendships')
        .where('userIds', 'array-contains', friendUid)
        .where('status', '==', 'accepted')
        .get();

      let permission = friendData.flightTagDefault || 'approve_required';

      for (const fDoc of friendshipQuery.docs) {
        const fData = fDoc.data() as FriendshipDocument;
        if (fData.userIds.includes(userId)) {
          const override = fData.user1Uid === friendUid
            ? fData.user1FlightTagOverride
            : fData.user2FlightTagOverride;
          if (override) {
            permission = override;
          }
          break;
        }
      }

      let status: string;
      if (permission === 'auto_approve') {
        status = 'approved';
      } else if (permission === 'auto_deny') {
        status = 'declined';
      } else {
        status = 'pending';
      }

      participants[friendUid] = {
        cityId: null,
        status,
        addedToGlobe: false,
        invitedAt: now,
        respondedAt: permission !== 'approve_required' ? now : undefined,
      };
    }

    const sharedFlight: Omit<SharedFlightDocument, 'id'> = {
      originalCityId: cityId,
      originalOwnerId: userId,
      participants,
      contributions: {
        [userId]: {
          photos: cityData.photos || [],
          videos: cityData.videos || [],
          memories: cityData.memories || '',
          contributedAt: now,
        },
      },
      createdAt: now,
      updatedAt: now,
    };

    const sharedFlightRef = await db().collection('sharedFlights').add(sharedFlight);

    // Update original city with shared flight reference
    await cityDoc.ref.update({
      sharedFlightId: sharedFlightRef.id,
      participants: [userId, ...friendUids],
    });

    // Send notifications (only to pending users)
    for (let i = 0; i < friendUids.length; i++) {
      const friendUid = friendUids[i];
      if (participants[friendUid].status === 'pending') {
        await createNotification(friendUid, 'flight_tag', {
          fromUid: userId,
          fromUsername: currentUserData.username || '',
          sharedFlightId: sharedFlightRef.id,
          flightName: cityData.name,
        });
      }
    }

    res.json({ sharedFlightId: sharedFlightRef.id });
  } catch (error) {
    console.error('Error sharing flight:', error);
    res.status(500).json({ error: 'Failed to share flight' });
  }
});

// Get flights shared with me (pending)
router.get('/flights/shared', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;

    // Find shared flights where user is a participant with pending status
    const sharedFlightsSnapshot = await db()
      .collection('sharedFlights')
      .get();

    const pendingFlights: SharedFlightPending[] = [];

    for (const doc of sharedFlightsSnapshot.docs) {
      const data = doc.data() as SharedFlightDocument;
      const participant = data.participants[userId];

      if (participant && participant.status === 'pending') {
        // Get original flight details
        const cityDoc = await db().collection('cities').doc(data.originalCityId).get();
        if (!cityDoc.exists) continue;

        const cityData = cityDoc.data()!;

        // Get sharer's info
        const sharerDoc = await db().collection('users').doc(data.originalOwnerId).get();
        const sharerData = sharerDoc.data() || {};

        pendingFlights.push({
          sharedFlightId: doc.id,
          originalFlight: {
            id: data.originalCityId,
            name: cityData.name,
            country: cityData.country,
            dates: cityData.dates || [],
          },
          sharedBy: {
            uid: data.originalOwnerId,
            username: sharerData.username || '',
          },
          invitedAt: participant.invitedAt,
        });
      }
    }

    res.json({ sharedFlights: pendingFlights });
  } catch (error) {
    console.error('Error getting shared flights:', error);
    res.status(500).json({ error: 'Failed to get shared flights' });
  }
});

// Respond to flight share invitation
router.post('/flights/shared/:sharedFlightId/respond', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { sharedFlightId } = req.params;
    const { action, addToGlobe } = req.body;
    const userId = req.user!.uid;

    if (!['approve', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approve or decline' });
    }

    const sharedFlightRef = db().collection('sharedFlights').doc(sharedFlightId);
    const sharedFlightDoc = await sharedFlightRef.get();

    if (!sharedFlightDoc.exists) {
      return res.status(404).json({ error: 'Shared flight not found' });
    }

    const data = sharedFlightDoc.data() as SharedFlightDocument;
    const participant = data.participants[userId];

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this shared flight' });
    }

    if (participant.status !== 'pending') {
      return res.status(400).json({ error: 'Already responded to this invitation' });
    }

    const now = new Date().toISOString();

    if (action === 'decline') {
      await sharedFlightRef.update({
        [`participants.${userId}.status`]: 'declined',
        [`participants.${userId}.respondedAt`]: now,
        updatedAt: now,
      });

      return res.json({ status: 'declined' });
    }

    // Approve
    let newCityId: string | null = null;

    if (addToGlobe) {
      // Copy the city to user's account
      const originalCityDoc = await db().collection('cities').doc(data.originalCityId).get();
      const originalCity = originalCityDoc.data()!;

      const newCity = {
        ...originalCity,
        userId,
        sharedFlightId,
        isSharedInstance: true,
        participants: Object.keys(data.participants),
        source: 'shared' as const,
        createdAt: now,
        updatedAt: now,
      };

      delete (newCity as any).id;

      const newCityRef = await db().collection('cities').add(newCity);
      newCityId = newCityRef.id;
    }

    await sharedFlightRef.update({
      [`participants.${userId}.status`]: addToGlobe ? 'added' : 'approved',
      [`participants.${userId}.addedToGlobe`]: addToGlobe,
      [`participants.${userId}.cityId`]: newCityId,
      [`participants.${userId}.respondedAt`]: now,
      updatedAt: now,
    });

    // Notify the original owner
    const currentUserDoc = await db().collection('users').doc(userId).get();
    const currentUsername = currentUserDoc.data()?.username || '';

    await createNotification(data.originalOwnerId, 'flight_tag_accepted', {
      fromUid: userId,
      fromUsername: currentUsername,
      sharedFlightId,
    });

    res.json({
      status: addToGlobe ? 'added' : 'approved',
      cityId: newCityId,
    });
  } catch (error) {
    console.error('Error responding to flight share:', error);
    res.status(500).json({ error: 'Failed to respond to flight share' });
  }
});

// Get merged contributions for a shared flight
router.get('/flights/:cityId/contributions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { cityId } = req.params;
    const userId = req.user!.uid;

    // Get the city
    const cityDoc = await db().collection('cities').doc(cityId).get();
    if (!cityDoc.exists) {
      return res.status(404).json({ error: 'City not found' });
    }

    const cityData = cityDoc.data()!;
    const sharedFlightId = cityData.sharedFlightId;

    if (!sharedFlightId) {
      return res.status(400).json({ error: 'This flight is not shared' });
    }

    // Get shared flight
    const sharedFlightDoc = await db().collection('sharedFlights').doc(sharedFlightId).get();
    if (!sharedFlightDoc.exists) {
      return res.status(404).json({ error: 'Shared flight not found' });
    }

    const sharedFlightData = sharedFlightDoc.data() as SharedFlightDocument;

    // Verify user is a participant
    if (!sharedFlightData.participants[userId]) {
      return res.status(403).json({ error: 'You are not a participant in this shared flight' });
    }

    // Build merged contributions with usernames
    const contributions = [];
    for (const [uid, contribution] of Object.entries(sharedFlightData.contributions)) {
      const userDoc = await db().collection('users').doc(uid).get();
      const username = userDoc.data()?.username || 'Unknown';

      contributions.push({
        uid,
        username,
        photos: contribution.photos,
        videos: contribution.videos,
        memories: contribution.memories,
        contributedAt: contribution.contributedAt,
      });
    }

    res.json({ contributions });
  } catch (error) {
    console.error('Error getting contributions:', error);
    res.status(500).json({ error: 'Failed to get contributions' });
  }
});

// Add contribution to shared flight
router.post('/flights/:cityId/contribute', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { cityId } = req.params;
    const { photos, videos, memories } = req.body;
    const userId = req.user!.uid;

    // Get the city
    const cityDoc = await db().collection('cities').doc(cityId).get();
    if (!cityDoc.exists) {
      return res.status(404).json({ error: 'City not found' });
    }

    const cityData = cityDoc.data()!;
    const sharedFlightId = cityData.sharedFlightId;

    if (!sharedFlightId) {
      return res.status(400).json({ error: 'This flight is not shared' });
    }

    // Get shared flight
    const sharedFlightRef = db().collection('sharedFlights').doc(sharedFlightId);
    const sharedFlightDoc = await sharedFlightRef.get();

    if (!sharedFlightDoc.exists) {
      return res.status(404).json({ error: 'Shared flight not found' });
    }

    const sharedFlightData = sharedFlightDoc.data() as SharedFlightDocument;

    // Verify user is a participant and has added to globe
    const participant = sharedFlightData.participants[userId];
    if (!participant || !participant.addedToGlobe) {
      return res.status(403).json({ error: 'You must add this flight to your globe to contribute' });
    }

    const now = new Date().toISOString();
    const existingContribution = sharedFlightData.contributions[userId] || {
      photos: [],
      videos: [],
      memories: '',
    };

    const updatedContribution = {
      photos: photos || existingContribution.photos,
      videos: videos || existingContribution.videos,
      memories: memories !== undefined ? memories : existingContribution.memories,
      contributedAt: now,
    };

    await sharedFlightRef.update({
      [`contributions.${userId}`]: updatedContribution,
      updatedAt: now,
    });

    // Also update the user's city copy
    if (participant.cityId) {
      await db().collection('cities').doc(participant.cityId).update({
        photos: updatedContribution.photos,
        videos: updatedContribution.videos,
        memories: updatedContribution.memories,
        updatedAt: now,
      });
    }

    res.json({ contribution: updatedContribution });
  } catch (error) {
    console.error('Error adding contribution:', error);
    res.status(500).json({ error: 'Failed to add contribution' });
  }
});

export default router;
