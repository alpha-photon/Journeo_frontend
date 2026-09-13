'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { withAuth } from '../../lib/auth';
import {
  IconSparkles, IconClock, IconAlert, IconBed, IconBus, IconUtensils,
  IconWallet, IconStar, IconMapPin, IconCheck, IconArrowRight, IconX,
} from './icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

/* ── Starters built from the actual trip ───────────────────────────────────
   Maya's whole advantage is that she has read this itinerary. Generic prompts
   ("best hotels downtown?") hide that, so every starter below names a real day,
   place or hotel from the plan the user is looking at. */
function buildStarters(itinerary, destination) {
  const days = itinerary?.days || [];
  const dest = destination || itinerary?.destination || 'this trip';
  const stops = (d) => [...(d.morning || []), ...(d.afternoon || []), ...(d.evening || [])];
  const out = [];

  const busiest = days.filter((d) => stops(d).length).sort((a, b) => stops(b).length - stops(a).length)[0];
  if (busiest) {
    out.push({
      icon: IconClock,
      label: `Is Day ${busiest.day} too packed?`,
      q: `Day ${busiest.day} has ${stops(busiest).length} stops. Is that realistic in one day, and what would you cut?`,
    });
  }

  const firstPlace = days.flatMap(stops).find((a) => a?.place)?.place;
  if (firstPlace) {
    out.push({
      icon: IconAlert,
      label: 'What if it rains?',
      q: `If it rains during my trip, what indoor alternatives near ${firstPlace} should I swap in?`,
    });
  }

  const stay = days.find((d) => d.accommodation)?.accommodation;
  if (stay) {
    out.push({
      icon: IconBed,
      label: 'Cheaper place to stay',
      q: `Is there a cheaper alternative to ${stay} in the same area, without losing the location?`,
    });
  }

  const a = days.flatMap(stops).filter((s) => s?.place);
  if (a.length >= 2) {
    out.push({
      icon: IconBus,
      label: 'Getting between stops',
      q: `What is the fastest way to get from ${a[0].place} to ${a[1].place}, and roughly what does it cost?`,
    });
  }

  out.push({
    icon: IconUtensils,
    label: 'Where locals actually eat',
    q: `Where do locals actually eat in ${dest}, close to the stops already in my itinerary?`,
  });
  out.push({
    icon: IconWallet,
    label: 'Realistic daily budget',
    q: `Give me a realistic daily budget breakdown for this trip, by category.`,
  });

  const must = itinerary?.mustTry?.[0];
  if (must) {
    // mustTry entries read like "Shojin Ryori: traditional Buddhist cuisine" —
    // keep the name, drop the gloss, so the chip stays one readable line.
    const name = must.split(/[:(—–-]/)[0].trim();
    const short = name.length > 24 ? `${name.slice(0, 24).trim()}…` : name;
    out.push({ icon: IconStar, label: `Is ${short} worth it?`, q: `Is "${must}" actually worth it, or is it a tourist trap?` });
  }

  out.push({
    icon: IconMapPin,
    label: 'Best day trip',
    q: `What is the best day trip from ${dest}, and which day of my itinerary should I use for it?`,
  });

  return out.slice(0, 8);
}

const MARKDOWN = {
  strong: ({ children }) => <strong className="text-saffron-deep font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="mt-1.5 mb-1.5 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mt-1.5 mb-1.5 space-y-1 list-decimal pl-4">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-1.5 text-ink-soft">
      <span className="text-saffron mt-[3px] shrink-0 text-xs">›</span><span>{children}</span>
    </li>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0 text-ink-soft">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-saffron-deep underline underline-offset-2">{children}</a>
  ),
  code: ({ children }) => <code className="px-1 py-0.5 rounded bg-paper-warm text-ink text-[13px] font-mono">{children}</code>,
};

function MayaAvatar({ size = 'md' }) {
  const s = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <div className={`${s} rounded-xl bg-ink text-paper font-serif font-bold flex items-center justify-center shrink-0`}>
      M
    </div>
  );
}

