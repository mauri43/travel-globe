import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { onAuthChange, login, signup, logout, type User } from '../services/firebase';
import { useStore } from '../store';
import { getUserProfile } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const sampleCities = [
  {
    id: '1',
    name: 'Tokyo',
    country: 'Japan',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    dates: ['2023-04-15', '2023-04-22'],
    photos: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800'],
    videos: [],
    memories: 'Cherry blossoms in full bloom, incredible street food in Shibuya.',
    tags: ['cherry blossoms', 'food', 'temples', 'culture'],
  },
  {
    id: '2',
    name: 'Paris',
    country: 'France',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    dates: ['2022-09-10', '2022-09-17'],
    photos: ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'],
    videos: [],
    memories: 'Morning croissants by the Seine, watching the Eiffel Tower sparkle.',
    tags: ['romance', 'art', 'architecture', 'food'],
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setLoggedIn, setCities, loadCitiesFromApi, startTour } = useStore();
  const previousUser = useRef<User | null>(null);

  useEffect(() => {
    let tourTimeout: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = onAuthChange(async (newUser) => {
      const wasLoggedIn = !!previousUser.current;
      const isNowLoggedIn = !!newUser;

      setUser(newUser);
      setLoggedIn(isNowLoggedIn);

      if (isNowLoggedIn && !wasLoggedIn) {
        // User just logged in - load cities from API
        await loadCitiesFromApi();

        // Check if user needs to see the onboarding tour
        try {
          const profile = await getUserProfile();
          if (!profile.tourCompleted) {
            // Delay tour start slightly to let UI settle
            tourTimeout = setTimeout(() => startTour(), 500);
          }
        } catch (err) {
          // Profile doesn't exist yet (new user), start tour
          tourTimeout = setTimeout(() => startTour(), 500);
        }
      } else if (!isNowLoggedIn && wasLoggedIn) {
        // User just logged out - reset to sample cities
        setCities(sampleCities);
      }

      previousUser.current = newUser;
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (tourTimeout) {
        clearTimeout(tourTimeout);
      }
    };
  }, [setLoggedIn, setCities, loadCitiesFromApi, startTour]);

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
  };

  const handleSignup = async (email: string, password: string) => {
    await signup(email, password);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
