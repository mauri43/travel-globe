import { useState } from 'react';
import { motion } from 'framer-motion';
import type { FriendRequest, SentFriendRequest } from '../../types/social';

interface IncomingRequestCardProps {
  request: FriendRequest;
  onRespond: (friendshipId: string, accept: boolean) => Promise<void>;
}

export function IncomingRequestCard({ request, onRespond }: IncomingRequestCardProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [respondAction, setRespondAction] = useState<'accept' | 'decline' | null>(null);

  const handleRespond = async (accept: boolean) => {
    setIsResponding(true);
    setRespondAction(accept ? 'accept' : 'decline');
    try {
      await onRespond(request.friendshipId, accept);
    } catch {
      setIsResponding(false);
      setRespondAction(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '8px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'white',
            flexShrink: 0,
          }}
        >
          {request.from.username.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>
            @{request.from.username}
          </div>
          {request.from.displayName && (
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
              {request.from.displayName}
            </div>
          )}
          <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginTop: '2px' }}>
            Sent {new Date(request.requestedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleRespond(true)}
            disabled={isResponding}
            style={{
              padding: '8px 14px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isResponding ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              opacity: isResponding && respondAction !== 'accept' ? 0.5 : 1,
            }}
          >
            {isResponding && respondAction === 'accept' ? '...' : 'Accept'}
          </button>
          <button
            onClick={() => handleRespond(false)}
            disabled={isResponding}
            style={{
              padding: '8px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              borderRadius: '8px',
              cursor: isResponding ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              opacity: isResponding && respondAction !== 'decline' ? 0.5 : 1,
            }}
          >
            {isResponding && respondAction === 'decline' ? '...' : 'Decline'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface SentRequestCardProps {
  request: SentFriendRequest;
}

export function SentRequestCard({ request }: SentRequestCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.6)',
            flexShrink: 0,
          }}
        >
          {request.to.username.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600', fontSize: '15px' }}>
            @{request.to.username}
          </div>
          {request.to.displayName && (
            <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' }}>
              {request.to.displayName}
            </div>
          )}
        </div>

        {/* Status */}
        <div
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(251, 191, 36, 0.15)',
            color: '#fbbf24',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          Pending
        </div>
      </div>
    </motion.div>
  );
}
