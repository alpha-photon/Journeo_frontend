'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useFlag } from '../context/FeatureFlagContext';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
import { COUNTRIES, CONTINENTS } from '../../data/countries';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const WorldMap = dynamic(() => import('../components/WorldMap'), { ssr: false, loading: () => (
  <div className="w-full h-64 rounded-2xl bg-paper-warm border border-line flex items-center justify-center shadow-warm-sm">
    <div className="w-6 h-6 border-2 border-saffron/30 border-t-saffron rounded-full animate-spin" />
  </div>
)});

const LEVELS = [
  { name: 'Homebody',     icon: '🏠', min: 0,  max: 0,   bar: 'bg-ink-muted',  text: 'text-ink-muted' },
  { name: 'Novice',       icon: '🌱', min: 1,  max: 4,   bar: 'bg-jade',       text: 'text-jade'      },
  { name: 'Explorer',     icon: '🗺️', min: 5,  max: 9,   bar: 'bg-saffron',    text: 'text-saffron'   },
  { name: 'Backpacker',   icon: '🎒', min: 10, max: 19,  bar: 'bg-indigo',     text: 'text-indigo'    },
  { name: 'Globetrotter', icon: '✈️', min: 20, max: 34,  bar: 'bg-marigold',   text: 'text-marigold-deep' },
  { name: 'Wanderer',     icon: '🌍', min: 35, max: 49,  bar: 'bg-saffron-deep',text: 'text-saffron-deep' },
  { name: 'Legend',       icon: '🏆', min: 50, max: 999, bar: 'bg-marigold',   text: 'text-marigold-deep' },
];

function getLevel(count) { return LEVELS.findLast((l) => count >= l.min) || LEVELS[0]; }
function getLevelProgress(count) {
  const level = getLevel(count);
  const next  = LEVELS[LEVELS.indexOf(level) + 1];
  if (!next) return { pct: 100, toNext: 0 };
  return { pct: Math.min(((count - level.min) / (next.min - level.min)) * 100, 100), toNext: next.min - count };
}

const BADGES = [
  { id: 'first_stamp',  name: 'First Stamp',      icon: '🎫', desc: 'Visited your first country',           check: (d) => d.visitedCount >= 1 },
  { id: 'five',         name: 'Five Countries',    icon: '⭐', desc: 'Explored 5 countries',                check: (d) => d.visitedCount >= 5 },
  { id: 'ten',          name: 'Decade',            icon: '🔟', desc: 'Stamped 10 passports',                check: (d) => d.visitedCount >= 10 },
  { id: 'twenty_five',  name: 'Quarter Century',   icon: '💫', desc: 'Visited 25 countries',               check: (d) => d.visitedCount >= 25 },
  { id: 'fifty',        name: 'Half the World',    icon: '🌐', desc: 'Visited 50 countries',               check: (d) => d.visitedCount >= 50 },
  { id: 'asia',         name: 'Asia Explorer',     icon: '🏯', desc: '3+ Asian countries',                 check: (d) => (d.byContinent['Asia'] || 0) >= 3 },
  { id: 'europe',       name: 'Euro Tripper',      icon: '🏰', desc: '3+ European countries',              check: (d) => (d.byContinent['Europe'] || 0) >= 3 },
  { id: 'africa',       name: 'Africa Bound',      icon: '🦁', desc: 'Set foot on African soil',           check: (d) => (d.byContinent['Africa'] || 0) >= 1 },
  { id: 'americas',     name: 'New World',         icon: '🗽', desc: 'Visited the Americas',               check: (d) => ((d.byContinent['North America'] || 0) + (d.byContinent['South America'] || 0)) >= 1 },
  { id: 'oceania',      name: 'Down Under',        icon: '🦘', desc: 'Made it to Oceania',                 check: (d) => (d.byContinent['Oceania'] || 0) >= 1 },
  { id: 'all_cont',     name: 'All Continents',    icon: '🌐', desc: 'Visited all 6 major continents',     check: (d) => Object.keys(d.byContinent).length >= 6 },
  { id: 'south_asia',   name: 'Desi Explorer',     icon: '🕌', desc: '3+ South Asian countries',          check: (d) => d.southAsiaCount >= 3 },
  { id: 'se_asia',      name: 'SEA Surfer',        icon: '🏄', desc: '4+ South-East Asian countries',     check: (d) => d.seAsiaCount >= 4 },
  { id: 'middle_east',  name: 'Desert Drifter',    icon: '🐪', desc: '3+ Middle Eastern countries',       check: (d) => d.middleEastCount >= 3 },
  { id: 'dreamlist_10', name: 'Dream Big',         icon: '💭', desc: '10+ countries on wishlist',         check: (d) => d.wishlistCount >= 10 },
  { id: 'streak_3',     name: 'On a Roll',         icon: '🔥', desc: '3-month travel streak',             check: (d) => d.streak >= 3 },
  { id: 'planner',      name: 'Serial Planner',    icon: '📋', desc: 'Generated 5+ itineraries',          check: (d) => d.totalItineraries >= 5 },
  { id: 'island',       name: 'Island Hopper',     icon: '🏝️', desc: 'Visited 3+ island nations',        check: (d) => d.islandCount >= 3 },
];

