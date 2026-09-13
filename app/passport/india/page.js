'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../../components/AuthModal';
import { INDIA_STATES, INDIA_REGIONS, REGION_COLORS, INDIA_BADGES, STATE_BY_CODE } from '../../../data/indiaStates';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

// ── Derive badge input data ───────────────────────────────────────────────────
function deriveBadgeData(indiaVisited, indiaWishlist) {
  const visitedCodes = new Set((indiaVisited || []).map((s) => s.code));
  const regionsVisited = new Set((indiaVisited || []).map((s) => s.region)).size;
  const visitedPlacesCount = (indiaVisited || []).reduce((sum, s) => sum + (s.visitedPlaces?.length || 0), 0);
  return {
    visitedCount: visitedCodes.size,
    visitedCodes,
    regionsVisited,
    visitedPlacesCount,
    wishlistCount: (indiaWishlist || []).length,
  };
}

// ── State Card ────────────────────────────────────────────────────────────────
function StateCard({ state, isVisited, isWishlist, visitedEntry, onClick }) {
  const rc = REGION_COLORS[state.region];
  const placesVisited = visitedEntry?.visitedPlaces?.length || 0;
  const totalPlaces   = state.places.length;

  return (
    <button
      onClick={() => onClick(state)}
      className={`w-full text-left p-3.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.99] ${
        isVisited  ? `${rc.bg} ${rc.border}` :
        isWishlist ? 'bg-amber-500/8 border-amber-500/25' :
                     'bg-slate-900 border-slate-800 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-2xl">{state.icon}</span>
        <div className="flex gap-1">
          {isVisited  && <span className="text-xs bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded-full border border-teal-500/30">✓ Visited</span>}
          {isWishlist && <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30">🔖</span>}
        </div>
      </div>
      <p className="font-semibold text-slate-100 text-sm leading-snug">{state.name}</p>
      <p className="text-xs text-slate-500 mt-0.5">{state.capital}</p>

      {isVisited && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">{placesVisited}/{totalPlaces} places</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${rc.dot} transition-all`}
              style={{ width: `${(placesVisited / totalPlaces) * 100}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}

// ── State Detail Drawer ───────────────────────────────────────────────────────
function StateDrawer({ state, visitedEntry, isWishlist, onStatusChange, onPlaceToggle, onClose, saving }) {
  const rc = REGION_COLORS[state.region];
  const visitedPlaces = new Set(visitedEntry?.visitedPlaces || []);
  const isVisited = !!visitedEntry;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b border-slate-800 flex items-center gap-3 rounded-t-2xl ${isVisited ? rc.bg : ''}`}>
          <span className="text-3xl">{state.icon}</span>
          <div className="flex-1">
            <h3 className="font-bold text-slate-100">{state.name}</h3>
            <p className="text-xs text-slate-400">{state.capital} · <span className={rc.text}>{state.region} India</span></p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 text-xl leading-none p-1">×</button>
        </div>

        {/* Status buttons */}
        <div className="px-5 py-4 border-b border-slate-800">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Mark as</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'visited',  label: 'Visited',  icon: '✅', active: 'bg-teal-500/20 border-teal-500/50 text-teal-300'   },
              { id: 'wishlist', label: 'Wishlist', icon: '🔖', active: 'bg-amber-500/20 border-amber-500/50 text-amber-300' },
              { id: 'none',     label: 'Remove',   icon: '✕',  active: 'bg-slate-700 border-slate-600 text-slate-300'       },
            ].map((opt) => {
              const isCurrent = (opt.id === 'visited' && isVisited) || (opt.id === 'wishlist' && isWishlist) || (opt.id === 'none' && !isVisited && !isWishlist);
              return (
                <button
                  key={opt.id}
                  onClick={() => onStatusChange(state, opt.id)}
                  disabled={saving}
                  className={`py-2.5 rounded-xl border text-sm font-medium flex flex-col items-center gap-1 transition-all ${
                    isCurrent ? opt.active : 'border-slate-700 text-slate-500 hover:border-slate-500'
                  } disabled:opacity-50`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Famous places checklist */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-200">Famous Places</p>
            {isVisited && (
              <span className={`text-xs font-medium ${rc.text}`}>
                {visitedPlaces.size}/{state.places.length} visited
              </span>
            )}
          </div>
          <div className="space-y-2">
            {state.places.map((place) => {
              const checked = visitedPlaces.has(place);
              return (
                <button
                  key={place}
                  onClick={() => isVisited && onPlaceToggle(state.code, place)}
                  disabled={!isVisited || saving}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    checked
                      ? `${rc.bg} ${rc.border}`
                      : 'bg-slate-800/50 border-slate-700/50'
                  } ${!isVisited ? 'opacity-40 cursor-not-allowed' : 'hover:border-slate-500'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    checked ? `${rc.dot} border-transparent` : 'border-slate-600'
                  }`}>
                    {checked && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className={`text-sm ${checked ? 'text-slate-100' : 'text-slate-400'}`}>{place}</span>
                </button>
              );
            })}
          </div>
          {!isVisited && (
            <p className="text-xs text-slate-600 mt-3 text-center">Mark this state as visited to tick off places</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IndiaPassportPage() {
  const [passport, setPassport]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [activeRegion, setActiveRegion] = useState('All');
  const [drawer, setDrawer]         = useState(null);   // state object
  const [toast, setToast]           = useState(null);
  const [search, setSearch]         = useState('');
  const [authOpen, setAuthOpen]     = useState(false);
  const { user, effectiveUserId: userId } = useAuth();

  const load = useCallback(async (id) => {
    if (!id) return;
    try {
      const res  = await fetch(`${API_URL}/api/passport/${id}`);
      const data = await res.json();
      setPassport(data.passport || { indiaVisited: [], indiaWishlist: [] });
    } catch (_) {
      setPassport({ indiaVisited: [], indiaWishlist: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (userId) load(userId); }, [userId, load]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const indiaVisited  = passport?.indiaVisited  || [];
  const indiaWishlist = passport?.indiaWishlist || [];
  const visitedMap    = useMemo(() => Object.fromEntries(indiaVisited.map((s) => [s.code, s])), [indiaVisited]);
  const wishlistSet   = useMemo(() => new Set(indiaWishlist), [indiaWishlist]);

  const badgeData = useMemo(() => deriveBadgeData(indiaVisited, indiaWishlist), [indiaVisited, indiaWishlist]);
  const earnedBadges = INDIA_BADGES.filter((b) => b.check(badgeData));
  const lockedBadges = INDIA_BADGES.filter((b) => !b.check(badgeData));

  const totalPlacesVisited = indiaVisited.reduce((s, st) => s + (st.visitedPlaces?.length || 0), 0);

  const byRegion = useMemo(() => {
    const m = {};
    indiaVisited.forEach((s) => { m[s.region] = (m[s.region] || 0) + 1; });
    return m;
  }, [indiaVisited]);

  // Filtered state list
  const filteredStates = useMemo(() => {
    let list = INDIA_STATES;
    if (activeRegion !== 'All') list = list.filter((s) => s.region === activeRegion);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.capital.toLowerCase().includes(q) || s.places.some((p) => p.toLowerCase().includes(q)));
    }
    return list;
  }, [activeRegion, search]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleStatusChange = async (state, status) => {
    if (!userId) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API_URL}/api/passport/${userId}/india/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: state.code, name: state.name, region: state.region, status }),
      });
      const data = await res.json();
      if (data.success) {
        setPassport(data.passport);
        const msgs = { visited: `${state.icon} ${state.name} visited!`, wishlist: `${state.name} added to wishlist`, none: `${state.name} removed` };
        showToast(msgs[status]);
        if (status === 'none') setDrawer(null);
      }
    } catch (_) { showToast('Something went wrong'); }
    finally { setSaving(false); }
  };

  const handlePlaceToggle = async (stateCode, place) => {
    if (!userId) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API_URL}/api/passport/${userId}/india/place`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateCode, place }),
      });
      const data = await res.json();
      if (data.success) setPassport(data.passport);
    } catch (_) { showToast('Something went wrong'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 text-slate-100 text-sm px-5 py-2.5 rounded-full shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Guest nudge */}
      {!user && (
        <div className="bg-teal-950/60 border-b border-teal-800/40 px-4 py-2.5 flex items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-teal-300 flex items-center gap-2">
            <span>🔒</span>
            <span>Guest mode — your India passport is saved to this device only.</span>
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
          >
            Sync across devices
          </button>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab="register" />

      {/* State drawer */}
      {drawer && (
        <StateDrawer
          state={drawer}
          visitedEntry={visitedMap[drawer.code]}
          isWishlist={wishlistSet.has(drawer.code)}
          onStatusChange={handleStatusChange}
          onPlaceToggle={handlePlaceToggle}
          onClose={() => setDrawer(null)}
          saving={saving}
        />
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">✈️</div>
              <span className="text-xl font-bold gradient-text">Journeo</span>
            </Link>
            <span className="text-slate-700">/</span>
            <Link href="/passport" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Passport</Link>
            <span className="text-slate-700">/</span>
            <span className="text-sm text-orange-400 font-medium">India 🇮🇳</span>
          </div>
          <Link href="/passport" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← World Map</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Hero banner ───────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-950/40 via-slate-900 to-slate-950 px-6 py-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="text-6xl">🇮🇳</div>
            <div className="flex-1">
              <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest mb-1">India Passport</p>
              <h1 className="text-3xl font-extrabold text-white">Explore Bharat</h1>
              <p className="text-sm text-slate-400 mt-1">
                {indiaVisited.length === 0
                  ? '36 states & UTs to explore — click any state to get started'
                  : `${indiaVisited.length}/36 states visited · ${totalPlacesVisited} famous places ticked off`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'States Visited',   value: `${indiaVisited.length}/36`,       icon: '✅', color: 'text-orange-400' },
            { label: 'On Wishlist',       value: indiaWishlist.length,               icon: '🔖', color: 'text-amber-400'  },
            { label: 'Regions Covered',   value: `${Object.keys(byRegion).length}/6`, icon: '🗺️', color: 'text-teal-400'  },
            { label: 'Places Checked',    value: totalPlacesVisited,                 icon: '📍', color: 'text-pink-400'   },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Region progress ───────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-100 mb-4">Region Progress</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INDIA_REGIONS.map((region) => {
              const rc       = REGION_COLORS[region];
              const total    = INDIA_STATES.filter((s) => s.region === region).length;
              const visited  = byRegion[region] || 0;
              const pct      = (visited / total) * 100;
              return (
                <button
                  key={region}
                  onClick={() => setActiveRegion(activeRegion === region ? 'All' : region)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeRegion === region ? `${rc.bg} ${rc.border}` : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${activeRegion === region ? rc.text : 'text-slate-300'}`}>{region}</span>
                    <span className="text-xs text-slate-500">{visited}/{total}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${rc.dot} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Badges ────────────────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-100">India Badges</h2>
            <span className="text-xs text-slate-500">{earnedBadges.length}/{INDIA_BADGES.length} earned</span>
          </div>

          {earnedBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {earnedBadges.map((b) => (
                <div key={b.id} title={b.desc} className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 rounded-xl px-3 py-2">
                  <span className="text-lg">{b.icon}</span>
                  <span className="text-xs font-medium text-orange-300">{b.name}</span>
                </div>
              ))}
            </div>
          )}

          {earnedBadges.length === 0 && (
            <p className="text-sm text-slate-500 mb-4">Visit your first state to start earning badges!</p>
          )}

          <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Locked</p>
          <div className="flex flex-wrap gap-2">
            {lockedBadges.map((b) => (
              <div key={b.id} title={b.desc} className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 opacity-40 grayscale">
                <span className="text-lg">{b.icon}</span>
                <span className="text-xs text-slate-500">{b.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── State grid ────────────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2 className="font-semibold text-slate-100 shrink-0">All States & UTs</h2>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search states, cities, places..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Region filter tabs */}
          {!search && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
              {['All', ...INDIA_REGIONS].map((region) => {
                const rc = region !== 'All' ? REGION_COLORS[region] : null;
                return (
                  <button
                    key={region}
                    onClick={() => setActiveRegion(region)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
                      activeRegion === region
                        ? rc ? `${rc.bg} ${rc.border} ${rc.text}` : 'bg-slate-700 border-slate-600 text-slate-200'
                        : 'border-slate-700 text-slate-500 hover:border-slate-500'
                    }`}
                  >
                    {region}
                    {region !== 'All' && byRegion[region] ? ` (${byRegion[region]})` : ''}
                  </button>
                );
              })}
            </div>
          )}

          {filteredStates.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No states found</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filteredStates.map((state) => (
                <StateCard
                  key={state.code}
                  state={state}
                  isVisited={!!visitedMap[state.code]}
                  isWishlist={wishlistSet.has(state.code)}
                  visitedEntry={visitedMap[state.code]}
                  onClick={setDrawer}
                />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
