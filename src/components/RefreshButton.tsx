import { useStore } from '../store';

export function RefreshButton() {
  const { isLoggedIn, isRefreshing, refreshCities } = useStore();

  // Only show for logged-in users
  if (!isLoggedIn) return null;

  return (
    <button
      className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
      onClick={refreshCities}
      disabled={isRefreshing}
      title="Check for new trips"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    </button>
  );
}
