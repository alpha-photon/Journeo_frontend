'use client';

import { useState } from 'react';

export default function CollaborationPanel({ collaboration, shareId, isOwner }) {
  const [copied, setCopied]       = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  if (!collaboration) return null;

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${collaboration.inviteCode}`
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allMembers = [
    { email: 'You (Owner)', isOwner: true },
    ...collaboration.collaborators.map((c) => ({ email: c.email, isOwner: false })),
  ];

  return (
    <div className="bg-white border border-line rounded-2xl p-4 shadow-warm-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
          👥 Trip Group
          <span className="text-xs text-ink-muted font-normal font-mono">
            {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
          </span>
        </h4>
        <button onClick={() => setShowGuide((v) => !v)}
          className="text-xs text-ink-muted hover:text-saffron transition-colors font-mono">
          {showGuide ? 'Hide guide' : 'How it works'}
        </button>
      </div>

      {showGuide && (
        <div className="mb-4 p-3 bg-saffron-subtle border border-saffron/20 rounded-xl space-y-2 animate-slide-up">
          <p className="eyebrow text-saffron-deep mb-2">Collaboration Guide</p>
          {[
            { icon: '👍', text: 'Vote on activities — upvote what you love, downvote what you\'d skip' },
            { icon: '💬', text: 'Comment on any activity to discuss with your group' },
            { icon: '💡', text: 'Suggest alternative places — the trip owner can accept or reject' },
            { icon: '🔗', text: 'Share the invite link to add more people to the trip' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-sm shrink-0">{item.icon}</span>
              <p className="text-xs text-ink-soft leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {allMembers.map((m, i) => (
          <div key={i} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${
            m.isOwner ? 'bg-saffron-subtle border-saffron/30 text-saffron-deep' : 'bg-paper-warm border-line text-ink-soft'
          }`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 ${
              m.isOwner ? 'bg-saffron' : 'bg-ink-muted'
            }`}>
              {(m.email || '?')[0].toUpperCase()}
            </div>
            <span className="max-w-[100px] truncate">{m.email}</span>
          </div>
        ))}
      </div>

      {isOwner && collaboration.inviteCode && (
        <div className="flex gap-2">
          <input readOnly value={inviteUrl}
            className="flex-1 text-xs bg-paper-warm border border-line rounded-lg px-3 py-2 text-ink-muted truncate focus:outline-none font-mono" />
          <button onClick={handleCopy}
            className={`shrink-0 text-xs px-3 py-2 rounded-lg border transition-all font-mono ${
              copied
                ? 'bg-jade-subtle border-jade/30 text-jade'
                : 'bg-paper-warm border-line text-ink-soft hover:border-saffron/30 hover:text-saffron-deep'
            }`}>
            {copied ? '✓ Copied' : '📋 Copy Invite'}
          </button>
        </div>
      )}
    </div>
  );
}
