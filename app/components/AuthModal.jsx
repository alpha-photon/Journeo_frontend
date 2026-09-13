'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const inputCls = 'w-full bg-paper-warm border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all';

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
  const { login, register } = useAuth();

  const [tab, setTab]             = useState(defaultTab);
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess]     = useState('');
  const emailRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab); setEmail(''); setPassword(''); setConfirm('');
      setError(''); setSuccess(''); setLoading(false);
      setTimeout(() => emailRef.current?.focus(), 80);
    }
  }, [isOpen, defaultTab]);

  useEffect(() => { setError(''); setSuccess(''); setPassword(''); setConfirm(''); }, [tab]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function validate() {
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (tab === 'register' && password !== confirm) return 'Passwords do not match';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      if (tab === 'login') {
        await login(email.trim(), password);
        onClose();
      } else {
        const result = await register(email.trim(), password);
        const msg = result.migrated
          ? 'Account created! Your passport data has been synced ✈️'
          : 'Account created! Welcome to Journeo ✈️';
        setSuccess(msg);
        setTimeout(onClose, 1800);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Enter your email address'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const r = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await r.json();
      if (data.success) setSuccess('Check your inbox — we sent a reset link.');
      else setError(data.error || 'Something went wrong.');
    } catch { setError('Could not send reset email. Please try again.'); }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-paper border border-line rounded-2xl shadow-warm-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center shadow-warm-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2.5" fill="#F97316"/>
                <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" stroke="#FAF6EE" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-serif text-lg font-semibold text-ink">Journeo</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-paper-warm transition-colors"
          >✕</button>
        </div>

        {/* Tabs */}
        {tab !== 'forgot' && (
          <div className="flex border-b border-line px-6 pt-4">
            {[{ id: 'login', label: 'Sign In' }, { id: 'register', label: 'Create Account' }].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`pb-3 px-1 mr-6 text-sm font-semibold border-b-2 transition-colors ${
                  tab === t.id ? 'text-saffron border-saffron' : 'text-ink-muted border-transparent hover:text-ink-soft'
                }`}
              >{t.label}</button>
            ))}
          </div>
        )}

        {/* Forgot password form */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="px-6 py-6 space-y-4" noValidate>
            <button type="button" onClick={() => setTab('login')} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-saffron transition-colors mb-2">
              ← Back to Sign In
            </button>
            <h3 className="font-serif text-lg font-semibold text-ink mb-1">Forgot your password?</h3>
            <p className="text-xs text-ink-muted mb-4">Enter your email and we'll send you a reset link.</p>
            <div>
              <label className="block text-xs font-mono font-medium text-ink-muted mb-1.5 tracking-wider uppercase">Email address</label>
              <input ref={emailRef} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com" autoComplete="email" className={inputCls} />
            </div>
            {error   && <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-subtle border border-rose/20 rounded-xl text-sm text-rose"><span>⚠</span><span>{error}</span></div>}
            {success && <div className="flex items-center gap-2 px-3 py-2.5 bg-jade-subtle border border-jade/20 rounded-xl text-sm text-jade"><span>✓</span><span>{success}</span></div>}
            <button type="submit" disabled={loading || !!success}
              className="w-full py-3 rounded-xl bg-ink hover:bg-ink-soft text-paper font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><span className="w-4 h-4 border-2 border-paper/30 border-t-paper rounded-full animate-spin" /><span>Sending…</span></> : <span>{success ? '✓ Email Sent' : 'Send Reset Link'}</span>}
            </button>
          </form>
        )}

        {/* Login / Register form */}
        <form onSubmit={handleSubmit} className={`px-6 py-6 space-y-4 ${tab === 'forgot' ? 'hidden' : ''}`} noValidate>
          {tab === 'register' && (
            <div className="flex items-start gap-2.5 p-3 bg-jade-subtle border border-jade/20 rounded-xl text-sm text-jade-deep">
              <span className="mt-0.5 shrink-0">💡</span>
              <p className="text-ink-soft">Your existing passport data will be synced to your new account automatically.</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-mono font-medium text-ink-muted mb-1.5 tracking-wider uppercase">Email address</label>
            <input ref={emailRef} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="you@example.com" autoComplete="email" className={inputCls} />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-mono font-medium text-ink-muted mb-1.5 tracking-wider uppercase">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder={tab === 'register' ? 'Min. 8 characters' : 'Enter password'}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className={`${inputCls} pr-14`} />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs px-1 py-0.5 transition-colors font-mono">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {tab === 'login' && (
            <div className="text-right -mt-2">
              <button type="button" onClick={() => setTab('forgot')} className="text-xs text-ink-muted hover:text-saffron transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          {/* Confirm password */}
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-mono font-medium text-ink-muted mb-1.5 tracking-wider uppercase">Confirm password</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                  placeholder="Repeat password" autoComplete="new-password"
                  className={`${inputCls} pr-14`} />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs px-1 py-0.5 transition-colors font-mono">
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {error   && <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-subtle border border-rose/20 rounded-xl text-sm text-rose"><span>⚠</span><span>{error}</span></div>}
          {success && <div className="flex items-center gap-2 px-3 py-2.5 bg-jade-subtle border border-jade/20 rounded-xl text-sm text-jade"><span>✓</span><span>{success}</span></div>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-ink hover:bg-ink-soft text-paper font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-warm"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-paper/30 border-t-paper rounded-full animate-spin" /><span>{tab === 'login' ? 'Signing in…' : 'Creating account…'}</span></>
              : <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
            }
          </button>

          <p className="text-center text-xs text-ink-muted">
            {tab === 'login' ? (
              <>Don't have an account?{' '}<button type="button" onClick={() => setTab('register')} className="text-saffron hover:text-saffron-deep font-medium">Sign up</button></>
            ) : (
              <>Already have an account?{' '}<button type="button" onClick={() => setTab('login')} className="text-saffron hover:text-saffron-deep font-medium">Sign in</button></>
            )}
          </p>
        </form>

        <div className="px-6 pb-5 text-center">
          <button onClick={onClose} className="text-xs text-ink-muted hover:text-ink-soft transition-colors">
            Continue as guest →
          </button>
        </div>
      </div>
    </div>
  );
}
