import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AuthModal } from './AuthModal';

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 99,
        y: (e.clientY / window.innerHeight - 0.5) * 99,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const openAuth = (signup: boolean) => {
    setIsSignup(signup);
    setShowAuthModal(true);
  };

  // Generate stars once and memoize them
  const stars = useMemo(() => Array.from({ length: 195 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 3,
    duration: Math.random() * 2 + 2,
    depth: Math.random(), // 0 = far (moves less), 1 = close (moves more)
  })), []);

  // Generate floating particles once
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * 10,
  })), []);

  return (
    <div className="landing-page">
      {/* Animated star background with parallax */}
      <div className="stars-container">
        {stars.map((star) => {
          // Parallax: closer stars (depth=1) move more, farther stars (depth=0) move less
          const parallaxX = mousePosition.x * (0.2 + star.depth * 0.8);
          const parallaxY = mousePosition.y * (0.2 + star.depth * 0.8);

          return (
            <motion.div
              key={star.id}
              className="star"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.2, 1],
                x: parallaxX,
                y: parallaxY,
              }}
              transition={{
                opacity: {
                  duration: star.duration,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                scale: {
                  duration: star.duration,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                x: { type: 'spring', stiffness: 100, damping: 30 },
                y: { type: 'spring', stiffness: 100, damping: 30 },
              }}
            />
          );
        })}
      </div>

      {/* Floating particles */}
      <div className="particles-container">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [window.innerHeight + 50, -50],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Gradient orbs */}
      <motion.div
        className="gradient-orb orb-1"
        animate={{
          x: mousePosition.x * 2,
          y: mousePosition.y * 2,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 30 }}
      />
      <motion.div
        className="gradient-orb orb-2"
        animate={{
          x: mousePosition.x * -1.5,
          y: mousePosition.y * -1.5,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 30 }}
      />

      {/* Content */}
      <div className="landing-content">
        {/* Navigation */}
        <motion.nav
          className="landing-nav"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="landing-logo">
            <div className="landing-logo-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" />
                <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <span>Travel Globe</span>
          </div>
          <div className="landing-nav-buttons">
            <button className="nav-btn-ghost" onClick={() => openAuth(false)}>
              Sign In
            </button>
            <button className="nav-btn-primary" onClick={() => openAuth(true)}>
              Get Started
            </button>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <main className="landing-hero">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <span className="badge-dot" />
            Your memories, mapped across the cosmos
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Every journey
            <br />
            <span className="hero-title-accent">becomes a star</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Transform your travel memories into an interactive 3D globe.
            <br />
            Forward your flight confirmations and watch your world light up.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <button className="hero-btn-primary" onClick={() => openAuth(true)}>
              <span>Start Your Globe</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="hero-btn-secondary" onClick={() => openAuth(false)}>
              I have an account
            </button>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            className="hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            <div className="feature-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Auto-import flights
            </div>
            <div className="feature-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Interactive 3D globe
            </div>
            <div className="feature-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              Track your miles
            </div>
          </motion.div>
        </main>

        {/* Globe preview */}
        <motion.div
          className="landing-globe-preview"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.8 }}
        >
          <div className="globe-preview-glow" />
          <div className="globe-preview-ring ring-1" />
          <div className="globe-preview-ring ring-2" />
          <div className="globe-preview-ring ring-3" />
          <div className="globe-preview-core">
            <svg viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              <ellipse cx="50" cy="50" rx="45" ry="18" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              <ellipse cx="50" cy="50" rx="45" ry="18" stroke="currentColor" strokeWidth="0.5" opacity="0.3" transform="rotate(60 50 50)" />
              <ellipse cx="50" cy="50" rx="45" ry="18" stroke="currentColor" strokeWidth="0.5" opacity="0.3" transform="rotate(120 50 50)" />
              <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              {/* Marker dots */}
              <circle cx="65" cy="35" r="3" fill="#ff6b35" />
              <circle cx="30" cy="55" r="3" fill="#ff6b35" />
              <circle cx="70" cy="60" r="3" fill="#ff6b35" />
              <circle cx="45" cy="25" r="3" fill="#ff6b35" />
              <circle cx="55" cy="70" r="3" fill="#ff6b35" />
              {/* Connection lines */}
              <path d="M65 35 Q 50 20 30 55" stroke="#00f5ff" strokeWidth="0.5" opacity="0.6" fill="none" />
              <path d="M30 55 Q 50 65 70 60" stroke="#00f5ff" strokeWidth="0.5" opacity="0.6" fill="none" />
              <path d="M45 25 Q 55 45 55 70" stroke="#00f5ff" strokeWidth="0.5" opacity="0.6" fill="none" />
            </svg>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          className="landing-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
        >
          <p>Forward flight emails to <span className="email-highlight">trips@mytravelglobe.org</span></p>
        </motion.footer>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultIsSignup={isSignup}
      />
    </div>
  );
}
