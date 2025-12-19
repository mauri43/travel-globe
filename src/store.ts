import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, City } from './types';
import * as api from './services/api';

const sampleCities: City[] = [
  {
    id: '1',
    name: 'Tokyo',
    country: 'Japan',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    dates: ['2023-04-15', '2023-04-22'],
    photos: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800',
    ],
    videos: [],
    memories: 'Cherry blossoms in full bloom, incredible street food in Shibuya, and the serene beauty of Senso-ji temple at dawn. The contrast between ancient traditions and futuristic technology was mesmerizing.',
    tags: ['cherry blossoms', 'food', 'temples', 'culture'],
  },
  {
    id: '2',
    name: 'Paris',
    country: 'France',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    dates: ['2022-09-10', '2022-09-17'],
    photos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
      'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800',
    ],
    videos: [],
    memories: 'Morning croissants by the Seine, watching the Eiffel Tower sparkle at midnight, and getting lost in the Louvre for hours. The city of lights truly earned its name.',
    tags: ['romance', 'art', 'architecture', 'food'],
  },
  {
    id: '3',
    name: 'New York',
    country: 'United States',
    coordinates: { lat: 40.7128, lng: -74.006 },
    dates: ['2023-12-20', '2023-12-27'],
    photos: [
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800',
      'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800',
    ],
    videos: [],
    memories: 'Holiday magic in Manhattan - ice skating in Central Park, the tree at Rockefeller Center, and Broadway shows that left me speechless. The energy of this city is unmatched.',
    tags: ['holidays', 'broadway', 'city life', 'winter'],
  },
  {
    id: '4',
    name: 'Sydney',
    country: 'Australia',
    coordinates: { lat: -33.8688, lng: 151.2093 },
    dates: ['2024-01-05', '2024-01-12'],
    photos: [
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
      'https://images.unsplash.com/photo-1523428096881-5bd79d043006?w=800',
      'https://images.unsplash.com/photo-1598948485421-33a1655d3c18?w=800',
    ],
    videos: [],
    memories: 'New Year fireworks over the Opera House, surfing lessons at Bondi Beach, and the most amazing seafood at the fish market. Summer in January felt surreal!',
    tags: ['beaches', 'new year', 'surfing', 'summer'],
  },
  {
    id: '5',
    name: 'Cape Town',
    country: 'South Africa',
    coordinates: { lat: -33.9249, lng: 18.4241 },
    dates: ['2023-06-15', '2023-06-22'],
    photos: [
      'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800',
      'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?w=800',
      'https://images.unsplash.com/photo-1591127233140-9c65e6b23d77?w=800',
    ],
    videos: [],
    memories: 'Table Mountain at sunset, penguin colonies at Boulders Beach, and wine tasting in Stellenbosch. The diversity of landscapes in one city is breathtaking.',
    tags: ['nature', 'wine', 'wildlife', 'mountains'],
  },
  {
    id: '6',
    name: 'Barcelona',
    country: 'Spain',
    coordinates: { lat: 41.3851, lng: 2.1734 },
    dates: ['2022-07-01', '2022-07-08'],
    photos: [
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800',
      'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=800',
    ],
    videos: [],
    memories: 'Gaudi\'s surreal architecture, tapas crawls through Gothic Quarter, and lazy beach afternoons. La Sagrada Familia made me believe in magic again.',
    tags: ['architecture', 'beach', 'tapas', 'art'],
  },
  {
    id: '7',
    name: 'Reykjavik',
    country: 'Iceland',
    coordinates: { lat: 64.1466, lng: -21.9426 },
    dates: ['2023-02-10', '2023-02-15'],
    photos: [
      'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800',
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
      'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=800',
    ],
    videos: [],
    memories: 'Northern lights dancing across the sky, Blue Lagoon in the snow, and driving the Golden Circle. This felt like visiting another planet.',
    tags: ['northern lights', 'nature', 'adventure', 'winter'],
  },
  {
    id: '8',
    name: 'Marrakech',
    country: 'Morocco',
    coordinates: { lat: 31.6295, lng: -7.9811 },
    dates: ['2023-10-05', '2023-10-10'],
    photos: [
      'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800',
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800',
      'https://images.unsplash.com/photo-1557127275-f8b5ba93e24e?w=800',
    ],
    videos: [],
    memories: 'The sensory overload of the souks, mint tea on rooftops, and the call to prayer echoing through the medina. Every corner revealed a new treasure.',
    tags: ['culture', 'markets', 'food', 'history'],
  },
  {
    id: '9',
    name: 'Rio de Janeiro',
    country: 'Brazil',
    coordinates: { lat: -22.9068, lng: -43.1729 },
    dates: ['2024-02-10', '2024-02-17'],
    photos: [
      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
      'https://images.unsplash.com/photo-1544989164-31dc3c645987?w=800',
      'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=800',
    ],
    videos: [],
    memories: 'Carnival energy everywhere, Christ the Redeemer emerging from the clouds, and samba rhythms on Copacabana. The Brazilian joy is absolutely contagious.',
    tags: ['carnival', 'beaches', 'music', 'culture'],
  },
  {
    id: '10',
    name: 'Kyoto',
    country: 'Japan',
    coordinates: { lat: 35.0116, lng: 135.7681 },
    dates: ['2023-04-23', '2023-04-28'],
    photos: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
    ],
    videos: [],
    memories: 'Bamboo groves whispering in the wind, geishas glimpsed in Gion, and the most perfect zen gardens. Time moves differently here.',
    tags: ['temples', 'zen', 'traditional', 'gardens'],
  },
];

