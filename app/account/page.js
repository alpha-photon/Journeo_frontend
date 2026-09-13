'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSubscription } from '../../hooks/useSubscription';
import { getToken } from '../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

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

export default function AccountPage() {
  const {
    isPro, isFree, plan, status, periodEnd, cancelAtEnd, manualOverride,
    usage, loading: subLoading, refresh,
  } = useSubscription();

  const [payments, setPayments]       = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [cancelling, setCancelling]   = useState(false);
  const [cancelMsg, setCancelMsg]     = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { setPaymentsLoading(false); return; }

    fetch(`${API}/api/payment/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setPayments(d.payments || []))
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  }, []);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelMsg('');
    try {
      const token = getToken();
      const r = await fetch(`${API}/api/payment/cancel`, {
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

  if (subLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  const remaining = daysLeft(periodEnd);
  const resetDate = fmtDate(usage.resetAt);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">← Home</Link>
          <span className="text-slate-700">/</span>
          <h1 className="text-2xl font-bold text-slate-100">Account</h1>
        </div>

        {/* ── Subscription card ──────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current plan</p>
                <div className="flex items-center gap-2">
                  {isPro ? (
                    <span className="text-2xl font-bold text-amber-300">★ Pro</span>
                  ) : (
                    <span className="text-2xl font-bold text-slate-200">Free</span>
                  )}
                  {manualOverride && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">admin</span>
                  )}
                  {cancelAtEnd && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">cancels at period end</span>
                  )}
                </div>
              </div>

              {isFree && (
                <Link href="/pricing" className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold transition-colors">
                  ★ Upgrade
                </Link>
              )}
            </div>

            {isPro && periodEnd && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-800/60 rounded-xl">
                  <p className="text-xs text-slate-500 mb-0.5">Access until</p>
                  <p className="font-medium text-slate-200">{fmtDate(periodEnd)}</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl">
                  <p className="text-xs text-slate-500 mb-0.5">Days remaining</p>
                  <p className={`font-bold ${remaining <= 7 ? 'text-yellow-400' : 'text-slate-200'}`}>
                    {remaining !== null ? `${remaining} day${remaining !== 1 ? 's' : ''}` : '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Free usage bar */}
            {isFree && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Free itineraries this month</span>
                  <span className={usage.used >= usage.limit ? 'text-red-400 font-medium' : ''}>
                    {usage.used} / {usage.limit}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usage.used >= usage.limit ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                  />
                </div>
                {usage.used >= usage.limit && (
                  <p className="text-xs text-red-400 mt-1.5">Limit reached — resets {resetDate}</p>
                )}
                {usage.used < usage.limit && (
                  <p className="text-xs text-slate-600 mt-1.5">Resets {resetDate}</p>
                )}
              </div>
            )}
          </div>

          {/* Renewal / upgrade CTA */}
          {isPro && !cancelAtEnd && !manualOverride && remaining !== null && remaining <= 14 && (
            <div className="px-6 pb-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                Your Pro subscription expires in {remaining} day{remaining !== 1 ? 's' : ''}. Renew to avoid losing access.
              </div>
              <Link href="/pricing" className="mt-2 inline-block text-xs text-indigo-400 hover:text-indigo-300">
                Renew now →
              </Link>
            </div>
          )}

          {/* Cancel section */}
          {isPro && !cancelAtEnd && !manualOverride && (
            <div className="px-6 pb-5 border-t border-slate-800 pt-4">
              {!confirmCancel ? (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  Cancel subscription
                </button>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-sm text-red-300 font-medium mb-1">Cancel Pro subscription?</p>
                  <p className="text-xs text-slate-400 mb-3">
                    You'll keep Pro access until {fmtDate(periodEnd)}. After that, you'll return to the Free plan.
                  </p>
                  {cancelMsg && <p className="text-xs text-red-300 mb-2">{cancelMsg}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-medium disabled:opacity-50"
                    >
                      {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                    </button>
                    <button
                      onClick={() => { setConfirmCancel(false); setCancelMsg(''); }}
                      className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                    >
                      Keep Pro
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {cancelAtEnd && periodEnd && (
            <div className="px-6 pb-5 border-t border-slate-800 pt-4">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-300">
                Your subscription is cancelled. Pro access continues until {fmtDate(periodEnd)}.
              </div>
              <Link href="/pricing" className="mt-2 inline-block text-xs text-indigo-400 hover:text-indigo-300">
                Re-subscribe →
              </Link>
            </div>
          )}
        </div>

        {/* ── Payment history ──────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Billing History</h2>
          </div>

          {paymentsLoading ? (
            <div className="p-8 text-center">
              <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin mx-auto" />
            </div>
          ) : payments.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-600">
              No payments yet.{' '}
              {isFree && <Link href="/pricing" className="text-indigo-400 hover:text-indigo-300">Upgrade to Pro →</Link>}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {payments.map((p) => (
                <div key={p._id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-200 font-medium capitalize">
                      {p.plan} · {p.durationDays} days
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {fmtDate(p.createdAt)}
                      {p.razorpayPaymentId && (
                        <span className="ml-2 font-mono text-slate-600">{p.razorpayPaymentId.slice(0, 14)}…</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-200">{fmtAmount(p.amount)}</span>
                    <StatusPill status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    captured: 'bg-green-500/15 border-green-500/30 text-green-300',
    pending:  'bg-yellow-500/15 border-yellow-500/30 text-yellow-300',
    failed:   'bg-red-500/15 border-red-500/30 text-red-400',
    refunded: 'bg-slate-700 border-slate-600 text-slate-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
