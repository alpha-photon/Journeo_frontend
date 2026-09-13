'use client';

import { useState } from 'react';
import { withAuth } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

function StarRating({ value, onChange, size = 'text-lg' }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? null : n)}
          className={`${size} leading-none transition-colors ${n <= (value || 0) ? 'text-marigold' : 'text-line hover:text-marigold-light'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function tripWindowPassed(startDate, days) {
  if (!startDate) return false;
  const end = new Date(startDate);
  end.setDate(end.getDate() + (days || 1));
  return end < new Date();
}

export default function TripJournal({ shareId, itinerary, destination, startDate, completed, journal, onUpdate }) {
  const [story, setStory] = useState(journal?.story || '');
  const [rating, setRating] = useState(journal?.rating ?? null);
  const [dayEntries, setDayEntries] = useState(() => {
    const days = itinerary?.days || [];
    const existing = new Map((journal?.dayEntries || []).map((e) => [e.day, e]));
    return days.map((d) => ({
      day: d.day,
      theme: d.theme,
      notes: existing.get(d.day)?.notes || '',
      rating: existing.get(d.day)?.rating ?? null,
    }));
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(journal?.updatedAt || null);
  const [error, setError] = useState('');

  const nudge = !completed && tripWindowPassed(startDate, itinerary?.totalDays);

  const updateDayEntry = (day, patch) => {
    setDayEntries((prev) => prev.map((e) => (e.day === day ? { ...e, ...patch } : e)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/itinerary/${shareId}/journal`,
        withAuth({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            story,
            rating,
            dayEntries: dayEntries.map(({ day, notes, rating }) => ({ day, notes, rating })),
          }),
        })
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save');
      setSavedAt(data.journal.updatedAt);
      onUpdate?.({ completed: true, journal: data.journal });
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleMarkCompleted = async () => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/itinerary/${shareId}/complete`,
        withAuth({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true }),
        })
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update');
      onUpdate?.({ completed: true, completedAt: data.completedAt });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-[11px] font-mono tracking-wider uppercase text-saffron-deep mb-1">Your Trip Journal</p>
        <h2 className="font-serif text-2xl font-semibold text-ink">How was {destination}?</h2>
        <p className="text-sm text-ink-muted mt-1">Private to you — write about your trip, rate it, and recap each day.</p>
      </div>

      {nudge && (
        <div className="mb-5 p-4 bg-saffron-subtle border border-saffron-light rounded-xl">
          <p className="text-sm text-saffron-deep font-medium">Looks like this trip has already happened — how did it go?</p>
        </div>
      )}

      {!completed && (
        <button
          onClick={handleMarkCompleted}
          className="mb-5 px-4 py-2 rounded-xl bg-ink hover:bg-ink-soft text-paper text-sm font-semibold transition-colors"
        >
          ✓ Mark this trip as completed
        </button>
      )}

      {completed && (
        <div className="mb-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-jade-subtle border border-jade-light text-jade-deep text-xs font-medium">
          ✓ Trip completed
        </div>
      )}

      {/* Overall story + rating */}
      <div className="bg-paper-warm border border-line rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-ink">Your story</label>
          <StarRating value={rating} onChange={setRating} />
        </div>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="What was the trip like? Highlights, surprises, would you go back?"
          rows={5}
          className="w-full bg-white border border-line rounded-xl p-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-saffron/50 resize-none"
        />
      </div>

      {/* Day-by-day recap */}
      {dayEntries.length > 0 && (
        <div className="space-y-3 mb-5">
          {dayEntries.map((entry) => (
            <div key={entry.day} className="bg-white border border-line rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-ink">Day {entry.day} <span className="text-ink-muted font-normal">— {entry.theme}</span></p>
                <StarRating value={entry.rating} onChange={(v) => updateDayEntry(entry.day, { rating: v })} size="text-sm" />
              </div>
              <textarea
                value={entry.notes}
                onChange={(e) => updateDayEntry(entry.day, { notes: e.target.value })}
                placeholder="What actually happened this day?"
                rows={2}
                className="w-full bg-paper border border-line rounded-lg p-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-saffron/50 resize-none"
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-rose mb-3">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-saffron hover:bg-saffron-deep text-white text-sm font-bold transition-colors shadow-saffron disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Journal'}
        </button>
        {savedAt && !saving && (
          <span className="text-xs text-ink-muted">Saved {new Date(savedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        )}
      </div>
    </div>
  );
}
