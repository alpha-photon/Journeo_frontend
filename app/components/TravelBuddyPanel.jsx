'use client';

import { useState, useEffect, useCallback } from 'react';
import BuddyCard from './BuddyCard';
import { withAuth } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

// Returns today's date as YYYY-MM-DD string for input[type=date] default
function today() {
  return new Date().toISOString().split('T')[0];
}

// Add N days to a date string
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export default function TravelBuddyPanel({ shareId, totalDays, isOwner }) {
  const [listing, setListing]     = useState(null);        // my listing for this trip
  const [matches, setMatches]     = useState([]);
  const [loadingListing, setLoadingListing] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [savingListing, setSavingListing]   = useState(false);
  const [error, setError]         = useState(null);
  const [tab, setTab]             = useState('matches');    // 'matches' | 'edit'

  // Form state
  const [startDate, setStartDate] = useState(today());
  const [endDate,   setEndDate]   = useState(addDays(today(), totalDays - 1 || 0));
  const [bio,       setBio]       = useState('');
  const [displayName, setDisplayName] = useState('');

  // Load existing listing
  const loadListing = useCallback(async () => {
    setLoadingListing(true);
    try {
      const r = await fetch(`${API_URL}/api/travel-buddy/listing/${shareId}`, withAuth());
      const data = await r.json();
      if (data.success && data.listing) {
        const l = data.listing;
        setListing(l);
        setStartDate(l.startDate?.split('T')[0] || today());
        setEndDate(l.endDate?.split('T')[0] || addDays(today(), totalDays - 1 || 0));
        setBio(l.bio || '');
        setDisplayName(l.displayName || '');
      }
    } catch { /* ignore */ }
    setLoadingListing(false);
  }, [shareId, totalDays]);

  // Load matches (only if listed)
  const loadMatches = useCallback(async () => {
    setLoadingMatches(true);
    try {
      const r = await fetch(`${API_URL}/api/travel-buddy/matches/${shareId}`, withAuth());
      const data = await r.json();
      if (data.success) setMatches(data.matches || []);
    } catch { /* ignore */ }
    setLoadingMatches(false);
  }, [shareId]);

  useEffect(() => { loadListing(); }, [loadListing]);

  useEffect(() => {
    if (listing) loadMatches();
  }, [listing, loadMatches]);

  const handleSaveListing = async () => {
    if (!startDate || !endDate) return;
    setSavingListing(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/api/travel-buddy/listing`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId, startDate, endDate, bio, displayName }),
      }));
      const data = await r.json();
      if (data.success) {
        setListing(data.listing);
        setTab('matches');
      } else {
        setError(data.error);
      }
    } catch {
      setError('Could not save. Please try again.');
    }
    setSavingListing(false);
  };

  const handleRemoveListing = async () => {
    if (!confirm('Remove your trip from Travel Buddy? Others won\'t be able to find you.')) return;
    try {
      await fetch(`${API_URL}/api/travel-buddy/listing/${shareId}`, withAuth({ method: 'DELETE' }));
      setListing(null);
      setMatches([]);
    } catch { /* ignore */ }
  };

  const handleReport = (reportedShareId) => {
    setMatches((prev) => prev.filter((m) => m.shareId !== reportedShareId));
  };

  if (loadingListing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-teal-950/40 to-slate-900 border border-teal-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-2xl shrink-0">
            🤝
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-100 mb-1">Find Your Travel Buddy</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connect with solo travelers going to the same destination around your dates.
              Opt-in to be discoverable — only your first name and travel style are shown.
            </p>
          </div>
        </div>

        {/* Status + action buttons */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {listing ? (
            <>
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Listed — discoverable
              </span>
              {isOwner && (
                <>
                  <button
                    onClick={() => setTab(tab === 'edit' ? 'matches' : 'edit')}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleRemoveListing}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
                  >
                    Remove
                  </button>
                </>
              )}
            </>
          ) : isOwner ? (
            <button
              onClick={() => setTab('edit')}
              className="text-sm px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors shadow-lg shadow-teal-900/30"
            >
              Find Travel Buddies →
            </button>
          ) : (
            <span className="text-xs text-slate-500 italic">Only the trip owner can opt-in to Travel Buddy</span>
          )}
        </div>
      </div>

      {/* Opt-in / Edit form */}
      {tab === 'edit' && isOwner && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">
            {listing ? 'Update your profile' : 'Create your listing'}
          </h3>

          <div className="space-y-4">
            {/* Display name */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Your first name (shown to matches)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
                placeholder="e.g. Divyansh"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today()}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">
                Short intro <span className="text-slate-600">({bio.length}/150)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                placeholder="e.g. Solo photographer from Delhi, looking for hiking and food spots"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-teal-500/50"
                rows={2}
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleSaveListing}
                disabled={savingListing || !startDate || !endDate || !displayName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingListing ? 'Saving...' : listing ? 'Update Listing' : 'Go Discoverable'}
              </button>
              <button
                onClick={() => setTab('matches')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matches tab */}
      {tab === 'matches' && listing && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Travelers going to {listing.destination}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {fmtDate(listing.startDate)} – {fmtDate(listing.endDate)}
              </p>
            </div>
            <button
              onClick={loadMatches}
              disabled={loadingMatches}
              className="text-xs text-slate-500 hover:text-teal-400 transition-colors disabled:opacity-50"
            >
              {loadingMatches ? '↻ Loading...' : '↻ Refresh'}
            </button>
          </div>

          {loadingMatches ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800" />
                    <div className="flex-1">
                      <div className="h-3 w-20 bg-slate-800 rounded mb-1.5" />
                      <div className="h-2.5 w-32 bg-slate-800/70 rounded" />
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800/50 rounded mb-2" />
                  <div className="h-2.5 w-3/4 bg-slate-800/40 rounded" />
                </div>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <div className="text-4xl mb-3">🌍</div>
              <p className="text-slate-300 font-semibold mb-1">No matches yet</p>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                You're one of the first! As more solo travelers list their trips, matches will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <BuddyCard
                  key={match.shareId}
                  match={match}
                  fromShareId={shareId}
                  onRequestSent={loadMatches}
                  onReport={handleReport}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Not opted-in and not owner */}
      {!listing && !isOwner && (
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-slate-400 text-sm">The trip owner hasn't enabled Travel Buddy for this trip.</p>
        </div>
      )}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
