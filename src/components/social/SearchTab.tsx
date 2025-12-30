import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore } from '../../store/socialStore';
import type { PublicUserProfile } from '../../types/social';

interface SearchTabProps {
  onViewGlobe: (username: string) => void;
}

export function SearchTab({ onViewGlobe }: SearchTabProps) {
  const [query, setQuery] = useState('');
  const {
    searchResults,
    searchLoading,
    searchUsers,
    clearSearch,
    sendFriendRequest,
    followUser,
    unfollowUser,
  } = useSocialStore();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      clearSearch();
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchUsers, clearSearch]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Input */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '16px',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            autoFocus
            style={{
              width: '100%',
              padding: '14px 14px 14px 44px',
              fontSize: '15px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              color: 'white',
              outline: 'none',
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                clearSearch();
              }}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {searchLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            Searching...
          </div>
        ) : !query.trim() ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div>Search for users by their username</div>
          </div>
        ) : searchResults.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
            <div>No users found for "{query}"</div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {searchResults.map((user) => (
              <UserSearchResult
                key={user.uid}
                user={user}
                onSendRequest={sendFriendRequest}
                onFollow={followUser}
                onUnfollow={unfollowUser}
                onViewGlobe={onViewGlobe}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface UserSearchResultProps {
  user: PublicUserProfile;
  onSendRequest: (username: string) => Promise<void>;
  onFollow: (username: string) => Promise<void>;
  onUnfollow: (username: string) => Promise<void>;
  onViewGlobe: (username: string) => void;
}

function UserSearchResult({
  user,
  onSendRequest,
  onFollow,
  onUnfollow,
  onViewGlobe,
}: UserSearchResultProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);

  const handleSendRequest = async () => {
    setIsLoading(true);
    setActionType('friend');
    try {
      await onSendRequest(user.username);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleFollow = async () => {
    setIsLoading(true);
    setActionType('follow');
    try {
      await onFollow(user.username);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleUnfollow = async () => {
    setIsLoading(true);
    setActionType('unfollow');
    try {
      await onUnfollow(user.username);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const { relationship } = user;
  const isPrivate = user.profileVisibility === 'private';
  const canViewGlobe = relationship.isFriend || (!isPrivate && relationship.isFollowing);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Avatar */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: relationship.isFriend
              ? 'rgba(34, 197, 94, 0.3)'
              : 'rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: 'white',
            flexShrink: 0,
          }}
        >
          {user.username.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>
              @{user.username}
            </span>
            {isPrivate && (
              <span
                style={{
                  padding: '2px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '10px',
                  fontSize: '11px',
                }}
              >
                🔒 Private
              </span>
            )}
            {relationship.isFriend && (
              <span
                style={{
                  padding: '2px 8px',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  borderRadius: '10px',
                  fontSize: '11px',
                }}
              >
                ✓ Friends
              </span>
            )}
          </div>
          {user.displayName && (
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px', marginTop: '2px' }}>
              {user.displayName}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '6px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '12px',
            }}
          >
            <span>{user.friendCount} friends</span>
            <span>{user.followerCount} followers</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Friend button */}
        {relationship.isFriend ? (
          <span
            style={{
              padding: '8px 14px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              color: '#4ade80',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            ✓ Friends
          </span>
        ) : relationship.hasPendingRequest ? (
          <span
            style={{
              padding: '8px 14px',
              backgroundColor: 'rgba(251, 191, 36, 0.15)',
              color: '#fbbf24',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            {relationship.pendingRequestDirection === 'outgoing' ? 'Request Sent' : 'Respond to Request'}
          </span>
        ) : (
          <button
            onClick={handleSendRequest}
            disabled={isLoading}
            style={{
              padding: '8px 14px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              opacity: isLoading && actionType === 'friend' ? 0.7 : 1,
            }}
          >
            {isLoading && actionType === 'friend' ? '...' : '+ Add Friend'}
          </button>
        )}

        {/* Follow button (only for public profiles, non-friends) */}
        {!isPrivate && !relationship.isFriend && (
          relationship.isFollowing ? (
            <button
              onClick={handleUnfollow}
              disabled={isLoading}
              style={{
                padding: '8px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: isLoading && actionType === 'unfollow' ? 0.7 : 1,
              }}
            >
              {isLoading && actionType === 'unfollow' ? '...' : 'Following ✓'}
            </button>
          ) : (
            <button
              onClick={handleFollow}
              disabled={isLoading}
              style={{
                padding: '8px 14px',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                color: '#a78bfa',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: isLoading && actionType === 'follow' ? 0.7 : 1,
              }}
            >
              {isLoading && actionType === 'follow' ? '...' : 'Follow'}
            </button>
          )
        )}

        {/* View Globe button */}
        {canViewGlobe && (
          <button
            onClick={() => onViewGlobe(user.username)}
            style={{
              padding: '8px 14px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            🌍 View Globe
          </button>
        )}
      </div>
    </motion.div>
  );
}
