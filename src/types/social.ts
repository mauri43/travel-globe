// Social feature type definitions for frontend

// Profile visibility
export type ProfileVisibility = 'public' | 'private';

// Flight tag permission levels
export type FlightTagPermission = 'approve_required' | 'auto_approve' | 'auto_deny';

// Notification types
export type NotificationType =
  | 'friend_request'
  | 'friend_request_accepted'
  | 'flight_tag'
  | 'flight_tag_accepted'
  | 'new_follower';

// User's relationship with another user
export interface UserRelationship {
  isFriend: boolean;
  friendshipId?: string;
  isFollowing: boolean;
  isFollowedBy: boolean;
  hasPendingRequest: boolean;
  pendingRequestDirection?: 'incoming' | 'outgoing';
}

// Public user profile (what you see when viewing someone else)
export interface PublicUserProfile {
  uid: string;
  username: string;
  displayName?: string;
  profileVisibility: ProfileVisibility;
  friendCount: number;
  followerCount: number;
  followingCount: number;
  relationship: UserRelationship;
}

// Friend with additional info
export interface FriendWithProfile extends PublicUserProfile {
  friendshipId: string;
  friendSince: string;
  flightTagOverride?: FlightTagPermission;
}

// Friend request (incoming)
export interface FriendRequest {
  friendshipId: string;
  from: {
    uid: string;
    username: string;
    displayName?: string;
  };
  requestedAt: string;
}

// Sent friend request (outgoing)
export interface SentFriendRequest {
  friendshipId: string;
  to: {
    uid: string;
    username: string;
    displayName?: string;
  };
  requestedAt: string;
}

// Public flight (for viewing other's globes - paths only)
export interface PublicFlight {
  id: string;
  flewFrom: {
    lat: number;
    lng: number;
    name: string;
  };
  destination: {
    lat: number;
    lng: number;
    name: string;
    country: string;
  };
}

// Shared flight pending approval
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

// Contribution from a user on a shared flight
export interface FlightContribution {
  uid: string;
  username: string;
  photos: string[];
  videos: string[];
  memories: string;
  contributedAt: string;
}

// Notification
export interface Notification {
  id: string;
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

// Social profile settings
export interface SocialSettings {
  username?: string;
  displayName?: string;
  profileVisibility: ProfileVisibility;
  flightTagDefault: FlightTagPermission;
}

// Globe viewing result
export interface GlobeViewResult {
  flights: PublicFlight[];
  accessLevel: 'friend' | 'follower';
}