function RedditSourcesBadge({ sources, postsFound }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 bg-saffron-subtle hover:bg-saffron/15 border border-saffron/20 rounded-full text-saffron-deep transition-colors font-mono tracking-wider"
      >
        <span>GROUNDED IN {postsFound} REDDIT POSTS</span>
        <span className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 animate-slide-up">
          {sources.map((s, i) => (
            <a
              key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 px-3 py-2 bg-paper-warm hover:bg-saffron-subtle border border-line rounded-xl transition-colors group"
            >
              <span className="text-saffron text-xs shrink-0 mt-0.5 font-mono">↑{s.score}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-saffron-deep font-mono">{s.subreddit}</span>
                <p className="text-xs text-ink-soft leading-tight line-clamp-2 group-hover:text-ink">{s.title}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, onRetry, isLast }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (_) { /* clipboard blocked — nothing useful to show */ }
  };

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink text-paper px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 animate-slide-up">
      <MayaAvatar />
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-bl-md bg-white border border-line px-4 py-3 text-sm leading-relaxed shadow-warm-sm">
          <ReactMarkdown components={MARKDOWN}>{message.content || ''}</ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-saffron rounded-sm animate-pulse ml-0.5 -mb-0.5" />
          )}
        </div>

        {/* Answers carry hotel names, routes and prices — people want to keep them. */}
        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <button onClick={copy} className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink transition-colors">
              {copied ? <IconCheck size={12} /> : null}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {isLast && (
              <button onClick={onRetry} className="text-[11px] text-ink-muted hover:text-ink transition-colors">
                Try again
              </button>
            )}
          </div>
        )}

        {message.redditSources && (
          <RedditSourcesBadge sources={message.redditSources} postsFound={message.redditPostsFound} />
        )}
      </div>
    </div>
  );
}

