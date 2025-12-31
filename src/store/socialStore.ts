import { create } from 'zustand';
import * as socialApi from '../services/socialApi';
import type {
  PublicUserProfile,
  FriendWithProfile,
  FriendRequest,
  SentFriendRequest,
  PublicFlight,
  SharedFlightPending,
  Notification,
  ProfileVisibility,
  FlightTagPermission,
} from '../types/social';

export type SocialTab = 'friends' | 'followers' | 'notifications' | 'shared' | 'search';

interface SocialState {
  // User's social profile
  username: string | null;
  displayName: string | null;
  profileVisibility: ProfileVisibility;
  flightTagDefault: FlightTagPermission;

  // Friends
  friends: FriendWithProfile[];
  pendingRequests: FriendRequest[];
  sentRequests: SentFriendRequest[];
  friendsLoading: boolean;

  // Followers
  followers: PublicUserProfile[];
  following: PublicUserProfile[];
  followersLoading: boolean;

  // Shared flights
  pendingSharedFlights: SharedFlightPending[];
  sharedFlightsLoading: boolean;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;

  // UI state
  socialHubOpen: boolean;
  activeTab: SocialTab;
  searchResults: PublicUserProfile[];
  searchQuery: string;
  searchLoading: boolean;

  // Viewing other user's globe
  viewingProfile: PublicUserProfile | null;
  viewingGlobe: PublicFlight[] | null;
  viewingAccessLevel: 'friend' | 'follower' | null;

  // Username setup modal
  usernameSetupOpen: boolean;

  // Actions - UI
  setSocialHubOpen: (open: boolean) => void;
  setActiveTab: (tab: SocialTab) => void;
  setUsernameSetupOpen: (open: boolean) => void;
  clearViewingGlobe: () => void;

  // Actions - Profile
  loadSocialProfile: () => Promise<void>;
  setUsername: (username: string) => Promise<boolean>;
  checkUsernameAvailable: (username: string) => Promise<{ available: boolean; suggestion?: string }>;
  updateVisibility: (visibility: ProfileVisibility) => Promise<void>;
  updateFlightTagDefault: (setting: FlightTagPermission) => Promise<void>;

  // Actions - Friends
  loadFriends: () => Promise<void>;
  loadFriendRequests: () => Promise<void>;
  sendFriendRequest: (username: string) => Promise<void>;
  respondToFriendRequest: (friendshipId: string, accept: boolean) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  setFriendFlightOverride: (friendshipId: string, override: FlightTagPermission | null) => Promise<void>;

  // Actions - Followers
  loadFollowers: () => Promise<void>;
  loadFollowing: () => Promise<void>;
  followUser: (username: string) => Promise<void>;
  unfollowUser: (username: string) => Promise<void>;

  // Actions - Search
  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Actions - Globe viewing
  viewUserGlobe: (username: string) => Promise<void>;

  // Actions - Shared flights
  loadPendingSharedFlights: () => Promise<void>;
  respondToFlightShare: (sharedFlightId: string, approve: boolean, addToGlobe: boolean) => Promise<string | null>;
  shareFlightWithFriends: (cityId: string, friendUsernames: string[]) => Promise<string>;

  // Actions - Notifications
  loadNotifications: () => Promise<void>;
  markNotificationsRead: (ids: string[] | 'all') => Promise<void>;
  refreshUnreadCount: () => Promise<void>;

  // Reset state
  resetSocialState: () => void;
}

const initialState = {
  username: null,
  displayName: null,
  profileVisibility: 'private' as ProfileVisibility,
  flightTagDefault: 'approve_required' as FlightTagPermission,
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  friendsLoading: false,
  followers: [],
  following: [],
  followersLoading: false,
  pendingSharedFlights: [],
  sharedFlightsLoading: false,
  notifications: [],
  unreadCount: 0,
  notificationsLoading: false,
  socialHubOpen: false,
  activeTab: 'friends' as SocialTab,
  searchResults: [],
  searchQuery: '',
  searchLoading: false,
  viewingProfile: null,
  viewingGlobe: null,
  viewingAccessLevel: null,
  usernameSetupOpen: false,
};

