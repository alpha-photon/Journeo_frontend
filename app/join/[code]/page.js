'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { withAuth } from '../../../lib/auth';
import AuthModal from '../../components/AuthModal';
import Navbar from '../../components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export default function JoinPage({ params }) {
  const { code } = params;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState('loading'); // loading | needsAuth | joining | success | error
  const [error, setError] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setStatus('needsAuth');
      setAuthOpen(true);
      return;
    }

    // User is logged in — join the trip
    setStatus('joining');
    fetch(`${API_URL}/api/collaborate/join/${code}`, withAuth())
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || 'Invalid invite link');
        setStatus('success');
        setTimeout(() => router.push(`/share/${data.shareId}`), 1500);
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  }, [user, authLoading, code, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar onAuthClick={() => setAuthOpen(true)} />
      <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {status === 'loading' || status === 'joining' ? (
          <>
            <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Joining the trip...</p>
          </>
        ) : status === 'needsAuth' ? (
          <>
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">You've been invited to a trip!</h2>
            <p className="text-slate-400 mb-6">Sign in or create an account to join and start collaborating.</p>
            <button
              onClick={() => setAuthOpen(true)}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition-colors"
            >
              Sign in to join
            </button>
          </>
        ) : status === 'success' ? (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">You're in!</h2>
            <p className="text-slate-400 mb-4">Redirecting to the trip...</p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left space-y-2 max-w-xs mx-auto">
              <p className="text-xs font-semibold text-teal-400 mb-2">What you can do:</p>
              <p className="text-xs text-slate-400 flex items-center gap-2"><span>👍</span> Vote on activities</p>
              <p className="text-xs text-slate-400 flex items-center gap-2"><span>💬</span> Comment on plans</p>
              <p className="text-xs text-slate-400 flex items-center gap-2"><span>💡</span> Suggest alternatives</p>
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Couldn't join</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <Link href="/" className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition-colors">
              Go Home
            </Link>
          </>
        )}
      </div>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab="login"
      />
    </div>
  );
}
