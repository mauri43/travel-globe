import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSocialStore } from '../../store/socialStore';
import { FriendCard } from './FriendCard';
import { IncomingRequestCard, SentRequestCard } from './FriendRequestCard';

interface FriendsTabProps {
  onViewGlobe: (username: string) => void;
}

export function FriendsTab({ onViewGlobe }: FriendsTabProps) {
  const {
    friends,
    pendingRequests,
    sentRequests,
    friendsLoading,
    loadFriends,
    respondToFriendRequest,
    removeFriend,
    setFriendFlightOverride,
    setActiveTab,
  } = useSocialStore();

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const hasRequests = pendingRequests.length > 0;
  const hasSentRequests = sentRequests.length > 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Incoming Requests Section */}
      {hasRequests && (
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: 0 }}>
              Friend Requests
              <span
                style={{
                  marginLeft: '8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              >
                {pendingRequests.length}
              </span>
            </h3>
          </div>
          <AnimatePresence mode="popLayout">
            {pendingRequests.map((request) => (
              <IncomingRequestCard
                key={request.friendshipId}
                request={request}
                onRespond={respondToFriendRequest}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Sent Requests Section */}
      {hasSentRequests && (
        <div style={{ marginBottom: '20px' }}>
          <h3
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '12px',
            }}
          >
            Sent Requests ({sentRequests.length})
          </h3>
          <AnimatePresence mode="popLayout">
            {sentRequests.map((request) => (
              <SentRequestCard key={request.friendshipId} request={request} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Friends List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: 0 }}>
            Friends ({friends.length})
          </h3>
          <button
            onClick={() => setActiveTab('search')}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>+</span> Add Friend
          </button>
        </div>

        {friendsLoading ? (
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
        ) : friends.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <div style={{ marginBottom: '8px' }}>No friends yet</div>
            <button
              onClick={() => setActiveTab('search')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Find Friends
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {friends.map((friend) => (
              <FriendCard
                key={friend.friendshipId}
                friend={friend}
                onRemove={removeFriend}
                onSetFlightOverride={setFriendFlightOverride}
                onViewGlobe={onViewGlobe}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
