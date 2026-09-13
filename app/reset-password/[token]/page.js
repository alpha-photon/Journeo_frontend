'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export default function ResetPasswordPage({ params }) {
  const { token } = params;
  const router = useRouter();
  const { setUserFromToken } = useAuth();

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await r.json();
      if (!data.success) {
        setError(data.error || 'Reset failed. The link may have expired.');
        return;
      }
      // Auto-login — store token in localStorage and update auth context
      localStorage.setItem('auth_token', data.token);
      setUserFromToken?.(data.token, data.user);
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-900/30 text-xl">
          ✈️
        </div>
        <span className="text-2xl font-bold text-slate-100">Journeo</span>
      </Link>

      <div className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800">
          <h1 className="text-xl font-bold text-slate-100">Set a new password</h1>
          <p className="text-xs text-slate-500 mt-1">Choose a strong password for your Journeo account.</p>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-lg font-bold text-slate-100 mb-2">Password updated!</h2>
            <p className="text-sm text-slate-400 mb-1">You're now signed in. Redirecting...</p>
            <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mx-auto mt-4" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4" noValidate>
            {/* New password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-11 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1 py-0.5 transition-colors"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm password</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                placeholder="Repeat password"
                autoComplete="new-password"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 transition-colors"
              />
            </div>

            {/* Password strength hint */}
            {password.length > 0 && (
              <div className="flex gap-1.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      password.length >= [8, 10, 12, 14][i]
                        ? ['bg-red-500', 'bg-yellow-500', 'bg-teal-500', 'bg-green-500'][i]
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                <span>⚠</span><span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Updating…</span></>
              ) : (
                <span>Update Password</span>
              )}
            </button>

            <p className="text-center text-xs text-slate-500">
              <Link href="/" className="text-teal-400 hover:text-teal-300">
                ← Back to Journeo
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
