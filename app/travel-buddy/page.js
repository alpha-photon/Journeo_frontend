'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import BuddyCard from '../components/BuddyCard';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
import { useFlag } from '../context/FeatureFlagContext';
import { withAuth } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export default function TravelBuddyPage() {
  const buddyEnabled = useFlag('travel_buddy');
  const { user, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [tab, setTab]           = useState('browse');
  const [browse, setBrowse]     = useState([]);
  const [loadingBrowse, setLoadingBrowse] = useState(true);
  const [searchDest, setSearchDest]   = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [myListings, setMyListings]   = useState([]);

  const loadBrowse = useCallback(async () => {
    setLoadingBrowse(true);
    try {
      const qs   = searchDest ? `?destination=${encodeURIComponent(searchDest)}` : '';
      const r    = await fetch(`${API_URL}/api/travel-buddy/browse${qs}`);
      const data = await r.json();
      if (data.success) setBrowse(data.listings || []);
    } catch { /* ignore */ }
    setLoadingBrowse(false);
  }, [searchDest]);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoadingReqs(true);
    try {
      const r    = await fetch(`${API_URL}/api/travel-buddy/requests`, withAuth());
      const data = await r.json();
      if (data.success) { setIncoming(data.incoming || []); setOutgoing(data.outgoing || []); }
    } catch { /* ignore */ }
    setLoadingReqs(false);
  }, [user]);

  const loadMyListings = useCallback(async () => {
    if (!user) return;
    try {
      const r    = await fetch(`${API_URL}/api/itinerary/my-trips`, withAuth());
      const data = await r.json();
      if (data.success) setMyListings((data.itineraries || []).filter((t) => t.isOwner));
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { loadBrowse(); }, [loadBrowse]);
  useEffect(() => { if (user && tab === 'requests') loadRequests(); }, [user, tab, loadRequests]);
  useEffect(() => { if (user) loadMyListings(); }, [user, loadMyListings]);

  const handleSearch = (e) => { e.preventDefault(); setSearchDest(searchInput.trim()); };

  const handleAcceptReject = async (requestId, status) => {
    try {
      const r    = await fetch(`${API_URL}/api/travel-buddy/request/${requestId}`, withAuth({
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }));
      const data = await r.json();
      if (data.success) setIncoming((prev) => prev.map((req) => req._id === requestId ? { ...req, status } : req));
    } catch { /* ignore */ }
  };

  if (buddyEnabled === false) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 text-center">
          <div>
            <div className="text-4xl mb-4">🔧</div>
            <h2 className="font-serif text-xl font-semibold text-ink mb-2">Coming Soon</h2>
            <p className="text-ink-muted text-sm">Travel Buddy feature is not enabled yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = incoming.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar onAuthClick={() => setAuthOpen(true)} />

      {/* Hero */}
      <div className="relative bg-ink border-b border-ink-soft py-10 px-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-saffron uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-saffron animate-pulse" />
            Beta Feature
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-paper mb-3">
            Find Your Travel Buddy
          </h1>
          <p className="text-paper/60 max-w-xl mx-auto text-sm leading-relaxed mb-6">
            Solo traveler? Connect with others going to the same destination around the same dates. Your email is never shown — only your first name and travel style.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-sm mx-auto">
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by destination..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-paper placeholder-paper/40 focus:outline-none focus:border-saffron/50" />
            <button type="submit" className="px-4 py-2.5 bg-saffron hover:bg-saffron-deep text-white rounded-xl text-sm font-medium transition-colors">
              Search
            </button>
            {searchDest && (
              <button type="button" onClick={() => { setSearchDest(''); setSearchInput(''); }}
                className="px-3 py-2.5 bg-white/10 border border-white/20 text-paper/70 hover:text-paper rounded-xl text-sm transition-colors">
                ✕
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[61px] z-40 bg-paper/95 backdrop-blur-md border-b border-line">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex">
            {[
              { id: 'browse',   label: 'Browse Travelers', badge: 0 },
              { id: 'requests', label: 'My Requests',      badge: pendingCount },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 font-sans ${
                  tab === t.id ? 'text-saffron border-saffron' : 'text-ink-muted hover:text-ink-soft border-transparent'
                }`}>
                <span>{t.label}</span>
                {t.badge > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-saffron text-white text-[10px] flex items-center justify-center font-bold font-mono">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Browse Tab */}
        {tab === 'browse' && (
          <>
            {searchDest && (
              <p className="text-sm text-ink-muted mb-4 font-mono">
                Showing results for "<span className="text-saffron">{searchDest}</span>" · {browse.length} traveler{browse.length !== 1 ? 's' : ''} found
              </p>
            )}

            {loadingBrowse ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="bg-white border border-line rounded-2xl p-4 shadow-warm-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-line shimmer" />
                      <div className="flex-1"><div className="h-3 w-20 bg-line shimmer rounded mb-1.5" /><div className="h-2.5 w-32 bg-line-soft shimmer rounded" /></div>
                    </div>
                    <div className="h-2.5 w-full bg-line-soft shimmer rounded mb-2" />
                    <div className="h-2.5 w-3/4 bg-line-soft shimmer rounded" />
                  </div>
                ))}
              </div>
            ) : browse.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🌏</div>
                <p className="font-serif text-lg font-semibold text-ink mb-1">No travelers listed yet</p>
                <p className="text-ink-muted text-sm mb-6 max-w-sm mx-auto">
                  {searchDest ? `No one is listed for "${searchDest}" right now. Try a broader search.` : 'Be the first! Open any of your trips and enable Travel Buddy.'}
                </p>
                {user && <Link href="/my-trips" className="px-5 py-2.5 bg-ink hover:bg-ink-soft text-paper rounded-xl text-sm font-medium transition-colors">Go to My Trips →</Link>}
              </div>
            ) : (
              <>
                <p className="text-xs text-ink-muted mb-4 font-mono">{browse.length} solo traveler{browse.length !== 1 ? 's' : ''} discoverable</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {browse.map((listing) => (
                    <BrowseCard key={listing.shareId} listing={listing} user={user} myListings={myListings} onAuthRequired={() => setAuthOpen(true)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Requests Tab */}
        {tab === 'requests' && (
          <>
            {!user && !authLoading ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">🔐</div>
                <p className="font-serif text-lg font-semibold text-ink mb-1">Sign in to see your requests</p>
                <p className="text-ink-muted text-sm mb-6">You need an account to connect with other travelers.</p>
                <button onClick={() => setAuthOpen(true)} className="px-5 py-2.5 bg-ink hover:bg-ink-soft text-paper rounded-xl text-sm font-medium transition-colors">Sign In</button>
              </div>
            ) : loadingReqs ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-saffron/30 border-t-saffron rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
                    Incoming Requests
                    {incoming.filter((r) => r.status === 'pending').length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-saffron-subtle border border-saffron/20 text-saffron-deep font-mono">
                        {incoming.filter((r) => r.status === 'pending').length} pending
                      </span>
                    )}
                  </h2>
                  {incoming.length === 0 ? (
                    <p className="text-ink-muted text-sm py-6 text-center bg-paper-warm border border-line rounded-2xl font-mono">
                      No incoming requests yet. Make sure your trip is listed!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {incoming.map((req) => (
                        <RequestCard key={req._id} req={req} direction="incoming"
                          onAccept={() => handleAcceptReject(req._id, 'accepted')}
                          onReject={() => handleAcceptReject(req._id, 'rejected')} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-semibold text-ink mb-4">Sent Requests</h2>
                  {outgoing.length === 0 ? (
                    <p className="text-ink-muted text-sm py-6 text-center bg-paper-warm border border-line rounded-2xl font-mono">
                      You haven't sent any requests yet. Browse travelers above!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {outgoing.map((req) => <RequestCard key={req._id} req={req} direction="outgoing" />)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab="login" />
    </div>
  );
}

function BrowseCard({ listing, user, myListings, onAuthRequired }) {
  const [showReqForm, setShowReqForm]           = useState(false);
  const [selectedFromShareId, setSelectedFromShareId] = useState(myListings[0]?.shareId || '');
  const [message, setMessage]                   = useState('');
  const [sending, setSending]                   = useState(false);
  const [sent, setSent]                         = useState(false);

  const handleSend = async () => {
    if (!user) { onAuthRequired(); return; }
    if (!selectedFromShareId) return;
    setSending(true);
    try {
      const r    = await fetch(`${API_URL}/api/travel-buddy/request`, withAuth({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromShareId: selectedFromShareId, toShareId: listing.shareId, message }),
      }));
      const data = await r.json();
      if (data.success) { setSent(true); setShowReqForm(false); }
    } catch { /* ignore */ }
    setSending(false);
  };

  const bandColors = { budget: 'bg-jade', luxury: 'bg-marigold', adventure: 'bg-saffron', family: 'bg-indigo', romantic: 'bg-rose', balanced: 'bg-saffron' };
  const avatarColors = ['bg-saffron', 'bg-indigo', 'bg-jade', 'bg-rose', 'bg-marigold'];
  let hash = 0;
  for (const c of (listing.displayName || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  const avatarBg = avatarColors[Math.abs(hash) % avatarColors.length];

  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden hover:border-saffron/30 hover:shadow-warm transition-all shadow-warm-sm">
      <div className={`h-[3px] w-full ${bandColors[listing.travelStyle?.toLowerCase()] || 'bg-saffron'}`} />
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {(listing.displayName || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink text-sm truncate">{listing.displayName}</p>
            <p className="text-xs text-ink-muted truncate font-mono">✈️ {listing.destination}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs text-ink-muted bg-paper-warm px-2 py-1 rounded-lg border border-line font-mono">
            📅 {new Date(listing.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(listing.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span className="text-xs text-ink-muted font-mono">{listing.totalDays}d</span>
        </div>

        {listing.bio && (
          <p className="text-xs text-ink-muted leading-relaxed mb-3 bg-paper-warm rounded-xl px-3 py-2 border border-line italic">
            "{listing.bio}"
          </p>
        )}

        {sent ? (
          <span className="w-full flex items-center justify-center py-2 rounded-xl border text-sm font-medium text-jade border-jade/30 bg-jade-subtle font-mono">
            ✓ Request Sent!
          </span>
        ) : showReqForm ? (
          <div className="space-y-2">
            {myListings.length > 1 && (
              <select value={selectedFromShareId} onChange={(e) => setSelectedFromShareId(e.target.value)}
                className="w-full bg-paper-warm border border-line rounded-xl px-3 py-2 text-sm text-ink focus:outline-none font-mono">
                {myListings.map((t) => <option key={t.shareId} value={t.shareId}>{t.destination}</option>)}
              </select>
            )}
            <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 200))}
              placeholder="Short intro (optional)"
              className="w-full bg-paper-warm border border-line rounded-xl px-3 py-2 text-sm text-ink placeholder-ink-muted resize-none focus:outline-none focus:border-saffron/50"
              rows={2} />
            <div className="flex gap-2">
              <button onClick={handleSend} disabled={sending || !selectedFromShareId}
                className="flex-1 py-2 rounded-xl bg-ink hover:bg-ink-soft text-paper text-sm font-medium transition-colors disabled:opacity-50">
                {sending ? 'Sending...' : 'Send Request'}
              </button>
              <button onClick={() => setShowReqForm(false)}
                className="px-3 py-2 rounded-xl bg-paper-warm border border-line text-ink-muted text-sm hover:text-ink transition-colors">✕</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { if (!user) { onAuthRequired(); return; } setShowReqForm(true); }}
            className="w-full py-2 rounded-xl bg-saffron-subtle hover:bg-saffron border border-saffron/30 hover:border-saffron text-saffron-deep hover:text-white text-sm font-medium transition-all duration-200">
            👋 Say Hi
          </button>
        )}
      </div>
    </div>
  );
}

function RequestCard({ req, direction, onAccept, onReject }) {
  const other = req.otherListing;
  const statusStyle = {
    pending:  'text-marigold-deep border-marigold/30 bg-marigold-subtle',
    accepted: 'text-jade border-jade/30 bg-jade-subtle',
    rejected: 'text-rose border-rose/30 bg-rose-subtle',
  };

  return (
    <div className="bg-white border border-line rounded-2xl p-4 flex items-start gap-4 shadow-warm-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="text-sm font-medium text-ink">{direction === 'incoming' ? req.fromEmail : req.toEmail}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium font-mono ${statusStyle[req.status]}`}>{req.status}</span>
        </div>
        {other && (
          <p className="text-xs text-ink-muted font-mono">
            ✈️ {other.destination} · {new Date(other.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(other.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
        {req.message && (
          <p className="text-xs text-ink-muted mt-2 bg-paper-warm rounded-lg px-2.5 py-1.5 border border-line italic">
            "{req.message}"
          </p>
        )}
        {req.status === 'accepted' && (
          <p className="text-xs text-jade mt-2 font-mono">
            ✓ Connected! Email: {direction === 'incoming' ? req.fromEmail : req.toEmail}
          </p>
        )}
      </div>

      {direction === 'incoming' && req.status === 'pending' && (
        <div className="flex gap-2 shrink-0">
          <button onClick={onAccept}
            className="text-xs px-3 py-1.5 rounded-xl bg-jade-subtle border border-jade/30 text-jade hover:bg-jade/15 transition-all font-mono">
            Accept
          </button>
          <button onClick={onReject}
            className="text-xs px-3 py-1.5 rounded-xl bg-paper-warm border border-line text-ink-muted hover:bg-rose-subtle hover:border-rose/30 hover:text-rose transition-all font-mono">
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