const SOUTH_ASIA    = new Set(['IND','PAK','BGD','LKA','NPL','BTN','MDV']);
const SE_ASIA       = new Set(['THA','VNM','IDN','MYS','SGP','PHL','KHM','MMR','LAO','BRN','TLS']);
const MIDDLE_EAST   = new Set(['ARE','SAU','QAT','KWT','BHR','OMN','JOR','ISR','LBN','IRQ','IRN','YEM','SYR']);
const ISLAND_NATIONS = new Set(['MDV','LKA','SGP','PHL','IDN','FJI','TTO','JAM','CUB','BHS','BRB','CYP','MLT','MUS','SYC','WSM','TON','VUT','PLW','NZL','BRN']);

function deriveBadgeData(passport) {
  const visited = passport?.visited || [];
  const byContinent = {};
  visited.forEach((c) => { byContinent[c.continent] = (byContinent[c.continent] || 0) + 1; });
  const visitedSet = new Set(visited.map((c) => c.a3));
  return {
    visitedCount:    visited.length,
    wishlistCount:   (passport?.wishlist || []).length,
    byContinent,
    southAsiaCount:  [...visitedSet].filter((a) => SOUTH_ASIA.has(a)).length,
    seAsiaCount:     [...visitedSet].filter((a) => SE_ASIA.has(a)).length,
    middleEastCount: [...visitedSet].filter((a) => MIDDLE_EAST.has(a)).length,
    islandCount:     [...visitedSet].filter((a) => ISLAND_NATIONS.has(a)).length,
    streak:          passport?.streak?.current || 0,
    totalItineraries: passport?.totalItineraries || 0,
  };
}

