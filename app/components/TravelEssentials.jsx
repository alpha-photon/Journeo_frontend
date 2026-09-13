'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

function Section({ title, icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-warm-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-paper-warm transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-ink">{title}</span>
        </div>
        <span className={`text-ink-muted text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div className="px-5 pb-5 animate-slide-up">{children}</div>}
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <span className="text-saffron mt-0.5 shrink-0 font-bold">›</span>
          <span className="text-ink-soft leading-relaxed">{item}</span>
        </div>
      ))}
    </div>
  );
}

function Badge({ children, color = 'default' }) {
  const colors = {
    green:   'bg-jade-subtle text-jade border-jade/20',
    red:     'bg-rose-subtle text-rose border-rose/20',
    yellow:  'bg-marigold-subtle text-marigold-deep border-marigold/20',
    teal:    'bg-jade-subtle text-jade border-jade/20',
    default: 'bg-paper-warm text-ink-soft border-line',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.default}`}>
      {children}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-line rounded-2xl p-5 space-y-3">
          <div className="h-5 w-40 shimmer rounded" />
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((j) => <div key={j} className="h-4 shimmer rounded" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TravelEssentials({ destination, shareId }) {
  const [essentials, setEssentials] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [loaded, setLoaded]         = useState(false);

  const fetchEssentials = async () => {
    if (loaded) return;
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ destination });
      if (shareId) params.append('shareId', shareId);
      const res  = await fetch(`${API_URL}/api/travel/essentials?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setEssentials(data.essentials);
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEssentials(); }, [destination]);

  const safetyColor = (rating) => {
    if (!rating) return 'default';
    const r = rating.toLowerCase();
    if (r.includes('safe'))   return 'green';
    if (r.includes('caution') || r.includes('moderate')) return 'yellow';
    return 'red';
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="eyebrow mb-1">Destination guide</p>
        <h2 className="font-serif text-2xl font-semibold text-ink">Travel Essentials</h2>
        <p className="text-sm text-ink-muted mt-1">
          Visa, safety, money & culture guide for{' '}
          <span className="text-saffron font-medium">{destination}</span>
        </p>
      </div>

      {loading && (
        <div>
          <div className="bg-saffron-subtle border border-saffron/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-saffron/30 border-t-saffron rounded-full animate-spin shrink-0" />
            <p className="text-sm text-saffron-deep">Compiling travel intelligence...</p>
          </div>
          <LoadingSkeleton />
        </div>
      )}

      {error && (
        <div className="bg-rose-subtle border border-rose/30 rounded-2xl p-5">
          <p className="text-sm text-rose mb-3">⚠️ {error}</p>
          <button
            onClick={() => { setLoaded(false); fetchEssentials(); }}
            className="text-xs px-4 py-2 bg-rose/10 hover:bg-rose/20 text-rose rounded-lg transition-colors border border-rose/20"
          >Retry</button>
        </div>
      )}

      {essentials && !loading && (
        <div className="space-y-4">

          {/* Quick Facts Banner */}
          {essentials.quickFacts?.length > 0 && (
            <div className="bg-saffron-subtle border border-saffron/20 rounded-2xl p-5">
              <p className="eyebrow text-saffron-deep mb-3">Quick Facts</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {essentials.quickFacts.map((fact, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 text-xs text-ink-soft leading-relaxed border border-line shadow-warm-sm">
                    {fact}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visa */}
          <Section title="Visa Requirements" icon="🛂">
            <p className="text-sm text-ink-soft mb-4 leading-relaxed">{essentials.visa?.summary}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {essentials.visa?.onArrival?.length > 0 && (
                <div className="bg-jade-subtle border border-jade/20 rounded-xl p-3">
                  <p className="text-xs font-semibold text-jade mb-2 font-mono tracking-wider">✅ VISA ON ARRIVAL</p>
                  <p className="text-xs text-ink-muted">{essentials.visa.onArrival.slice(0, 5).join(', ')}{essentials.visa.onArrival.length > 5 ? ` +${essentials.visa.onArrival.length - 5} more` : ''}</p>
                </div>
              )}
              {essentials.visa?.eVisa?.length > 0 && (
                <div className="bg-indigo-subtle border border-indigo/20 rounded-xl p-3">
                  <p className="text-xs font-semibold text-indigo mb-2 font-mono tracking-wider">🌐 E-VISA AVAILABLE</p>
                  <p className="text-xs text-ink-muted">{essentials.visa.eVisa.slice(0, 5).join(', ')}{essentials.visa.eVisa.length > 5 ? ` +${essentials.visa.eVisa.length - 5} more` : ''}</p>
                </div>
              )}
              {essentials.visa?.required?.length > 0 && (
                <div className="bg-marigold-subtle border border-marigold/20 rounded-xl p-3">
                  <p className="text-xs font-semibold text-marigold-deep mb-2 font-mono tracking-wider">📋 VISA REQUIRED</p>
                  <p className="text-xs text-ink-muted">{essentials.visa.required.slice(0, 5).join(', ')}{essentials.visa.required.length > 5 ? ` +${essentials.visa.required.length - 5} more` : ''}</p>
                </div>
              )}
            </div>
            {essentials.visa?.tip && (
              <div className="flex items-start gap-2 bg-marigold-subtle border border-marigold/20 rounded-xl p-3">
                <span className="text-marigold shrink-0">💡</span>
                <p className="text-sm text-ink-soft">{essentials.visa.tip}</p>
              </div>
            )}
          </Section>

          {/* Safety */}
          <Section title="Safety & Security" icon="🛡️">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-ink-muted">Overall Rating:</span>
              <Badge color={safetyColor(essentials.safety?.overallRating)}>{essentials.safety?.overallRating}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {essentials.safety?.safeAreas?.length > 0 && (
                <div>
                  <p className="eyebrow text-jade mb-2">Safe Areas</p>
                  <ul className="space-y-1">
                    {essentials.safety.safeAreas.map((a, i) => (
                      <li key={i} className="text-sm text-ink-soft flex gap-2"><span className="text-jade font-bold">✓</span>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {essentials.safety?.avoidAreas?.length > 0 && (
                <div>
                  <p className="eyebrow text-rose mb-2">Avoid / Be Careful</p>
                  <ul className="space-y-1">
                    {essentials.safety.avoidAreas.map((a, i) => (
                      <li key={i} className="text-sm text-ink-soft flex gap-2"><span className="text-rose font-bold">✗</span>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {essentials.safety?.commonScams?.length > 0 && (
              <div className="bg-rose-subtle border border-rose/20 rounded-xl p-4 mb-4">
                <p className="eyebrow text-rose mb-2">⚠️ Common Scams</p>
                <ul className="space-y-1">
                  {essentials.safety.commonScams.map((s, i) => (
                    <li key={i} className="text-sm text-ink-soft">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {essentials.safety?.emergencyNumbers && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(essentials.safety.emergencyNumbers).map(([key, val]) => (
                  <div key={key} className="bg-paper-warm border border-line rounded-xl p-3 text-center">
                    <p className="text-[10px] font-mono text-ink-muted capitalize mb-1 tracking-wider">{key}</p>
                    <p className="text-sm font-bold text-ink">{val}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Money */}
          <Section title="Money & Budget" icon="💰">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Currency',     value: essentials.money?.currency },
                { label: 'Exchange Rate',value: essentials.money?.exchangeRate },
                { label: 'Cards',        value: essentials.money?.creditCardAcceptance },
                { label: 'Best Exchange',value: essentials.money?.bestWayToExchange },
              ].filter(v => v.value).map((s) => (
                <div key={s.label} className="bg-paper-warm border border-line rounded-xl p-3">
                  <p className="text-[10px] font-mono text-ink-muted mb-1 tracking-wider uppercase">{s.label}</p>
                  <p className="text-sm text-ink font-medium leading-snug">{s.value}</p>
                </div>
              ))}
            </div>
            {essentials.money?.budgetPerDay && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Budget',   value: essentials.money.budgetPerDay.budget,  border: 'border-jade/20',    bg: 'bg-jade-subtle',    text: 'text-jade' },
                  { label: 'Mid-range',value: essentials.money.budgetPerDay.mid,     border: 'border-saffron/20', bg: 'bg-saffron-subtle', text: 'text-saffron-deep' },
                  { label: 'Luxury',   value: essentials.money.budgetPerDay.luxury,  border: 'border-marigold/20',bg: 'bg-marigold-subtle',text: 'text-marigold-deep' },
                ].map((b) => (
                  <div key={b.label} className={`${b.bg} border ${b.border} rounded-xl p-3 text-center`}>
                    <p className="eyebrow mb-1">{b.label}</p>
                    <p className={`text-sm font-bold ${b.text}`}>{b.value}</p>
                    <p className="text-[10px] text-ink-muted font-mono mt-0.5">PER DAY</p>
                  </div>
                ))}
              </div>
            )}
            {essentials.money?.tippingCulture && (
              <div className="flex items-start gap-2 bg-marigold-subtle border border-marigold/20 rounded-xl p-3">
                <span className="text-marigold shrink-0">💡</span>
                <p className="text-sm text-ink-soft"><strong className="text-ink">Tipping:</strong> {essentials.money.tippingCulture}</p>
              </div>
            )}
          </Section>

          {/* Culture */}
          <Section title="Culture & Etiquette" icon="🎭">
            {essentials.culture?.dressCode && (
              <div className="bg-indigo-subtle border border-indigo/20 rounded-xl p-3 mb-4">
                <p className="eyebrow text-indigo mb-1">Dress Code</p>
                <p className="text-sm text-ink-soft">{essentials.culture.dressCode}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              {essentials.culture?.dos?.length > 0 && (
                <div>
                  <p className="eyebrow text-jade mb-2">Do's</p>
                  <InfoGrid items={essentials.culture.dos} />
                </div>
              )}
              {essentials.culture?.donts?.length > 0 && (
                <div>
                  <p className="eyebrow text-rose mb-2">Don'ts</p>
                  <div className="grid grid-cols-1 gap-2">
                    {essentials.culture.donts.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-rose mt-0.5 shrink-0 font-bold">✗</span>
                        <span className="text-ink-soft leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {essentials.culture?.religiousSites && (
              <div className="flex items-start gap-2 bg-paper-warm border border-line rounded-xl p-3">
                <span className="shrink-0">🕌</span>
                <p className="text-sm text-ink-soft">{essentials.culture.religiousSites}</p>
              </div>
            )}
          </Section>

          {/* Connectivity */}
          <Section title="SIM & Connectivity" icon="📱">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Best SIM', value: essentials.connectivity?.simCard },
                { label: 'eSIM',     value: essentials.connectivity?.esim },
                { label: 'WiFi',     value: essentials.connectivity?.wifiAvailability },
              ].filter(v => v.value).map((s) => (
                <div key={s.label} className="bg-paper-warm border border-line rounded-xl p-3">
                  <p className="text-[10px] font-mono text-ink-muted mb-1 tracking-wider uppercase">{s.label}</p>
                  <p className="text-sm text-ink-soft leading-snug">{s.value}</p>
                </div>
              ))}
            </div>
            {essentials.connectivity?.usefulApps?.length > 0 && (
              <div>
                <p className="eyebrow mb-2">Useful Apps</p>
                <div className="flex flex-wrap gap-2">
                  {essentials.connectivity.usefulApps.map((app, i) => (
                    <span key={i} className="px-3 py-1.5 bg-paper-warm border border-line rounded-full text-xs text-ink-soft font-sans">{app}</span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Health */}
          <Section title="Health & Medical" icon="🏥">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {essentials.health?.vaccinations?.length > 0 && (
                <div>
                  <p className="eyebrow text-jade mb-2">Recommended Vaccines</p>
                  <div className="flex flex-wrap gap-1.5">
                    {essentials.health.vaccinations.map((v, i) => (
                      <Badge key={i} color="teal">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {essentials.health?.waterSafety && (
                  <div className="flex items-start gap-2 bg-paper-warm border border-line rounded-xl p-3">
                    <span className="shrink-0">💧</span>
                    <p className="text-sm text-ink-soft"><strong className="text-ink">Water:</strong> {essentials.health.waterSafety}</p>
                  </div>
                )}
                {essentials.health?.travelInsurance && (
                  <div className="flex items-start gap-2 bg-paper-warm border border-line rounded-xl p-3">
                    <span className="shrink-0">🛡️</span>
                    <p className="text-sm text-ink-soft"><strong className="text-ink">Insurance:</strong> {essentials.health.travelInsurance}</p>
                  </div>
                )}
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
