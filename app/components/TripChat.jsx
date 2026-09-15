'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { withAuth } from '../../lib/auth';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function TripChat({ shareId, collaboration }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState({}); // userId -> email
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const stopTypingTimer = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history
  useEffect(() => {
    if (!user || !shareId) return;
    fetch(`${API_URL}/api/collaborate/${shareId}/chat`, withAuth())
      .then((r) => r.json())
      .then((data) => { if (data.success) setMessages(data.messages || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shareId, user]);

  // Connect Socket.io
  useEffect(() => {
    if (!user || !shareId) return;

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('iteranary_token')
      : null;

    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_trip', shareId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTypingUsers((prev) => { const next = { ...prev }; delete next[msg.userId]; return next; });
    });

    socket.on('user_typing', ({ userId, email }) => {
      if (userId === user.id) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: email }));
    });

    socket.on('user_stop_typing', ({ userId }) => {
      setTypingUsers((prev) => { const next = { ...prev }; delete next[userId]; return next; });
    });

    return () => {
      socket.emit('leave_trip', shareId);
      socket.disconnect();
      socketRef.current = null;
      clearTimeout(stopTypingTimer.current);
    };
  }, [shareId, user]);

  const onChangeInput = (e) => {
    setInput(e.target.value);
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing', { shareId });
    clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(() => socketRef.current?.emit('stop_typing', { shareId }), 2000);
  };

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || !socketRef.current?.connected) return;
    socketRef.current.emit('chat_message', { shareId, text });
    socketRef.current.emit('stop_typing', { shareId });
    clearTimeout(stopTypingTimer.current);
    setInput('');
    inputRef.current?.focus();
  }, [input, shareId]);

  const typingNames = Object.values(typingUsers).map((e) => e?.split('@')[0] || 'Someone');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <span className="text-4xl mb-3">💬</span>
        <p className="text-slate-300 font-medium mb-1">Sign in to chat</p>
        <p className="text-sm text-slate-500">Group chat is available to trip members.</p>
      </div>
    );
  }

  // Group messages by date for date separators
  const grouped = [];
  let lastDate = null;
  for (const msg of messages) {
    const dateLabel = formatDate(msg.createdAt);
    if (dateLabel !== lastDate) {
      grouped.push({ type: 'separator', label: dateLabel, key: `sep-${dateLabel}` });
      lastDate = dateLabel;
    }
    grouped.push({ type: 'message', msg, key: msg._id || `${msg.userId}-${msg.createdAt}` });
  }

  return (
    <div className="flex flex-col h-[500px] lg:h-[600px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <span className="text-sm font-semibold text-slate-200">Group Chat</span>
          <span className="text-xs text-slate-600">
            · {1 + (collaboration?.collaborators?.length || 0)} member{(1 + (collaboration?.collaborators?.length || 0)) !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-teal-400' : 'bg-slate-600'}`} />
          <span className="text-xs text-slate-500">{connected ? 'Live' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <span className="text-4xl">👋</span>
            <div>
              <p className="text-slate-300 font-medium text-sm">No messages yet</p>
              <p className="text-xs text-slate-500 mt-1">Start the conversation with your trip group!</p>
            </div>
          </div>
        ) : (
          grouped.map((item) => {
            if (item.type === 'separator') {
              return (
                <div key={item.key} className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider shrink-0">
                    {item.label}
                  </span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
              );
            }

            const { msg } = item;
            const isMe = msg.userId === user.id;
            const name = msg.email?.split('@')[0] || 'Unknown';
            const initial = (msg.email || '?')[0].toUpperCase();

            return (
              <div
                key={item.key}
                className={`flex gap-2 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {!isMe && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mb-0.5">
                    {initial}
                  </div>
                )}

                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {/* Sender name — only for others, only on first of a group */}
                  {!isMe && (
                    <span className="text-[10px] text-slate-500 px-1">{name}</span>
                  )}

                  {/* Bubble */}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                      isMe
                        ? 'bg-teal-600 text-white rounded-br-sm'
                        : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Time */}
                  <span className="text-[10px] text-slate-600 px-1">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="px-4 pb-1 shrink-0">
          <p className="text-[11px] text-slate-500 italic">
            {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
          </p>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={onChangeInput}
            onKeyDown={handleKeyDown}
            placeholder="Message the group… (Enter to send)"
            rows={1}
            maxLength={500}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/60 resize-none leading-snug max-h-28 overflow-y-auto transition-colors"
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px';
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || !connected}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send message"
          >
            <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-1.5 text-right">{input.length}/500</p>
      </div>
    </div>
  );
}
