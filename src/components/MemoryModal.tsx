import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

export function MemoryModal() {
  const { selectedCity, setSelectedCity, setAdminOpen, setEditingCity } = useStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when city changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedCity]);

  if (!selectedCity) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleEdit = () => {
    setEditingCity(selectedCity);
    setSelectedCity(null);
    setAdminOpen(true);
  };

  const nextImage = () => {
    if (selectedCity.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedCity.photos.length);
    }
  };

  const prevImage = () => {
    if (selectedCity.photos.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + selectedCity.photos.length) % selectedCity.photos.length
      );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedCity(null)}
      >
        <motion.div
          className="modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button className="modal-close" onClick={() => setSelectedCity(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Edit button */}
          <button className="modal-edit" onClick={handleEdit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          {/* Header */}
          <div className="modal-header">
            <h1 className="city-title">{selectedCity.name}</h1>
            <p className="city-country-large">{selectedCity.country}</p>
            <div className="visit-dates">
              {selectedCity.dates.length === 1 ? (
                <span>{formatDate(selectedCity.dates[0])}</span>
              ) : (
                <span>
                  {formatDate(selectedCity.dates[0])} — {formatDate(selectedCity.dates[selectedCity.dates.length - 1])}
                </span>
              )}
            </div>
          </div>

          {/* Photo Gallery */}
          {selectedCity.photos.length > 0 && (
            <div className="gallery-section">
              <div className="main-image-container">
                <motion.img
                  key={currentImageIndex}
                  src={selectedCity.photos[currentImageIndex]}
                  alt={`${selectedCity.name} photo ${currentImageIndex + 1}`}
                  className="main-image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                {selectedCity.photos.length > 1 && (
                  <>
                    <button className="gallery-nav prev" onClick={prevImage}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button className="gallery-nav next" onClick={nextImage}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </>
                )}
                <div className="image-counter">
                  {currentImageIndex + 1} / {selectedCity.photos.length}
                </div>
              </div>

              {/* Thumbnail strip */}
              {selectedCity.photos.length > 1 && (
                <div className="thumbnail-strip">
                  {selectedCity.photos.map((photo, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img src={photo} alt={`Thumbnail ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Videos */}
          {selectedCity.videos.length > 0 && (
            <div className="videos-section">
              <h3>Videos</h3>
              <div className="video-grid">
                {selectedCity.videos.map((video, index) => (
                  <div key={index} className="video-container">
                    <video
                      src={video}
                      controls
                      playsInline
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memories text */}
          {selectedCity.memories && (
            <div className="memories-section">
              <h3>Memories</h3>
              <p className="memories-text">{selectedCity.memories}</p>
            </div>
          )}

          {/* Tags */}
          {selectedCity.tags.length > 0 && (
            <div className="tags-section">
              {selectedCity.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
