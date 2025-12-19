import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { updateTourCompleted } from '../services/api';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'bottom-right';
  hideSpotlightBorder?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour-target="globe"]',
    title: 'Welcome to Travel Globe!',
    description: 'This is your interactive 3D globe. Drag to rotate and explore your travel memories. Scroll to zoom in and out. Each glowing marker represents a place you\'ve visited.',
    position: 'bottom-right',
    hideSpotlightBorder: true, // No cyan border for globe, just the cutout
  },
  {
    target: '[data-tour-target="stats"]',
    title: 'Travel Stats',
    description: 'Track your journey with places visited, countries explored, and total miles flown. Hover over miles to see fun facts!',
    position: 'bottom'
  },
  {
    target: '[data-tour-target="places-list"]',
    title: 'My Places',
    description: 'View all your travel memories in a convenient list. Sort by country, date, or number of visits.',
    position: 'bottom'
  },
  {
    target: '[data-tour-target="add-button"]',
    title: 'Add New Memory',
    description: 'Manually add a new place or trip to your globe. Include photos, dates, and personal memories.',
    position: 'left'
  },
  {
    target: '[data-tour-target="settings"]',
    title: 'Settings',
    description: 'Manage your account and set up trusted emails for automatic trip imports. You can also replay this tour here!',
    position: 'left'
  },
  {
    target: '[data-tour-target="refresh"]',
    title: 'Refresh Trips',
    description: 'Check for new trips added via email forwarding. Just forward your flight confirmations to trips@mytravelglobe.org!',
    position: 'left'
  },
  {
    target: '[data-tour-target="tag-filter"]',
    title: 'Filter by Tags',
    description: 'Organize and filter your memories by tags like "beaches", "food", or "adventure". Only see what matters to you.',
    position: 'right'
  }
];

export function OnboardingTour() {
  const { isTourActive, endTour } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastRectRef = useRef<{ top: number; left: number; width: number; height: number } | null>(null);

  const currentStepData = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Update target element position
  const updateTargetPosition = useCallback(() => {
    if (!currentStepData) return;

    // Special handling for globe - create a centered circle
    if (currentStepData.target === '[data-tour-target="globe"]') {
      // Create a square rect centered on screen, sized to fit the globe
      const globeSize = Math.min(window.innerHeight * 0.75, window.innerWidth * 0.6);
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const customRect = {
        top: centerY - globeSize / 2,
        left: centerX - globeSize / 2,
        width: globeSize,
        height: globeSize,
        bottom: centerY + globeSize / 2,
        right: centerX + globeSize / 2,
        x: centerX - globeSize / 2,
        y: centerY - globeSize / 2,
        toJSON: () => ({})
      } as DOMRect;

      setTargetRect(customRect);
      lastRectRef.current = {
        top: customRect.top - 8,
        left: customRect.left - 8,
        width: customRect.width + 16,
        height: customRect.height + 16,
      };
      setIsTransitioning(false);
      return;
    }

    const element = document.querySelector(currentStepData.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      // Store last known position for smooth transitions
      lastRectRef.current = {
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      };
      setIsTransitioning(false);
    }
  }, [currentStepData]);

  // Update position on mount, step change, and window resize
  useEffect(() => {
    if (!isTourActive) return;

    // Small delay to ensure DOM elements are rendered
    const timeout = setTimeout(updateTargetPosition, 50);
    window.addEventListener('resize', updateTargetPosition);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateTargetPosition);
    };
  }, [isTourActive, currentStep, updateTargetPosition]);

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      // Mark as transitioning - keep spotlight in place, hide tooltip briefly
      setIsTransitioning(true);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleFinish = async () => {
    try {
      await updateTourCompleted(true);
    } catch (error) {
      console.error('Failed to save tour completion:', error);
    }
    endTour();
    setCurrentStep(0);
    lastRectRef.current = null;
  };

  // Calculate tooltip position based on target element and preferred position
  const getTooltipStyle = (): React.CSSProperties => {
    // During transition, hide tooltip to prevent flash
    if (isTransitioning) {
      return {
        position: 'fixed',
        opacity: 0,
        pointerEvents: 'none',
      };
    }

    if (!targetRect) {
      return {
        position: 'fixed',
        opacity: 0,
        pointerEvents: 'none',
      };
    }

    const padding = 20;
    const bottomBuffer = 100; // Extra space for footer and visibility
    const tooltipWidth = 380;
    const tooltipHeight = 240; // Actual height with all content
    const style: React.CSSProperties = {
      position: 'fixed',
      opacity: 1,
      transition: 'opacity 0.2s ease',
    };

    switch (currentStepData.position) {
      case 'bottom-right':
        // Position in bottom-right area of screen for globe intro
        style.bottom = padding + 60; // Above footer
        style.right = padding;
        break;
      case 'bottom':
        style.top = targetRect.bottom + padding;
        style.left = Math.max(padding, Math.min(
          targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
          window.innerWidth - tooltipWidth - padding
        ));
        break;
      case 'top':
        style.top = targetRect.top - tooltipHeight - padding;
        style.left = Math.max(padding, Math.min(
          targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
          window.innerWidth - tooltipWidth - padding
        ));
        break;
      case 'right':
        style.top = Math.max(padding, Math.min(
          targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          window.innerHeight - tooltipHeight - bottomBuffer
        ));
        style.left = targetRect.right + padding;
        break;
      case 'left':
        style.top = Math.max(padding, Math.min(
          targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          window.innerHeight - tooltipHeight - bottomBuffer
        ));
        style.left = targetRect.left - tooltipWidth - padding;
        // If tooltip goes off-screen left, flip to right
        if (style.left < padding) {
          style.left = targetRect.right + padding;
        }
        break;
    }

    return style;
  };

  // Get arrow position class
  const getArrowClass = (): string => {
    if (!targetRect || currentStepData.position === 'bottom-right') return '';
    return `tour-arrow-${currentStepData.position}`;
  };

  if (!isTourActive) return null;

  const stepTitle = currentStepData?.title || 'Welcome';
  const stepDescription = currentStepData?.description || 'Let us show you around!';
  const showCyanBorder = !currentStepData?.hideSpotlightBorder;

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true">
      {/* Spotlight - always render if we have a position, animate between positions */}
      {(targetRect || lastRectRef.current) && (
        <motion.div
          className={`tour-spotlight ${showCyanBorder ? '' : 'tour-spotlight-no-border'}`}
          initial={false}
          animate={{
            top: targetRect ? targetRect.top - 8 : lastRectRef.current!.top,
            left: targetRect ? targetRect.left - 8 : lastRectRef.current!.left,
            width: targetRect ? targetRect.width + 16 : lastRectRef.current!.width,
            height: targetRect ? targetRect.height + 16 : lastRectRef.current!.height,
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{ position: 'fixed' }}
        />
      )}

      {/* Tooltip */}
      <div
        className="tour-tooltip"
        style={getTooltipStyle()}
      >
        {/* Arrow pointing to target - not for bottom-right position */}
        {targetRect && currentStepData && currentStepData.position !== 'bottom-right' && (
          <div className={`tour-arrow ${getArrowClass()}`} />
        )}

        {/* Content */}
        <div className="tour-content">
          <h3 className="tour-title">{stepTitle}</h3>
          <p className="tour-description">{stepDescription}</p>

          {/* Progress dots */}
          <div className="tour-progress">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`tour-progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="tour-actions">
            <div className="tour-step-count">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </div>
            <button className="tour-button" onClick={handleNext}>
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
