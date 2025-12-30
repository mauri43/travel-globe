import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

type SortOption = 'country' | 'date' | 'visits' | 'continent';

// Map countries to continents
const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // North America
  'United States': 'North America',
  'Canada': 'North America',
  'Mexico': 'North America',
  'Guatemala': 'North America',
  'Costa Rica': 'North America',
  'Panama': 'North America',
  'Cuba': 'North America',
  'Jamaica': 'North America',
  'Dominican Republic': 'North America',
  'Puerto Rico': 'North America',
  'Honduras': 'North America',
  'El Salvador': 'North America',
  'Nicaragua': 'North America',
  'Belize': 'North America',
  'Bahamas': 'North America',
  'Trinidad and Tobago': 'North America',
  'Barbados': 'North America',

  // South America
  'Brazil': 'South America',
  'Argentina': 'South America',
  'Chile': 'South America',
  'Colombia': 'South America',
  'Peru': 'South America',
  'Venezuela': 'South America',
  'Ecuador': 'South America',
  'Bolivia': 'South America',
  'Paraguay': 'South America',
  'Uruguay': 'South America',
  'Guyana': 'South America',
  'Suriname': 'South America',

  // Europe
  'United Kingdom': 'Europe',
  'France': 'Europe',
  'Germany': 'Europe',
  'Italy': 'Europe',
  'Spain': 'Europe',
  'Portugal': 'Europe',
  'Netherlands': 'Europe',
  'Belgium': 'Europe',
  'Switzerland': 'Europe',
  'Austria': 'Europe',
  'Poland': 'Europe',
  'Czech Republic': 'Europe',
  'Sweden': 'Europe',
  'Norway': 'Europe',
  'Denmark': 'Europe',
  'Finland': 'Europe',
  'Ireland': 'Europe',
  'Greece': 'Europe',
  'Turkey': 'Europe',
  'Hungary': 'Europe',
  'Romania': 'Europe',
  'Ukraine': 'Europe',
  'Russia': 'Europe',
  'Croatia': 'Europe',
  'Serbia': 'Europe',
  'Bulgaria': 'Europe',
  'Slovakia': 'Europe',
  'Slovenia': 'Europe',
  'Iceland': 'Europe',
  'Luxembourg': 'Europe',
  'Monaco': 'Europe',
  'Malta': 'Europe',
  'Cyprus': 'Europe',
  'Estonia': 'Europe',
  'Latvia': 'Europe',
  'Lithuania': 'Europe',
  'Albania': 'Europe',
  'North Macedonia': 'Europe',
  'Montenegro': 'Europe',
  'Bosnia and Herzegovina': 'Europe',
  'Kosovo': 'Europe',
  'Moldova': 'Europe',
  'Belarus': 'Europe',

  // Asia
  'China': 'Asia',
  'Japan': 'Asia',
  'South Korea': 'Asia',
  'India': 'Asia',
  'Thailand': 'Asia',
  'Vietnam': 'Asia',
  'Indonesia': 'Asia',
  'Malaysia': 'Asia',
  'Singapore': 'Asia',
  'Philippines': 'Asia',
  'Taiwan': 'Asia',
  'Hong Kong': 'Asia',
  'Cambodia': 'Asia',
  'Myanmar': 'Asia',
  'Laos': 'Asia',
  'Nepal': 'Asia',
  'Sri Lanka': 'Asia',
  'Bangladesh': 'Asia',
  'Pakistan': 'Asia',
  'Mongolia': 'Asia',
  'Kazakhstan': 'Asia',
  'Uzbekistan': 'Asia',

  // Middle East
  'United Arab Emirates': 'Middle East',
  'Saudi Arabia': 'Middle East',
  'Qatar': 'Middle East',
  'Israel': 'Middle East',
  'Jordan': 'Middle East',
  'Lebanon': 'Middle East',
  'Kuwait': 'Middle East',
  'Bahrain': 'Middle East',
  'Oman': 'Middle East',
  'Iraq': 'Middle East',
  'Iran': 'Middle East',
  'Syria': 'Middle East',
  'Yemen': 'Middle East',

  // Africa
  'South Africa': 'Africa',
  'Egypt': 'Africa',
  'Morocco': 'Africa',
  'Kenya': 'Africa',
  'Nigeria': 'Africa',
  'Ethiopia': 'Africa',
  'Tanzania': 'Africa',
  'Ghana': 'Africa',
  'Tunisia': 'Africa',
  'Algeria': 'Africa',
  'Uganda': 'Africa',
  'Zimbabwe': 'Africa',
  'Botswana': 'Africa',
  'Namibia': 'Africa',
  'Rwanda': 'Africa',
  'Senegal': 'Africa',
  'Mauritius': 'Africa',
  'Madagascar': 'Africa',

  // Oceania
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',
  'Fiji': 'Oceania',
  'Papua New Guinea': 'Oceania',
  'Samoa': 'Oceania',
  'Tonga': 'Oceania',
  'Vanuatu': 'Oceania',
  'Solomon Islands': 'Oceania',
  'French Polynesia': 'Oceania',
  'Guam': 'Oceania',
  'New Caledonia': 'Oceania',
};

