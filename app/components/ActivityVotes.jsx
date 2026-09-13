'use client';

import { withAuth } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export default function ActivityVotes({ shareId, activityKey, votes, userId, onUpdate }) {
  const activityVotes = (votes || []).filter((v) => v.activityKey === activityKey);
  const upvotes   = activityVotes.filter((v) => v.vote === 1).length;
  const downvotes = activityVotes.filter((v) => v.vote === -1).length;
  const myVote    = activityVotes.find((v) => v.userId === userId)?.vote || 0;
  const score     = upvotes - downvotes;

  const handleVote = async (vote) => {
    const newVote = myVote === vote ? -vote : vote;
    try {
      const res = await fetch(`${API_URL}/api/collaborate/${shareId}/vote`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityKey, vote: newVote }),
      }));
      const data = await res.json();
      if (data.success) onUpdate?.(data.votes);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => handleVote(1)}
        className={`text-xs px-1.5 py-0.5 rounded transition-all font-mono ${
          myVote === 1 ? 'text-jade bg-jade-subtle' : 'text-ink-muted hover:text-jade hover:bg-jade-subtle'
        }`} title="Want to do this">▲</button>
      <span className={`text-xs font-medium min-w-[16px] text-center font-mono ${
        score > 0 ? 'text-jade' : score < 0 ? 'text-rose' : 'text-ink-muted'
      }`}>{score}</span>
      <button onClick={() => handleVote(-1)}
        className={`text-xs px-1.5 py-0.5 rounded transition-all font-mono ${
          myVote === -1 ? 'text-rose bg-rose-subtle' : 'text-ink-muted hover:text-rose hover:bg-rose-subtle'
        }`} title="Skip this">▼</button>
    </div>
  );
}
