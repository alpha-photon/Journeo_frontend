'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const FeatureFlagContext = createContext({});

export function FeatureFlagProvider({ children }) {
  const [flags, setFlags] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/feature-flags`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setFlags(data.flags || {}); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <FeatureFlagContext.Provider value={{ flags, loaded }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}

// Returns true/false once loaded, null while loading
export function useFlag(key) {
  const { flags, loaded } = useFeatureFlags();
  if (!loaded) return null;
  return flags[key]?.enabled === true;
}

// Display/tab sequence for a flag — lower shows first. Falls back to a large
// number so flags without an order (or still loading) sort last, not first.
export function useFlagOrder(key) {
  const { flags } = useFeatureFlags();
  const order = flags[key]?.order;
  return typeof order === 'number' ? order : 999;
}
