'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export default function EmailCapture({ destination, shareId, onClose }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');

    try {
      const res = await fetch(`${API_URL}/api/itinerary/save-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, shareId, destination }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      setStatus('success');
      setTimeout(onClose, 2500);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl shadow-black/50 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors text-sm"
        >✕</button>

        {status === 'success' ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✉️</div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">You're on the list!</h3>
            <p className="text-sm text-slate-400">We'll send your <span className="text-teal-400">{destination}</span> itinerary link to your inbox.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 flex items-center justify-center text-xl">✉️</div>
              <div>
                <h3 className="font-bold text-slate-100">Get your itinerary by email</h3>
                <p className="text-xs text-slate-500">We'll send the share link to your inbox</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 text-sm transition-all"
              />

              {status === 'error' && (
                <p className="text-xs text-red-400">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm"
              >
                {status === 'loading' ? 'Saving...' : 'Send me the link →'}
              </button>
            </form>

            <p className="text-xs text-slate-600 text-center mt-3">No spam. Just your trip link.</p>
          </>
        )}
      </div>
    </div>
  );
}
