'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import ItineraryDisplay from '../../components/ItineraryDisplay';
import ChatAgent from '../../components/ChatAgent';
import TravelEssentials from '../../components/TravelEssentials';
import WebRecommendations from '../../components/WebRecommendations';
import CollaborationPanel from '../../components/CollaborationPanel';
import TripChat from '../../components/TripChat';
import TravelBuddyPanel from '../../components/TravelBuddyPanel';
import PackingList from '../../components/PackingList';
import BudgetTracker from '../../components/BudgetTracker';
import RedditInsights from '../../components/RedditInsights';
import AuthModal from '../../components/AuthModal';
import { useAuth } from '../../context/AuthContext';
import { useFlag } from '../../context/FeatureFlagContext';
import { withAuth } from '../../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export default function ShareClient({ shareId }) {
  const { user } = useAuth();
  const groupChatEnabled = useFlag('group_chat');
  const buddyEnabled     = useFlag('travel_buddy');
  const budgetEnabled    = useFlag('budget_planner');
  const redditEnabled    = useFlag('reddit_insights');
  const mapsEnabled      = useFlag('google_maps');
  const collabEnabled    = useFlag('collaboration');
  const itineraryTabEnabled = useFlag('itinerary_tab');
  const essentialsEnabled   = useFlag('travel_essentials');
  const packingEnabled      = useFlag('packing_list');
  const resourcesEnabled    = useFlag('resources_tab');
  const chatEnabled         = useFlag('ai_chat');

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [copied, setCopied]       = useState(false);
  const [authOpen, setAuthOpen]   = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [collaboration, setCollaboration] = useState(null);
  const [enabling, setEnabling]   = useState(false);
  const lastModifiedRef           = useRef(null);
  const pendingActionRef          = useRef(null);

  useEffect(() => {
    if (!user || !pendingActionRef.current) return;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action === 'save') handleSave();
    else if (action === 'collaborate') handleEnableCollab();
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r    = await fetch(`${API_URL}/api/itinerary/share/${shareId}`, withAuth());
        const json = await r.json();
        if (!json.success) throw new Error(json.error || 'Not found');
        if (cancelled) return;
        setData(json);
        if (json.isOwner) setSaveStatus('owned');
        else if (json.isSaved) setSaveStatus('saved');
        else setSaveStatus('unsaved');
      } catch (err) { if (cancelled) return; setError(err.message); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [shareId]);

  const fetchCollab = useCallback(async () => {
    try {
      const r    = await fetch(`${API_URL}/api/collaborate/${shareId}`, withAuth());
      const json = await r.json();
      if (json.success && json.collaboration) {
        setCollaboration(json.collaboration);
        lastModifiedRef.current = json.collaboration.lastModified;
      }
    } catch { /* ignore */ }
  }, [shareId]);

  useEffect(() => { fetchCollab(); }, [fetchCollab]);

  useEffect(() => {
    if (!collaboration) return;
    const interval = setInterval(async () => {
      try {
        const r    = await fetch(`${API_URL}/api/collaborate/${shareId}/poll`, withAuth());
        const json = await r.json();
        if (json.success && json.lastModified && json.lastModified !== lastModifiedRef.current) fetchCollab();
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [shareId, collaboration, fetchCollab]);

  const handleEnableCollab = async () => {
    if (!user) { pendingActionRef.current = 'collaborate'; setAuthOpen(true); return; }
    setEnabling(true);
    try {
      const r    = await fetch(`${API_URL}/api/collaborate/${shareId}/enable`, withAuth({ method: 'POST' }));
      const json = await r.json();
      if (json.success) fetchCollab();
    } catch { /* ignore */ }
    setEnabling(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!user) { pendingActionRef.current = 'save'; setAuthOpen(true); return; }
    if (saving || saveStatus === 'owned') return;
    setSaving(true);
    try {
      const r    = await fetch(`${API_URL}/api/itinerary/${shareId}/save`, { method: 'POST', ...withAuth() });
      const json = await r.json();
      if (json.success) setSaveStatus(json.status);
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-8">
            <div className="h-3 w-24 bg-line rounded-full mb-3 shimmer" />
            <div className="h-10 w-72 bg-line rounded-xl mb-3 shimmer" />
            <div className="h-4 w-96 bg-line-soft rounded-lg shimmer" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-line shimmer" />
                  <div className="h-4 w-32 bg-line rounded-lg shimmer" />
                </div>
                <div className="h-3 w-full bg-line-soft rounded-lg mb-2 shimmer" />
                <div className="h-3 w-3/4 bg-line-soft rounded-lg shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="font-serif text-xl font-semibold text-ink mb-2">Itinerary Not Found</h2>
            <p className="text-ink-muted mb-6">{error}</p>
            <Link href="/" className="px-6 py-3 bg-ink hover:bg-ink-soft text-paper rounded-xl font-medium transition-colors">
              Plan a New Trip →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const itinerary   = data?.itinerary || null;
  const destination = data?.destination || itinerary?.destination || '';
  const travelStyle = data?.travelStyle || '';
  const views       = data?.views || 0;

  const isSaved = saveStatus === 'saved';

  const tabs = [
    ...(itineraryTabEnabled !== false ? [{ id: 'itinerary',  label: 'Itinerary'   }] : []),
    ...(essentialsEnabled !== false ? [{ id: 'essentials', label: 'Essentials'  }] : []),
    ...(packingEnabled !== false ? [{ id: 'packing',    label: 'Packing List' }] : []),
    ...(budgetEnabled ? [{ id: 'budget',       label: 'Budget'       }] : []),
    ...(redditEnabled ? [{ id: 'reddit',       label: 'Reddit'       }] : []),
    ...(resourcesEnabled !== false ? [{ id: 'resources',  label: 'Resources'   }] : []),
    ...(chatEnabled !== false ? [{ id: 'chat',       label: 'Ask Maya'    }] : []),
    ...(collabEnabled && collaboration && groupChatEnabled ? [{ id: 'group-chat',   label: 'Group Chat',   live: true }] : []),
    ...(buddyEnabled ? [{ id: 'travel-buddy', label: 'Travel Buddy', live: true }] : []),
  ];

  // If the active tab gets hidden by a flag (or defaults to one that's off),
  // fall back to the first tab that's actually visible.
  useEffect(() => {
    if (tabs.length && !tabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs.map((t) => t.id).join(',')]);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar onAuthClick={() => setAuthOpen(true)} rightContent={
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted hidden sm:inline font-mono">👁️ {views} views</span>

          {collabEnabled && saveStatus === 'owned' && !collaboration && (
            <button onClick={handleEnableCollab} disabled={enabling} title="Invite friends to vote, comment, and suggest changes"
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border bg-paper-warm text-ink-soft border-line hover:border-saffron/30 hover:text-saffron-deep transition-all disabled:opacity-50">
              {enabling ? '...' : '👥 Invite Group'}
            </button>
          )}
          {collaboration && (
            <span className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-saffron-subtle border border-saffron/20 text-saffron-deep font-mono">
              👥 {1 + (collaboration.collaborators?.length || 0)}
            </span>
          )}

          {saveStatus !== 'owned' && (
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition-all ${
                isSaved ? 'bg-jade-subtle text-jade border-jade/30' : 'bg-paper-warm text-ink-soft border-line hover:border-saffron/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}>
              {saving ? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" /> : <span>{isSaved ? '★' : '☆'}</span>}
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}

          <button onClick={handleCopy} title="Copy share link"
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition-all ${
              copied ? 'bg-jade-subtle text-jade border-jade/30' : 'bg-paper-warm text-ink-soft border-line hover:border-saffron/30'
            }`}>
            {copied ? '✓ Copied' : '🔗 Copy Link'}
          </button>
          <Link href="/" className="hidden sm:inline-flex text-sm px-3 py-2 rounded-xl bg-ink hover:bg-ink-soft text-paper border border-ink transition-all">
            Plan My Trip →
          </Link>
        </div>
      } />

      {/* Destination Banner */}
      <div className="relative bg-ink border-b border-ink-soft py-8 px-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="eyebrow text-saffron">Shared Itinerary</span>
                <span className="text-xs text-paper/30">·</span>
                <code className="text-xs text-paper/40 font-mono">{shareId}</code>
                {saveStatus === 'owned' && <span className="text-xs px-2 py-0.5 rounded-full bg-saffron-subtle border border-saffron/20 text-saffron-deep font-mono">Your trip</span>}
                {saveStatus === 'saved' && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-paper/60 font-mono">Saved</span>}
                {collaboration && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo/20 border border-indigo/30 text-indigo-light font-mono">Collaborative</span>}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-paper">
                {itinerary?.destination}<em className="text-saffron">.</em>
              </h1>
              {itinerary?.overview && (
                <p className="text-paper/60 mt-2 max-w-2xl text-sm leading-relaxed">{itinerary.overview}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Duration', value: `${itinerary?.totalDays} Days` },
                itinerary?.currency && { label: 'Currency', value: itinerary.currency },
                itinerary?.language && { label: 'Language', value: itinerary.language },
              ].filter(Boolean).map((s) => (
                <div key={s.label} className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-center min-w-[80px]">
                  <p className="text-[10px] text-paper/50 font-mono tracking-wider uppercase">{s.label}</p>
                  <p className="text-sm font-semibold text-paper mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Collaboration panel */}
      {collabEnabled && collaboration && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <CollaborationPanel collaboration={collaboration} shareId={shareId} isOwner={collaboration.isOwner} />
        </div>
      )}

      {/* Tabs */}
      <div className="sticky top-[61px] z-40 bg-paper/95 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 font-sans ${
                  activeTab === tab.id ? 'text-saffron border-saffron' : 'text-ink-muted hover:text-ink-soft border-transparent'
                }`}>
                <span>{tab.label}</span>
                {tab.live && <span className="ml-0.5 w-2 h-2 rounded-full bg-jade animate-pulse" />}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'itinerary'    && itineraryTabEnabled !== false && <ItineraryDisplay itinerary={itinerary} shareId={shareId} destination={destination} travelStyle={travelStyle} canEdit={saveStatus === 'owned'} collaboration={collabEnabled ? collaboration : null} userId={user?.id} onCollabUpdate={(updated) => setCollaboration(updated)} mapsEnabled={mapsEnabled} />}
        {activeTab === 'essentials'   && essentialsEnabled !== false && <TravelEssentials destination={destination} shareId={shareId} />}
        {activeTab === 'packing'      && packingEnabled !== false && <PackingList destination={destination} travelStyle={travelStyle} totalDays={itinerary?.totalDays} shareId={shareId} />}
        {activeTab === 'budget'       && <BudgetTracker destination={destination} travelStyle={travelStyle} totalDays={itinerary?.totalDays} shareId={shareId} />}
        {activeTab === 'reddit'       && <RedditInsights destination={destination} />}
        {activeTab === 'resources'    && resourcesEnabled !== false && <WebRecommendations destination={destination} />}
        {activeTab === 'chat'         && chatEnabled !== false && <ChatAgent itinerary={itinerary} destination={destination} shareId={shareId} />}
        {activeTab === 'group-chat'   && <TripChat shareId={shareId} collaboration={collaboration} />}
        {activeTab === 'travel-buddy' && buddyEnabled && <TravelBuddyPanel shareId={shareId} totalDays={data?.itinerary?.totalDays || 1} isOwner={saveStatus === 'owned'} />}
      </div>

      <footer className="border-t border-line py-6 px-4 text-center bg-white">
        <p className="text-sm text-ink-muted">
          This itinerary was generated by{' '}
          <Link href="/" className="text-saffron hover:text-saffron-deep font-medium">Journeo</Link>
        </p>
        <Link href="/" className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-ink hover:bg-ink-soft text-paper rounded-xl text-sm font-medium transition-colors">
          ✈️ Plan Your Own Trip
        </Link>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-ink-muted font-mono">
          <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
        </div>
      </footer>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab="login" />
    </div>
  );
}
