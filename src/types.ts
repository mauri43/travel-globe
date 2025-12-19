export interface City {
  id: string;
  name: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  flewFrom?: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  isOneWay?: boolean;
  tripName?: string;
  dates: string[];
  photos: string[];
  videos: string[];
  memories: string;
  tags: string[];
}

export interface AppState {
  cities: City[];
  selectedCity: City | null;
  isAdminOpen: boolean;
  isPlacesListOpen: boolean;
  editingCity: City | null;
  activeTagFilters: string[];
  addCity: (city: City) => void;
  updateCity: (id: string, city: Partial<City>) => void;
  deleteCity: (id: string) => void;
  setSelectedCity: (city: City | null) => void;
  setAdminOpen: (open: boolean) => void;
  setPlacesListOpen: (open: boolean) => void;
  setEditingCity: (city: City | null) => void;
  setActiveTagFilters: (tags: string[]) => void;
  toggleTagFilter: (tag: string) => void;
}