interface ExtendedAppState extends AppState {
  isLoggedIn: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
  setLoading: (loading: boolean) => void;
  setCities: (cities: City[]) => void;
  loadCitiesFromApi: () => Promise<void>;
  refreshCities: () => Promise<void>;
  addCityWithApi: (city: Omit<City, 'id'>) => Promise<City>;
  updateCityWithApi: (id: string, updates: Partial<City>) => Promise<void>;
  deleteCityWithApi: (id: string) => Promise<void>;
}

export const useStore = create<ExtendedAppState>()(
  persist(
    (set, get) => ({
      cities: sampleCities,
      selectedCity: null,
      isAdminOpen: false,
      isPlacesListOpen: false,
      editingCity: null,
      activeTagFilters: [],
      isLoggedIn: false,
      isLoading: false,
      isRefreshing: false,

      setLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
      setLoading: (loading) => set({ isLoading: loading }),
      setCities: (cities) => set({ cities }),

      loadCitiesFromApi: async () => {
        set({ isLoading: true, cities: [] }); // Clear cities first
        try {
          const cities = await api.getCities();
          set({ cities: cities || [], isLoading: false });
        } catch (error) {
          console.error('Failed to load cities:', error);
          set({ cities: [], isLoading: false }); // Keep empty on error
        }
      },

      refreshCities: async () => {
        const { isLoggedIn } = get();
        if (!isLoggedIn) return;

        set({ isRefreshing: true });
        try {
          const cities = await api.getCities();
          set({ cities: cities || [], isRefreshing: false });
        } catch (error) {
          console.error('Failed to refresh cities:', error);
          set({ isRefreshing: false });
        }
      },

      addCity: (city) =>
        set((state) => ({ cities: [...state.cities, city] })),

      addCityWithApi: async (cityData) => {
        const { isLoggedIn } = get();
        if (isLoggedIn) {
          const newCity = await api.createCity(cityData);
          set((state) => ({ cities: [...state.cities, newCity] }));
          return newCity;
        } else {
          const newCity = { ...cityData, id: crypto.randomUUID() };
          set((state) => ({ cities: [...state.cities, newCity] }));
          return newCity;
        }
      },

      updateCity: (id, updatedCity) =>
        set((state) => ({
          cities: state.cities.map((city) =>
            city.id === id ? { ...city, ...updatedCity } : city
          ),
        })),

      updateCityWithApi: async (id, updates) => {
        const { isLoggedIn, updateCity } = get();
        if (isLoggedIn) {
          await api.updateCity(id, updates);
        }
        updateCity(id, updates);
      },

      deleteCity: (id) =>
        set((state) => ({
          cities: state.cities.filter((city) => city.id !== id),
        })),

      deleteCityWithApi: async (id) => {
        const { isLoggedIn, deleteCity } = get();
        if (isLoggedIn) {
          await api.deleteCity(id);
        }
        deleteCity(id);
      },

      setSelectedCity: (city) => set({ selectedCity: city }),
      setAdminOpen: (open) => set({ isAdminOpen: open }),
      setPlacesListOpen: (open) => set({ isPlacesListOpen: open }),
      setEditingCity: (city) => set({ editingCity: city }),
      setActiveTagFilters: (tags) => set({ activeTagFilters: tags }),
      toggleTagFilter: (tag) =>
        set((state) => ({
          activeTagFilters: state.activeTagFilters.includes(tag)
            ? state.activeTagFilters.filter((t) => t !== tag)
            : [...state.activeTagFilters, tag],
        })),
    }),
    {
      name: 'travel-globe-storage',
      partialize: (state) => ({
        // Only persist these fields for guest users
        cities: state.isLoggedIn ? [] : state.cities,
        activeTagFilters: state.activeTagFilters,
      }),
    }
  )
);
