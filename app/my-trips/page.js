'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { withAuth } from '../../lib/auth';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const STYLE_COLORS = {
  budget:    { label: 'Budget',    cls: 'bg-jade-subtle text-jade border-jade/20',             band: 'bg-jade'     },
  luxury:    { label: 'Luxury',    cls: 'bg-marigold-subtle text-marigold-deep border-marigold/20', band: 'bg-marigold' },
  adventure: { label: 'Adventure', cls: 'bg-saffron-subtle text-saffron-deep border-saffron/20',   band: 'bg-saffron'  },
  family:    { label: 'Family',    cls: 'bg-indigo-subtle text-indigo border-indigo/20',        band: 'bg-indigo'   },
  romantic:  { label: 'Romantic',  cls: 'bg-rose-subtle text-rose border-rose/20',             band: 'bg-rose'     },
  balanced:  { label: 'Balanced',  cls: 'bg-paper-warm text-ink-muted border-line',            band: 'bg-saffron'  },
};

function timeAgo(dateStr) {
  const diff   = Date.now() - new Date(dateStr).getTime();
  const mins   = Math.floor(diff / 60000);
  const hours  = Math.floor(diff / 3600000);
  const days   = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function MyTripsPage() {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetch(`${API_URL}/api/itinerary/my-trips`, withAuth())
      .then((r) => r.json())
      .then((data) => { if (data.success) setTrips(data.itineraries); else setError(data.error); })
      .catch(() => setError('Could not load your trips. Please try again.'))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar onAuthClick={() => setAuthOpen(true)} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-saffron-subtle border border-saffron/20 flex items-center justify-center text-4xl shadow-warm">🗺️</div>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink mb-2">Your trips live here</h2>
            <p className="text-ink-muted max-w-sm">Sign in to see all the itineraries you've generated, revisit your past adventures, and pick up where you left off.</p>
          </div>
          <button onClick={() => setAuthOpen(true)}
            className="px-6 py-3 rounded-xl bg-ink hover:bg-ink-soft text-paper font-semibold transition-colors shadow-warm">
            Sign in to see my trips
          </button>
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab="login" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-saffron/30 border-t-saffron rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar rightContent={
        <Link href="/" className="text-sm text-ink-muted hover:text-saffron transition-colors font-sans">
          + New Trip
        </Link>
      } />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="eyebrow mb-1">Your itineraries</p>
          <h1 className="font-serif text-3xl font-semibold text-ink">My Trips</h1>
          <p className="text-ink-muted text-sm mt-1">
            {trips.length === 0 ? 'No trips yet — generate your first itinerary!' : `${trips.length} trip${trips.length !== 1 ? 's' : ''} generated`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-subtle border border-rose/20 rounded-xl text-sm text-rose font-sans">{error}</div>
        )}

        {!error && trips.length === 0 && (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-saffron-subtle border border-saffron/20 flex items-center justify-center text-4xl shadow-warm">✈️</div>
            <div>
              <p className="font-serif text-xl font-semibold text-ink mb-1">No trips yet</p>
              <p className="text-ink-muted text-sm">Every itinerary you generate while signed in will appear here.</p>
            </div>
            <Link href="/" className="mt-2 px-5 py-2.5 rounded-xl bg-ink hover:bg-ink-soft text-paper font-semibold text-sm transition-colors">
              Plan my first trip →
            </Link>
          </div>
        )}

        {trips.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => (
              <TripCard key={trip.shareId} trip={trip} onLeave={(shareId) => setTrips((prev) => prev.filter((t) => t.shareId !== shareId))} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TripCard({ trip, onLeave }) {
  const itinerary    = trip.itinerary || {};
  const [leaving, setLeaving] = useState(false);
  const sc = STYLE_COLORS[trip.travelStyle?.toLowerCase()] || STYLE_COLORS.balanced;

  const handleLeave = async () => {
    if (!confirm('Leave this trip? You can rejoin using an invite link.')) return;
    setLeaving(true);
    try {
      const r = await fetch(`${API_URL}/api/collaborate/${trip.shareId}/leave`, withAuth({ method: 'POST' }));
      const data = await r.json();
      if (data.success) onLeave?.(trip.shareId);
    } catch { /* ignore */ }
    setLeaving(false);
  };

  return (
    <div className="group bg-white border border-line rounded-2xl overflow-hidden hover:border-saffron/30 hover:shadow-warm-md transition-all duration-200 shadow-warm-sm">
      <div className={`h-1.5 w-full ${sc.band}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-semibold text-ink group-hover:text-saffron transition-colors truncate leading-tight">
              {trip.destination}
            </h3>
            {itinerary.country && itinerary.country !== trip.destination && (
              <p className="text-xs text-ink-muted mt-0.5 truncate font-mono">{itinerary.country}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {trip.isOwner && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-saffron-subtle border border-saffron/20 text-saffron-deep font-mono">Created</span>
              )}
              {trip.isSaved && !trip.isOwner && !trip.isCollaborator && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-paper-warm border border-line text-ink-muted font-mono">★ Saved</span>
              )}
              {trip.isCollaborator && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-subtle border border-indigo/20 text-indigo font-mono">👥 Collaborator</span>
              )}
              {trip.hasCollaboration && trip.isOwner && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-subtle border border-indigo/20 text-indigo font-mono">👥 Group Trip</span>
              )}
            </div>
          </div>
          <span className="text-2xl shrink-0 mt-0.5">✈️</span>
        </div>

        {itinerary.overview && (
          <p className="text-xs text-ink-muted leading-relaxed mb-4 line-clamp-2">{itinerary.overview}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${sc.cls}`}>{sc.label}</span>
          <span className="text-xs text-ink-muted bg-paper-warm px-2 py-0.5 rounded-full border border-line font-mono">
            {trip.days} day{trip.days !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-ink-muted font-mono">
          <span>{timeAgo(trip.createdAt)}</span>
          <span className="flex items-center gap-1">👁 {trip.views ?? 0} view{trip.views !== 1 ? 's' : ''}</span>
        </div>

        <div className="mt-3 flex gap-2">
          <Link href={`/share/${trip.shareId}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-saffron-subtle hover:bg-saffron border border-saffron/30 hover:border-saffron text-saffron-deep hover:text-white text-sm font-medium transition-all duration-200 font-sans">
            View Details →
          </Link>
          {trip.isCollaborator && (
            <button onClick={handleLeave} disabled={leaving} title="Leave this trip"
              className="px-3 py-2 rounded-xl bg-paper-warm hover:bg-rose-subtle border border-line hover:border-rose/30 text-ink-muted hover:text-rose text-xs font-medium transition-all duration-200 disabled:opacity-50">
              {leaving ? '...' : 'Leave'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
