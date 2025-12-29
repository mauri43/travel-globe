import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { getUserProfile, updateTrustedEmails, updateDefaultFromCity } from '../services/api';
import { SwipeToConfirm } from './SwipeToConfirm';
import { lookupAirport, isValidAirportCode } from '../utils/airportLookup';
import type { City } from '../types';
import { useStore } from '../store';

// Google Places API key
const GOOGLE_PLACES_API_KEY = 'AIzaSyB9TQe9WP_CBsVtJ6Z7WxjaygP8B1yxwTY';

// Load Google Places script
let googleScriptLoaded = false;
const loadGooglePlacesScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (googleScriptLoaded && window.google?.maps?.places) {
      resolve();
      return;
    }
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkLoaded);
          googleScriptLoaded = true;
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleScriptLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

interface DefaultFromCity {
  name: string;
  lat: number;
  lng: number;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_FROM_CITY: DefaultFromCity = {
  name: 'Washington, DC',
  lat: 38.9072,
  lng: -77.0369,
};

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { user, logout } = useAuth();
  const startTour = useStore((state) => state.startTour);
  const clearAllCities = useStore((state) => state.clearAllCities);
  const bulkAddCities = useStore((state) => state.bulkAddCities);
  const cities = useStore((state) => state.cities);
  const [trustedEmails, setTrustedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // CSV Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState('');

  // Clear all flights state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Default from city state
  const [defaultFromCity, setDefaultFromCity] = useState<DefaultFromCity>(DEFAULT_FROM_CITY);
  const [fromCitySearch, setFromCitySearch] = useState('');
  const [fromCityPredictions, setFromCityPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showFromCityPredictions, setShowFromCityPredictions] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
      loadGooglePlacesScript().then(() => {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
      }).catch(err => console.error('Failed to load Google Places:', err));
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await getUserProfile();
      setTrustedEmails(profile.trustedEmails || []);
      if (profile.defaultFromCity) {
        setDefaultFromCity(profile.defaultFromCity);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      if (user?.email) {
        setTrustedEmails([user.email]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Search cities for default from
  const searchFromCities = useCallback((input: string) => {
    if (!input || input.length < 2 || !autocompleteServiceRef.current) {
      setFromCityPredictions([]);
      return;
    }
    autocompleteServiceRef.current.getPlacePredictions(
      { input, types: ['(cities)'] },
      (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setFromCityPredictions(results);
          setShowFromCityPredictions(true);
        } else {
          setFromCityPredictions([]);
        }
      }
    );
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromCitySearch) {
        searchFromCities(fromCitySearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [fromCitySearch, searchFromCities]);

  const handleFromCitySelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    setFromCityPredictions([]);
    setShowFromCityPredictions(false);

    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['geometry', 'name'] },
      async (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const newCity: DefaultFromCity = {
            name: place.name || prediction.structured_formatting.main_text,
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          };

          setIsSaving(true);
          setError('');
          try {
            await updateDefaultFromCity(newCity);
            setDefaultFromCity(newCity);
            setFromCitySearch('');
            setSuccessMessage('Default origin updated');
            setTimeout(() => setSuccessMessage(''), 3000);
          } catch (err: any) {
            setError(err.message || 'Failed to update default origin');
          } finally {
            setIsSaving(false);
          }
        }
      }
    );
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (trustedEmails.includes(newEmail.trim().toLowerCase())) {
      setError('This email is already in your trusted list');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const updatedEmails = [...trustedEmails, newEmail.trim().toLowerCase()];
      await updateTrustedEmails(updatedEmails);
      setTrustedEmails(updatedEmails);
      setNewEmail('');
      setSuccessMessage('Email added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Add email error:', err);
      setError(err.message || 'Failed to add email. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    // Don't allow removing the last email
    if (trustedEmails.length <= 1) {
      setError('You must have at least one trusted email');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const updatedEmails = trustedEmails.filter(e => e !== emailToRemove);
      await updateTrustedEmails(updatedEmails);
      setTrustedEmails(updatedEmails);
      setSuccessMessage('Email removed');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Remove email error:', err);
      setError(err.message || 'Failed to remove email. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  // CSV Import handler
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportErrors([]);
    setImportSuccess('');
    setImportProgress('Reading file...');

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());

      if (lines.length < 2) {
        setImportErrors(['CSV file must have a header row and at least one data row']);
        setIsImporting(false);
        return;
      }

      // Parse header row
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      const originIdx = headers.findIndex(h => h.includes('origin') || h.includes('from') || h === 'departure');
      const destIdx = headers.findIndex(h => h.includes('dest') || h.includes('to') || h === 'arrival');
      const fromDateIdx = headers.findIndex(h => h.includes('from date') || h.includes('start') || h === 'departure date');
      const toDateIdx = headers.findIndex(h => h.includes('to date') || h.includes('end') || h === 'arrival date' || h === 'return');
      const tripIdx = headers.findIndex(h => h.includes('trip') || h.includes('name'));
      const tagsIdx = headers.findIndex(h => h.includes('tag'));

      if (originIdx === -1 || destIdx === -1) {
        setImportErrors(['CSV must have Origin and Destination columns']);
        setIsImporting(false);
        return;
      }

      const errors: string[] = [];
      const citiesToAdd: Omit<City, 'id'>[] = [];
      const dataLines = lines.slice(1);

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        if (!line.trim()) continue;

        setImportProgress(`Processing row ${i + 1} of ${dataLines.length}...`);
        const values = parseCSVLine(line);

        const originCode = values[originIdx]?.trim().toUpperCase();
        const destCode = values[destIdx]?.trim().toUpperCase();

        if (!originCode || !destCode) {
          errors.push(`Row ${i + 2}: Missing origin or destination airport code`);
          continue;
        }

        if (!isValidAirportCode(originCode)) {
          errors.push(`Row ${i + 2}: Invalid origin airport code "${originCode}"`);
          continue;
        }

        if (!isValidAirportCode(destCode)) {
          errors.push(`Row ${i + 2}: Invalid destination airport code "${destCode}"`);
          continue;
        }

        // Look up airports
        const [originAirport, destAirport] = await Promise.all([
          lookupAirport(originCode),
          lookupAirport(destCode)
        ]);

        if (!originAirport) {
          errors.push(`Row ${i + 2}: Could not find airport "${originCode}"`);
          continue;
        }

        if (!destAirport) {
          errors.push(`Row ${i + 2}: Could not find airport "${destCode}"`);
          continue;
        }

        // Parse dates (MM/DD/YYYY to YYYY-MM-DD)
        let fromDate: string | undefined;
        let toDate: string | undefined;

        if (fromDateIdx !== -1 && values[fromDateIdx]?.trim()) {
          fromDate = parseDate(values[fromDateIdx].trim());
        }
        if (toDateIdx !== -1 && values[toDateIdx]?.trim()) {
          toDate = parseDate(values[toDateIdx].trim());
        }

        // Parse trip name
        const tripName = tripIdx !== -1 ? values[tripIdx]?.trim() : undefined;

        // Parse tags (comma-separated)
        const tags: string[] = [];
        if (tagsIdx !== -1 && values[tagsIdx]?.trim()) {
          tags.push(...values[tagsIdx].split(',').map(t => t.trim()).filter(Boolean));
        }

        const city: Omit<City, 'id'> = {
          name: destAirport.city,
          country: destAirport.country,
          coordinates: { lat: destAirport.lat, lng: destAirport.lng },
          dates: fromDate && toDate ? [fromDate, toDate] : fromDate ? [fromDate] : [],
          photos: [],
          videos: [],
          memories: '',
          tags,
          tripName,
          flewFrom: {
            name: originAirport.city,
            coordinates: {
              lat: originAirport.lat,
              lng: originAirport.lng,
            },
          },
        };

        citiesToAdd.push(city);
      }

      if (citiesToAdd.length > 0) {
        setImportProgress(`Adding ${citiesToAdd.length} flights...`);
        await bulkAddCities(citiesToAdd);
        setImportSuccess(`Successfully imported ${citiesToAdd.length} flight${citiesToAdd.length > 1 ? 's' : ''}`);
      }

      if (errors.length > 0) {
        setImportErrors(errors);
      }
    } catch (err: any) {
      setImportErrors([err.message || 'Failed to import CSV']);
    } finally {
      setIsImporting(false);
      setImportProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Parse a CSV line handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Parse MM/DD/YYYY to YYYY-MM-DD
  const parseDate = (dateStr: string): string => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  };

  // Clear all flights handler
  const handleClearAllFlights = async () => {
    setIsClearing(true);
    try {
      await clearAllCities();
      setShowClearConfirm(false);
      setSuccessMessage('All flights have been deleted');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete flights');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="settings-panel"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="settings-header">
              <h2>Settings</h2>
              <button className="settings-close" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="settings-content">
              {/* Account Section */}
              <div className="settings-section">
                <h3>Account</h3>
                <div className="settings-account-info">
                  <div className="account-email">
                    <span className="label">Signed in as</span>
                    <span className="email">{user?.email}</span>
                  </div>
                  <button className="logout-btn" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16,17 21,12 16,7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                  <button className="tour-btn" onClick={() => { startTour(); onClose(); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    Take Tour
                  </button>
                </div>
              </div>

              {/* Default Origin City Section */}
              <div className="settings-section">
                <h3>Default Origin</h3>
                <p className="settings-description">
                  Set your default departure city for new trips. This will be used when you don't specify a "Flew From" location.
                </p>
                <div className="default-origin-display">
                  <span className="origin-label">Current:</span>
                  <span className="origin-city">{defaultFromCity.name}</span>
                </div>
                <div className="default-origin-search">
                  <input
                    type="text"
                    value={fromCitySearch}
                    onChange={(e) => setFromCitySearch(e.target.value)}
                    onFocus={() => fromCityPredictions.length > 0 && setShowFromCityPredictions(true)}
                    onBlur={() => setTimeout(() => setShowFromCityPredictions(false), 200)}
                    placeholder="Search for a new city..."
                    autoComplete="off"
                    disabled={isSaving}
                  />
                  {showFromCityPredictions && fromCityPredictions.length > 0 && (
                    <div className="city-suggestions">
                      {fromCityPredictions.map((prediction) => (
                        <button
                          key={prediction.place_id}
                          type="button"
                          className="suggestion-item"
                          onClick={() => handleFromCitySelect(prediction)}
                        >
                          <span className="suggestion-name">{prediction.structured_formatting.main_text}</span>
                          <span className="suggestion-country">{prediction.structured_formatting.secondary_text}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Trusted Emails Section */}
              <div className="settings-section">
                <h3>Trusted Emails</h3>
                <p className="settings-description">
                  Emails you forward flight confirmations from. When you forward to{' '}
                  <span className="highlight">trips@mytravelglobe.org</span>, we'll match the sender to your account.
                </p>

                {isLoading ? (
                  <div className="settings-loading">Loading...</div>
                ) : (
                  <>
                    <div className="trusted-emails-list">
                      {trustedEmails.map((email) => (
                        <div key={email} className="trusted-email-item">
                          <span className="email-text">{email}</span>
                          <button
                            className="remove-email-btn"
                            onClick={() => handleRemoveEmail(email)}
                            disabled={isSaving || trustedEmails.length <= 1}
                            title={trustedEmails.length <= 1 ? 'Cannot remove last email' : 'Remove email'}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="add-email-form">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                        placeholder="Add another email..."
                        disabled={isSaving}
                      />
                      <button
                        className="add-email-btn"
                        onClick={handleAddEmail}
                        disabled={isSaving || !newEmail.trim()}
                      >
                        {isSaving ? 'Adding...' : 'Add'}
                      </button>
                    </div>

                    {error && <div className="settings-error">{error}</div>}
                    {successMessage && <div className="settings-success">{successMessage}</div>}
                  </>
                )}
              </div>

              {/* Import CSV Section */}
              <div className="settings-section">
                <h3>Import Flights</h3>
                <p className="settings-description">
                  Import flights from a CSV file. Required columns: <strong>Origin</strong> and <strong>Destination</strong> (airport codes like JFK, LAX).
                  Optional: From Date, To Date (MM/DD/YYYY), Trip Name, Tags (comma-separated).
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  style={{ display: 'none' }}
                />
                <button
                  className="import-csv-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17,8 12,3 7,8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {isImporting ? 'Importing...' : 'Choose CSV File'}
                </button>

                {importProgress && (
                  <div className="import-progress">{importProgress}</div>
                )}

                {importSuccess && (
                  <div className="settings-success">{importSuccess}</div>
                )}

                {importErrors.length > 0 && (
                  <div className="import-errors">
                    <strong>Import errors:</strong>
                    <ul>
                      {importErrors.slice(0, 10).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {importErrors.length > 10 && (
                        <li>...and {importErrors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* How It Works Section */}
              <div className="settings-section">
                <h3>How It Works</h3>
                <div className="how-it-works">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <strong>Receive a flight confirmation</strong>
                      <p>Get your booking email from the airline</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <strong>Forward it to us</strong>
                      <p>Send to trips@mytravelglobe.org</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <strong>Watch your globe light up</strong>
                      <p>We'll extract the trip and add it automatically</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone Section */}
              <div className="settings-section danger-zone">
                <h3>Danger Zone</h3>
                <p className="settings-description">
                  Permanently delete all your flights. This action cannot be undone.
                </p>

                {!showClearConfirm ? (
                  <button
                    className="clear-flights-btn"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={cities.length === 0}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    Delete All Flights ({cities.length})
                  </button>
                ) : (
                  <div className="clear-confirm">
                    <SwipeToConfirm
                      onConfirm={handleClearAllFlights}
                      isLoading={isClearing}
                      warningText={`This will permanently delete all ${cities.length} flight${cities.length !== 1 ? 's' : ''}. This action cannot be undone.`}
                      confirmText="Swipe to delete all"
                    />
                    <button
                      className="cancel-clear-btn"
                      onClick={() => setShowClearConfirm(false)}
                      disabled={isClearing}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
