'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getToken, setToken, clearToken,
  getStoredUser, setStoredUser, withAuth,
} from '../../lib/auth';
import { getUserId } from '../../lib/userId';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { id, email } or null
  const [loading, setLoading] = useState(true);   // true while verifying token on mount

  // ── On mount: restore session from localStorage ───────────────────────────
  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();

    if (!token) {
      setLoading(false);
      return;
    }

    // Optimistically restore cached user, then verify with server
    if (stored) setUser(stored);

    fetch(`${API_URL}/api/auth/me`, withAuth({ method: 'GET' }))
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          setStoredUser(data.user);
        } else {
          // Token invalid/expired — clear everything
          clearToken();
          setUser(null);
        }
      })
      .catch(() => {
        // Network error — keep the optimistic user so offline mode still works
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Login failed');

    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
    return data;
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (email, password) => {
    // Pass the current guest UUID so the backend can migrate passport data
    const guestId = getUserId();

    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, guestId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Registration failed');

    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
    return data; // includes { migrated: true/false }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // ── Set user from external token (e.g. after password reset) ─────────────
  const setUserFromToken = useCallback((token, userData) => {
    setToken(token);
    setStoredUser(userData);
    setUser(userData);
  }, []);

  // ── Effective userId for passport/ping calls ──────────────────────────────
  // Returns account id when logged in, localStorage UUID when guest.
  const effectiveUserId = user?.id ?? getUserId();

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, effectiveUserId, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
