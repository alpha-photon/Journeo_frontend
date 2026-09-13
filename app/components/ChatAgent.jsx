'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { withAuth } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const SUGGESTION_GROUPS = [
  { label: 'Accommodation', icon: '🏨', questions: ['Best budget hotels near the city center?', 'Recommend luxury hotels with a view', 'Any good hostels for solo travelers?'] },
  { label: 'Food',          icon: '🍽️', questions: ['Best local street food spots?', 'Vegetarian restaurant recommendations', 'Where to eat breakfast like a local?'] },
  { label: 'Logistics',     icon: '🚌', questions: ['How to get around cheapest?', 'Is Uber/Grab available here?', 'Day trip options from here?'] },
  { label: 'Backup Plans',  icon: '🌧️', questions: ['What to do if it rains?', 'Indoor activities nearby?', 'Best rainy day spots?'] },
];

function RedditSourcesBadge({ sources, postsFound }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;
  return (
    <div className="mt-2 mb-1">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-saffron-subtle hover:bg-saffron/15 border border-saffron/20 rounded-full text-saffron-deep transition-colors font-mono tracking-wider">
        <span>📡</span>
        <span>GROUNDED IN {postsFound} REDDIT POSTS</span>
        <span className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 animate-slide-up">
          {sources.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 px-3 py-2 bg-paper-warm hover:bg-saffron-subtle border border-line rounded-xl transition-colors group">
              <span className="text-saffron text-xs shrink-0 mt-0.5 font-mono">↑{s.score}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-saffron-deep font-mono">{s.subreddit}</span>
                <p className="text-xs text-ink-soft leading-tight line-clamp-2 group-hover:text-ink">{s.title}</p>
              </div>
              <span className="text-ink-muted text-xs shrink-0 group-hover:text-saffron">→</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end animate-slide-up`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${
        isUser ? 'bg-ink text-paper' : 'bg-saffron-subtle border border-saffron/20'
      }`}>
        {isUser ? '👤' : '✈️'}
      </div>
      <div className={`max-w-[80%] ${isUser ? '' : 'flex-1'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-ink text-paper rounded-br-sm'
            : 'bg-white border border-line text-ink rounded-bl-sm shadow-warm-sm'
        }`}>
          <div className={`text-sm leading-relaxed`}>
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  strong: ({ children }) => <strong className="text-saffron-deep font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="mt-1 mb-1 space-y-0.5">{children}</ul>,
                  li: ({ children }) => <li className="flex items-start gap-1.5 text-ink-soft"><span className="text-saffron mt-1 shrink-0">›</span><span>{children}</span></li>,
                  p: ({ children }) => <p className="mb-1.5 last:mb-0 text-ink-soft">{children}</p>,
                }}
              >
                {message.content || ''}
              </ReactMarkdown>
            )}
          </div>
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-saffron rounded-sm animate-pulse ml-0.5 -mb-0.5" />
          )}
          <p className={`text-xs mt-1.5 font-mono ${isUser ? 'text-paper/40' : 'text-ink-muted'}`}>{message.time}</p>
        </div>
        {!isUser && message.redditSources && (
          <RedditSourcesBadge sources={message.redditSources} postsFound={message.redditPostsFound} />
        )}
      </div>
    </div>
  );
}

