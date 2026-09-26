'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { withAuth } from '../../lib/auth';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

// Floating on every page (mounted once in the root layout) so feedback is
// always one click away, not buried on a specific screen. Works signed out
// too — an optional email field lets a guest ask for a reply without
// requiring an account.
export default function FeedbackWidget() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setMessage(''); setEmail(''); setSent(false); setError('');
  }

  async function submit(e) {
    e.preventDefault();
    if (!message.trim()) { setError('Say a little about what you noticed.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/feedback`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), email: email.trim(), page: pathname }),
      }));
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Could not send feedback');
      setSent(true);
      setTimeout(() => { setOpen(false); reset(); }, 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-ink hover:bg-ink-soft text-paper text-xs font-semibold px-4 py-3 rounded-full shadow-warm transition-all hover:-translate-y-0.5"
      >
        <span aria-hidden>💬</span>
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-ink/30 backdrop-blur-sm px-0 sm:px-6 sm:pb-6"
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); reset(); } }}
        >
          <div className="w-full sm:w-[380px] bg-paper border border-line rounded-t-2xl sm:rounded-2xl shadow-warm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-semibold text-ink text-base">Got feedback?</h3>
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="text-ink-muted hover:text-ink text-lg leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {sent ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-jade-subtle border border-jade/20 rounded-xl text-sm text-jade">
                <span>✓</span><span>Thanks — we read every one of these.</span>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's working, what's broken, what's missing?"
                  rows={4}
                  maxLength={2000}
                  className="w-full text-sm bg-paper-warm border border-line rounded-xl px-3.5 py-2.5 text-ink placeholder-ink-muted focus:outline-none focus:border-saffron/60 resize-none"
                />
                {!user && (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional, if you'd like a reply)"
                    className="w-full text-sm bg-paper-warm border border-line rounded-xl px-3.5 py-2.5 text-ink placeholder-ink-muted focus:outline-none focus:border-saffron/60"
                  />
                )}
                {error && <p className="text-xs text-rose">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="w-full py-2.5 rounded-xl bg-ink hover:bg-ink-soft text-paper font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending…' : 'Send feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
