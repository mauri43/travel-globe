import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

export function TagFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const { cities, activeTagFilters, toggleTagFilter, setActiveTagFilters } = useStore();

  // Get all unique tags from all cities
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    cities.forEach((city) => {
      city.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [cities]);

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

  const handleClearAll = () => {
    setActiveTagFilters([]);
  };

  if (allTags.length === 0) return null;

  return (
    <div className="tag-filter">
      <button
        className={`tag-filter-btn ${activeTagFilters.length > 0 ? 'has-filters' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {activeTagFilters.length > 0 && (
          <span className="filter-count">{activeTagFilters.length}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="tag-filter-popup"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="tag-filter-header">
              <span>Filter by Tag</span>
              {activeTagFilters.length > 0 && (
                <button className="clear-filters-btn" onClick={handleClearAll}>
                  Clear all
                </button>
              )}
            </div>
            <div className="tag-filter-list">
              {allTags.map((tag) => {
                const isActive = activeTagFilters.includes(tag);
                return (
                  <button
                    key={tag}
                    className={`tag-filter-item ${isActive ? 'active' : ''}`}
                    onClick={() => toggleTagFilter(tag)}
                  >
                    <span className="tag-filter-check">
                      {isActive && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="tag-filter-name">{tag}</span>
                    <span className="tag-filter-count">{tagCounts[tag]}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