export default function ChatAgent({ itinerary, destination, shareId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm **Maya**, your AI travel concierge for **${destination}** ✈️

I have your full itinerary loaded. Ask me anything:
- 🏨 Specific hotel recommendations with prices
- 🍽️ Restaurant names near any location
- 🌧️ Rainy day alternatives
- 🚌 Exact transport routes & costs
- 💰 Budget breakdowns by category

What would you like to know?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const messagesEndRef              = useRef(null);
  const inputRef                    = useRef(null);
  const abortControllerRef          = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (content) => {
    const userMessage = content.trim();
    if (!userMessage || isLoading) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, time: now }]);
    setInput('');
    setIsLoading(true);

    const apiMessages = [...messages.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: userMessage }];
    const streamId    = Date.now();
    setMessages((prev) => [...prev, { id: streamId, role: 'assistant', content: '', isStreaming: true, time: now, redditSources: null }]);

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch(`${API_URL}/api/chat/message`, withAuth({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, itinerary, destination, shareId }),
        signal: abortControllerRef.current.signal,
      }));
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') break;
          let data;
          try { data = JSON.parse(dataStr); } catch (_) { continue; }

          if (data.error) {
            const msg = data.error.includes('rate_limit') || data.error.includes('429')
              ? 'Maya is a bit busy right now. Please wait a minute and try again.'
              : `Error: ${data.error}`;
            setMessages((prev) => prev.map((m) => m.id === streamId ? { ...m, content: msg, isStreaming: false } : m));
            setIsLoading(false); return;
          }
          if (data.type === 'reddit_sources') {
            setMessages((prev) => prev.map((m) => m.id === streamId ? { ...m, redditSources: data.sources, redditPostsFound: data.postsFound } : m));
            continue;
          }
          if (data.content) {
            accumulated += data.content;
            setMessages((prev) => prev.map((m) => m.id === streamId ? { ...m, content: accumulated } : m));
          }
        }
      }
      setMessages((prev) => prev.map((m) => m.id === streamId ? { ...m, isStreaming: false } : m));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => prev.map((m) =>
          m.id === streamId ? { ...m, content: `Sorry, I hit an error: ${err.message}. Please try again.`, isStreaming: false } : m
        ));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    setMessages((prev) => prev.map((m) => m.isStreaming ? { ...m, isStreaming: false } : m));
    setIsLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <p className="eyebrow mb-1">Your AI concierge</p>
        <h2 className="font-serif text-2xl font-semibold text-ink">Maya ✈️</h2>
        <p className="text-sm text-ink-muted mt-1">
          Personal travel guide for{' '}
          <span className="text-saffron font-medium">{destination}</span>
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border border-line rounded-2xl flex flex-col shadow-warm-sm" style={{ height: '580px' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {messages.map((msg, i) => <MessageBubble key={msg.id || i} message={msg} />)}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {isLoading && (
              <div className="px-5 pb-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-saffron-subtle border border-saffron/20 flex items-center justify-center text-sm shrink-0">✈️</div>
                <div className="flex gap-1 px-4 py-3 bg-paper-warm border border-line rounded-2xl rounded-bl-sm">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 bg-saffron rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-line p-4">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
                <input
                  ref={inputRef} type="text" value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Ask anything about ${destination}...`}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-paper-warm border border-line rounded-xl text-ink placeholder-ink-muted focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all text-sm disabled:opacity-50"
                />
                {isLoading ? (
                  <button type="button" onClick={stopGeneration}
                    className="px-4 py-3 bg-rose/90 hover:bg-rose text-white rounded-xl transition-colors text-sm font-medium shrink-0">■</button>
                ) : (
                  <button type="submit" disabled={!input.trim()}
                    className="px-5 py-3 bg-ink hover:bg-ink-soft text-paper rounded-xl transition-all duration-200 disabled:opacity-40 text-sm font-medium shrink-0">↑</button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Quick Questions Panel */}
        <div className="lg:w-60 shrink-0">
          <div className="bg-white border border-line rounded-2xl p-4 sticky top-32 shadow-warm-sm">
            <p className="eyebrow mb-3">Quick Questions</p>

            {/* Group Tabs */}
            <div className="flex gap-1 mb-3 overflow-x-auto">
              {SUGGESTION_GROUPS.map((g, i) => (
                <button key={i} onClick={() => setActiveGroup(i)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeGroup === i ? 'bg-saffron-subtle text-saffron-deep border border-saffron/20' : 'text-ink-muted hover:text-ink-soft'
                  }`}>
                  {g.icon}
                </button>
              ))}
            </div>

            <p className="text-xs text-ink-muted mb-2 font-sans">{SUGGESTION_GROUPS[activeGroup].label}</p>
            <div className="space-y-1.5">
              {SUGGESTION_GROUPS[activeGroup].questions.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} disabled={isLoading}
                  className="w-full text-left text-xs px-3 py-2.5 bg-paper-warm hover:bg-saffron-subtle border border-line hover:border-saffron/30 rounded-xl text-ink-muted hover:text-saffron-deep transition-all disabled:opacity-40 leading-relaxed font-sans">
                  {q}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-line">
              <div className="flex items-center gap-1.5 text-xs text-ink-muted font-mono">
                <span className="w-1.5 h-1.5 bg-jade rounded-full animate-pulse" />
                <span>Maya · Journeo AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
