'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { withAuth } from '../../lib/auth';
import { IconStar, IconCheck, IconX, IconPencil } from './icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const AUTOSAVE_MS = 1200;

// Optional nudges for the story box. A blank textarea headed "What was the trip
// like?" is the fastest way to get nothing written; a concrete angle is easier
// to answer than an open question.
const PROMPTS = [
  'Best meal',
  'Biggest surprise',
  'What I would do differently',
  'Worth the money?',
  'Would I go back?',
];

function StarRating({ value, onChange, size = 18, label }) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? null : n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={`p-0.5 leading-none transition-colors ${
            n <= (value || 0) ? 'text-marigold' : 'text-line hover:text-marigold-light'
          }`}
        >
          <IconStar size={size} filled={n <= (value || 0)} />
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

// The planned stops for a day, in the order they were scheduled.
function plannedStops(day) {
  return [...(day.morning || []), ...(day.afternoon || []), ...(day.evening || [])]
    .filter((a) => a?.place)
    .map((a) => ({ place: a.place, time: a.time || '' }));
}

export default function TripJournal({ shareId, itinerary, destination, startDate, completed, journal, onUpdate }) {
  const [story, setStory]   = useState(journal?.story || '');
  const [rating, setRating] = useState(journal?.rating ?? null);
  const [dayEntries, setDayEntries] = useState(() => {
    const days = itinerary?.days || [];
    const existing = new Map((journal?.dayEntries || []).map((e) => [e.day, e]));
    return days.map((d) => {
      const saved = existing.get(d.day);
      const savedStatus = new Map((saved?.activities || []).map((a) => [a.place, a.status]));
      return {
        day: d.day,
        theme: d.theme,
        notes: saved?.notes || '',
        rating: saved?.rating ?? null,
        activities: plannedStops(d).map((s) => ({ ...s, status: savedStatus.get(s.place) || null })),
      };
    });
  });

  const [status, setStatus]   = useState('idle'); // idle | dirty | saving | saved | error
  const [savedAt, setSavedAt] = useState(journal?.updatedAt || null);
  const [error, setError]     = useState('');
  const storyRef = useRef(null);
  const timerRef = useRef(null);
  const lastSavedRef = useRef(null);

  const nudge = !completed && tripWindowPassed(startDate, itinerary?.totalDays);

  const payload = useMemo(() => ({
    story,
    rating,
    dayEntries: dayEntries.map(({ day, notes, rating: r, activities }) => ({
      day,
      notes,
      rating: r,
      activities: activities.filter((a) => a.status).map((a) => ({ place: a.place, status: a.status })),
    })),
  }), [story, rating, dayEntries]);

  // Held in a ref so `save` keeps a stable identity — ShareClient passes a new
  // inline onUpdate every render, which would otherwise restart the debounce.
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  const save = useCallback(async (body) => {
    const serialized = JSON.stringify(body);
    if (serialized === lastSavedRef.current) { setStatus('saved'); return; }
    setStatus('saving');
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/itinerary/${shareId}/journal`, withAuth({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
      }));
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save');
      lastSavedRef.current = serialized;
      setSavedAt(data.journal.updatedAt);
      setStatus('saved');
      onUpdateRef.current?.({ completed: true, journal: data.journal });
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, [shareId]);

  // Autosave. Losing a trip write-up because the user tapped another tab is not
  // recoverable — there is no second chance to remember the trip.
  useEffect(() => {
    if (status !== 'dirty') return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(payload), AUTOSAVE_MS);
    return () => clearTimeout(timerRef.current);
  }, [status, payload, save]);

  // Keep the latest payload reachable from the unmount cleanup below.
  const payloadRef = useRef(payload);
  useEffect(() => { payloadRef.current = payload; }, [payload]);

  // Baseline = what the server already has. Without this the unmount flush
  // would fire on a tab the user only looked at — and a PUT also marks the
  // trip completed, so "opened the journal once" would become "trip done".
  useEffect(() => { lastSavedRef.current ??= JSON.stringify(payloadRef.current); }, []);

  // Switching tabs unmounts this component mid-debounce, so flush on the way
  // out. keepalive lets the request outlive the component (and the page).
  useEffect(() => () => {
    clearTimeout(timerRef.current);
    const serialized = JSON.stringify(payloadRef.current);
    if (serialized === lastSavedRef.current) return;
    // Hand the draft back to the parent too. Without this the next mount reads
    // a stale `journal` prop, the user sees their writing "lost", and typing
    // over it would overwrite the copy the flush just saved.
    onUpdateRef.current?.({
      completed: true,
      journal: { ...payloadRef.current, updatedAt: new Date().toISOString() },
    });
    fetch(`${API_URL}/api/itinerary/${shareId}/journal`, withAuth({
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: serialized,
      keepalive: true,
    })).catch(() => { /* best effort — the debounced save usually got there first */ });
  }, [shareId]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (status === 'dirty' || status === 'saving') { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [status]);

  const touch = () => setStatus('dirty');

  const updateDayEntry = (day, patch) => {
    setDayEntries((prev) => prev.map((e) => (e.day === day ? { ...e, ...patch } : e)));
    touch();
  };

  const setActivityStatus = (day, place, next) => {
    setDayEntries((prev) => prev.map((e) => (
      e.day === day
        ? { ...e, activities: e.activities.map((a) => (a.place === place ? { ...a, status: a.status === next ? null : next } : a)) }
        : e
    )));
    touch();
  };

  const addPrompt = (label) => {
    if (story.includes(`${label}:`)) return;
    const next = story.trim() ? `${story.trim()}\n\n${label}: ` : `${label}: `;
    setStory(next);
    touch();
    requestAnimationFrame(() => {
      const el = storyRef.current;
      if (el) { el.focus(); el.setSelectionRange(next.length, next.length); }
    });
  };

  const handleMarkCompleted = async () => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/itinerary/${shareId}/complete`, withAuth({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      }));
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update');
      onUpdate?.({ completed: true, completedAt: data.completedAt });
    } catch (e) {
      setError(e.message);
    }
  };

  // Progress gives the page a finish line instead of an endless form.
  const recapped = dayEntries.filter((e) => e.notes.trim() || e.rating || e.activities.some((a) => a.status)).length;
  const totalTracked = dayEntries.reduce((n, e) => n + e.activities.length, 0);
  const marked = dayEntries.reduce((n, e) => n + e.activities.filter((a) => a.status).length, 0);

  const statusLine = {
    idle:   savedAt ? `Saved ${new Date(savedAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Autosaves as you write',
    dirty:  'Unsaved changes…',
    saving: 'Saving…',
    saved:  'All changes saved',
    error:  'Could not save',
  }[status];

  return (
    <div className="max-w-3xl mx-auto pb-24">
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

      <div className="flex flex-wrap items-center gap-3 mb-5">
        {completed ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-jade-subtle border border-jade-light text-jade-deep text-xs font-medium">
            <IconCheck size={13} /> Trip completed
          </div>
        ) : (
          <button
            onClick={handleMarkCompleted}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink hover:bg-ink-soft text-paper text-sm font-semibold transition-colors"
          >
            <IconCheck size={14} /> Mark this trip as completed
          </button>
        )}
        {dayEntries.length > 0 && (
          <span className="text-xs text-ink-muted font-mono">
            {recapped} of {dayEntries.length} days recapped
            {totalTracked > 0 && ` · ${marked}/${totalTracked} stops marked`}
          </span>
        )}
      </div>

      {/* Overall story + rating */}
      <div className="bg-paper-warm border border-line rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-ink">Your story</label>
          <StarRating value={rating} onChange={(v) => { setRating(v); touch(); }} label="Overall trip rating" />
        </div>
        <textarea
          ref={storyRef}
          value={story}
          onChange={(e) => { setStory(e.target.value); touch(); }}
          placeholder="What was the trip like? Highlights, surprises, would you go back?"
          rows={5}
          className="w-full bg-white border border-line rounded-xl p-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-saffron/50 resize-none leading-relaxed"
        />
        <div className="flex flex-wrap gap-1.5 mt-3">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => addPrompt(p)}
              disabled={story.includes(`${p}:`)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-line text-xs text-ink-muted hover:text-saffron-deep hover:border-saffron/30 transition-colors disabled:opacity-35 disabled:hover:text-ink-muted disabled:hover:border-line"
            >
              <IconPencil size={11} /> {p}
            </button>
          ))}
        </div>
      </div>

      {/* Day-by-day recap */}
      {dayEntries.length > 0 && (
        <div className="space-y-3">
          {dayEntries.map((entry) => (
            <div key={entry.day} className="bg-white border border-line rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-ink">
                  Day {entry.day} <span className="text-ink-muted font-normal">— {entry.theme}</span>
                </p>
                <StarRating value={entry.rating} onChange={(v) => updateDayEntry(entry.day, { rating: v })} size={14} label={`Day ${entry.day} rating`} />
              </div>

              {/* What was planned. Tapping is far less work than recalling from a
                  blank box, and a stop people keep skipping is worth knowing. */}
              {entry.activities.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {entry.activities.map((a) => (
                    <div key={a.place} className="flex items-center gap-2 justify-between">
                      <span className={`text-[13px] truncate ${a.status === 'skipped' ? 'text-ink-muted line-through' : 'text-ink-soft'}`}>
                        {a.time && <span className="font-mono text-[11px] text-ink-muted mr-1.5">{a.time}</span>}
                        {a.place}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActivityStatus(entry.day, a.place, 'did')}
                          title="I did this"
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
                            a.status === 'did'
                              ? 'bg-jade-subtle border-jade-light text-jade-deep'
                              : 'border-line text-ink-muted hover:text-jade-deep hover:border-jade-light'
                          }`}
                        >
                          <IconCheck size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivityStatus(entry.day, a.place, 'skipped')}
                          title="I skipped this"
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
                            a.status === 'skipped'
                              ? 'bg-paper-warm border-line text-ink'
                              : 'border-line text-ink-muted hover:text-ink hover:border-ink-muted'
                          }`}
                        >
                          <IconX size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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

      {/* Save state stays visible instead of living under a long scroll. */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-paper/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <span className={`text-xs flex items-center gap-1.5 ${
            status === 'error' ? 'text-rose' : status === 'saved' ? 'text-jade-deep' : 'text-ink-muted'
          }`}>
            {status === 'saving' && <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
            {status === 'saved' && <IconCheck size={13} />}
            {statusLine}
          </span>
          {(status === 'dirty' || status === 'error') && (
            <button
              onClick={() => save(payload)}
              className="px-4 py-1.5 rounded-lg bg-saffron hover:bg-saffron-deep text-white text-xs font-bold transition-colors"
            >
              Save now
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-rose mt-3">{error}</p>}
    </div>
  );
}