export const useSocialStore = create<SocialState>()((set, get) => ({
  ...initialState,

  // UI Actions
  setSocialHubOpen: (open) => {
    set({ socialHubOpen: open });
    // Check if username needs to be set
    if (open && !get().username) {
      set({ usernameSetupOpen: true });
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setUsernameSetupOpen: (open) => set({ usernameSetupOpen: open }),

  clearViewingGlobe: () => set({
    viewingProfile: null,
    viewingGlobe: null,
    viewingAccessLevel: null,
  }),

  // Profile Actions
  loadSocialProfile: async () => {
    try {
      const profile = await socialApi.getMyProfile();
      set({
        username: profile.username,
        displayName: profile.displayName,
        profileVisibility: profile.profileVisibility,
        flightTagDefault: profile.flightTagDefault,
      });
    } catch {
      // Failed to load profile - this is expected for new users or network issues
    }
  },

  setUsername: async (username) => {
    try {
      const result = await socialApi.setUsername(username);
      set({ username: result.username, usernameSetupOpen: false });
      return true;
    } catch (error) {
      console.error('Failed to set username:', error);
      return false;
    }
  },

  checkUsernameAvailable: async (username) => {
    try {
      return await socialApi.checkUsernameAvailable(username);
    } catch {
      return { available: false };
    }
  },

  updateVisibility: async (visibility) => {
    try {
      await socialApi.updateProfileVisibility(visibility);
      set({ profileVisibility: visibility });
    } catch (error) {
      console.error('Failed to update visibility:', error);
      throw error;
    }
  },

  updateFlightTagDefault: async (setting) => {
    try {
      await socialApi.updateFlightTagDefault(setting);
      set({ flightTagDefault: setting });
    } catch (error) {
      console.error('Failed to update flight tag default:', error);
      throw error;
    }
  },

  // Friends Actions
  loadFriends: async () => {
    set({ friendsLoading: true });
    try {
      const [friendsResult, requestsResult, sentResult] = await Promise.all([
        socialApi.getFriends(),
        socialApi.getFriendRequests(),
        socialApi.getSentFriendRequests(),
      ]);
      set({
        friends: friendsResult.friends,
        pendingRequests: requestsResult.requests,
        sentRequests: sentResult.requests,
        friendsLoading: false,
      });
    } catch (error) {
      console.error('Failed to load friends:', error);
      set({ friendsLoading: false });
    }
  },

  loadFriendRequests: async () => {
    try {
      const [requestsResult, sentResult] = await Promise.all([
        socialApi.getFriendRequests(),
        socialApi.getSentFriendRequests(),
      ]);
      set({
        pendingRequests: requestsResult.requests,
        sentRequests: sentResult.requests,
      });
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  },

  sendFriendRequest: async (username) => {
    try {
      await socialApi.sendFriendRequest(username);
      // Refresh requests list
      await get().loadFriendRequests();
      // Update search results to reflect the new request
      set((state) => ({
        searchResults: state.searchResults.map((user) =>
          user.username.toLowerCase() === username.toLowerCase()
            ? {
                ...user,
                relationship: {
                  ...user.relationship,
                  hasPendingRequest: true,
                  pendingRequestDirection: 'outgoing',
                },
              }
            : user
        ),
      }));
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  },

  respondToFriendRequest: async (friendshipId, accept) => {
    try {
      await socialApi.respondToFriendRequest(friendshipId, accept ? 'accept' : 'decline');
      // Refresh friends list
      await get().loadFriends();
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
      throw error;
    }
  },

  removeFriend: async (friendshipId) => {
    try {
      await socialApi.removeFriend(friendshipId);
      set((state) => ({
        friends: state.friends.filter((f) => f.friendshipId !== friendshipId),
      }));
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  },

  setFriendFlightOverride: async (friendshipId, override) => {
    try {
      await socialApi.setFriendFlightOverride(friendshipId, override);
      set((state) => ({
        friends: state.friends.map((f) =>
          f.friendshipId === friendshipId ? { ...f, flightTagOverride: override || undefined } : f
        ),
      }));
    } catch (error) {
      console.error('Failed to set flight override:', error);
      throw error;
    }
  },

  // Followers Actions
  loadFollowers: async () => {
    set({ followersLoading: true });
    try {
      const result = await socialApi.getFollowers();
      set({ followers: result.followers, followersLoading: false });
    } catch (error) {
      console.error('Failed to load followers:', error);
      set({ followersLoading: false });
    }
  },

  loadFollowing: async () => {
    set({ followersLoading: true });
    try {
      const result = await socialApi.getFollowing();
      set({ following: result.following, followersLoading: false });
    } catch (error) {
      console.error('Failed to load following:', error);
      set({ followersLoading: false });
    }
  },

  followUser: async (username) => {
    try {
      await socialApi.followUser(username);
      // Update search results
      set((state) => ({
        searchResults: state.searchResults.map((user) =>
          user.username.toLowerCase() === username.toLowerCase()
            ? { ...user, relationship: { ...user.relationship, isFollowing: true } }
            : user
        ),
      }));
      // Refresh following list
      await get().loadFollowing();
    } catch (error) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  },

  unfollowUser: async (username) => {
    try {
      await socialApi.unfollowUser(username);
      set((state) => ({
        following: state.following.filter(
          (u) => u.username.toLowerCase() !== username.toLowerCase()
        ),
        searchResults: state.searchResults.map((user) =>
          user.username.toLowerCase() === username.toLowerCase()
            ? { ...user, relationship: { ...user.relationship, isFollowing: false } }
            : user
        ),
      }));
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  },

  // Search Actions
  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: '' });
      return;
    }

    set({ searchLoading: true, searchQuery: query });
    try {
      const result = await socialApi.searchUsers(query);
      set({ searchResults: result.users, searchLoading: false });
    } catch (error) {
      console.error('Failed to search users:', error);
      set({ searchResults: [], searchLoading: false });
    }
  },

  clearSearch: () => set({ searchResults: [], searchQuery: '' }),

  // Globe viewing Actions
  viewUserGlobe: async (username) => {
    try {
      const [profile, globe] = await Promise.all([
        socialApi.getProfile(username),
        socialApi.getProfileGlobe(username),
      ]);
      set({
        viewingProfile: profile,
        viewingGlobe: globe.flights,
        viewingAccessLevel: globe.accessLevel,
      });
    } catch (error) {
      console.error('Failed to load globe:', error);
      throw error;
    }
  },

  // Shared flights Actions
  loadPendingSharedFlights: async () => {
    set({ sharedFlightsLoading: true });
    try {
      const result = await socialApi.getPendingSharedFlights();
      set({ pendingSharedFlights: result.sharedFlights, sharedFlightsLoading: false });
    } catch (error) {
      console.error('Failed to load shared flights:', error);
      set({ sharedFlightsLoading: false });
    }
  },

  respondToFlightShare: async (sharedFlightId, approve, addToGlobe) => {
    try {
      const result = await socialApi.respondToFlightShare(
        sharedFlightId,
        approve ? 'approve' : 'decline',
        addToGlobe
      );
      // Remove from pending list
      set((state) => ({
        pendingSharedFlights: state.pendingSharedFlights.filter(
          (f) => f.sharedFlightId !== sharedFlightId
        ),
      }));
      return result.cityId || null;
    } catch (error) {
      console.error('Failed to respond to flight share:', error);
      throw error;
    }
  },

  shareFlightWithFriends: async (cityId, friendUsernames) => {
    try {
      const result = await socialApi.shareFlightWithFriends(cityId, friendUsernames);
      return result.sharedFlightId;
    } catch (error) {
      console.error('Failed to share flight:', error);
      throw error;
    }
  },

  // Notifications Actions
  loadNotifications: async () => {
    set({ notificationsLoading: true });
    try {
      const result = await socialApi.getNotifications();
      set({
        notifications: result.notifications,
        unreadCount: result.unreadCount,
        notificationsLoading: false,
      });
    } catch (error) {
      console.error('Failed to load notifications:', error);
      set({ notificationsLoading: false });
    }
  },

  markNotificationsRead: async (ids) => {
    try {
      await socialApi.markNotificationsRead(ids);
      if (ids === 'all') {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      } else {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            ids.includes(n.id) ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - ids.length),
        }));
      }
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
      throw error;
    }
  },

  refreshUnreadCount: async () => {
    try {
      const result = await socialApi.getNotificationCount();
      set({ unreadCount: result.count });
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  },

  // Reset
  resetSocialState: () => set(initialState),
}));