export default function ChatAgent({ itinerary, destination, shareId }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);

  const scrollRef          = useRef(null);
  const endRef             = useRef(null);
  const taRef              = useRef(null);
  const abortControllerRef = useRef(null);
  const pinnedRef          = useRef(true); // is the user reading the latest message?

  const starters = useMemo(() => buildStarters(itinerary, destination), [itinerary, destination]);

  // The chat tab unmounts whenever the user checks another tab. The backend has
  // been saving every exchange all along, so restore it instead of starting over.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/chat/history/${shareId}`);
        const data = await res.json();
        if (!cancelled && data.success && data.messages?.length) {
          setMessages(data.messages.map((m) => ({ role: m.role, content: m.content })));
        }
      } catch (_) { /* history is a nicety — an empty chat still works */ }
      finally { if (!cancelled) setRestoring(false); }
    })();
    return () => { cancelled = true; };
  }, [shareId]);

  // Only follow the stream if the user hasn't scrolled up to read something.
  useEffect(() => {
    if (pinnedRef.current) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const sendMessage = useCallback(async (content, historyOverride) => {
    const userMessage = (content || '').trim();
    if (!userMessage || isLoading) return;

    const base = historyOverride ?? messages;
    const apiMessages = [...base.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: userMessage }];
    const streamId = Date.now();

    pinnedRef.current = true;
    setMessages([...base, { role: 'user', content: userMessage }, { id: streamId, role: 'assistant', content: '', isStreaming: true }]);
    setInput('');
    setIsLoading(true);
    if (taRef.current) taRef.current.style.height = 'auto';

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch(`${API_URL}/api/chat/message`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, itinerary, destination, shareId }),
        signal: abortControllerRef.current.signal,
      }));
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let lineBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lineBuffer += decoder.decode(value, { stream: true });
        // SSE events can be split across network chunks — only process complete
        // lines, keep any trailing partial line for the next read.
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') break;
          let data;
          try { data = JSON.parse(dataStr); } catch (_) { continue; }

          if (data.error) {
            const msg = data.error.includes('rate_limit') || data.error.includes('429')
              ? 'Maya is busy right now. Give it a minute and try again.'
              : `Error: ${data.error}`;
            setMessages((prev) => prev.map((m) => (m.id === streamId ? { ...m, content: msg, isStreaming: false } : m)));
            setIsLoading(false);
            return;
          }
          if (data.type === 'reddit_sources') {
            setMessages((prev) => prev.map((m) => (m.id === streamId ? { ...m, redditSources: data.sources, redditPostsFound: data.postsFound } : m)));
            continue;
          }
          if (data.content) {
            accumulated += data.content;
            setMessages((prev) => prev.map((m) => (m.id === streamId ? { ...m, content: accumulated } : m)));
          }
        }
      }
      setMessages((prev) => prev.map((m) => (m.id === streamId ? { ...m, isStreaming: false } : m)));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => prev.map((m) =>
          m.id === streamId ? { ...m, content: `Sorry, I hit an error: ${err.message}. Please try again.`, isStreaming: false } : m
        ));
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, itinerary, destination, shareId]);

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    setMessages((prev) => prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)));
    setIsLoading(false);
  };

  // Re-ask the last question against the history that preceded it.
  const retryLast = () => {
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const idx = messages.length - 1 - lastUserIdx;
    sendMessage(messages[idx].content, messages.slice(0, idx));
  };

  const clearChat = async () => {
    setMessages([]);
    pinnedRef.current = true;
    try { await fetch(`${API_URL}/api/chat/history/${shareId}`, withAuth({ method: 'DELETE' })); }
    catch (_) { /* local clear already happened; a reload may restore it */ }
  };

  const grow = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = !restoring && messages.length === 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="eyebrow mb-1">Your AI concierge</p>
          <h2 className="font-serif text-2xl font-semibold text-ink">Maya</h2>
          <p className="text-sm text-ink-muted mt-1">
            She has read your {itinerary?.totalDays ? `${itinerary.totalDays}-day ` : ''}
            <span className="text-saffron font-medium">{destination}</span> itinerary.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink border border-line hover:border-ink-muted rounded-lg px-2.5 py-1.5 transition-colors shrink-0"
          >
            <IconX size={12} /> Start over
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-line rounded-2xl flex flex-col shadow-warm-sm h-[68vh] min-h-[440px] lg:h-[640px]">

            {/* Messages */}
            <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4">
              {restoring && (
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                  Loading your conversation…
                </div>
              )}

              {/* Empty state does the teaching — every prompt names something real
                  from this trip, so the value is obvious before typing anything. */}
              {isEmpty && (
                <div className="h-full flex flex-col justify-center">
                  <div className="flex items-center gap-2.5 mb-2">
                    <MayaAvatar />
                    <p className="text-sm font-semibold text-ink">Ask me anything about this trip</p>
                  </div>
                  <p className="text-sm text-ink-muted mb-5 leading-relaxed">
                    I know every stop, cost and hotel in your plan — so you can ask about the plan itself, not just the city.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {starters.slice(0, 6).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s.q)}
                        className="flex items-center gap-2.5 text-left text-[13px] px-3 py-2.5 bg-paper-warm hover:bg-saffron-subtle border border-line hover:border-saffron/30 rounded-xl text-ink-soft hover:text-saffron-deep transition-all"
                      >
                        <s.icon size={15} />
                        <span className="leading-snug">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id || i}
                  message={msg}
                  isLast={i === messages.length - 1 && !isLoading}
                  onRetry={retryLast}
                />
              ))}

              {isLoading && !messages.some((m) => m.isStreaming && m.content) && (
                <div className="flex items-center gap-2.5">
                  <MayaAvatar />
                  <div className="flex gap-1 px-4 py-3 bg-paper-warm border border-line rounded-2xl rounded-bl-md">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-saffron rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Follow-up chips — the desktop sidebar is off-screen on phones, so
                the suggestions have to live next to the composer here. */}
            {!isEmpty && !isLoading && (
              <div className="lg:hidden border-t border-line px-4 py-2.5 overflow-x-auto">
                <div className="flex gap-1.5 w-max">
                  {starters.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.q)}
                      className="flex items-center gap-1.5 whitespace-nowrap text-xs px-3 py-1.5 bg-paper-warm hover:bg-saffron-subtle border border-line rounded-full text-ink-muted hover:text-saffron-deep transition-colors"
                    >
                      <s.icon size={13} />{s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Composer */}
            <div className="border-t border-line p-3 sm:p-4">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2 items-end">
                <textarea
                  ref={taRef}
                  rows={1}
                  value={input}
                  onChange={grow}
                  onKeyDown={onKeyDown}
                  placeholder={`Ask anything about ${destination}…`}
                  disabled={isLoading}
                  className="flex-1 resize-none px-4 py-3 bg-paper-warm border border-line rounded-xl text-ink placeholder-ink-muted focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all text-sm disabled:opacity-50 leading-relaxed"
                />
                {isLoading ? (
                  <button
                    type="button" onClick={stopGeneration} title="Stop"
                    className="w-11 h-11 flex items-center justify-center bg-paper-warm hover:bg-line border border-line text-ink rounded-xl transition-colors shrink-0"
                  >
                    <span className="w-3 h-3 bg-ink rounded-[2px]" />
                  </button>
                ) : (
                  <button
                    type="submit" disabled={!input.trim()} title="Send"
                    className="w-11 h-11 flex items-center justify-center bg-ink hover:bg-ink-soft text-paper rounded-xl transition-all disabled:opacity-30 shrink-0"
                  >
                    <IconArrowRight size={17} />
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Desktop sidebar — labelled, not four unlabelled emoji */}
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="bg-white border border-line rounded-2xl p-4 sticky top-32 shadow-warm-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <IconSparkles size={13} className="text-saffron" />
              <p className="eyebrow !mb-0">Ask about your plan</p>
            </div>
            <div className="space-y-1.5">
              {starters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.q)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2.5 text-left text-[13px] px-3 py-2.5 bg-paper-warm hover:bg-saffron-subtle border border-line hover:border-saffron/30 rounded-xl text-ink-muted hover:text-saffron-deep transition-all disabled:opacity-40 leading-snug"
                >
                  <s.icon size={14} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-line flex items-center gap-1.5 text-xs text-ink-muted font-mono">
              <span className="w-1.5 h-1.5 bg-jade rounded-full animate-pulse" />
              <span>Maya · Journeo AI</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
