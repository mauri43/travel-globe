import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore } from '../../store/socialStore';
import type { SharedFlightPending } from '../../types/social';

interface SharedFlightsTabProps {
  onFlightAdded?: (cityId: string) => void;
}

export function SharedFlightsTab({ onFlightAdded }: SharedFlightsTabProps) {
  const {
    pendingSharedFlights,
    sharedFlightsLoading,
    loadPendingSharedFlights,
    respondToFlightShare,
  } = useSocialStore();

  useEffect(() => {
    loadPendingSharedFlights();
  }, [loadPendingSharedFlights]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: 0 }}>
          Shared Flights
          {pendingSharedFlights.length > 0 && (
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
              {pendingSharedFlights.length}
            </span>
          )}
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px', marginTop: '4px' }}>
          Flights that friends have shared with you
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sharedFlightsLoading ? (
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
        ) : pendingSharedFlights.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✈️</div>
            <div>No pending shared flights</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>
              When friends share flights with you, they'll appear here
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {pendingSharedFlights.map((flight) => (
              <SharedFlightCard
                key={flight.sharedFlightId}
                flight={flight}
                onRespond={respondToFlightShare}
                onFlightAdded={onFlightAdded}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface SharedFlightCardProps {
  flight: SharedFlightPending;
  onRespond: (sharedFlightId: string, approve: boolean, addToGlobe: boolean) => Promise<string | null>;
  onFlightAdded?: (cityId: string) => void;
}

function SharedFlightCard({ flight, onRespond, onFlightAdded }: SharedFlightCardProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [showAddToGlobeChoice, setShowAddToGlobeChoice] = useState(false);

  const handleApprove = () => {
    setShowAddToGlobeChoice(true);
  };

  const handleDecline = async () => {
    setIsResponding(true);
    try {
      await onRespond(flight.sharedFlightId, false, false);
    } finally {
      setIsResponding(false);
    }
  };

  const handleAddToGlobeChoice = async (addToGlobe: boolean) => {
    setIsResponding(true);
    try {
      const cityId = await onRespond(flight.sharedFlightId, true, addToGlobe);
      if (cityId && onFlightAdded) {
        onFlightAdded(cityId);
      }
    } finally {
      setIsResponding(false);
    }
  };

  const formatDates = (dates: string[]) => {
    if (!dates || dates.length === 0) return '';
    if (dates.length === 1) {
      return new Date(dates[0]).toLocaleDateString();
    }
    return `${new Date(dates[0]).toLocaleDateString()} - ${new Date(dates[1]).toLocaleDateString()}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
      }}
    >
      {/* Flight info */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>✈️</span>
          <div>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
              {flight.originalFlight.name}, {flight.originalFlight.country}
            </div>
            {flight.originalFlight.dates.length > 0 && (
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
                {formatDates(flight.originalFlight.dates)}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '13px',
          }}
        >
          <span>Shared by</span>
          <span style={{ color: '#60a5fa', fontWeight: '500' }}>@{flight.sharedBy.username}</span>
          <span>•</span>
          <span>{new Date(flight.invitedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      {!showAddToGlobeChoice ? (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleApprove}
            disabled={isResponding}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isResponding ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Accept
          </button>
          <button
            onClick={handleDecline}
            disabled={isResponding}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              borderRadius: '8px',
              cursor: isResponding ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isResponding ? 'Declining...' : 'Decline'}
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div
            style={{
              color: 'white',
              fontSize: '14px',
              marginBottom: '12px',
              fontWeight: '500',
            }}
          >
            Add this flight to your globe?
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleAddToGlobeChoice(true)}
              disabled={isResponding}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isResponding ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isResponding ? 0.7 : 1,
              }}
            >
              {isResponding ? 'Adding...' : '🌍 Yes, add to my globe'}
            </button>
            <button
              onClick={() => handleAddToGlobeChoice(false)}
              disabled={isResponding}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                border: 'none',
                borderRadius: '8px',
                cursor: isResponding ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isResponding ? 0.7 : 1,
              }}
            >
              No, just approve
            </button>
          </div>
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '12px',
              marginTop: '8px',
              textAlign: 'center',
            }}
          >
            If you add it, you can add your own photos and memories
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
