import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { useSocialStore } from '../store/socialStore';
import { calculateTotalMiles } from '../utils/distance';
import type { City } from '../types';

export function Header() {
  const myCities = useStore((state) => state.cities);
  const setPlacesListOpen = useStore((state) => state.setPlacesListOpen);

  // Check if viewing someone else's globe
  const viewingGlobe = useSocialStore((state) => state.viewingGlobe);
  const viewingProfile = useSocialStore((state) => state.viewingProfile);

  // Convert PublicFlight[] to City[] format for stats calculation
  const viewingCities: City[] = useMemo(() => {
    if (!viewingGlobe) return [];
    return viewingGlobe.map((flight) => ({
      id: flight.id,
      name: flight.destination.name,
      country: flight.destination.country,
      coordinates: {
        lat: flight.destination.lat,
        lng: flight.destination.lng,
      },
      dates: [],
      photos: [],
      videos: [],
      memories: '',
      tags: [],
      flewFrom: {
        name: flight.flewFrom.name,
        coordinates: {
          lat: flight.flewFrom.lat,
          lng: flight.flewFrom.lng,
        },
      },
    }));
  }, [viewingGlobe]);

  // Use viewing cities if viewing someone else's globe, otherwise use own cities
  const cities = viewingGlobe ? viewingCities : myCities;
  const isViewingOther = !!viewingProfile;

  const totalMiles = calculateTotalMiles(cities);

  // Format number with commas
  const formatNumber = (num: number) => num.toLocaleString();

  // Earth's circumference in miles
  const EARTH_CIRCUMFERENCE = 24901;
  // Average commercial flight speed in mph (accounting for takeoff/landing)
  const AVG_FLIGHT_SPEED = 500;

  const timesAroundGlobe = totalMiles / EARTH_CIRCUMFERENCE;
  const totalFlightHours = totalMiles / AVG_FLIGHT_SPEED;
  const flightDays = Math.floor(totalFlightHours / 24);
  const flightHours = Math.round(totalFlightHours % 24);

  const formatTimesAround = (times: number) => {
    if (times < 0.01) return '< 0.01';
    if (times < 1) return times.toFixed(2);
    return times.toFixed(1);
  };

  return (
    <motion.header
      className="header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="header-content">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" />
                <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h1>Travel Memories</h1>
          </div>
          {!isViewingOther && (
            <button
              className="places-list-btn"
              onClick={() => setPlacesListOpen(true)}
              title="View all places"
              data-tour-target="places-list"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span>My Places</span>
            </button>
          )}
        </div>
        <div className="stats-container" data-tour-target="stats">
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{cities.length}</span>
              <span className="stat-label">Places Visited</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {new Set(cities.map((c) => c.country)).size}
              </span>
              <span className="stat-label">Countries</span>
            </div>
          </div>
          <div className="stats stats-secondary">
            <div className="stat stat-with-tooltip">
              <span className="stat-value">{formatNumber(totalMiles)}</span>
              <span className="stat-label">Miles Flown</span>
              <div className="miles-tooltip">
                <div className="tooltip-row">
                  <span className="tooltip-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <ellipse cx="12" cy="12" rx="10" ry="4" />
                      <line x1="12" y1="2" x2="12" y2="22" />
                    </svg>
                  </span>
                  <span>{formatTimesAround(timesAroundGlobe)}x around Earth</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </span>
                  <span>
                    {flightDays > 0 ? `${flightDays}d ` : ''}{flightHours}h in the air
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
