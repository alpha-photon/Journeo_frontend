'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useFlag } from '../context/FeatureFlagContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const STYLE_CONFIG = {
  budget:    { color: 'bg-jade-subtle text-jade border-jade/20',           label: 'Budget'    },
  luxury:    { color: 'bg-marigold-subtle text-marigold-deep border-marigold/20', label: 'Luxury'    },
  adventure: { color: 'bg-saffron-subtle text-saffron-deep border-saffron/20',    label: 'Adventure' },
  family:    { color: 'bg-indigo-subtle text-indigo border-indigo/20',     label: 'Family'    },
  romantic:  { color: 'bg-rose-subtle text-rose border-rose/20',           label: 'Romantic'  },
  balanced:  { color: 'bg-paper-warm text-ink-muted border-line',          label: 'Balanced'  },
};

const STYLE_FILTERS = ['all', 'budget', 'balanced', 'luxury', 'adventure', 'family', 'romantic'];

function ItineraryCard({ doc }) {
  const style = STYLE_CONFIG[doc.travelStyle] || STYLE_CONFIG.balanced;
  const createdAgo = (() => {
    const diff = Date.now() - new Date(doc.createdAt).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  })();

  return (
    <div className="group relative bg-white border border-line rounded-2xl p-5 hover:border-saffron/40 hover:shadow-warm-md transition-all duration-200 hover:-translate-y-0.5 shadow-warm-sm">
      <Link href={`/share/${doc.shareId}`} className="absolute inset-0 rounded-2xl" aria-label={doc.destination} />

      <div className="relative flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-saffron-subtle border border-saffron/20 flex items-center justify-center text-xl shrink-0">
          ✈️
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-muted font-mono">
          <span>👁</span><span>{doc.views || 0}</span>
        </div>
      </div>

      <h3 className="relative font-serif text-base font-semibold text-ink leading-tight mb-1 group-hover:text-saffron transition-colors">
        {doc.destination}
      </h3>

      {doc.itinerary?.overview && (
        <p className="relative text-xs text-ink-muted leading-relaxed line-clamp-2 mb-3">{doc.itinerary.overview}</p>
      )}

      <div className="relative flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 bg-paper-warm border border-line rounded-full text-ink-muted font-mono">
          📅 {doc.days} days
        </span>
        {doc.travelStyle && (
          <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${style.color}`}>{style.label}</span>
        )}
        <span className="text-xs text-ink-muted ml-auto font-mono">{createdAgo}</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
      <div className="w-10 h-10 rounded-xl shimmer mb-3" />
      <div className="h-4 w-3/4 shimmer rounded mb-2" />
      <div className="h-3 w-full shimmer rounded mb-1" />
      <div className="h-3 w-2/3 shimmer rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-5 w-16 shimmer rounded-full" />
        <div className="h-5 w-20 shimmer rounded-full" />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const exploreEnabled = useFlag('explore_page');
  const [allItineraries, setAllItineraries] = useState([]);
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState(null);
  const [search, setSearch]          = useState('');
  const [styleFilter, setStyleFilter] = useState('all');
  const [sort, setSort]              = useState('newest');

  const fetchItineraries = useCallback(async (style, sortBy) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ limit: '50', sort: sortBy });
      if (style !== 'all') params.set('style', style);
      const r    = await fetch(`${API_URL}/api/itinerary/recent?${params}`);
      const data = await r.json();
      if (!data.success) throw new Error(data.error || 'Failed to load');
      setAllItineraries(data.itineraries || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (exploreEnabled === false) { window.location.replace('/'); return; }
    fetchItineraries(styleFilter, sort);
  }, [styleFilter, sort, fetchItineraries, exploreEnabled]);

  const filtered = search.trim()
    ? allItineraries.filter((d) => d.destination?.toLowerCase().includes(search.trim().toLowerCase()))
    : allItineraries;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar rightContent={
        <Link href="/" className="text-sm px-4 py-2 bg-ink hover:bg-ink-soft text-paper rounded-xl transition-all font-medium shadow-warm-sm">
          + Plan My Trip
        </Link>
      } />

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-saffron-subtle border border-saffron/20 rounded-full text-saffron-deep text-xs font-mono mb-4 tracking-wider">
            <span className="w-1.5 h-1.5 bg-saffron rounded-full animate-pulse" />
            COMMUNITY ITINERARIES
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-2">
            Explore AI-Generated Trips
          </h1>
          <p className="text-ink-muted text-sm sm:text-base max-w-lg">
            Real itineraries generated by travelers. Get inspired or use one as a starting point.
          </p>
        </div>

        {/* Search + Sort row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-sm">🔍</span>
            <input type="text" placeholder="Search destinations..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-line rounded-xl text-ink placeholder-ink-muted focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all text-sm shadow-warm-sm" />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs transition-colors">✕</button>
            )}
          </div>

          <div className="flex rounded-xl border border-line overflow-hidden shrink-0 shadow-warm-sm">
            {[{ value: 'newest', label: 'Newest' }, { value: 'popular', label: 'Popular' }].map(({ value, label }) => (
              <button key={value} onClick={() => setSort(value)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors font-sans ${
                  sort === value ? 'bg-ink text-paper' : 'bg-white text-ink-muted hover:text-ink-soft hover:bg-paper-warm'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Style filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STYLE_FILTERS.map((s) => {
            const cfg      = STYLE_CONFIG[s];
            const isActive = styleFilter === s;
            return (
              <button key={s} onClick={() => setStyleFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                  isActive ? 'bg-ink text-paper border-ink' : 'bg-white text-ink-muted border-line hover:border-saffron/30 hover:text-saffron-deep'
                }`}>
                {cfg ? cfg.label : 'All Styles'}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-ink font-medium mb-2">Failed to load itineraries</p>
            <p className="text-sm text-ink-muted mb-6">{error}</p>
            <button onClick={() => fetchItineraries(styleFilter, sort)}
              className="px-5 py-2.5 bg-paper-warm hover:bg-line text-ink rounded-xl text-sm font-medium transition-colors border border-line">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-sm text-ink-muted mb-4 font-mono">
              {filtered.length === 0
                ? search ? <>No destinations match <span className="text-ink">"{search}"</span></> : 'No itineraries yet'
                : <>Showing <span className="text-ink font-semibold">{filtered.length}</span>
                    {filtered.length < allItineraries.length && <> of <span className="text-ink font-semibold">{allItineraries.length}</span></>}{' '}
                    trip{filtered.length !== 1 ? 's' : ''}{search && <> matching <span className="text-saffron">"{search}"</span></>}
                  </>
              }
            </p>

            {filtered.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                <p className="text-5xl">{search ? '🔍' : '🌍'}</p>
                <div>
                  <p className="text-ink font-semibold mb-1">{search ? 'No results found' : 'No itineraries yet'}</p>
                  <p className="text-sm text-ink-muted">{search ? 'Try a different destination or clear the search' : 'Be the first to generate one!'}</p>
                </div>
                {search ? (
                  <button onClick={() => setSearch('')}
                    className="px-4 py-2 bg-paper-warm hover:bg-line text-ink rounded-xl text-sm font-medium transition-colors border border-line">
                    Clear search
                  </button>
                ) : (
                  <Link href="/" className="px-5 py-2.5 bg-ink hover:bg-ink-soft text-paper rounded-xl transition-all font-medium text-sm">
                    Plan a Trip →
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((doc) => <ItineraryCard key={doc.shareId || doc._id} doc={doc} />)}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
