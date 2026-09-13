'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import { useFlag } from './context/FeatureFlagContext';
import AuthModal from './components/AuthModal';
import { withAuth } from '../lib/auth';
import Navbar from './components/Navbar';
import ItineraryForm from './components/ItineraryForm';
import ItineraryDisplay from './components/ItineraryDisplay';
import RedditInsights from './components/RedditInsights';
import WebRecommendations from './components/WebRecommendations';
import ChatAgent from './components/ChatAgent';
import TravelEssentials from './components/TravelEssentials';
import PackingList from './components/PackingList';
import PDFExport from './components/PDFExport';
import BudgetTracker from './components/BudgetTracker';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const LOADING_STEPS = [
  { id: 1, label: 'Researching Sources',      defaultMsg: 'Fetching Wikivoyage guide + Reddit trip reports...' },
  { id: 2, label: 'Synthesizing Itinerary',   defaultMsg: 'Grounding with real traveler data...' },
  { id: 3, label: 'Saving to Cloud',          defaultMsg: 'Saving your trip to MongoDB...' },
];

/* ── tiny icon helpers ── */
function IconCheck({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconArrowRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

export default function Home() {
  const [stage, setStage]           = useState('form');
  const [itinerary, setItinerary]   = useState(null);
  const [destination, setDestination] = useState('');
  const [shareId, setShareId]       = useState(null);
  const [formData, setFormData]     = useState(null);
  const [activeTab, setActiveTab]   = useState('itinerary');
  const [copied, setCopied]         = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(
    LOADING_STEPS.map((s) => ({ ...s, status: 'waiting', message: s.defaultMsg }))
  );
  const [authOpen, setAuthOpen]   = useState(false);
  const [authTab, setAuthTab]     = useState('login');

  const { user, logout, effectiveUserId } = useAuth();
  const budgetEnabled = useFlag('budget_planner');
  const redditEnabled = useFlag('reddit_insights');
  const mapsEnabled = useFlag('google_maps');
  const itineraryTabEnabled = useFlag('itinerary_tab');
  const essentialsEnabled = useFlag('travel_essentials');
  const packingEnabled = useFlag('packing_list');
  const resourcesEnabled = useFlag('resources_tab');
  const chatEnabled = useFlag('ai_chat');

  const TABS = [
    ...(itineraryTabEnabled !== false ? [{ id: 'itinerary',  label: 'Itinerary'  }] : []),
    ...(essentialsEnabled !== false ? [{ id: 'essentials', label: 'Essentials' }] : []),
    ...(packingEnabled !== false ? [{ id: 'packing',    label: 'Packing List' }] : []),
    ...(budgetEnabled ? [{ id: 'budget',  label: 'Budget' }] : []),
    ...(redditEnabled ? [{ id: 'reddit',  label: 'Reddit Insights' }] : []),
    ...(resourcesEnabled !== false ? [{ id: 'resources',  label: 'Resources' }] : []),
    ...(chatEnabled !== false ? [{ id: 'chat',       label: 'Ask Maya' }] : []),
  ];

  // Whichever tab is first in the (flag-filtered) list — used whenever we need
  // to land on "the default tab" without assuming 'itinerary' is enabled.
  const defaultTabId = TABS[0]?.id || 'itinerary';

  // If the active tab gets hidden by a flag (or defaults to one that's off),
  // fall back to the first tab that's actually visible.
  useEffect(() => {
    if (TABS.length && !TABS.some((t) => t.id === activeTab)) {
      setActiveTab(TABS[0].id);
    }
  }, [TABS.map((t) => t.id).join(',')]);

  const markStep = (stepId, status, message) =>
    setLoadingSteps((prev) =>
      prev.map((s) => s.id === stepId ? { ...s, status, message: message || s.defaultMsg } : s)
    );

  const handleGenerate = async (data) => {
    setFormData(data);
    setDestination(data.destination);
    setLoadingSteps(LOADING_STEPS.map((s) => ({ ...s, status: 'waiting', message: s.defaultMsg })));
    setStage('loading');

    try {
      const response = await fetch(`${API_URL}/api/itinerary/generate`,
        withAuth({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      );
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE events can be split across network chunks — only process
        // complete lines, keep any trailing partial line for the next read.
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          let evt;
          try { evt = JSON.parse(dataStr); } catch (_) { continue; }

          if (evt.type === 'step') {
            for (let i = 1; i < evt.step; i++) markStep(i, 'done');
            markStep(evt.step, 'active', evt.message);
          } else if (evt.type === 'complete') {
            LOADING_STEPS.forEach((s) => markStep(s.id, 'done'));
            setItinerary(evt.itinerary);
            setShareId(evt.shareId);
            if (effectiveUserId)
              fetch(`${API_URL}/api/passport/${effectiveUserId}/ping`, { method: 'POST' }).catch(() => {});
            setTimeout(() => { setStage('results'); setActiveTab(defaultTabId); }, 600);
          } else if (evt.type === 'error') {
            const msg = evt.message?.includes('rate_limit') || evt.message?.includes('429')
              ? 'Our AI is a bit busy right now. Please wait a minute and try again.'
              : evt.message;
            alert(`Generation failed: ${msg}`);
            setStage('form');
            return;
          }
        }
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
      setStage('form');
    }
  };

  const handleReset = () => {
    setStage('form'); setItinerary(null); setDestination('');
    setShareId(null); setFormData(null); setActiveTab(defaultTabId);
  };

  const handleCopyShare = async () => {
    if (!shareId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/share/${shareId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar
        onAuthClick={(tab) => { setAuthTab(tab); setAuthOpen(true); }}
        rightContent={
          stage === 'results' ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-jade-subtle border border-jade-light rounded-full">
                <span className="w-2 h-2 bg-jade rounded-full animate-pulse" />
                <span className="text-sm text-jade font-medium truncate max-w-[150px] font-mono">{destination}</span>
              </div>
              {shareId && (
                <button
                  onClick={handleCopyShare}
                  className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition-all duration-200 ${
                    copied
                      ? 'bg-jade-subtle text-jade border-jade-light'
                      : 'bg-paper-warm text-ink-soft border-line hover:border-ink-muted hover:text-ink'
                  }`}
                >
                  {copied ? <IconCheck size={14} /> : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  )}
                  <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
                </button>
              )}
              <button
                onClick={handleReset}
                className="text-sm px-3 py-2 rounded-xl bg-ink hover:bg-ink-soft text-paper border border-transparent transition-all duration-200"
              >
                + New Trip
              </button>
            </div>
          ) : null
        }
      />

      <main>
        {/* ════════════════════════════════
            FORM — Hero landing page
            ════════════════════════════════ */}
        {stage === 'form' && (
          <div className="animate-fade-in">

            {/* ── Hero ── */}
            <section className="relative overflow-hidden px-4 pt-16 pb-14 sm:pt-28 sm:pb-20">
              {/* Warm background wash */}
              <div className="absolute inset-0 bg-gradient-to-b from-saffron-subtle via-paper to-paper pointer-events-none" />
              {/* Decorative blobs */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-marigold-subtle rounded-full blur-3xl opacity-60 pointer-events-none -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-jade-subtle rounded-full blur-3xl opacity-50 pointer-events-none translate-y-1/2 -translate-x-1/4" />

              <div className="relative max-w-3xl mx-auto text-center">
                {/* Badge */}
                <div className="animate-slide-down inline-flex items-center gap-2 px-4 py-1.5 bg-saffron-subtle border border-saffron-light rounded-full text-saffron-deep text-xs font-mono mb-8 tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 bg-saffron rounded-full animate-pulse-soft" />
                  Free · No sign-up required
                </div>

                {/* Headline — serif editorial style */}
                <h1 className="font-serif text-[2.8rem] sm:text-[4.5rem] font-semibold mb-5 leading-[1.05] tracking-tight text-ink">
                  Plan less.{' '}
                  <em className="text-saffron not-italic">Wander</em>
                  <br className="hidden sm:block" />
                  {' '}more.
                </h1>

                {/* Sub-headline */}
                <p className="text-base sm:text-lg text-ink-muted mb-6 max-w-xl mx-auto leading-relaxed font-sans">
                  Tell us where you're going. Get a complete, day-by-day itinerary built from{' '}
                  <span className="text-ink font-medium">real traveler data</span> — instantly.
                </p>

                {/* Trust pills */}
                <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
                  {['Reddit insights', 'Packing list', 'Ask Maya AI', 'Group trips'].map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-line rounded-full text-xs text-ink-muted font-sans shadow-warm-sm">
                      <span className="w-1.5 h-1.5 bg-saffron rounded-full" />
                      {t}
                    </span>
                  ))}
                </div>

                {/* The form */}
                <ItineraryForm onSubmit={handleGenerate} />

                {/* Sample destinations */}
                <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-xs text-ink-muted font-mono tracking-wider">POPULAR:</span>
                  {[
                    { e: '🗼', d: 'Paris' }, { e: '🏝️', d: 'Bali' }, { e: '⛩️', d: 'Tokyo' },
                    { e: '🏔️', d: 'Manali' }, { e: '🏛️', d: 'Rome' }, { e: '🌆', d: 'Udaipur' },
                  ].map(({ e, d }) => (
                    <button
                      key={d}
                      onClick={() => {
                        const input = document.querySelector('input[placeholder*="Tokyo"]');
                        if (input) {
                          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                          nativeInputValueSetter.call(input, d);
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                          input.focus();
                        }
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-white border border-line text-ink-muted hover:border-saffron/50 hover:text-saffron-deep hover:bg-saffron-subtle transition-all duration-200 shadow-warm-sm"
                    >
                      {e} {d}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── How it works ── */}
            <section className="max-w-4xl mx-auto px-4 pb-16">
              <div className="text-center mb-10">
                <p className="eyebrow mb-3">How it works</p>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">Ready in 3 simple steps</h2>
                <div className="section-divider mt-3" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 stagger">
                {[
                  { n: '01', title: 'Enter your trip',       desc: 'Destination, dates, travel style, and budget. That\'s all we need.' },
                  { n: '02', title: 'AI builds your plan',   desc: 'We research Reddit, Wikivoyage & travel guides to build a hyper-specific itinerary.' },
                  { n: '03', title: 'Get everything',        desc: 'Full itinerary, packing list, essentials, budget tracker, and AI chat — all in one.' },
                ].map((item) => (
                  <div key={item.n} className="step-card animate-slide-up">
                    <div className="w-12 h-12 rounded-2xl bg-ink flex items-center justify-center shrink-0">
                      <span className="font-mono text-sm font-semibold text-saffron">{item.n}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink mb-1 font-sans">{item.title}</h3>
                      <p className="text-sm text-ink-muted leading-relaxed font-sans">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Features ── */}
            <section className="max-w-5xl mx-auto px-4 pb-16">
              <div className="text-center mb-10">
                <p className="eyebrow mb-3">What's included</p>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">Everything a traveler needs</h2>
                <div className="section-divider mt-3" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
                {[
                  { title: 'Day-by-Day Itinerary', points: ['Morning, afternoon & evening slots', 'Real place names with entry fees', 'Swap any activity with AI'],   accent: 'text-saffron' },
                  { title: 'Travel Essentials',    points: ['Visa requirements & safety tips', 'Emergency numbers & hospitals', 'Currency, language, etiquette'],       accent: 'text-jade' },
                  { title: 'Smart Packing List',   points: ['Tailored to destination & style', 'Interactive checkboxes', 'Climate & activity aware'],                    accent: 'text-indigo' },
                  { title: 'Reddit Insights',      points: ['Real traveler experiences', 'Hidden gems & local warnings', 'Summarized from r/travel'],                    accent: 'text-rose' },
                  { title: 'Ask Maya (AI Chat)',   points: ['Ask any trip question', 'Hotel, food & activity recs', 'Knows your full itinerary'],                        accent: 'text-marigold' },
                  { title: 'Group Trips',          points: ['Invite friends to collaborate', 'Vote, comment & suggest', 'Real-time group chat'],                          accent: 'text-indigo' },
                ].map((card) => (
                  <div key={card.title} className="feature-card animate-slide-up">
                    <h3 className={`font-semibold text-sm mb-3 font-sans ${card.accent}`}>{card.title}</h3>
                    <ul className="space-y-2">
                      {card.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-xs text-ink-muted font-sans">
                          <span className="text-saffron shrink-0 mt-0.5 font-bold">›</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Stats strip ── */}
            <section className="border-y border-line bg-white py-10 mb-0">
              <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                {[
                  { v: '27K+',   l: 'Reddit reports' },
                  { v: '10s',    l: 'Avg. generation' },
                  { v: '150+',   l: 'Destinations' },
                  { v: 'Free',   l: 'Always' },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="stat-number">{s.v}</div>
                    <div className="text-xs text-ink-muted font-mono tracking-wider mt-1.5 uppercase">{s.l}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="max-w-2xl mx-auto px-4 py-16">
              <div className="relative overflow-hidden rounded-2xl border border-line px-6 py-12 text-center bg-ink">
                {/* warm glow inside dark card */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-saffron/15 rounded-full blur-2xl pointer-events-none" />
                <div className="relative">
                  <p className="font-serif text-3xl font-semibold text-paper mb-2">Where to next?</p>
                  <p className="text-ink-muted text-sm mb-8 font-sans" style={{ color: 'rgba(250,246,238,0.6)' }}>
                    Join thousands of travelers planning smarter with Journeo.
                  </p>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-saffron hover:bg-saffron-deep text-white font-semibold rounded-xl transition-all duration-200 shadow-saffron hover:shadow-saffron-lg hover:-translate-y-0.5 text-sm font-sans"
                  >
                    Plan My Trip — It's Free
                    <IconArrowRight size={15} />
                  </button>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ════════════════════════════════
            LOADING
            ════════════════════════════════ */}
        {stage === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[72vh] px-4 animate-fade-in">
            {/* Animated compass */}
            <div className="relative w-20 h-20 mb-10">
              <div className="absolute inset-0 rounded-full border-2 border-line" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-saffron animate-spin" />
              <div className="absolute inset-3 rounded-full bg-white border border-line flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#F97316" stroke="none"/>
                </svg>
              </div>
            </div>

            <p className="eyebrow mb-3">Building your trip</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-1 text-center">
              Reading <em className="text-saffron">real</em>
              <br className="sm:hidden" /> trip reports.
            </h2>
            <p className="text-ink-muted text-sm font-sans mb-8">
              Planning{' '}
              <span className="font-medium text-ink">{destination}</span>
            </p>

            <div className="w-full max-w-sm space-y-3">
              {loadingSteps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-500 ${
                    step.status === 'active'
                      ? 'bg-saffron-subtle border-saffron/40 shadow-saffron'
                      : step.status === 'done'
                      ? 'bg-white border-line'
                      : 'bg-paper-warm border-line opacity-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    step.status === 'done'
                      ? 'bg-jade text-white'
                      : step.status === 'active'
                      ? 'bg-saffron text-white'
                      : 'bg-line text-ink-muted'
                  }`}>
                    {step.status === 'done' ? (
                      <IconCheck size={16} />
                    ) : step.status === 'active' ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="font-mono text-xs font-semibold">{step.id}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-sm font-semibold font-sans ${
                      step.status === 'active' ? 'text-saffron-deep' : step.status === 'done' ? 'text-ink-soft' : 'text-ink-muted'
                    }`}>
                      {step.label}
                    </p>
                    <p className={`text-xs truncate font-sans ${
                      step.status === 'active' ? 'text-ink-muted' : 'text-ink-muted opacity-60'
                    }`}>
                      {step.message}
                    </p>
                  </div>
                  {step.status === 'active' && (
                    <div className="flex gap-0.5 shrink-0">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-saffron animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs text-ink-muted font-mono tracking-wider">THIS USUALLY TAKES 15–30 SECONDS</p>
          </div>
        )}

        {/* ════════════════════════════════
            RESULTS
            ════════════════════════════════ */}
        {stage === 'results' && itinerary && (
          <div className="animate-fade-in">

            {/* Destination Banner */}
            <div className="relative bg-ink border-b border-ink-soft px-4 pt-10 pb-8">
              {/* subtle warm glow top-right */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-7xl mx-auto relative">
                {/* Top row */}
                <div className="flex items-center justify-between mb-4">
                  <p className="eyebrow text-saffron">Your Itinerary</p>
                  {shareId && (
                    <button
                      onClick={handleCopyShare}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all font-sans ${
                        copied
                          ? 'bg-jade-subtle text-jade border-jade-light'
                          : 'bg-white/10 text-paper/70 border-white/20 hover:text-paper hover:border-white/40'
                      }`}
                    >
                      {copied ? <IconCheck size={12} /> : '🔗'}
                      <span>{copied ? 'Copied!' : 'Copy share link'}</span>
                    </button>
                  )}
                </div>

                {/* Destination name */}
                <h2 className="font-serif text-4xl sm:text-6xl font-semibold text-paper tracking-tight leading-none mb-1">
                  {itinerary.destination}
                  <em className="text-saffron">.</em>
                </h2>
                {itinerary.country && itinerary.country !== itinerary.destination && (
                  <p className="text-paper/50 text-sm mt-1 font-mono tracking-wider uppercase">{itinerary.country}</p>
                )}

                {/* Overview */}
                {itinerary.overview && (
                  <p className="text-paper/70 text-sm leading-relaxed max-w-3xl mt-4 mb-6 font-sans">{itinerary.overview}</p>
                )}

                {/* Stats pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { label: 'Duration',  value: `${itinerary.totalDays} Days` },
                    itinerary.bestTimeToVisit && { label: 'Best Time', value: itinerary.bestTimeToVisit.replace(/^The best time to visit [^,.]+ is /, '').split('.')[0] },
                    itinerary.currency && { label: 'Currency', value: itinerary.currency },
                    itinerary.language && { label: 'Language', value: itinerary.language },
                    itinerary.timezone && { label: 'Timezone', value: itinerary.timezone },
                    itinerary.visaInfo  && { label: 'Visa',     value: itinerary.visaInfo.split('.')[0] },
                  ].filter(Boolean).map((s) => (
                    <div key={s.label} className="shrink-0 bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 flex items-center gap-2.5 backdrop-blur-sm">
                      <div>
                        <p className="text-[10px] text-paper/50 leading-none mb-0.5 font-mono tracking-wider uppercase">{s.label}</p>
                        <p className="text-sm font-semibold text-paper leading-none whitespace-nowrap max-w-[180px] truncate font-sans">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action row */}
                {shareId && (
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-paper/40 font-mono">SAVED:</span>
                      <code className="text-xs bg-white/10 px-2.5 py-1 rounded-lg text-paper/60 border border-white/15 font-mono">/share/{shareId}</code>
                    </div>
                    <PDFExport itinerary={itinerary} destination={destination} />
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-[61px] z-40 bg-paper/95 backdrop-blur-md border-b border-line">
              <div className="max-w-7xl mx-auto px-4">
                <nav className="flex gap-0.5 overflow-x-auto scrollbar-hide">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 font-sans ${
                        activeTab === tab.id
                          ? 'text-saffron border-saffron'
                          : 'text-ink-muted hover:text-ink-soft border-transparent hover:border-line'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
              {activeTab === 'itinerary'  && itineraryTabEnabled !== false && <ItineraryDisplay itinerary={itinerary} shareId={shareId} destination={destination} travelStyle={formData?.travelStyle} canEdit mapsEnabled={mapsEnabled} />}
              {activeTab === 'essentials' && essentialsEnabled !== false && <TravelEssentials destination={destination} shareId={shareId} />}
              {activeTab === 'packing'    && packingEnabled !== false && <PackingList destination={destination} days={itinerary.totalDays} travelStyle={formData?.travelStyle} shareId={shareId} />}
              {activeTab === 'budget'     && <BudgetTracker shareId={shareId} destination={destination} numDays={itinerary.totalDays} suggestedBudgetPerDay={formData?.budgetPerDay ? parseFloat(formData.budgetPerDay) : null} />}
              {activeTab === 'reddit'     && <RedditInsights destination={destination} />}
              {activeTab === 'resources'  && resourcesEnabled !== false && <WebRecommendations destination={destination} />}
              {activeTab === 'chat'       && chatEnabled !== false && <ChatAgent itinerary={itinerary} destination={destination} shareId={shareId} />}
            </div>
          </div>
        )}
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />

      {stage === 'form' && (
        <footer className="border-t border-line py-6 px-4 text-center text-ink-muted text-xs font-mono tracking-wider bg-white">
          JOURNEO © {new Date().getFullYear()} · AI TRAVEL PLANNER
        </footer>
      )}
    </div>
  );
}
