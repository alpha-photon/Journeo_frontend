'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const TYPE_STYLES = {
  info:    { bg: 'bg-indigo-subtle border-indigo/20',   text: 'text-indigo',       dot: 'bg-indigo'  },
  warning: { bg: 'bg-marigold-subtle border-marigold/20', text: 'text-marigold-deep', dot: 'bg-marigold' },
  success: { bg: 'bg-jade-subtle border-jade/20',       text: 'text-jade',          dot: 'bg-jade'    },
  error:   { bg: 'bg-rose-subtle border-rose/20',       text: 'text-rose',          dot: 'bg-rose'    },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return new Set();
    try { return new Set(JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => {
    fetch(`${API_URL}/api/announcements/active`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setAnnouncements(data.announcements || []); })
      .catch(() => {});
  }, []);

  const dismiss = (id) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem('dismissed_announcements', JSON.stringify([...next]));
  };

  const visible = announcements.filter((a) => !dismissed.has(a._id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {visible.map((ann) => {
        const s = TYPE_STYLES[ann.type] || TYPE_STYLES.info;
        return (
          <div key={ann._id} className={`flex items-center gap-3 px-4 py-2.5 border-b text-sm ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
            <p className={`flex-1 font-sans text-xs ${s.text}`}>{ann.message}</p>
            {ann.link && ann.linkLabel && (
              <a href={ann.link} target="_blank" rel="noopener noreferrer"
                className={`text-xs shrink-0 underline font-mono ${s.text}`}>
                {ann.linkLabel} →
              </a>
            )}
            <button onClick={() => dismiss(ann._id)}
              className={`shrink-0 ${s.text} opacity-50 hover:opacity-100 text-base leading-none`}>✕</button>
          </div>
        );
      })}
    </div>
  );
}
