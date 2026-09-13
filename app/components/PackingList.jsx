'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

export default function PackingList({ destination, days, travelStyle, shareId }) {
  const [packingList, setPackingList] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [loaded, setLoaded]           = useState(false);
  const [checked, setChecked]         = useState({});
  const [progress, setProgress]       = useState(0);

  const fetchPackingList = async () => {
    if (loaded) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/travel/packing`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, days, travelStyle, shareId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPackingList(data.packingList);
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPackingList(); }, [destination]);

  useEffect(() => {
    if (!packingList) return;
    const allItems    = packingList.categories?.flatMap((c) => c.items) || [];
    const checkedCount = Object.values(checked).filter(Boolean).length;
    setProgress(allItems.length > 0 ? Math.round((checkedCount / allItems.length) * 100) : 0);
  }, [checked, packingList]);

  const toggleItem = (key) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  const clearAll   = () => setChecked({});
  const checkAll   = () => {
    const all = {};
    packingList?.categories?.forEach((cat) => {
      cat.items.forEach((_, i) => { all[`${cat.name}-${i}`] = true; });
    });
    setChecked(all);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="eyebrow mb-1">What to bring</p>
        <h2 className="font-serif text-2xl font-semibold text-ink">Packing List</h2>
        <p className="text-sm text-ink-muted mt-1">
          AI-generated for {days} days in{' '}
          <span className="text-saffron font-medium">{destination}</span>
        </p>
      </div>

      {loading && (
        <div className="bg-saffron-subtle border border-saffron/20 rounded-2xl p-8 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-saffron/20 border-t-saffron rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-sm font-medium text-saffron-deep">Building your packing list...</p>
            <p className="text-xs text-ink-muted mt-1">Tailored to {destination} climate & your travel style</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-subtle border border-rose/30 rounded-2xl p-5">
          <p className="text-sm text-rose mb-3">⚠️ {error}</p>
          <button onClick={() => { setLoaded(false); fetchPackingList(); }}
            className="text-xs px-4 py-2 bg-rose/10 hover:bg-rose/20 text-rose rounded-lg border border-rose/20 transition-colors">
            Retry
          </button>
        </div>
      )}

      {packingList && !loading && (
        <div>
          {/* Progress Bar */}
          <div className="bg-white border border-line rounded-2xl p-5 mb-6 shadow-warm-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-ink">Packing Progress</p>
                {packingList.weatherNote && (
                  <p className="text-xs text-ink-muted mt-0.5">☁️ {packingList.weatherNote}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-serif text-2xl font-semibold italic text-saffron">{progress}%</span>
                <div className="flex gap-1.5">
                  <button onClick={checkAll}
                    className="text-xs px-3 py-1.5 bg-saffron-subtle hover:bg-saffron/15 text-saffron-deep rounded-lg border border-saffron/20 transition-colors font-mono">
                    Check All
                  </button>
                  <button onClick={clearAll}
                    className="text-xs px-3 py-1.5 bg-paper-warm hover:bg-line text-ink-muted rounded-lg border border-line transition-colors font-mono">
                    Reset
                  </button>
                </div>
              </div>
            </div>
            <div className="h-2.5 bg-line-soft rounded-full overflow-hidden">
              <div className="h-full bg-saffron rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            {progress === 100 && (
              <p className="text-sm text-jade mt-2 font-medium animate-fade-in">🎉 All packed! Have a great trip!</p>
            )}
          </div>

          {/* Don't Forget Banner */}
          {packingList.dontForget?.length > 0 && (
            <div className="bg-marigold-subtle border border-marigold/20 rounded-2xl p-4 mb-6">
              <p className="eyebrow text-marigold-deep mb-2">⚡ Don't Forget</p>
              <div className="flex flex-wrap gap-2">
                {packingList.dontForget.map((item, i) => (
                  <span key={i} className="px-3 py-1 bg-white text-ink-soft rounded-full text-xs border border-marigold/20 font-sans">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {packingList.categories?.map((category) => (
              <div key={category.name} className="bg-white border border-line rounded-2xl overflow-hidden shadow-warm-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-paper-warm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <span className="font-semibold text-ink text-sm">{category.name}</span>
                  </div>
                  <span className="text-xs text-ink-muted font-mono">
                    {category.items.filter((_, i) => checked[`${category.name}-${i}`]).length}/{category.items.length}
                  </span>
                </div>
                <div className="p-3 space-y-1">
                  {category.items.map((item, i) => {
                    const key       = `${category.name}-${i}`;
                    const isChecked = !!checked[key];
                    return (
                      <label key={i}
                        className={`flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group ${
                          isChecked ? 'bg-jade-subtle' : 'hover:bg-paper-warm'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                            isChecked ? 'bg-jade border-jade' : 'border-line group-hover:border-ink-muted'
                          }`}
                          onClick={() => toggleItem(key)}
                        >
                          {isChecked && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm transition-all ${isChecked ? 'line-through text-ink-muted' : 'text-ink'}`}>
                              {item.item}
                            </span>
                            {item.quantity && (
                              <span className="text-xs text-ink-muted shrink-0 font-mono">{item.quantity}</span>
                            )}
                            {item.essential && !isChecked && (
                              <span className="text-xs px-1.5 py-0.5 bg-rose-subtle text-rose rounded border border-rose/20 shrink-0 font-mono">
                                Essential
                              </span>
                            )}
                          </div>
                          {item.note && !isChecked && (
                            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{item.note}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tips */}
          {packingList.proTips?.length > 0 && (
            <div className="mt-6 bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
              <p className="font-semibold text-ink mb-3 flex items-center gap-2">
                <span>💡</span> Packing Tips
              </p>
              <div className="space-y-2">
                {packingList.proTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-saffron font-bold shrink-0 font-mono">{i + 1}.</span>
                    <p className="text-ink-soft leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
