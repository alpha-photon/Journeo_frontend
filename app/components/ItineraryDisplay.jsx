'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import ActivityVotes from './ActivityVotes';
import ActivityComments from './ActivityComments';
import ActivitySuggestions from './ActivitySuggestions';
import ItineraryRefine from './ItineraryRefine';

const TripMap = dynamic(() => import('./TripMap'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

function getAuthHeader() {
  try {
    const token = localStorage.getItem('iteranary_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

// ── Inline-editable field ──────────────────────────────────────────────────────
function EditableField({ value, shareId, fieldPath, className = '', multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState(null);

  if (!shareId) return <span className={className}>{value}</span>;

  const commit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) { setEditing(false); setDraft(value); return; }
    setEditing(false); setError(null);
    try {
      const r = await fetch(`${API_URL}/api/itinerary/${shareId}/field`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ field: fieldPath, value: trimmed }),
      });
      const json = await r.json();
      if (!json.success) throw new Error(json.error || 'Save failed');
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { setError(err.message); setDraft(value); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setEditing(false); setDraft(value); }
  };

  if (editing) {
    const sharedProps = {
      value: draft, onChange: (e) => setDraft(e.target.value),
      onBlur: commit, onKeyDown: handleKeyDown, autoFocus: true,
      className: 'bg-white border border-saffron/50 rounded-lg px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-saffron/15 w-full resize-none',
    };
    return multiline ? <textarea {...sharedProps} rows={2} /> : <input type="text" {...sharedProps} />;
  }

  return (
    <span onClick={() => { setEditing(true); setDraft(value); }} title="Click to edit"
      className={`${className} group/edit cursor-text hover:bg-saffron-subtle hover:outline hover:outline-1 hover:outline-saffron/30 rounded px-0.5 transition-all`}>
      {draft}
      {saved  && <span className="ml-1.5 text-xs text-jade font-normal">saved ✓</span>}
      {error  && <span className="ml-1.5 text-xs text-rose font-normal">{error}</span>}
      <span className="hidden group-hover/edit:inline ml-1 text-[10px] text-ink-muted">✎</span>
    </span>
  );
}

// ── Slot config — warm palette ─────────────────────────────────────────────────
const SLOT = {
  morning: {
    icon: '🌅', label: 'Morning',
    headerBg:   'bg-marigold-subtle border-marigold/25',
    headerText: 'text-marigold-deep',
    dot:        'bg-marigold',
    rail:       'bg-marigold/25',
    cardBorder: 'border-marigold/20',
    cardBg:     'bg-gradient-to-br from-marigold-subtle/60 to-transparent',
    timePill:   'bg-marigold-subtle text-marigold-deep border-marigold/20',
    numBg:      'bg-marigold-subtle text-marigold-deep',
  },
  afternoon: {
    icon: '☀️', label: 'Afternoon',
    headerBg:   'bg-indigo-subtle border-indigo/25',
    headerText: 'text-indigo',
    dot:        'bg-indigo',
    rail:       'bg-indigo/25',
    cardBorder: 'border-indigo/20',
    cardBg:     'bg-gradient-to-br from-indigo-subtle/60 to-transparent',
    timePill:   'bg-indigo-subtle text-indigo border-indigo/20',
    numBg:      'bg-indigo-subtle text-indigo',
  },
  evening: {
    icon: '🌙', label: 'Evening',
    headerBg:   'bg-rose-subtle border-rose/25',
    headerText: 'text-rose',
    dot:        'bg-rose',
    rail:       'bg-rose/25',
    cardBorder: 'border-rose/20',
    cardBg:     'bg-gradient-to-br from-rose-subtle/60 to-transparent',
    timePill:   'bg-rose-subtle text-rose border-rose/20',
    numBg:      'bg-rose-subtle text-rose',
  },
};

const CAT_ICON  = { attraction: '🏛️', food: '🍽️', activity: '🎯', transport: '🚌', nightlife: '🌃', nature: '🌿', viewpoint: '🌄' };
const CAT_LABEL = { attraction: 'Attraction', food: 'Food', activity: 'Activity', transport: 'Transport', nightlife: 'Nightlife', nature: 'Nature', viewpoint: 'Viewpoint' };
const QUICK_CHIPS = ['hidden gem', 'less touristy', 'more budget', 'outdoor', 'adventurous', 'relaxing'];

// ── Activity card ──────────────────────────────────────────────────────────────
function ActivityNode({ activity, slot, index, isLast, onSwap, isSwapping, activityKey, collab, nodeRef, isHighlighted }) {
  const [open, setOpen]                   = useState(false);
  const [swapPanelOpen, setSwapPanelOpen] = useState(false);
  const [swapInput, setSwapInput]         = useState('');
  const s = SLOT[slot];

  const handleSwapSubmit = () => {
    const pref = swapInput.trim();
    if (!pref) return;
    setSwapPanelOpen(false); setSwapInput(''); onSwap(pref);
  };

  // Swapping skeleton
  if (isSwapping) {
    return (
      <div className="flex gap-4 mb-5" ref={nodeRef}>
        <div className="flex flex-col items-center w-8 shrink-0 pt-1">
          <div className={`w-3 h-3 rounded-full ${s.dot} ring-4 ring-paper shadow-lg animate-pulse`} />
          {!isLast && <div className={`flex-1 w-0.5 ${s.rail} mt-2`} />}
        </div>
        <div className={`flex-1 border ${s.cardBorder} ${s.cardBg} rounded-2xl p-5 animate-pulse`}>
          <div className="h-3 w-20 bg-line rounded-full mb-3" />
          <div className="h-5 w-2/3 bg-line-soft rounded-lg mb-2" />
          <div className="h-3 w-full bg-line-soft rounded-lg mb-1" />
          <div className="h-3 w-4/5 bg-line-soft rounded-lg" />
          <p className="text-xs text-saffron/60 mt-3 font-mono">Finding a better match...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 mb-5 group/node transition-all duration-300 ${isHighlighted ? 'scale-[1.01]' : ''}`} ref={nodeRef}>
      {/* Timeline rail */}
      <div className="flex flex-col items-center w-8 shrink-0 pt-1.5">
        <div className={`w-3.5 h-3.5 rounded-full ${s.dot} ring-[3px] ring-paper shrink-0 z-10 shadow-sm`} />
        {!isLast && <div className={`flex-1 w-0.5 ${s.rail} mt-2 min-h-[2rem]`} />}
      </div>

      {/* Card */}
      <div className={`flex-1 border rounded-2xl overflow-hidden bg-white transition-all duration-200
        ${s.cardBorder}
        ${isHighlighted ? 'ring-2 ring-saffron/40 shadow-saffron' : ''}
        ${open || swapPanelOpen ? 'shadow-warm-md' : 'hover:shadow-warm shadow-warm-sm'}`}
      >
        {/* Card body */}
        <div className="px-5 py-4 cursor-pointer" onClick={() => { if (!swapPanelOpen) setOpen(!open); }}>
          <div className="flex items-start gap-3">
            {/* Activity number */}
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${s.numBg}`}>
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border font-mono ${s.timePill}`}>
                  {activity.time}
                </span>
                {activity.duration && (
                  <span className="text-xs text-ink-muted">⏱ {activity.duration}</span>
                )}
                {activity.category && (
                  <span className="text-xs text-ink-muted">
                    {CAT_ICON[activity.category] || '📍'}{' '}
                    <span className="hidden sm:inline">{CAT_LABEL[activity.category] || activity.category}</span>
                  </span>
                )}
                {activity.bookingRequired && (
                  <span className="text-[10px] px-2 py-0.5 bg-saffron-subtle text-saffron-deep rounded-full border border-saffron/20 font-mono">
                    📅 Book ahead
                  </span>
                )}
              </div>

              {/* Place name */}
              <h4 className="font-semibold text-ink text-[15px] leading-snug mb-1.5 font-sans">{activity.place}</h4>

              {/* Description */}
              {activity.description && (
                <p className="text-sm text-ink-muted leading-relaxed line-clamp-2 mb-2">{activity.description}</p>
              )}

              {/* Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {activity.entryFee && (
                  <span className="inline-flex items-center gap-1 text-xs bg-jade-subtle border border-jade/20 text-jade px-2.5 py-1 rounded-full font-mono">
                    💰 {activity.entryFee}
                  </span>
                )}
                {activity.travelTime && (
                  <span className="inline-flex items-center gap-1 text-xs bg-paper-warm border border-line text-ink-muted px-2.5 py-1 rounded-full font-mono">
                    🚶 {activity.travelTime}
                  </span>
                )}
              </div>
            </div>

            {/* Right actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {onSwap && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSwapPanelOpen((v) => !v); setOpen(false); }}
                  title="Swap this activity"
                  className={`opacity-0 group-hover/node:opacity-100 transition-all text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 font-mono ${
                    swapPanelOpen
                      ? 'bg-saffron-subtle border-saffron/40 text-saffron-deep opacity-100'
                      : 'border-line text-ink-muted hover:text-saffron hover:border-saffron/40 hover:bg-saffron-subtle'
                  }`}
                >
                  ⇄ swap
                </button>
              )}
              <span className={`text-ink-muted text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
            </div>
          </div>
        </div>

        {/* Swap panel */}
        {swapPanelOpen && (
          <div className="px-5 pb-4 pt-3 border-t border-line bg-paper-warm animate-slide-up">
            <p className="text-xs text-ink-muted mb-2.5 font-medium">Replace with something more...</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK_CHIPS.map((chip) => (
                <button key={chip} onClick={() => setSwapInput(chip)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all font-mono ${
                    swapInput === chip
                      ? 'bg-saffron-subtle border-saffron/40 text-saffron-deep'
                      : 'bg-white border-line text-ink-muted hover:border-saffron/30 hover:text-saffron-deep'
                  }`}>
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={swapInput} onChange={(e) => setSwapInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSwapSubmit()}
                placeholder="or describe what you want..."
                className="flex-1 text-sm bg-white border border-line rounded-xl px-3 py-2 text-ink placeholder-ink-muted focus:outline-none focus:border-saffron/50 font-sans"
                autoFocus />
              <button onClick={() => { setSwapPanelOpen(false); setSwapInput(''); }}
                className="text-xs px-3 py-2 rounded-xl border border-line text-ink-muted hover:text-ink-soft shrink-0 font-mono">Cancel</button>
              <button onClick={handleSwapSubmit} disabled={!swapInput.trim()}
                className="text-xs px-3 py-2 rounded-xl bg-saffron-subtle border border-saffron/30 text-saffron-deep hover:bg-saffron/15 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 font-mono">
                Swap →
              </button>
            </div>
          </div>
        )}

        {/* Expanded tip */}
        {open && activity.tip && (
          <div className="px-5 pb-4 pt-0 animate-slide-up">
            <div className="flex items-start gap-2.5 bg-marigold-subtle border border-marigold/20 rounded-xl p-3.5">
              <span className="text-marigold shrink-0 mt-0.5">💡</span>
              <div>
                <p className="text-xs font-semibold text-marigold-deep mb-1 font-mono tracking-wider">INSIDER TIP</p>
                <p className="text-sm text-ink-soft leading-relaxed">{activity.tip}</p>
              </div>
            </div>
          </div>
        )}

        {open && !activity.tip && activity.description && (
          <div className="px-5 pb-4 pt-0">
            <p className="text-sm text-ink-muted leading-relaxed">{activity.description}</p>
          </div>
        )}

        {/* Collaboration row */}
        {collab && activityKey && (
          <div className="px-5 pb-3 flex items-center gap-4 flex-wrap border-t border-line pt-2.5 bg-paper-warm">
            <ActivityVotes shareId={collab.shareId} activityKey={activityKey} votes={collab.votes} userId={collab.userId} onUpdate={collab.onVotesUpdate} />
            <ActivityComments shareId={collab.shareId} activityKey={activityKey} comments={collab.comments} onUpdate={collab.onCommentsUpdate} />
            <ActivitySuggestions shareId={collab.shareId} activityKey={activityKey} suggestions={collab.suggestions} isOwner={collab.isOwner} onUpdate={collab.onSuggestionsUpdate} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Meal divider ───────────────────────────────────────────────────────────────
function MealDivider({ type, value, shareId, fieldPath }) {
  if (!value) return null;
  const config = {
    lunch:  { icon: '🍱', label: 'Lunch Recommendation',  bg: 'bg-marigold-subtle border-marigold/20',  badge: 'text-marigold-deep' },
    dinner: { icon: '🍷', label: 'Dinner Recommendation', bg: 'bg-rose-subtle border-rose/20',           badge: 'text-rose' },
  };
  const c = config[type];
  return (
    <div className="flex gap-4 mb-5">
      <div className="flex flex-col items-center w-8 shrink-0">
        <div className="w-px flex-1 bg-line" />
        <div className="w-7 h-7 rounded-full bg-paper-warm border border-line flex items-center justify-center text-sm z-10 shrink-0 my-1">{c.icon}</div>
        <div className="w-px flex-1 bg-line" />
      </div>
      <div className={`flex-1 my-1 border rounded-xl px-4 py-2.5 ${c.bg}`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${c.badge} mb-0.5 block font-mono`}>{c.label}</span>
        <p className="text-sm leading-snug text-ink-soft">
          <EditableField value={value} shareId={shareId} fieldPath={fieldPath} multiline />
        </p>
      </div>
    </div>
  );
}

// ── Day timeline ───────────────────────────────────────────────────────────────
function DayTimeline({ day, dayIndex, shareId, onSwapActivity, swappingKey, collab, activityRefs, onActivityClick, highlightedActivity }) {
  const slots = [
    { key: 'morning',   activities: day.morning   || [] },
    { key: 'lunch',     activities: null },
    { key: 'afternoon', activities: day.afternoon || [] },
    { key: 'dinner',    activities: null },
    { key: 'evening',   activities: day.evening   || [] },
  ];

  return (
    <div className="animate-fade-in">
      {/* Day meta bar */}
      {(day.accommodation || day.estimatedCost || day.transport) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {day.accommodation && (
            <div className="flex items-center gap-2 text-xs bg-paper-warm border border-line rounded-xl px-3 py-2">
              <span className="text-base">🏨</span>
              <EditableField value={day.accommodation} shareId={shareId} fieldPath={`itinerary.days.${dayIndex}.accommodation`} className="text-ink-soft" />
            </div>
          )}
          {day.estimatedCost && (
            <div className="flex items-center gap-2 text-xs bg-paper-warm border border-line rounded-xl px-3 py-2">
              <span className="text-base">💰</span>
              <span className="text-ink-soft">{day.estimatedCost}</span>
            </div>
          )}
          {day.transport && (
            <div className="flex items-center gap-2 text-xs bg-paper-warm border border-line rounded-xl px-3 py-2">
              <span className="text-base">🚌</span>
              <span className="text-ink-soft">{day.transport}</span>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {slots.map((slot) => {
        if (slot.key === 'lunch' || slot.key === 'dinner') {
          return (
            <MealDivider key={slot.key} type={slot.key} value={day[slot.key]}
              shareId={shareId} fieldPath={`itinerary.days.${dayIndex}.${slot.key}`} />
          );
        }

        const s = SLOT[slot.key];
        const acts = slot.activities;
        if (!acts?.length) return null;

        return (
          <div key={slot.key} className="mb-6">
            <div className={`flex items-center gap-2.5 mb-4 px-3 py-2 rounded-xl border ${s.headerBg} w-fit`}>
              <span className="text-base">{s.icon}</span>
              <span className={`text-xs font-bold uppercase tracking-widest ${s.headerText} font-mono`}>{s.label}</span>
              <span className={`text-xs font-medium ${s.headerText} opacity-60 font-mono`}>· {acts.length} {acts.length === 1 ? 'activity' : 'activities'}</span>
            </div>

            {acts.map((act, i) => {
              const key = `${day.day}-${slot.key}-${i}`;
              return (
                <div key={i} onClick={() => onActivityClick?.(key)}>
                  <ActivityNode
                    activity={act} slot={slot.key} index={i} isLast={i === acts.length - 1}
                    onSwap={onSwapActivity ? (pref) => onSwapActivity(slot.key, i, pref) : null}
                    isSwapping={swappingKey === `${slot.key}-${i}`}
                    activityKey={key} collab={collab}
                    nodeRef={(el) => { if (activityRefs) activityRefs.current[key] = el; }}
                    isHighlighted={highlightedActivity === key}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ItineraryDisplay({ itinerary, shareId, destination, travelStyle, collaboration, userId, onCollabUpdate, canEdit = false, mapsEnabled = false }) {
  const [activeDay, setActiveDay]               = useState(1);
  const [days, setDays]                         = useState(itinerary.days || []);
  const [swappingKey, setSwappingKey]           = useState(null);
  const [swapError, setSwapError]               = useState(null);
  const [showMap, setShowMap]                   = useState(mapsEnabled);
  const [highlightedActivity, setHighlightedActivity] = useState(null);
  const activityRefs = useRef({});

  const currentDay      = days.find((d) => d.day === activeDay) || days[0];
  const totalActivities = days.reduce((sum, d) =>
    sum + (d.morning?.length || 0) + (d.afternoon?.length || 0) + (d.evening?.length || 0), 0);

  const collab = collaboration ? {
    shareId, userId,
    votes:       collaboration.votes       || [],
    comments:    collaboration.comments    || [],
    suggestions: collaboration.suggestions || [],
    isOwner:     collaboration.isOwner,
    onVotesUpdate:       (votes)       => onCollabUpdate?.({ ...collaboration, votes }),
    onCommentsUpdate:    (comments)    => onCollabUpdate?.({ ...collaboration, comments }),
    onSuggestionsUpdate: (suggestions) => onCollabUpdate?.({ ...collaboration, suggestions }),
  } : null;

  const handleMarkerClick   = useCallback((key) => {
    setHighlightedActivity(key);
    const el = activityRefs.current[key];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleActivityClick = useCallback((key) => setHighlightedActivity(key), []);

  const handleSwapActivity = useCallback(async (slot, activityIndex, swapPreference) => {
    if (!shareId) return;
    const key = `${slot}-${activityIndex}`;
    setSwappingKey(key); setSwapError(null);
    try {
      const res = await fetch(`${API_URL}/api/itinerary/swap-activity`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId, dayNumber: activeDay, slot, activityIndex, swapPreference, destination, travelStyle }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to swap');
      setDays((prev) =>
        prev.map((d) => {
          if (d.day !== activeDay) return d;
          const updated = [...(d[slot] || [])];
          updated[activityIndex] = data.activity;
          return { ...d, [slot]: updated };
        })
      );
    } catch (err) { setSwapError(err.message); }
    finally { setSwappingKey(null); }
  }, [shareId, activeDay, destination, travelStyle]);

  return (
    <div className="animate-fade-in">

      {/* Refine from feedback — owner-only, regenerates the whole trip */}
      {canEdit && shareId && <ItineraryRefine shareId={shareId} />}

      {/* Getting Around Banner */}
      {itinerary.gettingAround && (
        <div className="flex items-start gap-3 bg-indigo-subtle border border-indigo/20 rounded-2xl px-5 py-4 mb-6">
          <span className="text-xl shrink-0">🗺️</span>
          <div>
            <p className="eyebrow text-indigo mb-0.5">Getting Around</p>
            <p className="text-sm text-ink-soft leading-relaxed">{itinerary.gettingAround}</p>
          </div>
        </div>
      )}

      {/* Day selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{itinerary.totalDays}-day itinerary</h3>
            <span className="text-xs text-ink-muted font-mono">· {totalActivities} activities</span>
          </div>
          {mapsEnabled && (
            <button onClick={() => setShowMap((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 font-mono ${
                showMap
                  ? 'bg-saffron-subtle border-saffron/40 text-saffron-deep'
                  : 'bg-paper-warm border-line text-ink-muted hover:border-saffron/30'
              }`}>
              🗺️ {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          )}
        </div>

        {/* Day pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {days.map((day) => {
            const dayActCount = (day.morning?.length || 0) + (day.afternoon?.length || 0) + (day.evening?.length || 0);
            const isActive    = activeDay === day.day;
            return (
              <button key={day.day} onClick={() => setActiveDay(day.day)}
                className={`shrink-0 flex flex-col items-center px-4 pt-3 pb-3.5 rounded-2xl border transition-all duration-200 min-w-[80px] relative overflow-hidden ${
                  isActive
                    ? 'bg-saffron-subtle border-saffron/40 shadow-saffron'
                    : 'bg-white border-line hover:border-saffron/25 hover:bg-saffron-subtle/30 shadow-warm-sm'
                }`}>
                {isActive && <div className="absolute inset-x-0 top-0 h-0.5 bg-saffron" />}
                <span className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 font-mono ${isActive ? 'text-saffron' : 'text-ink-muted'}`}>Day</span>
                <span className={`text-2xl font-bold leading-none font-serif italic ${isActive ? 'text-saffron-deep' : 'text-ink'}`}>{day.day}</span>
                {day.theme && (
                  <span className="text-[9px] text-ink-muted mt-1.5 text-center leading-tight line-clamp-2 max-w-[80px]">{day.theme}</span>
                )}
                <span className={`text-[9px] mt-1.5 px-1.5 py-0.5 rounded-full font-mono ${isActive ? 'bg-saffron/15 text-saffron-deep' : 'bg-paper-warm text-ink-muted border border-line'}`}>
                  {dayActCount} stops
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {swapError && (
        <div className="mb-4 px-4 py-2.5 bg-rose-subtle border border-rose/20 rounded-xl text-xs text-rose font-mono">
          Swap failed: {swapError}
        </div>
      )}

      {/* Split layout: Timeline + Map */}
      <div className={`flex gap-5 mb-8 ${showMap ? 'lg:flex-row' : 'flex-col'} flex-col`}>

        {/* Timeline panel */}
        <div className={`${showMap ? 'lg:w-[58%]' : 'w-full'}`}>
          {currentDay && (
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-line">
              <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center font-bold text-saffron text-lg shrink-0 font-serif italic">
                {currentDay.day}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink leading-tight font-sans">
                  <EditableField
                    value={currentDay.theme || `Day ${currentDay.day}`}
                    shareId={canEdit ? shareId : null}
                    fieldPath={`itinerary.days.${days.findIndex((d) => d.day === activeDay)}.theme`}
                    className="font-semibold text-ink"
                  />
                </h3>
                <p className="text-xs text-ink-muted font-mono">
                  {[
                    currentDay.morning?.length   && `${currentDay.morning.length} morning`,
                    currentDay.afternoon?.length && `${currentDay.afternoon.length} afternoon`,
                    currentDay.evening?.length   && `${currentDay.evening.length} evening`,
                  ].filter(Boolean).join(' · ')} activities
                </p>
              </div>
            </div>
          )}

          <div className="bg-paper-warm rounded-2xl border border-line p-5 sm:p-6">
            {currentDay ? (
              <DayTimeline
                day={currentDay}
                dayIndex={days.findIndex((d) => d.day === activeDay)}
                shareId={canEdit ? shareId : null}
                onSwapActivity={canEdit ? handleSwapActivity : null}
                swappingKey={swappingKey} collab={collab}
                activityRefs={activityRefs}
                onActivityClick={handleActivityClick}
                highlightedActivity={highlightedActivity}
              />
            ) : (
              <p className="text-ink-muted text-sm text-center py-8">No data for this day.</p>
            )}
          </div>
        </div>

        {/* Map panel */}
        {showMap && (
          <div className="lg:w-[42%] h-[380px] lg:h-auto lg:min-h-[540px] lg:sticky lg:top-[130px] lg:self-start">
            <TripMap shareId={shareId} activeDay={String(activeDay)}
              highlightedActivity={highlightedActivity} onMarkerClick={handleMarkerClick} />
          </div>
        )}
      </div>

      {/* Bottom info panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {itinerary.generalTips?.length > 0 && (
          <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
            <h3 className="font-semibold text-ink mb-4 flex items-center gap-2 text-sm">
              <span className="w-7 h-7 rounded-lg bg-marigold-subtle flex items-center justify-center text-sm">💡</span>
              General Tips
            </h3>
            <ul className="space-y-3">
              {itinerary.generalTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-saffron flex items-center justify-center text-[10px] text-white font-bold shrink-0 mt-0.5 font-mono">{i + 1}</span>
                  <span className="text-ink-soft leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {itinerary.avoidList?.length > 0 && (
          <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
            <h3 className="font-semibold text-ink mb-4 flex items-center gap-2 text-sm">
              <span className="w-7 h-7 rounded-lg bg-rose-subtle flex items-center justify-center text-sm">⚠️</span>
              Things to Avoid
            </h3>
            <ul className="space-y-3">
              {itinerary.avoidList.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-rose shrink-0 mt-0.5 font-bold">✗</span>
                  <span className="text-ink-soft leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {itinerary.mustTry?.length > 0 && (
          <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
            <h3 className="font-semibold text-ink mb-4 flex items-center gap-2 text-sm">
              <span className="w-7 h-7 rounded-lg bg-marigold-subtle flex items-center justify-center text-sm">⭐</span>
              Must Try
            </h3>
            <div className="space-y-2.5">
              {itinerary.mustTry.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm p-2.5 rounded-xl bg-paper-warm border border-line">
                  <span className="text-marigold shrink-0 font-bold">★</span>
                  <span className="text-ink-soft leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {itinerary.localPhrases?.length > 0 && (
          <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
            <h3 className="font-semibold text-ink mb-4 flex items-center gap-2 text-sm">
              <span className="w-7 h-7 rounded-lg bg-jade-subtle flex items-center justify-center text-sm">🗣️</span>
              Useful Phrases
            </h3>
            <div className="space-y-2">
              {itinerary.localPhrases.map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-paper-warm rounded-xl px-3.5 py-2.5 border border-line">
                  <span className="text-sm text-ink-muted w-24 shrink-0 truncate font-sans">{p.phrase}</span>
                  <span className="w-px h-4 bg-line shrink-0" />
                  <span className="text-saffron-deep font-semibold text-sm flex-1 font-sans">{p.translation}</span>
                  {p.pronunciation && (
                    <span className="text-xs text-ink-muted italic shrink-0 hidden sm:block font-mono">"{p.pronunciation}"</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
