import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

type MenuCategory = 'trips' | 'tags' | 'years' | null;

export function TagFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<MenuCategory>(null);
  const {
    cities,
    activeTagFilters,
    activeTripFilters,
    activeYearFilters,
    toggleTagFilter,
    toggleTripFilter,
    toggleYearFilter,
    clearAllFilters,
  } = useStore();

  // Get all unique tags from all cities
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    cities.forEach((city) => {
      city.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [cities]);

  // Get all unique trips from all cities
  const allTrips = useMemo(() => {
    const tripSet = new Set<string>();
    cities.forEach((city) => {
      if (city.tripName) {
        tripSet.add(city.tripName);
      }
    });
    return Array.from(tripSet).sort();
  }, [cities]);

  // Generate years from 2025 to 2000
  const allYears = useMemo(() => {
    const years: number[] = [];
    for (let year = 2025; year >= 2000; year--) {
      years.push(year);
    }
    return years;
  }, []);

  // Count places per tag
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cities.forEach((city) => {
      city.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [cities]);

  // Count places per trip
  const tripCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cities.forEach((city) => {
      if (city.tripName) {
        counts[city.tripName] = (counts[city.tripName] || 0) + 1;
      }
    });
    return counts;
  }, [cities]);

  // Count places per year
  const yearCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    cities.forEach((city) => {
      if (city.dates && city.dates.length > 0) {
        const year = parseInt(city.dates[0].split('-')[0], 10);
        if (year) {
          counts[year] = (counts[year] || 0) + 1;
        }
      }
    });
    return counts;
  }, [cities]);

  const totalActiveFilters = activeTagFilters.length + activeTripFilters.length + activeYearFilters.length;

  const handleClearAll = () => {
    clearAllFilters();
  };

  return (
    <div
      className="tag-filter"
      data-tour-target="tag-filter"
      onMouseLeave={() => {
        setIsOpen(false);
        setHoveredCategory(null);
      }}
    >
      <button
        className={`tag-filter-btn ${totalActiveFilters > 0 ? 'has-filters' : ''}`}
        onMouseEnter={() => setIsOpen(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {totalActiveFilters > 0 && (
          <span className="filter-count">{totalActiveFilters}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="filter-menu"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Clear all button */}
            {totalActiveFilters > 0 && (
              <button className="filter-menu-clear" onClick={handleClearAll}>
                Clear all ({totalActiveFilters})
              </button>
            )}

            {/* Trips category */}
            <div
              className={`filter-menu-item ${hoveredCategory === 'trips' ? 'active' : ''} ${activeTripFilters.length > 0 ? 'has-selection' : ''}`}
              onMouseEnter={() => setHoveredCategory('trips')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l4.7 3.2-3.6 3.6-2.3-.6c-.5-.1-1 .1-1.2.5-.2.4-.1.9.3 1.2l3 2.1 2.1 3c.3.4.8.5 1.2.3.4-.2.6-.7.5-1.2l-.6-2.3 3.6-3.6 3.2 4.7c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z" />
              </svg>
              <span>Trips</span>
              {activeTripFilters.length > 0 && (
                <span className="filter-badge">{activeTripFilters.length}</span>
              )}
              <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>

            {/* Tags category */}
            <div
              className={`filter-menu-item ${hoveredCategory === 'tags' ? 'active' : ''} ${activeTagFilters.length > 0 ? 'has-selection' : ''}`}
              onMouseEnter={() => setHoveredCategory('tags')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span>Tags</span>
              {activeTagFilters.length > 0 && (
                <span className="filter-badge">{activeTagFilters.length}</span>
              )}
              <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>

            {/* Years category */}
            <div
              className={`filter-menu-item ${hoveredCategory === 'years' ? 'active' : ''} ${activeYearFilters.length > 0 ? 'has-selection' : ''}`}
              onMouseEnter={() => setHoveredCategory('years')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Years</span>
              {activeYearFilters.length > 0 && (
                <span className="filter-badge">{activeYearFilters.length}</span>
              )}
              <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>

            {/* Submenu */}
            <AnimatePresence>
              {hoveredCategory && (
                <motion.div
                  className="filter-submenu"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.1 }}
                >
                  {hoveredCategory === 'trips' && (
                    <>
                      <div className="filter-submenu-header">Trips</div>
                      <div className="filter-submenu-list">
                        {allTrips.length === 0 ? (
                          <div className="filter-submenu-empty">No trips yet</div>
                        ) : (
                          allTrips.map((trip) => {
                            const isActive = activeTripFilters.includes(trip);
                            return (
                              <button
                                key={trip}
                                className={`filter-submenu-item ${isActive ? 'active' : ''}`}
                                onClick={() => toggleTripFilter(trip)}
                              >
                                <span className="filter-check">
                                  {isActive && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </span>
                                <span className="filter-name">{trip}</span>
                                <span className="filter-count">{tripCounts[trip]}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}

                  {hoveredCategory === 'tags' && (
                    <>
                      <div className="filter-submenu-header">Tags</div>
                      <div className="filter-submenu-list">
                        {allTags.length === 0 ? (
                          <div className="filter-submenu-empty">No tags yet</div>
                        ) : (
                          allTags.map((tag) => {
                            const isActive = activeTagFilters.includes(tag);
                            return (
                              <button
                                key={tag}
                                className={`filter-submenu-item ${isActive ? 'active' : ''}`}
                                onClick={() => toggleTagFilter(tag)}
                              >
                                <span className="filter-check">
                                  {isActive && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </span>
                                <span className="filter-name">{tag}</span>
                                <span className="filter-count">{tagCounts[tag]}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}

                  {hoveredCategory === 'years' && (
                    <>
                      <div className="filter-submenu-header">Years</div>
                      <div className="filter-submenu-list">
                        {allYears.map((year) => {
                          const isActive = activeYearFilters.includes(year);
                          const count = yearCounts[year] || 0;
                          return (
                            <button
                              key={year}
                              className={`filter-submenu-item ${isActive ? 'active' : ''} ${count === 0 ? 'disabled' : ''}`}
                              onClick={() => count > 0 && toggleYearFilter(year)}
                              disabled={count === 0}
                            >
                              <span className="filter-check">
                                {isActive && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </span>
                              <span className="filter-name">{year}</span>
                              <span className="filter-count">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
