'use client';

import { useState, useEffect } from 'react';
import { withAuth } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

function PostCard({ post }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden hover:border-saffron/30 hover:shadow-warm transition-all duration-200">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Score */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-10 h-10 rounded-xl bg-saffron-subtle border border-saffron/20 flex items-center justify-center">
              <span className="text-saffron-deep text-xs font-bold font-mono">
                {post.score >= 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
              </span>
            </div>
            <span className="text-[10px] text-ink-muted mt-1 font-mono">votes</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs px-2.5 py-0.5 bg-paper-warm border border-line rounded-full text-ink-muted font-mono">
                {post.subreddit}
              </span>
              <span className="text-xs text-ink-muted">{post.created}</span>
              <span className="text-xs text-ink-muted">💬 {post.numComments}</span>
            </div>

            <a href={post.url} target="_blank" rel="noopener noreferrer"
              className="font-semibold text-ink hover:text-saffron transition-colors leading-snug text-sm sm:text-base block mb-2">
              {post.title}
            </a>

            {post.preview && (
              <p className="text-sm text-ink-muted leading-relaxed line-clamp-2">{post.preview}</p>
            )}
          </div>
        </div>

        {/* Top Comments */}
        {post.topComments?.length > 0 && (
          <div className="mt-4">
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs text-saffron hover:text-saffron-deep flex items-center gap-1 transition-colors font-mono tracking-wider">
              <span>{expanded ? 'HIDE' : 'SHOW'} TOP COMMENTS ({post.topComments.length})</span>
              <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {expanded && (
              <div className="mt-3 space-y-2 animate-slide-up">
                {post.topComments.map((comment, i) => (
                  <div key={i} className="bg-paper-warm rounded-xl p-3 border border-line">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-ink-muted font-mono">↑ {comment.score}</span>
                    </div>
                    <p className="text-sm text-ink-soft leading-relaxed">{comment.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-5 pb-4 flex items-center justify-between border-t border-line">
        <a href={post.url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-ink-muted hover:text-saffron transition-colors flex items-center gap-1 font-mono tracking-wider">
          VIEW ON REDDIT →
        </a>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-line rounded-2xl p-5">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl shimmer shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 shimmer rounded" />
              <div className="h-4 w-full shimmer rounded" />
              <div className="h-4 w-3/4 shimmer rounded" />
              <div className="h-3 w-1/2 shimmer rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RedditInsights({ destination }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [loaded, setLoaded] = useState(false);

  const fetchReddit = async () => {
    if (loaded) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/reddit/search?destination=${encodeURIComponent(destination)}`, withAuth());
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch Reddit data');
      setData(json);
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReddit(); }, [destination]);

  const labelColors = {
    'Tip':          'bg-jade-subtle text-jade border-jade/20',
    'Warning':      'bg-rose-subtle text-rose border-rose/20',
    'Hidden Gem':   'bg-marigold-subtle text-marigold-deep border-marigold/20',
    'Best Time':    'bg-indigo-subtle text-indigo border-indigo/20',
    'Local Secret': 'bg-saffron-subtle text-saffron-deep border-saffron/20',
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="eyebrow mb-1">Community wisdom</p>
        <h2 className="font-serif text-2xl font-semibold text-ink">Reddit Insights</h2>
        <p className="text-sm text-ink-muted mt-1">
          Real traveler experiences for{' '}
          <span className="text-saffron font-medium">{destination}</span>
        </p>
      </div>

      {loading && (
        <div>
          <div className="bg-saffron-subtle border border-saffron/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-saffron/30 border-t-saffron rounded-full animate-spin shrink-0" />
            <div>
              <p className="text-sm font-medium text-saffron-deep">Searching Reddit...</p>
              <p className="text-xs text-ink-muted">Fetching posts + comments + AI summary</p>
            </div>
          </div>
          <LoadingSkeleton />
        </div>
      )}

      {error && (
        <div className="bg-rose-subtle border border-rose/30 rounded-2xl p-5 mb-6">
          <p className="text-sm text-rose mb-3">⚠️ {error}</p>
          <button onClick={() => { setLoaded(false); fetchReddit(); }}
            className="text-xs px-4 py-2 bg-rose/10 hover:bg-rose/20 text-rose rounded-lg transition-colors border border-rose/20">
            Retry
          </button>
        </div>
      )}

      {data && !loading && (
        <>
          {/* AI Summary */}
          {data.summary?.length > 0 && (
            <div className="bg-white border border-line rounded-2xl p-6 mb-6 shadow-warm-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-saffron-subtle border border-saffron/20 flex items-center justify-center">
                  <span className="text-sm">💬</span>
                </div>
                <h3 className="font-semibold text-ink">Real Traveler Insights</h3>
              </div>
              <ul className="space-y-3">
                {data.summary.map((point, i) => {
                  const typeMatch = point.match(/^\[([^\]]+)\]\s*/);
                  const label = typeMatch?.[1];
                  const text  = typeMatch ? point.slice(typeMatch[0].length) : point;
                  const lc    = labelColors[label] || 'bg-paper-warm text-ink-muted border-line';
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-saffron flex items-center justify-center text-[10px] text-white font-bold shrink-0 mt-0.5 font-mono">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        {label && (
                          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${lc} mr-2`}>
                            {label}
                          </span>
                        )}
                        <span className="text-sm text-ink-soft leading-relaxed">{text}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Post count */}
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-ink-muted font-mono">
              FOUND <span className="text-ink font-semibold">{data.total}</span> RELEVANT POSTS
            </p>
            <div className="flex-1 h-px bg-line" />
          </div>

          {/* Posts */}
          {data.posts?.length > 0 ? (
            <div className="space-y-4">
              {data.posts.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          ) : (
            <div className="bg-white border border-line rounded-2xl p-8 text-center shadow-warm-sm">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-ink font-medium mb-2">No Reddit posts found for {destination}</p>
              <p className="text-sm text-ink-muted max-w-sm mx-auto">
                Try searching manually on{' '}
                <a href={`https://www.reddit.com/search/?q=${encodeURIComponent(destination + ' travel')}&sort=relevance`}
                  target="_blank" rel="noopener noreferrer" className="text-saffron hover:text-saffron-deep underline">
                  Reddit directly →
                </a>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
