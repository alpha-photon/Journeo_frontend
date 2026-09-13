'use client';

import { useState } from 'react';

const TRAVEL_STYLES = [
  { value: 'budget',    label: 'Budget',    desc: 'Hostels, street food, local transport' },
  { value: 'balanced',  label: 'Balanced',  desc: 'Mix of comfort and value' },
  { value: 'luxury',    label: 'Luxury',    desc: 'Premium hotels, fine dining' },
  { value: 'adventure', label: 'Adventure', desc: 'Outdoor activities, off-the-beaten path' },
  { value: 'family',    label: 'Family',    desc: 'Kid-friendly activities and comfort' },
  { value: 'romantic',  label: 'Romantic',  desc: 'Couples experiences and sunset views' },
];

const QUICK_REQUIREMENTS = [
  'Vegetarian friendly',
  'Vegan options',
  'No spicy food',
  'Wheelchair accessible',
  'Pet friendly',
  'Beach focused',
  'History & culture',
  'Shopping',
  'Nightlife',
  'Off-season travel',
];

export default function ItineraryForm({ onSubmit }) {
  const [form, setForm] = useState({
    destination: '',
    days: 5,
    travelStyle: 'balanced',
    specialRequirements: '',
    budgetPerDay: '',
    startDate: '',
  });
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleRequirement = (req) =>
    setSelectedRequirements((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.destination.trim()) return;
    setIsSubmitting(true);
    const allRequirements = [...selectedRequirements, form.specialRequirements.trim()]
      .filter(Boolean).join(', ');
    await onSubmit({ ...form, specialRequirements: allRequirements || 'None' });
    setIsSubmitting(false);
  };

  const labelClass = 'block text-[10px] font-mono font-medium text-ink-muted uppercase tracking-widest mb-2';
  const inputClass = 'w-full px-4 py-3 bg-white border border-line rounded-xl text-ink placeholder-ink-muted focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all text-[15px] font-sans';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-line rounded-2xl p-6 sm:p-8 text-left max-w-2xl mx-auto shadow-warm-md"
    >
      {/* Destination */}
      <div className="mb-5">
        <label className={labelClass}>Where are you going?</label>
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B665D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <input
            type="text"
            placeholder="Tokyo, Bali, Paris, Udaipur..."
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            required
            className={`${inputClass} pl-12`}
          />
        </div>
      </div>

      {/* Days + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className={labelClass}>
            Duration —{' '}
            <span className="text-saffron normal-case tracking-normal font-semibold">{form.days} days</span>
          </label>
          <div className="space-y-3">
            <input
              type="range" min={1} max={14} value={form.days}
              onChange={(e) => setForm({ ...form, days: parseInt(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-saffron bg-line"
            />
            <div className="flex gap-1.5 flex-wrap">
              {[1, 3, 5, 7, 10, 14].map((d) => (
                <button
                  key={d} type="button"
                  onClick={() => setForm({ ...form, days: d })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    form.days === d
                      ? 'bg-ink text-paper shadow-warm-sm'
                      : 'bg-paper-warm text-ink-muted hover:bg-line hover:text-ink-soft border border-line'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Start Date <span className="text-ink-muted normal-case tracking-normal font-normal">(optional)</span>
          </label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B665D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <input
              type="date" value={form.startDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={`${inputClass} pl-10`}
            />
          </div>
          {form.startDate && (
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-saffron font-mono">
                Ends {new Date(new Date(form.startDate).getTime() + (form.days - 1) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <button type="button" onClick={() => setForm({ ...form, startDate: '' })} className="text-xs text-ink-muted hover:text-ink transition-colors">Clear</button>
            </div>
          )}
        </div>
      </div>

      {/* Travel Style */}
      <div className="mb-5">
        <label className={labelClass}>Travel Style</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {TRAVEL_STYLES.map((style) => (
            <button
              key={style.value} type="button"
              onClick={() => setForm({ ...form, travelStyle: style.value })}
              title={style.desc}
              className={`p-2.5 rounded-xl border text-center transition-all duration-200 ${
                form.travelStyle === style.value
                  ? 'border-saffron bg-saffron-subtle shadow-saffron'
                  : 'border-line bg-paper-warm hover:border-line hover:bg-white'
              }`}
            >
              <div className={`text-xs font-semibold leading-none ${form.travelStyle === style.value ? 'text-saffron-deep' : 'text-ink-muted'}`}>
                {style.label}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-muted mt-2 font-sans italic">
          {TRAVEL_STYLES.find((s) => s.value === form.travelStyle)?.desc}
        </p>
      </div>

      {/* Budget */}
      <div className="mb-5">
        <label className={labelClass}>
          Daily Budget <span className="text-ink-muted normal-case tracking-normal font-normal">(optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted font-mono text-sm font-medium">$</span>
          <input
            type="number" min={0} placeholder="Leave blank for no limit"
            value={form.budgetPerDay}
            onChange={(e) => setForm({ ...form, budgetPerDay: e.target.value })}
            className={`${inputClass} pl-8`}
          />
        </div>
        {form.budgetPerDay && (
          <p className="text-xs text-saffron-deep mt-1.5 font-mono">AI will keep costs ≤ ${form.budgetPerDay}/day per person</p>
        )}
      </div>

      {/* Quick Requirements */}
      <div className="mb-6">
        <label className={labelClass}>
          Preferences <span className="text-ink-muted normal-case tracking-normal font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {QUICK_REQUIREMENTS.map((req) => (
            <button
              key={req} type="button"
              onClick={() => toggleRequirement(req)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                selectedRequirements.includes(req)
                  ? 'bg-ink text-paper shadow-warm-sm'
                  : 'bg-paper-warm text-ink-muted border border-line hover:border-ink-muted hover:text-ink-soft'
              }`}
            >
              {req}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Anything else? (e.g. no seafood, honeymoon, solo female...)"
          value={form.specialRequirements}
          onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })}
          className={inputClass}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !form.destination.trim()}
        className="w-full py-4 px-6 bg-ink hover:bg-ink-soft text-paper font-semibold text-base rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-warm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2.5 font-sans"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-paper/30 border-t-paper rounded-full animate-spin" />
            <span>Building your itinerary...</span>
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>Generate My Itinerary</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </>
        )}
      </button>

      <p className="text-center text-[11px] font-mono text-ink-muted mt-3 tracking-wide">
        GROUNDED IN 27,000 REAL REDDIT TRIP REPORTS
      </p>
    </form>
  );
}
