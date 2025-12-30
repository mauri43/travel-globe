import { getIdToken } from './firebase';
import type {
  PublicUserProfile,
  FriendWithProfile,
  FriendRequest,
  SentFriendRequest,
  SharedFlightPending,
  FlightContribution,
  Notification,
  ProfileVisibility,
  FlightTagPermission,
  GlobeViewResult,
} from '../types/social';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getIdToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ==========================================
// USERNAME
// ==========================================

export async function checkUsernameAvailable(username: string): Promise<{
  available: boolean;
  suggestion?: string;
  error?: string;
  currentlyYours?: boolean;
}> {
  return fetchWithAuth(`/api/social/username/check/${encodeURIComponent(username)}`);
}

export async function setUsername(username: string): Promise<{ username: string }> {
  return fetchWithAuth('/api/social/username', {
    method: 'PUT',
    body: JSON.stringify({ username }),
  });
}

// ==========================================
// PROFILE
// ==========================================

export async function getProfile(username: string): Promise<PublicUserProfile> {
  return fetchWithAuth(`/api/social/profile/${encodeURIComponent(username)}`);
}

export async function getProfileGlobe(username: string): Promise<GlobeViewResult> {
  return fetchWithAuth(`/api/social/profile/${encodeURIComponent(username)}/globe`);
}

export async function getProfileGlobeDetails(username: string): Promise<{ cities: any[] }> {
  return fetchWithAuth(`/api/social/profile/${encodeURIComponent(username)}/globe/details`);
}

export async function updateProfileVisibility(visibility: ProfileVisibility): Promise<{ profileVisibility: ProfileVisibility }> {
  return fetchWithAuth('/api/social/settings/visibility', {
    method: 'PUT',
    body: JSON.stringify({ visibility }),
  });
}

export async function updateFlightTagDefault(flightTagDefault: FlightTagPermission): Promise<{ flightTagDefault: FlightTagPermission }> {
  return fetchWithAuth('/api/social/settings/flight-tag-default', {
    method: 'PUT',
    body: JSON.stringify({ flightTagDefault }),
  });
}

// ==========================================
// SEARCH
// ==========================================

export async function searchUsers(query: string, limit = 10): Promise<{ users: PublicUserProfile[] }> {
  return fetchWithAuth(`/api/social/search/users?q=${encodeURIComponent(query)}&limit=${limit}`);
}

// ==========================================
// FRIENDS
// ==========================================

export async function getFriends(): Promise<{ friends: FriendWithProfile[] }> {
  return fetchWithAuth('/api/social/friends');
}

export async function getFriendRequests(): Promise<{ requests: FriendRequest[] }> {
  return fetchWithAuth('/api/social/friends/requests');
}

export async function getSentFriendRequests(): Promise<{ requests: SentFriendRequest[] }> {
  return fetchWithAuth('/api/social/friends/sent');
}

export async function sendFriendRequest(username: string): Promise<{ friendshipId: string }> {
  return fetchWithAuth('/api/social/friends/request', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function respondToFriendRequest(
  friendshipId: string,
  action: 'accept' | 'decline'
): Promise<{ status: string }> {
  return fetchWithAuth('/api/social/friends/respond', {
    method: 'POST',
    body: JSON.stringify({ friendshipId, action }),
  });
}

export async function removeFriend(friendshipId: string): Promise<{ message: string }> {
  return fetchWithAuth(`/api/social/friends/${friendshipId}`, {
    method: 'DELETE',
  });
}

export async function setFriendFlightOverride(
  friendshipId: string,
  override: FlightTagPermission | null
): Promise<{ override: FlightTagPermission | null }> {
  return fetchWithAuth(`/api/social/friends/${friendshipId}/flight-override`, {
    method: 'PUT',
    body: JSON.stringify({ override }),
  });
}

// ==========================================
// FOLLOWERS
// ==========================================

export async function getFollowers(): Promise<{ followers: PublicUserProfile[] }> {
  return fetchWithAuth('/api/social/followers');
}

export async function getFollowing(): Promise<{ following: PublicUserProfile[] }> {
  return fetchWithAuth('/api/social/following');
}

export async function followUser(username: string): Promise<{ message: string }> {
  return fetchWithAuth('/api/social/follow', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function unfollowUser(username: string): Promise<{ message: string }> {
  return fetchWithAuth(`/api/social/follow/${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export async function getNotifications(
  unreadOnly = false,
  limit = 50
): Promise<{ notifications: Notification[]; unreadCount: number }> {
  return fetchWithAuth(`/api/social/notifications?unreadOnly=${unreadOnly}&limit=${limit}`);
}

export async function markNotificationsRead(
  notificationIds: string[] | 'all'
): Promise<{ message: string }> {
  return fetchWithAuth('/api/social/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ notificationIds }),
  });
}

export async function getNotificationCount(): Promise<{ count: number }> {
  return fetchWithAuth('/api/social/notifications/count');
}

// ==========================================
// FLIGHT SHARING
// ==========================================

export async function shareFlightWithFriends(
  cityId: string,
  friendUsernames: string[]
): Promise<{ sharedFlightId: string }> {
  return fetchWithAuth(`/api/social/flights/${cityId}/share`, {
    method: 'POST',
    body: JSON.stringify({ friendUsernames }),
  });
}

export async function getPendingSharedFlights(): Promise<{ sharedFlights: SharedFlightPending[] }> {
  return fetchWithAuth('/api/social/flights/shared');
}

export async function respondToFlightShare(
  sharedFlightId: string,
  action: 'approve' | 'decline',
  addToGlobe: boolean
): Promise<{ status: string; cityId?: string }> {
  return fetchWithAuth(`/api/social/flights/shared/${sharedFlightId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ action, addToGlobe }),
  });
}

export async function getFlightContributions(cityId: string): Promise<{ contributions: FlightContribution[] }> {
  return fetchWithAuth(`/api/social/flights/${cityId}/contributions`);
}

export async function addFlightContribution(
  cityId: string,
  contribution: { photos?: string[]; videos?: string[]; memories?: string }
): Promise<{ contribution: FlightContribution }> {
  return fetchWithAuth(`/api/social/flights/${cityId}/contribute`, {
    method: 'POST',
    body: JSON.stringify(contribution),
  });
}
