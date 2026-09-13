'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useFlag } from '../context/FeatureFlagContext';
import { useSubscription } from '../../hooks/useSubscription';
import { getToken, withAuth } from '../../lib/auth';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtAmount(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function daysLeft(d) {
  if (!d) return null;
  const diff = new Date(d) - new Date();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86_400_000);
}

const PERSONALITIES = {
  budget:    { title: 'The Backpacker',       emoji: '🎒', blurb: 'You chase real value and real experiences over luxury.' },
  luxury:    { title: 'The Jetsetter',        emoji: '✨', blurb: 'You travel in style — comfort is never optional.' },
  adventure: { title: 'The Thrill Seeker',    emoji: '🏔️', blurb: 'Trails, peaks, and adrenaline call your name.' },
  family:    { title: 'The Family Explorer',  emoji: '👨‍👩‍👧', blurb: 'Every trip is a memory made together.' },
  romantic:  { title: 'The Romantic Wanderer',emoji: '🌅', blurb: 'Sunsets and slow mornings, always.' },
  balanced:  { title: 'The All-Rounder',      emoji: '🧭', blurb: 'A bit of everything — your favorite way to travel.' },
};

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const {
    isPro, isFree, plan, status, periodEnd, cancelAtEnd, manualOverride,
    usage, loading: subLoading, refresh,
  } = useSubscription();
  const paymentsEnabled = useFlag('payments_enabled');

  const [authModal, setAuthModal]     = useState(null);
  const [payments, setPayments]       = useState([]);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [trips, setTrips]             = useState([]);
  const [tripsLoaded, setTripsLoaded] = useState(false);

  // Cancellation
  const [cancelling, setCancelling]       = useState(false);
  const [cancelMsg, setCancelMsg]         = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Load billing history + trip stats when user is ready
  useEffect(() => {
    if (!user) return;

    const token = getToken();
    if (!token) return;

    // Load payment history
    fetch(`${API_URL}/api/payment/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setPayments(d.payments || []); })
      .catch(() => {})
      .finally(() => setPaymentsLoaded(true));

    // Load trips — powers both the trip count and the Travel DNA stats below
    fetch(`${API_URL}/api/itinerary/my-trips`, withAuth())
      .then((r) => r.json())
      .then((d) => { if (d.success) setTrips(d.itineraries || []); })
      .catch(() => {})
      .finally(() => setTripsLoaded(true));
  }, [user]);

  const ownedTrips = trips.filter((t) => t.isOwner);
  const totalDays = ownedTrips.reduce((sum, t) => sum + (t.days || 0), 0);
  const countries = [...new Set(ownedTrips.map((t) => t.itinerary?.country).filter(Boolean))];
  const styleCounts = ownedTrips.reduce((acc, t) => {
    if (t.travelStyle) acc[t.travelStyle] = (acc[t.travelStyle] || 0) + 1;
    return acc;
  }, {});
  const favoriteStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const personality = favoriteStyle && PERSONALITIES[favoriteStyle];

  const handleCancel = async () => {
    setCancelling(true);
    setCancelMsg('');
    try {
      const token = getToken();
      const r = await fetch(`${API_URL}/api/payment/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.error);
      setCancelMsg(data.message);
      await refresh();
      setConfirmCancel(false);
    } catch (e) {
      setCancelMsg(`Error: ${e.message}`);
    }
    setCancelling(false);
  };

  const loading = authLoading || subLoading;
  const remaining = daysLeft(periodEnd);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar onAuthClick={setAuthModal} />

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Not logged in */}
        {!authLoading && !user && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-saffron/10 border border-saffron/20 flex items-center justify-center text-3xl mx-auto mb-4">👤</div>
            <h2 className="text-xl font-bold text-ink mb-2">Sign in to view your profile</h2>
            <p className="text-ink-muted text-sm mb-6">See your subscription, billing history, and trip stats.</p>
            <button
              onClick={() => setAuthModal('login')}
              className="px-6 py-2.5 rounded-xl bg-ink hover:bg-ink-soft text-paper text-sm font-semibold transition-colors shadow-warm-sm"
            >
              Sign in
            </button>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-saffron/30 border-t-saffron rounded-full animate-spin" />
          </div>
        )}

        {!loading && user && (
          <div className="space-y-5">

            {/* ── User card ─────────────────────────────────────────────────── */}
            <div className="bg-paper-warm border border-line rounded-2xl p-6 flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-saffron flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-saffron">
                {user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-ink truncate">{user.email}</h1>
                  {paymentsEnabled && (isPro ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-marigold/15 border border-marigold/30 text-marigold-deep">
                      ★ Pro
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-line border border-line text-ink-muted">
                      Free
                    </span>
                  ))}
                  {paymentsEnabled && manualOverride && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo/10 border border-indigo/20 text-indigo-deep">admin</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-ink-muted">
                  {tripsLoaded && <span>{ownedTrips.length} trip{ownedTrips.length !== 1 ? 's' : ''} generated</span>}
                </div>
              </div>
              <button
                onClick={logout}
                className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-line bg-paper hover:bg-line text-ink-muted transition-colors"
              >
                Sign out
              </button>
            </div>

            {/* ── Travel DNA — a personality read on their trips, computed client-side ── */}
            {tripsLoaded && ownedTrips.length > 0 && (
              <div className="border border-line rounded-2xl p-6 bg-gradient-to-br from-saffron-subtle to-paper-warm">
                <p className="text-[11px] font-mono tracking-wider uppercase text-saffron-deep mb-2">Your Travel DNA</p>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{personality?.emoji || '🧭'}</span>
                  <h2 className="font-serif text-xl font-semibold text-ink">{personality?.title || 'The Explorer'}</h2>
                </div>
                <p className="text-sm text-ink-muted mb-5">{personality?.blurb || 'Every trip tells a story.'}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/70 rounded-xl p-3 text-center border border-line/60">
                    <p className="text-2xl font-bold text-ink">{ownedTrips.length}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">Trips Planned</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-3 text-center border border-line/60">
                    <p className="text-2xl font-bold text-ink">{totalDays}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">Days Mapped</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-3 text-center border border-line/60">
                    <p className="text-2xl font-bold text-ink">{countries.length}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">{countries.length === 1 ? 'Country' : 'Countries'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Empty state — no trips generated yet ──────────────────────── */}
            {tripsLoaded && ownedTrips.length === 0 && (
              <div className="border border-dashed border-line rounded-2xl p-8 text-center bg-paper-warm">
                <div className="text-3xl mb-2">🗺️</div>
                <h2 className="font-serif text-lg font-semibold text-ink mb-1">No trips yet</h2>
                <p className="text-sm text-ink-muted mb-4">Plan your first trip and your Travel DNA will show up here.</p>
                <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink hover:bg-ink-soft text-paper text-sm font-semibold transition-colors">
                  + Plan a Trip
                </Link>
              </div>
            )}

            {/* ── Recent trips ──────────────────────────────────────────────── */}
            {ownedTrips.length > 0 && (
              <div className="border border-line rounded-2xl overflow-hidden bg-paper-warm">
                <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">Recent Trips</h2>
                  <Link href="/my-trips" className="text-xs text-saffron hover:text-saffron-deep font-medium">View all →</Link>
                </div>
                <div className="divide-y divide-line/60">
                  {ownedTrips.slice(0, 5).map((t) => (
                    <Link
                      key={t.shareId}
                      href={`/share/${t.shareId}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-line/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{t.destination}</p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {t.days} day{t.days !== 1 ? 's' : ''} · {t.travelStyle || 'balanced'} · {fmtDate(t.createdAt)}
                        </p>
                      </div>
                      <span className="text-ink-muted text-sm shrink-0 ml-3">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Subscription / billing UI — hidden entirely while payments are off ── */}
            {paymentsEnabled && (
            <>
            {/* ── Subscription status card ──────────────────────────────────── */}
            <div className={`border rounded-2xl overflow-hidden ${isPro ? 'border-marigold/30 bg-marigold/5' : 'border-line bg-paper-warm'}`}>
              <div className="px-5 py-4 flex items-center justify-between border-b border-line/60">
                <h2 className="text-sm font-semibold text-ink">Subscription</h2>
                {isFree && (
                  <Link
                    href="/pricing"
                    className="px-3 py-1.5 rounded-xl bg-saffron hover:bg-saffron-deep text-white text-xs font-bold transition-colors shadow-saffron"
                  >
                    ★ Upgrade to Pro
                  </Link>
                )}
                {isPro && !cancelAtEnd && (
                  <Link href="/pricing" className="text-xs text-indigo hover:text-indigo-deep transition-colors">
                    Renew / change plan →
                  </Link>
                )}
              </div>

              <div className="p-5">
                {/* Pro status */}
                {isPro && (
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1 p-3 bg-paper rounded-xl border border-line">
                      <p className="text-[11px] text-ink-muted mb-0.5">Status</p>
                      <p className="text-sm font-semibold text-jade">
                        Active{cancelAtEnd ? ' (cancels at period end)' : ''}
                      </p>
                    </div>
                    <div className="flex-1 p-3 bg-paper rounded-xl border border-line">
                      <p className="text-[11px] text-ink-muted mb-0.5">Access until</p>
                      <p className={`text-sm font-semibold ${remaining !== null && remaining <= 7 ? 'text-rose' : 'text-ink'}`}>
                        {manualOverride && !periodEnd ? 'Lifetime' : fmtDate(periodEnd)}
                        {remaining !== null && remaining <= 14 && !manualOverride && (
                          <span className="ml-1 text-[11px] font-normal text-ink-muted">({remaining}d left)</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Free usage meter */}
                {isFree && (
                  <div className="mb-1">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-ink-muted">Free itineraries this month</span>
                      <span className={`font-semibold ${usage.used >= usage.limit ? 'text-rose' : 'text-ink-soft'}`}>
                        {usage.used} / {usage.limit}
                      </span>
                    </div>
                    <div className="h-2 bg-line rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usage.used >= usage.limit ? 'bg-rose' : usage.used >= 2 ? 'bg-marigold' : 'bg-jade'
                        }`}
                        style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                      />
                    </div>
                    {usage.used >= usage.limit ? (
                      <p className="text-[11px] text-rose mt-1.5">
                        Limit reached — resets {fmtDate(usage.resetAt)}.{' '}
                        <Link href="/pricing" className="underline font-medium">Upgrade for unlimited.</Link>
                      </p>
                    ) : (
                      <p className="text-[11px] text-ink-muted mt-1.5">Resets {fmtDate(usage.resetAt)}</p>
                    )}
                  </div>
                )}

                {/* Renewal alert */}
                {isPro && !cancelAtEnd && !manualOverride && remaining !== null && remaining <= 14 && (
                  <div className="mt-3 p-3 bg-marigold/10 border border-marigold/20 rounded-xl">
                    <p className="text-xs text-marigold-deep font-medium">
                      Expiring in {remaining} day{remaining !== 1 ? 's' : ''}.{' '}
                      <Link href="/pricing" className="underline">Renew now →</Link>
                    </p>
                  </div>
                )}

                {/* Cancellation notice */}
                {cancelAtEnd && periodEnd && (
                  <div className="mt-3 p-3 bg-rose-subtle border border-rose/20 rounded-xl">
                    <p className="text-xs text-rose-deep">
                      Subscription cancelled — Pro access continues until {fmtDate(periodEnd)}.{' '}
                      <Link href="/pricing" className="underline font-medium">Re-subscribe →</Link>
                    </p>
                  </div>
                )}

                {/* Manual override notice */}
                {manualOverride && (
                  <div className="mt-3 p-3 bg-indigo/5 border border-indigo/20 rounded-xl">
                    <p className="text-xs text-indigo-deep">Your Pro access was granted by the Journeo team.</p>
                  </div>
                )}

                {/* Cancel subscription */}
                {isPro && !cancelAtEnd && !manualOverride && (
                  <div className="mt-4 pt-4 border-t border-line/60">
                    {!confirmCancel ? (
                      <button
                        onClick={() => setConfirmCancel(true)}
                        className="text-xs text-ink-muted hover:text-rose transition-colors"
                      >
                        Cancel subscription
                      </button>
                    ) : (
                      <div className="p-4 bg-rose-subtle border border-rose/20 rounded-xl">
                        <p className="text-sm text-rose-deep font-medium mb-1">Cancel Pro?</p>
                        <p className="text-xs text-ink-muted mb-3">
                          You keep Pro access until {fmtDate(periodEnd)}, then drop to Free.
                        </p>
                        {cancelMsg && <p className="text-xs text-rose mb-2">{cancelMsg}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="px-3 py-1.5 text-xs rounded-lg bg-rose/15 hover:bg-rose/25 border border-rose/30 text-rose-deep font-medium disabled:opacity-50 transition-colors"
                          >
                            {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                          </button>
                          <button
                            onClick={() => { setConfirmCancel(false); setCancelMsg(''); }}
                            className="px-3 py-1.5 text-xs rounded-lg bg-paper hover:bg-line border border-line text-ink-muted transition-colors"
                          >
                            Keep Pro
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Pro feature list (for free users) ────────────────────────── */}
            {isFree && (
              <div className="border border-line rounded-2xl p-5 bg-paper-warm">
                <h3 className="text-sm font-semibold text-ink mb-3">What you get with Pro</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    ['♾️', 'Unlimited itinerary generation'],
                    ['🤖', 'AI Chat with Maya'],
                    ['📡', 'Reddit Insights'],
                    ['💰', 'Budget Planner'],
                    ['🤝', 'Travel Buddy matching'],
                    ['👥', 'Group Collaboration'],
                  ].map(([icon, text]) => (
                    <div key={text} className="flex items-center gap-2 text-sm text-ink-soft">
                      <span className="text-base">{icon}</span>
                      {text}
                    </div>
                  ))}
                </div>
                <Link
                  href="/pricing"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-deep text-white text-sm font-bold transition-colors shadow-saffron"
                >
                  ★ View pricing plans
                </Link>
              </div>
            )}

            {/* ── Billing history ────────────────────────────────────────────── */}
            <div className="border border-line rounded-2xl overflow-hidden bg-paper-warm">
              <div className="px-5 py-4 border-b border-line">
                <h2 className="text-sm font-semibold text-ink">Billing History</h2>
              </div>

              {!paymentsLoaded ? (
                <div className="p-8 flex justify-center">
                  <div className="w-5 h-5 border-2 border-line border-t-ink-muted rounded-full animate-spin" />
                </div>
              ) : payments.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-ink-muted">
                  No payments yet.{' '}
                  {isFree && <Link href="/pricing" className="text-saffron hover:text-saffron-deep font-medium">Upgrade to Pro →</Link>}
                </div>
              ) : (
                <div className="divide-y divide-line/60">
                  {payments.map((p) => (
                    <div key={p._id} className="px-5 py-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-ink capitalize">
                          {p.plan} · {p.durationDays} days
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {fmtDate(p.createdAt)}
                          {p.razorpayPaymentId && (
                            <span className="ml-2 font-mono text-ink-muted/60">{p.razorpayPaymentId.slice(0, 14)}…</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-ink">{fmtAmount(p.amount)}</span>
                        <PaymentPill status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
            )}

          </div>
        )}
      </div>

      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSwitch={setAuthModal} />}
    </div>
  );
}

function PaymentPill({ status }) {
  const styles = {
    captured: 'bg-jade-subtle border-jade/30 text-jade-deep',
    pending:  'bg-marigold-subtle border-marigold/30 text-marigold-deep',
    failed:   'bg-rose-subtle border-rose/30 text-rose-deep',
    refunded: 'bg-line border-line text-ink-muted',
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
