import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { DatePicker } from './DatePicker';
import { getUserProfile } from '../services/api';

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
      // Script already exists, wait for it to load
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

// Google types provided by @types/google.maps

interface FormData {
  name: string;
  country: string;
  lat: string;
  lng: string;
  flewFromName: string;
  flewFromLat: string;
  flewFromLng: string;
  isOneWay: boolean;
  tripName: string;
  dateFrom: string;
  dateTo: string;
  photos: string[];
  videos: string[];
  memories: string;
  tags: string[];
}

const initialFormData: FormData = {
  name: '',
  country: '',
  lat: '',
  lng: '',
  flewFromName: '',
  flewFromLat: '',
  flewFromLng: '',
  isOneWay: false,
  tripName: '',
  dateFrom: '',
  dateTo: '',
  photos: [],
  videos: [],
  memories: '',
  tags: [],
};

// Default origin fallback: Washington, DC
const FALLBACK_ORIGIN = {
  name: 'Washington, DC',
  coordinates: {
    lat: 38.9072,
    lng: -77.0369,
  },
};

interface DefaultOrigin {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export function AdminPanel() {
  const { cities, isAdminOpen, setAdminOpen, addCityWithApi, updateCityWithApi, deleteCityWithApi, editingCity, setEditingCity } = useStore();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [tagInput, setTagInput] = useState('');
  const [userDefaultOrigin, setUserDefaultOrigin] = useState<DefaultOrigin | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [flewFromPredictions, setFlewFromPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showFlewFromPredictions, setShowFlewFromPredictions] = useState(false);
  const [isLoadingFlewFrom, setIsLoadingFlewFrom] = useState(false);
  const [showTripSuggestions, setShowTripSuggestions] = useState(false);

  // Get all existing trip names for autocomplete
  const existingTripNames = useMemo(() => {
    const tripSet = new Set<string>();
    cities.forEach((city) => {
      if (city.tripName) {
        tripSet.add(city.tripName);
      }
    });
    return Array.from(tripSet).sort();
  }, [cities]);

  // Filter trip suggestions based on input
  const filteredTripSuggestions = useMemo(() => {
    if (!formData.tripName) return existingTripNames;
    const search = formData.tripName.toLowerCase();
    return existingTripNames.filter((trip) =>
      trip.toLowerCase().includes(search)
    );
  }, [formData.tripName, existingTripNames]);

  // Get all existing tags for autocomplete
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    cities.forEach((city) => {
      city.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [cities]);

  // Filter tag suggestions based on input (exclude already selected tags)
  const filteredTagSuggestions = useMemo(() => {
    const available = existingTags.filter((tag) => !formData.tags.includes(tag));
    if (!tagInput) return available;
    const search = tagInput.toLowerCase();
    return available.filter((tag) => tag.toLowerCase().includes(search));
  }, [tagInput, existingTags, formData.tags]);

  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  // Flags to skip search after selection (prevents dropdown from reappearing)
  const skipCitySearchRef = useRef(false);
  const skipFlewFromSearchRef = useRef(false);

  // Initialize Google Places and load user profile
  useEffect(() => {
    if (isAdminOpen) {
      loadGooglePlacesScript().then(() => {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        // Create a dummy div for PlacesService (required but not displayed)
        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      }).catch(err => {
        console.error('Failed to load Google Places:', err);
      });

      // Load user's default origin from profile (fresh fetch each time panel opens)
      getUserProfile().then((profile) => {
        if (profile.defaultFromCity) {
          setUserDefaultOrigin({
            name: profile.defaultFromCity.name,
            coordinates: {
              lat: profile.defaultFromCity.lat,
              lng: profile.defaultFromCity.lng,
            },
          });
        } else {
          // No custom default set, use fallback
          setUserDefaultOrigin(FALLBACK_ORIGIN);
        }
      }).catch(err => {
        console.error('Failed to load user profile:', err);
        setUserDefaultOrigin(FALLBACK_ORIGIN);
      });
    }
  }, [isAdminOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingCity) {
      setFormData({
        name: editingCity.name,
        country: editingCity.country,
        lat: editingCity.coordinates.lat.toString(),
        lng: editingCity.coordinates.lng.toString(),
        flewFromName: editingCity.flewFrom?.name || '',
        flewFromLat: editingCity.flewFrom?.coordinates.lat.toString() || '',
        flewFromLng: editingCity.flewFrom?.coordinates.lng.toString() || '',
        isOneWay: editingCity.isOneWay || false,
        tripName: editingCity.tripName || '',
        dateFrom: editingCity.dates[0] || '',
        dateTo: editingCity.dates[1] || '',
        photos: editingCity.photos,
        videos: editingCity.videos,
        memories: editingCity.memories,
        tags: editingCity.tags,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingCity, isAdminOpen]);

  // Search cities using Google Places
  const searchCities = useCallback((input: string) => {
    if (!input || input.length < 2) {
      setPredictions([]);
      setIsLoadingPlaces(false);
      return;
    }

    if (!autocompleteServiceRef.current) {
      console.log('AutocompleteService not ready, retrying...');
      // Try to initialize again
      loadGooglePlacesScript().then(() => {
        if (!autocompleteServiceRef.current) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }
        // Retry the search
        searchCities(input);
      });
      return;
    }

    setIsLoadingPlaces(true);
    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input,
          types: ['(cities)'],
          sessionToken: sessionTokenRef.current || undefined,
        },
        (results, status) => {
          setIsLoadingPlaces(false);
          console.log('Places API status:', status);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
            setShowPredictions(true);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setPredictions([]);
            setShowPredictions(false);
          } else {
            console.error('Places API error:', status);
            setPredictions([]);
            setShowPredictions(false);
          }
        }
      );
    } catch (error) {
      console.error('Places search error:', error);
      setIsLoadingPlaces(false);
      setPredictions([]);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Skip search if we just selected a city
      if (skipCitySearchRef.current) {
        skipCitySearchRef.current = false;
        return;
      }
      if (formData.name && !editingCity) {
        searchCities(formData.name);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.name, searchCities, editingCity]);

