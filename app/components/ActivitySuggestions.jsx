'use client';

import { useState } from 'react';
import { withAuth } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export default function ActivitySuggestions({ shareId, activityKey, suggestions, isOwner, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [place, setPlace]       = useState('');
  const [reason, setReason]     = useState('');
  const [sending, setSending]   = useState(false);

  const activitySuggestions = (suggestions || []).filter((s) => s.activityKey === activityKey);
  const count = activitySuggestions.length;

  const handleSubmit = async () => {
    if (!place.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/collaborate/${shareId}/suggest`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityKey, suggestedPlace: place.trim(), reason: reason.trim() }),
      }));
      const data = await res.json();
      if (data.success) { onUpdate?.(data.suggestions); setPlace(''); setReason(''); }
    } catch { /* ignore */ }
    setSending(false);
  };

  const handleDecision = async (suggestionId, status) => {
    try {
      const res = await fetch(`${API_URL}/api/collaborate/${shareId}/suggestion/${suggestionId}`, withAuth({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }));
      const data = await res.json();
      if (data.success) onUpdate?.(null, data.suggestion);
    } catch { /* ignore */ }
  };

  const statusStyle = {
    pending:  'bg-marigold-subtle border-marigold/20 text-marigold-deep',
    accepted: 'bg-jade-subtle border-jade/20 text-jade',
    rejected: 'bg-rose-subtle border-rose/20 text-rose',
  };

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}
        className="text-xs text-ink-muted hover:text-ink-soft transition-colors flex items-center gap-1 font-mono">
        <span>💡</span>
        <span>{count > 0 ? `${count} suggestion${count !== 1 ? 's' : ''}` : 'Suggest alternative'}</span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {activitySuggestions.map((s) => {
            const name = s.email?.split('@')[0] || 'Someone';
            return (
              <div key={s._id} className={`rounded-xl border p-2.5 ${statusStyle[s.status] || statusStyle.pending}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{s.suggestedPlace}</p>
                    {s.reason && <p className="text-[10px] opacity-70 mt-0.5">{s.reason}</p>}
                    <p className="text-[10px] opacity-50 mt-1 font-mono">{name} · {s.status}</p>
                  </div>
                  {isOwner && s.status === 'pending' && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleDecision(s._id, 'accepted')}
                        className="text-[10px] px-2 py-1 bg-jade-subtle border border-jade/30 text-jade rounded hover:bg-jade/15 transition-all">✓</button>
                      <button onClick={() => handleDecision(s._id, 'rejected')}
                        className="text-[10px] px-2 py-1 bg-rose-subtle border border-rose/30 text-rose rounded hover:bg-rose/15 transition-all">✗</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="space-y-1.5">
            <input type="text" value={place} onChange={(e) => setPlace(e.target.value)}
              placeholder="Suggest a place..."
              className="w-full text-xs bg-paper-warm border border-line rounded-lg px-2.5 py-1.5 text-ink placeholder-ink-muted focus:outline-none focus:border-saffron/50" />
            <div className="flex gap-1.5">
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Why? (optional)"
                className="flex-1 text-xs bg-paper-warm border border-line rounded-lg px-2.5 py-1.5 text-ink placeholder-ink-muted focus:outline-none focus:border-saffron/50" />
              <button onClick={handleSubmit} disabled={!place.trim() || sending}
                className="text-xs px-2.5 py-1.5 bg-saffron-subtle border border-saffron/30 text-saffron-deep rounded-lg hover:bg-saffron/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-mono">
                {sending ? '...' : 'Suggest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
