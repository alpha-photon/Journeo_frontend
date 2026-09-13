'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

// Fetches and caches the current user's subscription status.
// Returns null while loading, or the subscription object.
// Re-fetches whenever the auth token changes.
export function useSubscription() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const r = await fetch(`${API}/api/payment/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        setData(null);
      } else {
        const json = await r.json();
        setData(json);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPro     = data?.subscription?.isActive === true;
  const isFree    = !isPro;
  const plan      = data?.subscription?.plan || 'free';
  const status    = data?.subscription?.status || 'none';
  const periodEnd = data?.subscription?.currentPeriodEnd || null;
  const cancelAtEnd = data?.subscription?.cancelAtPeriodEnd || false;
  const manualOverride = data?.subscription?.manualOverride || false;

  const used  = data?.usage?.generationsUsed  ?? 0;
  const limit = data?.usage?.generationsLimit ?? 3;
  const resetAt = data?.usage?.generationsResetAt || null;

  return {
    loading,
    error,
    isPro,
    isFree,
    plan,
    status,
    periodEnd,
    cancelAtEnd,
    manualOverride,
    usage: { used, limit, resetAt },
    keyId: data?.keyId || null,
    refresh,
  };
}
