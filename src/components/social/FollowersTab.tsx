import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore } from '../../store/socialStore';
import type { PublicUserProfile } from '../../types/social';

interface FollowersTabProps {
  onViewGlobe: (username: string) => void;
}

export function FollowersTab({ onViewGlobe }: FollowersTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'followers' | 'following'>('followers');
  const {
    followers,
    following,
    followersLoading,
    loadFollowers,
    loadFollowing,
    unfollowUser,
    sendFriendRequest,
  } = useSocialStore();

  useEffect(() => {
    if (activeSubTab === 'followers') {
      loadFollowers();
    } else {
      loadFollowing();
    }
  }, [activeSubTab, loadFollowers, loadFollowing]);

  const currentList = activeSubTab === 'followers' ? followers : following;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          padding: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '10px',
        }}
      >
        <button
          onClick={() => setActiveSubTab('followers')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeSubTab === 'followers' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
            color: activeSubTab === 'followers' ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Followers ({followers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('following')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: activeSubTab === 'following' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
            color: activeSubTab === 'following' ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Following ({following.length})
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {followersLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            Loading...
          </div>
        ) : currentList.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {activeSubTab === 'followers' ? '👥' : '🌍'}
            </div>
            <div>
              {activeSubTab === 'followers'
                ? 'No followers yet. Make your profile public to get followers!'
                : "You're not following anyone yet."}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {currentList.map((user) => (
              <FollowerCard
                key={user.uid}
                user={user}
                type={activeSubTab}
                onUnfollow={unfollowUser}
                onSendRequest={sendFriendRequest}
                onViewGlobe={onViewGlobe}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface FollowerCardProps {
  user: PublicUserProfile;
  type: 'followers' | 'following';
  onUnfollow: (username: string) => Promise<void>;
  onSendRequest: (username: string) => Promise<void>;
  onViewGlobe: (username: string) => void;
}

function FollowerCard({ user, type, onUnfollow, onSendRequest, onViewGlobe }: FollowerCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);

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

  const { relationship } = user;
  const isPrivate = user.profileVisibility === 'private';
  const canViewGlobe = relationship.isFriend || (!isPrivate && relationship.isFollowing);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: relationship.isFriend
              ? 'rgba(34, 197, 94, 0.3)'
              : 'rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'white',
            flexShrink: 0,
          }}
        >
          {user.username.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>
              @{user.username}
            </span>
            {relationship.isFriend && (
              <span
                style={{
                  padding: '2px 6px',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  borderRadius: '8px',
                  fontSize: '10px',
                }}
              >
                Friend
              </span>
            )}
          </div>
          {user.displayName && (
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
              {user.displayName}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* View Globe */}
          {canViewGlobe && (
            <button
              onClick={() => onViewGlobe(user.username)}
              style={{
                padding: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              title="View Globe"
            >
              🌍
            </button>
          )}

          {/* Add Friend (if not already friends) */}
          {!relationship.isFriend && !relationship.hasPendingRequest && (
            <button
              onClick={handleSendRequest}
              disabled={isLoading}
              style={{
                padding: '8px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: isLoading && actionType === 'friend' ? 0.7 : 1,
              }}
            >
              {isLoading && actionType === 'friend' ? '...' : '+ Friend'}
            </button>
          )}

          {/* Unfollow (only in "following" tab) */}
          {type === 'following' && (
            <button
              onClick={handleUnfollow}
              disabled={isLoading}
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: isLoading && actionType === 'unfollow' ? 0.7 : 1,
              }}
            >
              {isLoading && actionType === 'unfollow' ? '...' : 'Unfollow'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
