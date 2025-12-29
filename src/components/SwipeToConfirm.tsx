import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';

interface SwipeToConfirmProps {
  onConfirm: () => void;
  isLoading?: boolean;
  warningText?: string;
  confirmText?: string;
}

export function SwipeToConfirm({
  onConfirm,
  isLoading = false,
  warningText = 'This action cannot be undone',
  confirmText = 'Swipe to confirm',
}: SwipeToConfirmProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Track width for threshold calculation
  const [trackWidth, setTrackWidth] = useState(0);
  const threshold = trackWidth * 0.75; // Must swipe 75% to confirm

  // Transform x position to background progress
  const backgroundProgress = useTransform(x, [0, trackWidth - 56], [0, 100]);
  const backgroundColor = useTransform(
    backgroundProgress,
    [0, 50, 100],
    ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.5)']
  );

  // Transform for checkmark opacity
  const checkOpacity = useTransform(x, [threshold * 0.8, threshold], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.point.x === 0 && info.offset.x === 0) return;

    const currentX = x.get();
    if (currentX >= threshold) {
      setIsConfirmed(true);
      onConfirm();
    }
  };

  const handleTrackRef = (el: HTMLDivElement | null) => {
    if (el) {
      setTrackWidth(el.offsetWidth);
      (constraintsRef as any).current = el;
    }
  };

  if (isConfirmed || isLoading) {
    return (
      <div className="swipe-confirmed">
        <div className="swipe-spinner" />
        <span>Deleting all flights...</span>
      </div>
    );
  }

  return (
    <div className="swipe-container">
      <p className="swipe-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        {warningText}
      </p>

      <motion.div
        className="swipe-track"
        ref={handleTrackRef}
        style={{ backgroundColor }}
      >
        <div className="swipe-track-text">
          <span className="swipe-arrows">→→→</span>
          <span>{confirmText}</span>
          <span className="swipe-arrows">→→→</span>
        </div>

        <motion.div
          className="swipe-thumb"
          drag="x"
          dragConstraints={{ left: 0, right: trackWidth - 56 }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ x }}
          whileDrag={{ scale: 1.05 }}
        >
          <motion.div className="thumb-icon" style={{ opacity: useTransform(checkOpacity, v => 1 - v) }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </motion.div>
          <motion.div className="thumb-check" style={{ opacity: checkOpacity }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
