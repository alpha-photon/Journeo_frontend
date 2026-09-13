'use client';

import { useState } from 'react';
import { withAuth } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const STYLE_COLORS = {
  budget:    { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400'  },
  luxury:    { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  adventure: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  family:    { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400'   },
  romantic:  { bg: 'bg-pink-500/10',   border: 'border-pink-500/30',   text: 'text-pink-400'   },
  balanced:  { bg: 'bg-teal-500/10',   border: 'border-teal-500/30',   text: 'text-teal-400'   },
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function avatarInitial(name) {
  return (name || '?')[0].toUpperCase();
}

function avatarColor(name) {
  const colors = ['bg-teal-600', 'bg-purple-600', 'bg-orange-600', 'bg-pink-600', 'bg-blue-600', 'bg-green-600'];
  let hash = 0;
  for (const c of (name || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

// request: { status, direction, requestId } | null
export default function BuddyCard({ match, fromShareId, onRequestSent, onReport }) {
  const [sending, setSending]     = useState(false);
  const [message, setMessage]     = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportText, setReportText] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [localRequest, setLocalRequest] = useState(match.request);

  const style = STYLE_COLORS[match.travelStyle?.toLowerCase()] || STYLE_COLORS.balanced;

  const handleSendRequest = async () => {
    if (!message.trim() && !showForm) { setShowForm(true); return; }
    setSending(true);
    try {
      const r = await fetch(`${API_URL}/api/travel-buddy/request`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromShareId, toShareId: match.shareId, message: message.trim() }),
      }));
      const data = await r.json();
      if (data.success) {
        setLocalRequest({ status: 'pending', direction: 'sent', requestId: data.request._id });
        setShowForm(false);
        onRequestSent?.();
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  const handleReport = async () => {
    if (!reportText.trim()) return;
    setReporting(true);
    try {
      await fetch(`${API_URL}/api/travel-buddy/report`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedShareId: match.shareId, reason: reportText.trim() }),
      }));
      onReport?.(match.shareId);
    } catch { /* ignore */ }
    setReporting(false);
    setShowReport(false);
  };

  const RequestButton = () => {
    if (!localRequest) {
      return (
        <button
          onClick={handleSendRequest}
          disabled={sending}
          className="flex-1 py-2 rounded-xl bg-teal-600/10 hover:bg-teal-600 border border-teal-500/30 hover:border-teal-500 text-teal-400 hover:text-white text-sm font-medium transition-all duration-200 disabled:opacity-50"
        >
          {sending ? '...' : showForm ? 'Send' : '👋 Say Hi'}
        </button>
      );
    }
    if (localRequest.direction === 'sent') {
      const label = localRequest.status === 'accepted' ? '✓ Connected!' : localRequest.status === 'rejected' ? '✗ Declined' : '⏳ Pending';
      const cls = localRequest.status === 'accepted' ? 'text-teal-400 border-teal-500/30 bg-teal-500/10' : localRequest.status === 'rejected' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-slate-400 border-slate-700 bg-slate-800';
      return (
        <span className={`flex-1 flex items-center justify-center py-2 rounded-xl border text-sm font-medium ${cls}`}>
          {label}
        </span>
      );
    }
    // Received a request
    return (
      <span className="flex-1 flex items-center justify-center py-2 rounded-xl border text-sm font-medium text-purple-400 border-purple-500/30 bg-purple-500/10">
        📩 Wants to meet!
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-200">
      {/* Travel style color band */}
      <div className={`h-1 w-full ${STYLE_COLORS[match.travelStyle?.toLowerCase()]?.bg?.replace('/10', '') || 'bg-teal-500'}`}
        style={{ height: '3px', background: match.travelStyle === 'adventure' ? '#f97316' : match.travelStyle === 'luxury' ? '#eab308' : match.travelStyle === 'romantic' ? '#ec4899' : match.travelStyle === 'family' ? '#3b82f6' : match.travelStyle === 'budget' ? '#22c55e' : '#14b8a6' }}
      />

      <div className="p-4">
        {/* Avatar + name + destination */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full ${avatarColor(match.displayName)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {avatarInitial(match.displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-100 text-sm truncate">{match.displayName}</p>
            <p className="text-xs text-slate-500 truncate">✈️ {match.destination}</p>
          </div>
          <button
            onClick={() => setShowReport(!showReport)}
            className="text-slate-700 hover:text-red-400 text-xs transition-colors p-1"
            title="Report this user"
          >
            ⚑
          </button>
        </div>

        {/* Dates + days */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
            📅 {fmtDate(match.startDate)} – {fmtDate(match.endDate)}
          </span>
          <span className="text-xs text-slate-500">
            {match.totalDays} day{match.totalDays !== 1 ? 's' : ''}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${style.bg} ${style.border} ${style.text}`}>
            {match.travelStyle}
          </span>
        </div>

        {/* Bio */}
        {match.bio && (
          <p className="text-xs text-slate-400 leading-relaxed mb-3 bg-slate-800/40 rounded-xl px-3 py-2 border border-slate-800">
            "{match.bio}"
          </p>
        )}

        {/* Message input (shown after first click) */}
        {showForm && !localRequest && (
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            placeholder="Write a short intro — where you're from, what you're excited about... (optional)"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 resize-none mb-3 focus:outline-none focus:border-teal-500/50"
            rows={2}
          />
        )}

        {/* Report form */}
        {showReport && (
          <div className="mb-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
            <p className="text-xs text-red-400 mb-2 font-medium">Report this listing</p>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Reason for report..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 resize-none mb-2 focus:outline-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button onClick={handleReport} disabled={reporting || !reportText.trim()} className="text-xs px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50">
                {reporting ? 'Reporting...' : 'Submit'}
              </button>
              <button onClick={() => setShowReport(false)} className="text-xs px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-lg hover:text-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <RequestButton />
          {showForm && !localRequest && (
            <button
              onClick={() => { setShowForm(false); setMessage(''); }}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
