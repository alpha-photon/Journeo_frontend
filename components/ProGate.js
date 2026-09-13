'use client';

import Link from 'next/link';
import { useSubscription } from '../hooks/useSubscription';

const FEATURE_LABELS = {
  ai_chat:       { icon: '🤖', label: 'AI Chat with Maya' },
  reddit:        { icon: '📡', label: 'Reddit Insights' },
  budget:        { icon: '💰', label: 'Budget Planner' },
  travel_buddy:  { icon: '🤝', label: 'Travel Buddy Matching' },
  collaboration: { icon: '👥', label: 'Group Trip Collaboration' },
  unlimited:     { icon: '♾️', label: 'Unlimited Itineraries' },
};

// Wraps a Pro feature. Shows a paywall card when the user is not Pro.
// props:
//   feature  — key from FEATURE_LABELS (for display only)
//   children — the actual Pro feature UI
//   compact  — show a smaller inline lock instead of the full card
export default function ProGate({ feature = 'unlimited', children, compact = false }) {
  const { isPro, loading } = useSubscription();

  // While loading, render nothing (avoids layout shift)
  if (loading) return null;

  // User has Pro — render children directly
  if (isPro) return <>{children}</>;

  const info = FEATURE_LABELS[feature] || { icon: '🔒', label: 'This feature' };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
        <span className="text-lg">{info.icon}</span>
        <span className="text-sm text-slate-300 flex-1">{info.label} is a Pro feature</span>
        <Link href="/pricing" className="text-xs font-semibold text-amber-300 hover:text-amber-200 whitespace-nowrap">
          Upgrade →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-12 px-6 text-center">
      {/* Lock icon */}
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl">
        {info.icon}
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-100 mb-1">{info.label}</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          Unlock {info.label.toLowerCase()} and all other Pro features for ₹199/month.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm transition-colors"
        >
          ★ Upgrade to Pro
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-slate-100 text-sm transition-colors"
        >
          See all plans
        </Link>
      </div>
    </div>
  );
}
