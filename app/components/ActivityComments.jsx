'use client';

import { useState } from 'react';
import { withAuth } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export default function ActivityComments({ shareId, activityKey, comments, onUpdate }) {
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [expanded, setExpanded] = useState(false);

  const activityComments = (comments || []).filter((c) => c.activityKey === activityKey);
  const count = activityComments.length;

  const handleSubmit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/collaborate/${shareId}/comment`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityKey, text: text.trim() }),
      }));
      const data = await res.json();
      if (data.success) { onUpdate?.(data.comments); setText(''); }
    } catch { /* ignore */ }
    setSending(false);
  };

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}
        className="text-xs text-ink-muted hover:text-ink-soft transition-colors flex items-center gap-1 font-mono">
        <span>💬</span>
        <span>{count > 0 ? `${count} comment${count !== 1 ? 's' : ''}` : 'Comment'}</span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {activityComments.map((c, i) => {
            const name = c.email?.split('@')[0] || 'User';
            const time = new Date(c.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' });
            return (
              <div key={c._id || i} className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-saffron flex items-center justify-center text-[8px] font-bold text-white shrink-0 mt-0.5">
                  {name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-ink">{name}</span>
                    <span className="text-[10px] text-ink-muted font-mono">{time}</span>
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed">{c.text}</p>
                </div>
              </div>
            );
          })}

          <div className="flex gap-1.5">
            <input type="text" value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Add a note..."
              className="flex-1 text-xs bg-paper-warm border border-line rounded-lg px-2.5 py-1.5 text-ink placeholder-ink-muted focus:outline-none focus:border-saffron/50" />
            <button onClick={handleSubmit} disabled={!text.trim() || sending}
              className="text-xs px-2.5 py-1.5 bg-saffron-subtle border border-saffron/30 text-saffron-deep rounded-lg hover:bg-saffron/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-mono">
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