function CountryModal({ country, currentStatus, onSave, onClose }) {
  const [status, setStatus] = useState(currentStatus || 'none');
  const [notes, setNotes]   = useState('');
  if (!country) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-paper border border-line rounded-2xl p-6 w-full max-w-sm shadow-warm-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-4xl">{country.flag}</span>
          <div>
            <h3 className="font-serif text-lg font-semibold text-ink">{country.name}</h3>
            <p className="text-xs text-ink-muted font-mono">{country.cont}</p>
          </div>
        </div>

        <p className="eyebrow mb-2">Mark as</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: 'visited',  label: 'Visited',  icon: '✅', cls: 'bg-jade-subtle border-jade/40 text-jade'             },
            { id: 'wishlist', label: 'Wishlist', icon: '🔖', cls: 'bg-marigold-subtle border-marigold/40 text-marigold-deep' },
            { id: 'none',     label: 'Remove',   icon: '✕',  cls: 'bg-rose-subtle border-rose/40 text-rose'              },
          ].map((opt) => (
            <button key={opt.id} onClick={() => setStatus(opt.id)}
              className={`py-2.5 rounded-xl border text-sm font-medium flex flex-col items-center gap-1 transition-all ${
                status === opt.id ? opt.cls : 'border-line text-ink-muted hover:border-saffron/25 hover:bg-saffron-subtle'
              }`}>
              <span>{opt.icon}</span><span>{opt.label}</span>
            </button>
          ))}
        </div>

        {status === 'visited' && (
          <textarea placeholder="How was it? Any memories? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full px-3 py-2.5 bg-paper-warm border border-line rounded-xl text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-saffron mb-4 resize-none" />
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-line text-ink-muted text-sm hover:text-ink transition-colors">Cancel</button>
          <button onClick={() => onSave(country, status, notes)}
            className="flex-1 py-2.5 rounded-xl bg-ink hover:bg-ink-soft text-paper font-semibold text-sm transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PassportPage() {
  const passportEnabled = useFlag('passport_page');
  const [passport, setPassport]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [modal, setModal]           = useState(null);
  const [search, setSearch]         = useState('');
  const [activeContinent, setActiveContinent] = useState('All');
  const [listTab, setListTab]       = useState('visited');
  const [toast, setToast]           = useState(null);
  const [authOpen, setAuthOpen]     = useState(false);
  const { user, effectiveUserId: userId } = useAuth();

  useEffect(() => { if (passportEnabled === false) window.location.replace('/'); }, [passportEnabled]);

  const load = useCallback(async (id) => {
    if (!id) return;
    try {
      const res  = await fetch(`${API_URL}/api/passport/${id}`);
      const data = await res.json();
      setPassport(data.passport || { visited: [], wishlist: [], streak: { current: 0, longest: 0 }, totalItineraries: 0 });
    } catch (_) { setPassport({ visited: [], wishlist: [], streak: { current: 0, longest: 0 }, totalItineraries: 0 }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (userId) load(userId); }, [userId, load]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const visitedSet  = useMemo(() => new Set((passport?.visited  || []).map((c) => c.a3)), [passport]);
  const wishlistSet = useMemo(() => new Set((passport?.wishlist || []).map((c) => c.a3)), [passport]);

  const handleCountryClick = (country) => {
    let current = 'none';
    if (visitedSet.has(country.a3))  current = 'visited';
    if (wishlistSet.has(country.a3)) current = 'wishlist';
    setModal({ country, current });
  };

  const handleSave = async (country, status, notes) => {
    if (!userId) return;
    setSaving(true); setModal(null);
    try {
      const res  = await fetch(`${API_URL}/api/passport/${userId}/country`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a3: country.a3, name: country.name, continent: country.cont, flag: country.flag, status, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setPassport(data.passport);
        const msgs = { visited: `${country.flag} ${country.name} added to visited!`, wishlist: `${country.flag} ${country.name} added to wishlist!`, none: `${country.name} removed` };
        showToast(msgs[status]);
      }
    } catch (_) { showToast('Something went wrong'); }
    finally { setSaving(false); }
  };

  const visited       = passport?.visited  || [];
  const wishlist      = passport?.wishlist || [];
  const visitedCount  = visited.length;
  const wishlistCount = wishlist.length;

  const byContinent = useMemo(() => {
    const m = {};
    visited.forEach((c) => { m[c.continent] = (m[c.continent] || 0) + 1; });
    return m;
  }, [visited]);

  const continentsUnlocked = Object.keys(byContinent).length;
  const level  = getLevel(visitedCount);
  const { pct: levelPct, toNext } = getLevelProgress(visitedCount);
  const badgeData     = useMemo(() => deriveBadgeData(passport), [passport]);
  const earnedBadges  = BADGES.filter((b) => b.check(badgeData));
  const lockedBadges  = BADGES.filter((b) => !b.check(badgeData));

  const filteredCountries = useMemo(() => {
    let list = COUNTRIES;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.cont.toLowerCase().includes(q));
    }
    if (activeContinent !== 'All') list = list.filter((c) => c.cont === activeContinent);
    return list;
  }, [search, activeContinent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-saffron/30 border-t-saffron rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-ink text-paper text-sm px-5 py-2.5 rounded-full shadow-warm-lg animate-fade-in font-sans">
          {toast}
        </div>
      )}

      {!user && (
        <div className="bg-marigold-subtle border-b border-marigold/20 px-4 py-2.5 flex items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-ink-soft flex items-center gap-2">
            <span>🔒</span><span>You're in guest mode — your passport is saved to this device only.</span>
          </p>
          <button onClick={() => setAuthOpen(true)}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-ink hover:bg-ink-soft text-paper transition-colors">
            Sync across devices
          </button>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab="register" />
      {modal && <CountryModal country={modal.country} currentStatus={modal.current} onSave={handleSave} onClose={() => setModal(null)} />}

      <Navbar rightContent={
        <div className="flex items-center gap-2 px-3 py-1.5 bg-paper-warm border border-line rounded-full shadow-warm-sm">
          <span className="text-lg">{level.icon}</span>
          <span className={`text-sm font-semibold font-sans ${level.text}`}>{level.name}</span>
        </div>
      } />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Passport header */}
        <div className="relative overflow-hidden bg-ink border border-ink-soft rounded-2xl px-6 py-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-saffron flex items-center justify-center text-4xl shadow-saffron shrink-0">🛂</div>
            <div className="flex-1">
              <p className="eyebrow text-saffron mb-1">Travel Passport</p>
              <h1 className="font-serif text-3xl font-semibold text-paper mb-1">Your World Map</h1>
              <p className="text-sm text-paper/60">
                {visitedCount === 0
                  ? 'Click any country on the map to start your travel story'
                  : `${visitedCount} ${visitedCount === 1 ? 'country' : 'countries'} visited · ${continentsUnlocked} ${continentsUnlocked === 1 ? 'continent' : 'continents'} unlocked · ${wishlistCount} on wishlist`}
              </p>
            </div>
          </div>
        </div>

        {/* India shortcut */}
        <Link href="/passport/india"
          className="flex items-center gap-4 bg-white border border-line rounded-2xl px-5 py-4 hover:border-saffron/30 hover:shadow-warm transition-all group shadow-warm-sm">
          <span className="text-4xl">🇮🇳</span>
          <div className="flex-1">
            <p className="font-semibold text-ink group-hover:text-saffron transition-colors">Explore India</p>
            <p className="text-xs text-ink-muted mt-0.5 font-mono">
              {(passport?.indiaVisited?.length || 0) === 0
                ? 'Track states, famous places & earn India badges'
                : `${passport.indiaVisited.length}/36 states visited · ${passport.indiaVisited.reduce((s, st) => s + (st.visitedPlaces?.length || 0), 0)} places checked off`}
            </p>
          </div>
          <span className="text-ink-muted group-hover:text-saffron transition-colors text-sm">→</span>
        </Link>

        {/* World Map */}
        <WorldMap visited={[...visitedSet]} wishlist={[...wishlistSet]} onCountryClick={handleCountryClick} />

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Countries Visited', value: visitedCount,        icon: '✅', cls: 'text-jade'        },
            { label: 'Wishlist',          value: wishlistCount,       icon: '🔖', cls: 'text-marigold-deep' },
            { label: 'Continents',        value: `${continentsUnlocked}/6`, icon: '🌍', cls: 'text-indigo' },
            { label: 'Travel Streak',     value: `${passport?.streak?.current || 0}mo`, icon: '🔥', cls: 'text-saffron-deep' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-line rounded-2xl px-4 py-4 text-center shadow-warm-sm">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className={`font-serif text-2xl font-semibold italic ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-ink-muted mt-0.5 font-mono">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Level bar */}
        <div className="bg-white border border-line rounded-2xl px-5 py-4 shadow-warm-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{level.icon}</span>
              <div>
                <p className={`font-semibold ${level.text}`}>{level.name}</p>
                <p className="text-xs text-ink-muted font-mono">
                  {toNext > 0 ? `${toNext} more ${toNext === 1 ? 'country' : 'countries'} to next level` : 'Maximum level reached!'}
                </p>
              </div>
            </div>
            {LEVELS.indexOf(level) < LEVELS.length - 1 && (
              <p className="text-xs text-ink-muted font-mono">Next: {LEVELS[LEVELS.indexOf(level) + 1]?.icon} {LEVELS[LEVELS.indexOf(level) + 1]?.name}</p>
            )}
          </div>
          <div className="h-3 bg-line-soft rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${level.bar} transition-all duration-700`} style={{ width: `${levelPct}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            {LEVELS.slice(1).map((l) => (
              <span key={l.name} title={`${l.name}: ${l.min} countries`} className="text-xs text-ink-muted">{l.icon}</span>
            ))}
          </div>
        </div>

        {/* Badges + Continent breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink">Badges</h2>
              <span className="text-xs text-ink-muted font-mono">{earnedBadges.length}/{BADGES.length} earned</span>
            </div>
            {earnedBadges.length === 0 && (
              <p className="text-sm text-ink-muted mb-4">Visit your first country to start earning badges!</p>
            )}
            {earnedBadges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {earnedBadges.map((b) => (
                  <div key={b.id} title={b.desc} className="flex items-center gap-1.5 bg-saffron-subtle border border-saffron/30 rounded-xl px-3 py-2">
                    <span className="text-lg">{b.icon}</span>
                    <span className="text-xs font-medium text-saffron-deep">{b.name}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="eyebrow mb-2">Locked</p>
            <div className="flex flex-wrap gap-2">
              {lockedBadges.map((b) => (
                <div key={b.id} title={b.desc} className="flex items-center gap-1.5 bg-paper-warm border border-line rounded-xl px-3 py-2 opacity-50 grayscale">
                  <span className="text-lg">{b.icon}</span>
                  <span className="text-xs text-ink-muted">{b.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
            <h2 className="font-semibold text-ink mb-4">Continent Breakdown</h2>
            {CONTINENTS.map((cont) => {
              const count = byContinent[cont] || 0;
              const total = COUNTRIES.filter((c) => c.cont === cont).length;
              const pct   = (count / total) * 100;
              return (
                <div key={cont} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink-soft">{cont}</span>
                    <span className="text-xs text-ink-muted font-mono">{count}/{total}</span>
                  </div>
                  <div className="h-2 bg-line-soft rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-saffron transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
              <span className="text-sm text-ink-muted">Longest streak</span>
              <span className="text-sm font-bold text-saffron font-mono">🔥 {passport?.streak?.longest || 0} months</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-ink-muted">Itineraries planned</span>
              <span className="text-sm font-bold text-jade font-mono">📋 {passport?.totalItineraries || 0}</span>
            </div>
          </div>
        </div>

        {/* Country list */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2 className="font-semibold text-ink shrink-0">Countries</h2>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm">🔍</span>
              <input type="text" placeholder="Search countries..." value={search}
                onChange={(e) => { setSearch(e.target.value); setListTab('search'); }}
                className="w-full pl-8 pr-3 py-2 bg-paper-warm border border-line rounded-xl text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-saffron" />
            </div>
            {!search && (
              <div className="flex gap-1">
                {[
                  { id: 'visited',  label: `Visited (${visitedCount})` },
                  { id: 'wishlist', label: `Wishlist (${wishlistCount})` },
                  { id: 'all',      label: 'All' },
                ].map((t) => (
                  <button key={t.id} onClick={() => setListTab(t.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap font-mono ${
                      listTab === t.id ? 'bg-saffron-subtle border-saffron/40 text-saffron-deep' : 'border-line text-ink-muted hover:border-saffron/25'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(listTab === 'all' || search) && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
              {['All', ...CONTINENTS].map((cont) => (
                <button key={cont} onClick={() => setActiveContinent(cont)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all font-mono ${
                    activeContinent === cont ? 'bg-ink text-paper border-ink' : 'border-line text-ink-muted hover:border-saffron/25'
                  }`}>
                  {cont}
                </button>
              ))}
            </div>
          )}

          {(() => {
            let list;
            if (search || listTab === 'all') list = filteredCountries;
            else if (listTab === 'visited') list = visited.map((v) => COUNTRIES.find((c) => c.a3 === v.a3)).filter(Boolean);
            else list = wishlist.map((w) => COUNTRIES.find((c) => c.a3 === w.a3)).filter(Boolean);

            if (list.length === 0) return (
              <p className="text-sm text-ink-muted text-center py-6 font-mono">
                {listTab === 'visited' ? 'No countries visited yet — click any country on the map!'
                  : listTab === 'wishlist' ? 'No countries on wishlist yet' : 'No results'}
              </p>
            );

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1 scrollbar-hide">
                {list.map((country) => {
                  if (!country) return null;
                  const isVisited  = visitedSet.has(country.a3);
                  const isWishlist = wishlistSet.has(country.a3);
                  const visitEntry = visited.find((v) => v.a3 === country.a3);
                  return (
                    <button key={country.a3} onClick={() => handleCountryClick(country)} disabled={saving}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                        isVisited  ? 'bg-jade-subtle border-jade/25'
                        : isWishlist ? 'bg-marigold-subtle border-marigold/25'
                        : 'bg-paper-warm border-line hover:border-saffron/25'
                      }`}>
                      <span className="text-xl shrink-0">{country.flag}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink truncate">{country.name}</p>
                        {isVisited && visitEntry?.visitedAt && <p className="text-xs text-jade font-mono">{new Date(visitEntry.visitedAt).getFullYear()}</p>}
                        {isWishlist && <p className="text-xs text-marigold-deep font-mono">Wishlist</p>}
                      </div>
                      {isVisited  && <span className="ml-auto text-xs shrink-0">✅</span>}
                      {isWishlist && <span className="ml-auto text-xs shrink-0">🔖</span>}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

      </main>
    </div>
  );
}
