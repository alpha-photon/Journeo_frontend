'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useSubscription } from '../../hooks/useSubscription';
import { getToken, getStoredUser } from '../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const PLANS = [
  { key: 'monthly', label: 'Pro Monthly', price: '₹199', sub: 'per month', amount: 19900, badge: null },
  { key: 'annual',  label: 'Pro Annual',  price: '₹1,499', sub: 'per year', amount: 149900, badge: 'Save 37%' },
];

const PRO_FEATURES = [
  { icon: '♾️', text: 'Unlimited itinerary generation' },
  { icon: '🤖', text: 'AI Chat with Maya (travel companion)' },
  { icon: '📡', text: 'Reddit Insights — real traveler tips' },
  { icon: '💰', text: 'Budget Planner & expense tracking' },
  { icon: '🤝', text: 'Travel Buddy matching' },
  { icon: '👥', text: 'Real-time group collaboration' },
  { icon: '⚡', text: 'Priority itinerary generation' },
];

const FREE_FEATURES = [
  { text: '3 itineraries per month' },
  { text: 'Share & explore itineraries' },
  { text: 'Packing list & travel essentials' },
  { text: 'Travel passport tracker' },
];

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function PricingPage() {
  const { isPro, loading: subLoading, periodEnd, refresh } = useSubscription();
  const [buying, setBuying]   = useState(null);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const handleCheckout = async (plan) => {
    setError(''); setSuccess('');
    const token = getToken();
    if (!token) { setError('Please sign in to upgrade.'); return; }
    setBuying(plan.key);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load Razorpay. Check your internet connection.');
      const orderRes  = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: plan.key }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || 'Could not create order');
      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: orderData.keyId, amount: orderData.amount, currency: orderData.currency,
          name: 'Journeo', description: plan.label, order_id: orderData.orderId,
          prefill: { email: getStoredUser()?.email || '' },
          theme: { color: '#F97316' },
          modal: { ondismiss: () => reject(new Error('dismissed')) },
          handler: async (response) => {
            try {
              const verifyRes  = await fetch(`${API}/api/payment/verify`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyData.success) throw new Error(verifyData.error || 'Verification failed');
              setSuccess('Payment successful! Welcome to Pro 🎉');
              await refresh(); resolve();
            } catch (e) { reject(e); }
          },
        });
        rzp.on('payment.failed', (resp) => reject(new Error(resp.error?.description || 'Payment failed')));
        rzp.open();
      });
    } catch (e) {
      if (e.message !== 'dismissed') setError(e.message || 'Payment failed. Please try again.');
    } finally { setBuying(null); }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">Pricing</p>
          <h1 className="font-serif text-4xl font-semibold text-ink mb-3">Simple, honest pricing</h1>
          <div className="section-divider mb-5" />
          <p className="text-ink-muted text-lg max-w-md mx-auto">
            Start free. Upgrade when you need unlimited AI-powered travel planning.
          </p>
        </div>

        {/* Already Pro */}
        {isPro && (
          <div className="mb-8 p-4 bg-jade-subtle border border-jade/20 rounded-2xl text-center">
            <p className="text-jade font-semibold">You're already on Pro ✓</p>
            {periodEnd && (
              <p className="text-xs text-ink-muted mt-1 font-mono">
                Active until {new Date(periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            <Link href="/profile" className="inline-block mt-2 text-xs text-saffron hover:text-saffron-deep">
              Manage subscription →
            </Link>
          </div>
        )}

        {error   && <div className="mb-6 p-4 bg-rose-subtle border border-rose/20 rounded-xl text-rose text-sm text-center">{error}</div>}
        {success && <div className="mb-6 p-4 bg-jade-subtle border border-jade/20 rounded-xl text-jade text-sm text-center">{success}</div>}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

          {/* Free card */}
          <div className="bg-white border border-line rounded-2xl p-6 shadow-warm-sm">
            <div className="mb-5">
              <h2 className="font-serif text-xl font-semibold text-ink">Free</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-serif text-3xl font-semibold text-ink">₹0</span>
                <span className="text-ink-muted text-sm font-mono">forever</span>
              </div>
            </div>
            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                  <span className="text-jade mt-0.5 shrink-0 font-bold">✓</span>{f.text}
                </li>
              ))}
            </ul>
            <div className="w-full py-2.5 rounded-xl border border-line text-ink-muted text-sm text-center font-mono">
              CURRENT PLAN
            </div>
          </div>

          {/* Pro plan cards */}
          {PLANS.map((plan) => (
            <div key={plan.key}
              className={`relative bg-white rounded-2xl p-6 shadow-warm transition-all ${
                plan.key === 'annual' ? 'border-2 border-marigold/50 shadow-warm-md' : 'border border-line'
              }`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-marigold text-ink text-xs font-bold rounded-full font-mono">
                  {plan.badge}
                </div>
              )}
              <div className="mb-5">
                <h2 className="font-serif text-xl font-semibold text-ink mb-0.5">{plan.label}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-serif text-3xl font-semibold text-saffron">{plan.price}</span>
                  <span className="text-ink-muted text-sm font-mono">{plan.sub}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {PRO_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                    <span className="shrink-0 mt-0.5">{f.icon}</span>{f.text}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleCheckout(plan)} disabled={!!buying || isPro || subLoading}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans ${
                  plan.key === 'annual'
                    ? 'bg-marigold hover:bg-marigold-deep text-ink shadow-warm'
                    : 'bg-ink hover:bg-ink-soft text-paper shadow-warm'
                }`}>
                {buying === plan.key ? 'Opening checkout…' : isPro ? 'Already Pro' : `Get ${plan.label}`}
              </button>
            </div>
          ))}
        </div>

        {/* Trust row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-ink-muted">
          {[
            { icon: '🔒', title: 'Secure payments', text: 'Powered by Razorpay — trusted by 5M+ businesses. We never store card data.' },
            { icon: '⚡', title: 'Instant activation', text: 'Your account upgrades the moment payment is confirmed. No delay.' },
            { icon: '🔄', title: 'Cancel anytime', text: 'Cancel from your account page. You keep Pro access until the period ends.' },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div>
                <p className="font-medium text-ink mb-1">{item.title}</p>
                <p className="leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
