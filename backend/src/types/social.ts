// Social feature type definitions

// Profile visibility
export type ProfileVisibility = 'public' | 'private';

// Flight tag permission levels
export type FlightTagPermission = 'approve_required' | 'auto_approve' | 'auto_deny';

// Friendship status
export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

// Shared flight participant status
export type ParticipantStatus = 'pending' | 'approved' | 'declined' | 'added';

// Notification types
export type NotificationType =
  | 'friend_request'
  | 'friend_request_accepted'
  | 'flight_tag'
  | 'flight_tag_accepted'
  | 'flight_tag_auto_added'
  | 'new_follower';

// User document with social fields
export interface UserDocument {
  uid: string;
  email: string;
  trustedEmails: string[];
  tourCompleted?: boolean;
  defaultFromCity?: {
    name: string;
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt?: string;

  // Social fields
  username?: string;
  displayName?: string;
  profileVisibility: ProfileVisibility;
  flightTagDefault: FlightTagPermission;
  friendCount: number;
  followerCount: number;
  followingCount: number;
  unreadNotificationCount: number;
}

// Username document (for uniqueness)
export interface UsernameDocument {
  uid: string;
  username: string;
  createdAt: string;
}

// Friendship document
export interface FriendshipDocument {
  id?: string;
  userIds: [string, string];
  user1Uid: string;
  user2Uid: string;
  status: FriendshipStatus;
  requestedBy: string;
  requestedAt: string;
  respondedAt?: string;
  user1FlightTagOverride?: FlightTagPermission;
  user2FlightTagOverride?: FlightTagPermission;
  createdAt: string;
  updatedAt: string;
}

// Follow document
export interface FollowDocument {
  id?: string;
  followerUid: string;
  followedUid: string;
  createdAt: string;
}

// Shared flight participant
export interface SharedFlightParticipant {
  cityId: string | null;
  status: ParticipantStatus;
  addedToGlobe: boolean;
  invitedAt: string;
  respondedAt?: string;
}

// Shared flight contribution
export interface SharedFlightContribution {
  photos: string[];
  videos: string[];
  memories: string;
  contributedAt: string;
}

// Shared flight document
export interface SharedFlightDocument {
  id?: string;
  originalCityId: string;
  originalOwnerId: string;
  participants: Record<string, SharedFlightParticipant>;
  contributions: Record<string, SharedFlightContribution>;
  createdAt: string;
  updatedAt: string;
}

// Notification document
export interface NotificationDocument {
  id?: string;
  recipientUid: string;
  type: NotificationType;
  data: {
    fromUid?: string;
    fromUsername?: string;
    friendshipId?: string;
    sharedFlightId?: string;
    flightName?: string;
    followerUid?: string;
    followerUsername?: string;
  };
  read: boolean;
  createdAt: string;
}

// API Response types
export interface PublicUserProfile {
  uid: string;
  username: string;
  displayName?: string;
  profileVisibility: ProfileVisibility;
  friendCount: number;
  followerCount: number;
  followingCount: number;
  relationship: {
    isFriend: boolean;
    friendshipId?: string;
    isFollowing: boolean;
    isFollowedBy: boolean;
    hasPendingRequest: boolean;
    pendingRequestDirection?: 'incoming' | 'outgoing';
  };
}

export interface FriendWithProfile extends PublicUserProfile {
  friendshipId: string;
  friendSince: string;
  flightTagOverride?: FlightTagPermission;
}

export interface PublicFlight {
  id: string;
  flewFrom: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string; country: string };
}

export interface SharedFlightPending {
  sharedFlightId: string;
  originalFlight: {
    id: string;
    name: string;
    country: string;
    dates: string[];
  };
  sharedBy: {
    uid: string;
    username: string;
  };
  invitedAt: string;
}
