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