const getContinent = (country: string): string => {
  return COUNTRY_TO_CONTINENT[country] || 'Other';
};

// Define continent order
const CONTINENT_ORDER = ['North America', 'South America', 'Europe', 'Asia', 'Middle East', 'Africa', 'Oceania', 'Other'];

export function PlacesList() {
  const {
    cities,
    isPlacesListOpen,
    setPlacesListOpen,
    setSelectedCity,
    setEditingCity,
    setAdminOpen,
  } = useStore();

  const [sortBy, setSortBy] = useState<SortOption>('country');

  // Sort and group cities based on sort option
  const getSortedCities = () => {
    const citiesCopy = [...cities];

    switch (sortBy) {
      case 'date':
        // Sort by most recent date first
        return citiesCopy.sort((a, b) => {
          const dateA = a.dates[0] ? new Date(a.dates[0]).getTime() : 0;
          const dateB = b.dates[0] ? new Date(b.dates[0]).getTime() : 0;
          return dateB - dateA;
        });
      case 'visits':
        // Sort by number of visits (dates array length)
        return citiesCopy.sort((a, b) => b.dates.length - a.dates.length);
      case 'country':
      default:
        return citiesCopy;
    }
  };

  const sortedCities = getSortedCities();

  // Group cities by country (only used for country sort)
  const citiesByCountry = cities.reduce((acc, city) => {
    if (!acc[city.country]) {
      acc[city.country] = [];
    }
    acc[city.country].push(city);
    return acc;
  }, {} as Record<string, typeof cities>);

  // Sort countries alphabetically
  const sortedCountries = Object.keys(citiesByCountry).sort();

  // Group cities by continent
  const citiesByContinent = cities.reduce((acc, city) => {
    const continent = getContinent(city.country);
    if (!acc[continent]) {
      acc[continent] = [];
    }
    acc[continent].push(city);
    return acc;
  }, {} as Record<string, typeof cities>);

  // Sort continents by defined order
  const sortedContinents = CONTINENT_ORDER.filter(c => citiesByContinent[c]);

  const handleCityClick = (city: typeof cities[0]) => {
    setSelectedCity(city);
    setPlacesListOpen(false);
  };

  const handleEditClick = (e: React.MouseEvent, city: typeof cities[0]) => {
    e.stopPropagation();
    setEditingCity(city);
    setAdminOpen(true);
    setPlacesListOpen(false);
  };

  if (!isPlacesListOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="places-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setPlacesListOpen(false)}
      >
        <motion.div
          className="places-panel"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="places-header">
            <h2>My Places</h2>
            <span className="places-count">{cities.length} places</span>
            <button className="places-close" onClick={() => setPlacesListOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="places-sort">
            <span className="sort-label">Sort by:</span>
            <div className="sort-buttons">
              <button
                className={`sort-btn ${sortBy === 'country' ? 'active' : ''}`}
                onClick={() => setSortBy('country')}
              >
                Country
              </button>
              <button
                className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
                onClick={() => setSortBy('date')}
              >
                Date
              </button>
              <button
                className={`sort-btn ${sortBy === 'visits' ? 'active' : ''}`}
                onClick={() => setSortBy('visits')}
              >
                Most Visited
              </button>
              <button
                className={`sort-btn ${sortBy === 'continent' ? 'active' : ''}`}
                onClick={() => setSortBy('continent')}
              >
                Continent
              </button>
            </div>
          </div>

          <div className="places-content">
            {cities.length === 0 ? (
              <div className="places-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <p>No places yet</p>
                <span>Add your first travel memory!</span>
              </div>
            ) : sortBy === 'continent' ? (
              // Group by continent view
              sortedContinents.map((continent) => (
                <div key={continent} className="country-group continent-group">
                  <div className="country-header continent-header">
                    <span className="country-name">{continent}</span>
                    <span className="country-count">
                      {citiesByContinent[continent].length}
                    </span>
                  </div>
                  <div className="country-cities">
                    {citiesByContinent[continent].map((city) => (
                      <div
                        key={city.id}
                        className="place-item"
                        onClick={() => handleCityClick(city)}
                      >
                        <div className="place-thumbnail">
                          {city.photos[0] ? (
                            <img src={city.photos[0]} alt={city.name} />
                          ) : (
                            <div className="place-thumbnail-placeholder">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="place-info">
                          <span className="place-name">{city.name}</span>
                          <span className="place-dates">
                            {city.country}
                            {city.dates.length > 0 && ` · ${new Date(city.dates[0]).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}`}
                          </span>
                        </div>
                        <button
                          className="place-edit"
                          onClick={(e) => handleEditClick(e, city)}
                          title="Edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : sortBy === 'country' ? (
              // Group by country view
              sortedCountries.map((country) => (
                <div key={country} className="country-group">
                  <div className="country-header">
                    <span className="country-name">{country}</span>
                    <span className="country-count">
                      {citiesByCountry[country].length}
                    </span>
                  </div>
                  <div className="country-cities">
                    {citiesByCountry[country].map((city) => (
                      <div
                        key={city.id}
                        className="place-item"
                        onClick={() => handleCityClick(city)}
                      >
                        <div className="place-thumbnail">
                          {city.photos[0] ? (
                            <img src={city.photos[0]} alt={city.name} />
                          ) : (
                            <div className="place-thumbnail-placeholder">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="place-info">
                          <span className="place-name">{city.name}</span>
                          <span className="place-dates">
                            {city.dates.length > 0
                              ? new Date(city.dates[0]).toLocaleDateString('en-US', {
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'No date'}
                          </span>
                        </div>
                        <button
                          className="place-edit"
                          onClick={(e) => handleEditClick(e, city)}
                          title="Edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Flat list view (for date and visits sort)
              <div className="places-flat-list">
                {sortedCities.map((city) => (
                  <div
                    key={city.id}
                    className="place-item"
                    onClick={() => handleCityClick(city)}
                  >
                    <div className="place-thumbnail">
                      {city.photos[0] ? (
                        <img src={city.photos[0]} alt={city.name} />
                      ) : (
                        <div className="place-thumbnail-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="place-info">
                      <span className="place-name">{city.name}</span>
                      <span className="place-meta">
                        {city.country}
                        {sortBy === 'visits' && city.dates.length > 0 && (
                          <span className="visit-count"> · {city.dates.length} visit{city.dates.length > 1 ? 's' : ''}</span>
                        )}
                        {sortBy === 'date' && city.dates[0] && (
                          <span className="visit-date"> · {new Date(city.dates[0]).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        )}
                      </span>
                    </div>
                    <button
                      className="place-edit"
                      onClick={(e) => handleEditClick(e, city)}
                      title="Edit"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