  // Handle city selection from Google Places
  const handleCitySelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    // Immediately close dropdown and skip next search
    setPredictions([]);
    setShowPredictions(false);
    skipCitySearchRef.current = true;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'address_components', 'name'],
        sessionToken: sessionTokenRef.current!,
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          // Extract city name and country
          let cityName = place.name || '';
          let country = '';

          if (place.address_components) {
            for (const component of place.address_components) {
              if (component.types.includes('locality')) {
                cityName = component.long_name;
              }
              if (component.types.includes('country')) {
                country = component.long_name;
              }
            }
          }

          // Get coordinates
          const lat = place.geometry?.location?.lat() || 0;
          const lng = place.geometry?.location?.lng() || 0;

          setFormData({
            ...formData,
            name: cityName,
            country: country,
            lat: lat.toString(),
            lng: lng.toString(),
          });

          // Create new session token for next search
          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }
      }
    );
  };

  // Search flew from cities using Google Places
  const searchFlewFromCities = useCallback((input: string) => {
    if (!input || input.length < 2) {
      setFlewFromPredictions([]);
      setIsLoadingFlewFrom(false);
      return;
    }

    if (!autocompleteServiceRef.current) {
      return;
    }

    setIsLoadingFlewFrom(true);
    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input,
          types: ['(cities)'],
          sessionToken: sessionTokenRef.current || undefined,
        },
        (results, status) => {
          setIsLoadingFlewFrom(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setFlewFromPredictions(results);
            setShowFlewFromPredictions(true);
          } else {
            setFlewFromPredictions([]);
            setShowFlewFromPredictions(false);
          }
        }
      );
    } catch (error) {
      setIsLoadingFlewFrom(false);
      setFlewFromPredictions([]);
    }
  }, []);

  // Debounced search for flew from
  useEffect(() => {
    const timer = setTimeout(() => {
      // Skip search if we just selected a city
      if (skipFlewFromSearchRef.current) {
        skipFlewFromSearchRef.current = false;
        return;
      }
      if (formData.flewFromName) {
        searchFlewFromCities(formData.flewFromName);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.flewFromName, searchFlewFromCities]);

  // Handle flew from city selection
  const handleFlewFromSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    // Immediately close dropdown and skip next search
    setFlewFromPredictions([]);
    setShowFlewFromPredictions(false);
    skipFlewFromSearchRef.current = true;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'address_components', 'name'],
        sessionToken: sessionTokenRef.current!,
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          let cityName = place.name || '';

          if (place.address_components) {
            for (const component of place.address_components) {
              if (component.types.includes('locality')) {
                cityName = component.long_name;
              }
            }
          }

          const lat = place.geometry?.location?.lat() || 0;
          const lng = place.geometry?.location?.lng() || 0;

          setFormData({
            ...formData,
            flewFromName: cityName,
            flewFromLat: lat.toString(),
            flewFromLng: lng.toString(),
          });

          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }
      }
    );
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleFileUpload = async (files: FileList | null, type: 'photos' | 'videos') => {
    if (!files) return;

    const newFiles: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            newFiles.push(e.target.result as string);
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setFormData({
      ...formData,
      [type]: [...formData[type], ...newFiles],
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = e.dataTransfer.files;
      const imageFiles: File[] = [];
      const videoFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();
        // Check MIME type or file extension for HEIC/HEIF
        const isImage = file.type.startsWith('image/') ||
          fileName.endsWith('.heic') ||
          fileName.endsWith('.heif');
        const isVideo = file.type.startsWith('video/');

        if (isImage) {
          imageFiles.push(file);
        } else if (isVideo) {
          videoFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        const dt = new DataTransfer();
        imageFiles.forEach((f) => dt.items.add(f));
        handleFileUpload(dt.files, 'photos');
      }
      if (videoFiles.length > 0) {
        const dt = new DataTransfer();
        videoFiles.forEach((f) => dt.items.add(f));
        handleFileUpload(dt.files, 'videos');
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index),
    });
  };

  const handleRemoveVideo = (index: number) => {
    setFormData({
      ...formData,
      videos: formData.videos.filter((_, i) => i !== index),
    });
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.lat || !formData.lng) {
      alert('Please fill in city name and coordinates');
      return;
    }

    setIsSaving(true);

    try {
      // Determine flew from: use entered value or user's default origin
      const flewFrom = formData.flewFromName && formData.flewFromLat && formData.flewFromLng
        ? {
            name: formData.flewFromName,
            coordinates: {
              lat: parseFloat(formData.flewFromLat),
              lng: parseFloat(formData.flewFromLng),
            },
          }
        : userDefaultOrigin || FALLBACK_ORIGIN;

      const cityData = {
        name: formData.name,
        country: formData.country,
        coordinates: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        },
        flewFrom,
        isOneWay: formData.isOneWay,
        tripName: formData.tripName || undefined,
        dates: [formData.dateFrom, formData.dateTo].filter((d) => d !== ''),
        photos: formData.photos,
        videos: formData.videos,
        memories: formData.memories,
        tags: formData.tags,
      };

      if (editingCity) {
        await updateCityWithApi(editingCity.id, cityData);
      } else {
        await addCityWithApi(cityData);
      }

      handleClose();
    } catch (error) {
      console.error('Failed to save city:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (editingCity && confirm('Are you sure you want to delete this city?')) {
      setIsSaving(true);
      try {
        await deleteCityWithApi(editingCity.id);
        handleClose();
      } catch (error) {
        console.error('Failed to delete city:', error);
        alert('Failed to delete. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleClose = () => {
    setAdminOpen(false);
    setEditingCity(null);
    setFormData(initialFormData);
    setTagInput('');
  };

  if (!isAdminOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="admin-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="admin-panel"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="admin-header">
            <h2>{editingCity ? 'Edit Memory' : 'Add New Memory'}</h2>
            <button className="admin-close" onClick={handleClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            {/* City Search */}
            <div className="form-group">
              <label>City Name</label>
              <div className="city-search">
                <input
                  ref={cityInputRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onFocus={() => predictions.length > 0 && setShowPredictions(true)}
                  onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                  placeholder="Search for a city..."
                  autoComplete="off"
                />
                {isLoadingPlaces && (
                  <div className="city-search-loading">Searching...</div>
                )}
                {showPredictions && predictions.length > 0 && (
                  <div className="city-suggestions">
                    {predictions.map((prediction) => {
                      // Extract city and country from structured formatting
                      const mainText = prediction.structured_formatting.main_text;
                      const secondaryText = prediction.structured_formatting.secondary_text;
                      return (
                        <button
                          key={prediction.place_id}
                          type="button"
                          className="suggestion-item"
                          onClick={() => handleCitySelect(prediction)}
                        >
                          <span className="suggestion-name">{mainText}</span>
                          <span className="suggestion-country">{secondaryText}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Country */}
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Country name"
              />
            </div>

            {/* Flew From */}
            <div className="form-group">
              <label>Flew From (optional)</label>
              <div className="city-search">
                <input
                  type="text"
                  value={formData.flewFromName}
                  onChange={(e) => setFormData({ ...formData, flewFromName: e.target.value, flewFromLat: '', flewFromLng: '' })}
                  onFocus={() => flewFromPredictions.length > 0 && setShowFlewFromPredictions(true)}
                  onBlur={() => setTimeout(() => setShowFlewFromPredictions(false), 200)}
                  placeholder={`Default: ${userDefaultOrigin?.name || 'Loading...'}`}
                  autoComplete="off"
                />
                {isLoadingFlewFrom && (
                  <div className="city-search-loading">Searching...</div>
                )}
                {showFlewFromPredictions && flewFromPredictions.length > 0 && (
                  <div className="city-suggestions">
                    {flewFromPredictions.map((prediction) => {
                      const mainText = prediction.structured_formatting.main_text;
                      const secondaryText = prediction.structured_formatting.secondary_text;
                      return (
                        <button
                          key={prediction.place_id}
                          type="button"
                          className="suggestion-item"
                          onClick={() => handleFlewFromSelect(prediction)}
                        >
                          <span className="suggestion-name">{mainText}</span>
                          <span className="suggestion-country">{secondaryText}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flew-from-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isOneWay}
                    onChange={(e) => setFormData({ ...formData, isOneWay: e.target.checked })}
                  />
                  <span className="checkbox-text">One-way flight (not round trip)</span>
                </label>
                <span className="form-hint">Leave origin empty to use {userDefaultOrigin?.name || 'default city'}</span>
              </div>
            </div>

            {/* Dates */}
            <div className="form-group">
              <label>Visit Dates</label>
              <div className="date-range-container">
                <div className="date-range-field">
                  <span className="date-range-label">From</span>
                  <DatePicker
                    value={formData.dateFrom}
                    onChange={(value) => setFormData({ ...formData, dateFrom: value })}
                  />
                </div>
                <span className="date-range-separator">→</span>
                <div className="date-range-field">
                  <span className="date-range-label">To</span>
                  <DatePicker
                    value={formData.dateTo}
                    onChange={(value) => setFormData({ ...formData, dateTo: value })}
                  />
                </div>
              </div>
            </div>

            {/* Photo/Video Upload */}
            <div className="form-group">
              <label>Photos & Videos</label>
              <div
                className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="upload-content">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17,8 12,3 7,8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p>Drag & drop files here or</p>
                  <div className="upload-buttons">
                    <button type="button" onClick={() => fileInputRef.current?.click()}>
                      Add Photos
                    </button>
                    <button type="button" onClick={() => videoInputRef.current?.click()}>
                      Add Videos
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.heic,.heif,image/heic,image/heif"
                  multiple
                  hidden
                  onChange={(e) => handleFileUpload(e.target.files, 'photos')}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  hidden
                  onChange={(e) => handleFileUpload(e.target.files, 'videos')}
                />
              </div>

              {/* Photo previews */}
              {formData.photos.length > 0 && (
                <div className="preview-grid">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="preview-item">
                      <img src={photo} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="preview-remove"
                        onClick={() => handleRemovePhoto(index)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Video previews */}
              {formData.videos.length > 0 && (
                <div className="preview-grid video-preview">
                  {formData.videos.map((video, index) => (
                    <div key={index} className="preview-item">
                      <video src={video} />
                      <button
                        type="button"
                        className="preview-remove"
                        onClick={() => handleRemoveVideo(index)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Memories */}
            <div className="form-group">
              <label>Memories</label>
              <textarea
                value={formData.memories}
                onChange={(e) => setFormData({ ...formData, memories: e.target.value })}
                placeholder="Write about your memories from this place..."
                rows={4}
              />
            </div>

            {/* Trip Name */}
            <div className="form-group">
              <label>Trip Name (optional)</label>
              <div className="trip-name-input">
                <input
                  type="text"
                  value={formData.tripName}
                  onChange={(e) => setFormData({ ...formData, tripName: e.target.value })}
                  onFocus={() => existingTripNames.length > 0 && setShowTripSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTripSuggestions(false), 200)}
                  placeholder="e.g., Europe Summer 2024"
                  autoComplete="off"
                />
                {showTripSuggestions && filteredTripSuggestions.length > 0 && (
                  <div className="trip-suggestions">
                    {filteredTripSuggestions.map((trip) => (
                      <button
                        key={trip}
                        type="button"
                        className="trip-suggestion-item"
                        onClick={() => {
                          setFormData({ ...formData, tripName: trip });
                          setShowTripSuggestions(false);
                        }}
                      >
                        {trip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="form-hint">Group memories from the same trip together</span>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input">
                <div className="tags-list">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag-item">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    onFocus={() => setShowTagSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                    placeholder="Add a tag..."
                    autoComplete="off"
                  />
                  <button type="button" onClick={handleAddTag}>
                    Add
                  </button>
                </div>
                {/* Tag autocomplete dropdown */}
                {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                  <div className="tag-suggestions">
                    {filteredTagSuggestions.slice(0, 5).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="tag-suggestion-item"
                        onClick={() => {
                          setFormData({ ...formData, tags: [...formData.tags, tag] });
                          setTagInput('');
                          setShowTagSuggestions(false);
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
                {/* Previous tags suggestions */}
                {existingTags.length > 0 && (
                  <div className="tag-quick-add">
                    <span className="tag-quick-label">Quick add:</span>
                    <div className="tag-quick-list">
                      {existingTags
                        .filter((tag) => !formData.tags.includes(tag))
                        .slice(0, 8)
                        .map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className="tag-quick-item"
                            onClick={() => setFormData({ ...formData, tags: [...formData.tags, tag] })}
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              {editingCity && (
                <button type="button" className="delete-btn" onClick={handleDelete} disabled={isSaving}>
                  {isSaving ? 'Deleting...' : 'Delete'}
                </button>
              )}
              <button type="button" className="cancel-btn" onClick={handleClose} disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingCity ? 'Save Changes' : 'Add Memory'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
