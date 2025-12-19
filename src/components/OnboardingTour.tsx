import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { updateTourCompleted } from '../services/api';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour-target="globe"]',
    title: 'Interactive 3D Globe',
    description: 'Drag to rotate and explore your travel memories. Scroll to zoom in and out. Each glowing marker represents a place you\'ve visited.',
    position: 'bottom'
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

  const currentStepData = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Update target element position
  const updateTargetPosition = useCallback(() => {
    if (!currentStepData) return;

    const element = document.querySelector(currentStepData.target);
    if (element) {
      setTargetRect(element.getBoundingClientRect());
    } else {
      // If element not found, use center of screen
      setTargetRect(null);
    }
  }, [currentStepData]);

  // Update position on mount, step change, and window resize
  useEffect(() => {
    if (!isTourActive) return;

    // Small delay to ensure DOM elements are rendered
    const timeout = setTimeout(updateTargetPosition, 100);
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
  };

  // Calculate tooltip position based on target element and preferred position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      // Center on screen if no target
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;
    const tooltipWidth = 380;
    const tooltipHeight = 200; // Approximate
    const style: React.CSSProperties = {
      position: 'fixed',
    };

    switch (currentStepData.position) {
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
          window.innerHeight - tooltipHeight - padding
        ));
        style.left = targetRect.right + padding;
        break;
      case 'left':
        style.top = Math.max(padding, Math.min(
          targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          window.innerHeight - tooltipHeight - padding
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
    if (!targetRect) return '';
    return `tour-arrow-${currentStepData.position}`;
  };

  if (!isTourActive) return null;

  // Fallback if step data is somehow missing
  const stepTitle = currentStepData?.title || 'Welcome';
  const stepDescription = currentStepData?.description || 'Let us show you around!';

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true">
      {/* Dark backdrop */}
      <div className="tour-backdrop" />

      {/* Spotlight highlight around target element */}
      {targetRect && (
        <motion.div
          className="tour-spotlight"
          animate={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          transition={{ duration: 0.3 }}
          style={{ position: 'fixed' }}
        />
      )}

      {/* Tooltip */}
      <div
        className="tour-tooltip"
        style={getTooltipStyle()}
      >
        {/* Arrow pointing to target */}
        {targetRect && currentStepData && <div className={`tour-arrow ${getArrowClass()}`} />}

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
