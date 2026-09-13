'use client';

import { useState } from 'react';
import { withAuth } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export default function ItineraryRefine({ shareId }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = feedback.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/itinerary/${shareId}/refine`,
        withAuth({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback: trimmed }),
        })
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to refine itinerary');
      // The whole itinerary object can change (overview, tips, every day) —
      // a reload is simpler and safer than patching dozens of local state
      // pieces across this component and its parent.
      window.location.reload();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-6 w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-dashed border-line hover:border-saffron/40 bg-paper-warm hover:bg-saffron-subtle text-sm text-ink-soft hover:text-saffron-deep transition-all"
      >
        <span className="text-base">✨</span>
        Not quite right? Give feedback and regenerate this itinerary
      </button>
    );
  }

  return (
    <div className="mb-6 p-5 rounded-2xl border border-saffron-light bg-saffron-subtle">
      <p className="text-sm font-semibold text-ink mb-1">What should change?</p>
      <p className="text-xs text-ink-muted mb-3">Be specific — "day 2 feels rushed", "more vegetarian food", "swap the hotel for something cheaper".</p>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Tell us what to fix..."
        rows={3}
        disabled={loading}
        className="w-full bg-white border border-line rounded-xl p-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-saffron/50 resize-none disabled:opacity-60"
      />
      {error && <p className="text-sm text-rose mt-2">{error}</p>}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleSubmit}
          disabled={loading || !feedback.trim()}
          className="px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-deep text-white text-sm font-bold transition-colors shadow-saffron disabled:opacity-50"
        >
          {loading ? 'Regenerating…' : 'Regenerate Itinerary'}
        </button>
        <button
          onClick={() => { setOpen(false); setError(''); }}
          disabled={loading}
          className="text-sm text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {loading && <p className="text-xs text-ink-muted mt-2">This can take up to a minute for longer trips…</p>}
    </div>
  );
}
