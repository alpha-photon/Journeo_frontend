'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { withAuth } from '../../lib/auth';
import AuthModal from './AuthModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const CATEGORIES = [
  { id: 'accommodation', label: 'Accommodation', icon: '🏨', color: 'bg-indigo'    },
  { id: 'food',          label: 'Food & Drinks',  icon: '🍽️', color: 'bg-saffron'   },
  { id: 'transport',     label: 'Transport',       icon: '🚌', color: 'bg-jade'      },
  { id: 'activities',    label: 'Activities',      icon: '🎯', color: 'bg-marigold'  },
  { id: 'shopping',      label: 'Shopping',        icon: '🛍️', color: 'bg-rose'      },
  { id: 'misc',          label: 'Misc',            icon: '📦', color: 'bg-ink-muted' },
];

const CURRENCIES = ['USD','EUR','GBP','INR','JPY','AUD','CAD','SGD','THB','AED','MXN','BRL'];
const CURRENCY_SYMBOL = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', AUD:'A$', CAD:'C$', SGD:'S$', THB:'฿', AED:'AED', MXN:'$', BRL:'R$' };

function fmt(amount, currency) {
  const sym = CURRENCY_SYMBOL[currency] || currency + ' ';
  return `${sym}${amount.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function computeSettlement(travelers, expenses) {
  const balance = {};
  travelers.forEach((t) => (balance[t] = 0));
  expenses.forEach((exp) => {
    const split = exp.splitBetween?.length > 0 ? exp.splitBetween : travelers;
    const perPerson = exp.amount / split.length;
    if (balance[exp.paidBy] !== undefined) balance[exp.paidBy] += exp.amount;
    split.forEach((p) => { if (balance[p] !== undefined) balance[p] -= perPerson; });
  });
  const debtors   = travelers.filter((t) => balance[t] < -0.01).map((t) => ({ name: t, amount: -balance[t] }));
  const creditors = travelers.filter((t) => balance[t] > 0.01 ).map((t) => ({ name: t, amount:  balance[t] }));
  const settlements = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    settlements.push({ from: debtors[i].name, to: creditors[j].name, amount: pay });
    debtors[i].amount -= pay; creditors[j].amount -= pay;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }
  return { balance, settlements };
}

const inputCls = 'w-full px-3 py-2.5 bg-paper-warm border border-line rounded-xl text-ink placeholder-ink-muted text-sm focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all';
const selectCls = 'bg-paper-warm border border-line rounded-xl px-3 py-2.5 text-ink text-sm focus:outline-none focus:border-saffron transition-all';

function SetupForm({ onSave, suggested, numDays, defaultTravelerName = 'Me' }) {
  const [total, setTotal]               = useState(suggested ? String(suggested * numDays) : '');
  const [currency, setCurrency]         = useState('USD');
  const [travelerInput, setTravelerInput] = useState('');
  const [travelers, setTravelers]       = useState([defaultTravelerName]);
  const [saving, setSaving]             = useState(false);

  const addTraveler = () => {
    const name = travelerInput.trim();
    if (name && !travelers.includes(name)) { setTravelers((p) => [...p, name]); setTravelerInput(''); }
  };
  const removeTraveler = (name) => {
    if (travelers.length === 1) return;
    setTravelers((p) => p.filter((t) => t !== name));
  };
  const handleSave = async () => {
    if (!total || parseFloat(total) <= 0) return;
    setSaving(true);
    await onSave({ totalBudget: parseFloat(total), currency, travelers, numDays });
    setSaving(false);
  };
  const perDay = total && numDays ? (parseFloat(total) / numDays).toFixed(0) : null;
  const perPersonPerDay = perDay && travelers.length ? (parseFloat(perDay) / travelers.length).toFixed(0) : null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-saffron-subtle border border-saffron/20 flex items-center justify-center text-2xl mx-auto mb-3">💰</div>
        <h3 className="font-serif text-xl font-semibold text-ink">Set Up Your Trip Budget</h3>
        <p className="text-sm text-ink-muted mt-1">Track expenses and split costs with your travel group</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-[10px] font-mono font-medium text-ink-muted uppercase tracking-widest mb-2">Total Trip Budget</label>
          <div className="flex gap-2">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${selectCls} w-24`}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" min={0} placeholder="e.g. 1500" value={total}
              onChange={(e) => setTotal(e.target.value)} className={`${inputCls} flex-1`} />
          </div>
          {perDay && (
            <p className="text-xs text-saffron-deep mt-1.5 font-mono">
              ≈ {CURRENCY_SYMBOL[currency] || ''}{perDay}/day
              {travelers.length > 1 ? ` · ${CURRENCY_SYMBOL[currency] || ''}${perPersonPerDay}/person/day` : ''}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-mono font-medium text-ink-muted uppercase tracking-widest mb-2">
            Travelers <span className="text-ink-muted normal-case font-normal tracking-normal">(for expense splitting)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {travelers.map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-saffron-subtle border border-saffron/30 rounded-full text-saffron-deep">
                {t}
                {travelers.length > 1 && (
                  <button onClick={() => removeTraveler(t)} className="text-saffron/60 hover:text-rose transition-colors leading-none">×</button>
                )}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Add traveler name..." value={travelerInput}
              onChange={(e) => setTravelerInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTraveler()}
              className={`${inputCls} flex-1`} />
            <button onClick={addTraveler} className="px-3 py-2.5 bg-paper-warm hover:bg-line border border-line text-ink-soft rounded-xl text-sm transition-colors">
              + Add
            </button>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || !total || parseFloat(total) <= 0}
          className="w-full py-3.5 bg-ink hover:bg-ink-soft text-paper font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-warm">
          {saving ? 'Setting up...' : 'Set Budget & Start Tracking'}
        </button>
        <button onClick={() => onSave({ totalBudget: 0, currency, travelers, numDays })}
          className="w-full py-2.5 text-ink-muted hover:text-ink-soft text-sm transition-colors font-mono">
          Skip — just track expenses without a budget →
        </button>
      </div>
    </div>
  );
}

export default function BudgetTracker({ shareId, destination, numDays, suggestedBudgetPerDay }) {
  const { user, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen]   = useState(false);
  const [budget, setBudget]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeDay, setActiveDay] = useState('all');
  const [showSetup, setShowSetup] = useState(false);
  const [form, setForm] = useState({ amount: '', category: 'food', description: '', day: '', paidBy: '', splitBetween: [] });
  const [adding, setAdding]       = useState(false);
  const [addError, setAddError]   = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/budget/${shareId}`);
      const data = await res.json();
      setBudget(data.budget);
      if (!data.budget) setShowSetup(true);
    } catch (_) { setShowSetup(true); }
    finally { setLoading(false); }
  }, [shareId]);

  useEffect(() => { load(); }, [load]);

  const handleSetup = async (setup) => {
    const res = await fetch(`${API_URL}/api/budget/${shareId}/setup`, withAuth({
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...setup, destination }),
    }));
    const data = await res.json();
    if (data.success) {
      setBudget(data.budget); setShowSetup(false);
      setForm((f) => ({ ...f, paidBy: data.budget.travelers[0], splitBetween: data.budget.travelers }));
    }
  };

  const handleAddExpense = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setAdding(true); setAddError(null);
    try {
      const res = await fetch(`${API_URL}/api/budget/${shareId}/expense`, withAuth({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(form.amount), category: form.category,
          description: form.description, day: form.day ? parseInt(form.day) : null,
          paidBy: form.paidBy || budget.travelers[0],
          splitBetween: form.splitBetween.length > 0 ? form.splitBetween : budget.travelers,
        }),
      }));
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setBudget(data.budget);
      setForm((f) => ({ ...f, amount: '', description: '', day: '' }));
    } catch (err) { setAddError(err.message); }
    finally { setAdding(false); }
  };

  const handleDelete = async (expenseId) => {
    const res = await fetch(`${API_URL}/api/budget/${shareId}/expense/${expenseId}`, withAuth({ method: 'DELETE' }));
    const data = await res.json();
    if (data.success) setBudget(data.budget);
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-saffron/30 border-t-saffron rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-saffron-subtle border border-saffron/20 flex items-center justify-center text-2xl">💰</div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-ink mb-1">Sign in to track your budget</h3>
          <p className="text-sm text-ink-muted max-w-sm">Log expenses, split costs with your group, and keep your budget in sync — all saved to your account.</p>
        </div>
        <button onClick={() => setAuthOpen(true)}
          className="px-6 py-2.5 rounded-xl bg-ink hover:bg-ink-soft text-paper font-semibold text-sm transition-colors shadow-warm">
          Sign in to get started
        </button>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab="login" />
      </div>
    );
  }

  if (showSetup || !budget) {
    const defaultName = user.email?.split('@')[0] || 'Me';
    return (
      <div className="py-8">
        <SetupForm onSave={handleSetup} suggested={suggestedBudgetPerDay} numDays={numDays || 5} defaultTravelerName={defaultName} />
      </div>
    );
  }

  const expenses     = budget.expenses || [];
  const travelers    = budget.travelers || ['Me'];
  const currency     = budget.currency || 'USD';
  const sym          = CURRENCY_SYMBOL[currency] || '';
  const hasBudget    = budget.totalBudget > 0;
  const totalSpent   = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining    = budget.totalBudget - totalSpent;
  const pct          = hasBudget ? Math.min(100, (totalSpent / budget.totalBudget) * 100) : 0;
  const daysElapsed  = expenses.length > 0 ? Math.max(...expenses.map((e) => e.day || 1)) : 0;
  const dailyAvg     = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
  const projected    = dailyAvg * (budget.numDays || numDays || 1);
  const overBudget   = hasBudget && projected > budget.totalBudget;

  const byCategory = {};
  CATEGORIES.forEach((c) => (byCategory[c.id] = 0));
  expenses.forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  const maxCat = Math.max(...Object.values(byCategory), 1);

  const filteredExpenses = activeDay === 'all'
    ? [...expenses].reverse()
    : [...expenses].filter((e) => e.day === parseInt(activeDay)).reverse();

  const { settlements } = travelers.length > 1 ? computeSettlement(travelers, expenses) : { settlements: [] };
  const days = Array.from({ length: budget.numDays || numDays || 1 }, (_, i) => i + 1);

  const barColor = pct > 90 ? 'bg-rose' : pct > 70 ? 'bg-marigold' : 'bg-jade';

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Overview */}
      <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink">Budget Overview</h3>
          <button onClick={() => setShowSetup(true)} className="text-xs text-ink-muted hover:text-ink transition-colors font-mono">Edit setup</button>
        </div>

        <div className={`grid gap-3 mb-4 ${hasBudget ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
          {hasBudget && (
            <div className="bg-paper-warm border border-line rounded-xl px-4 py-3">
              <p className="text-[10px] font-mono text-ink-muted mb-1 uppercase tracking-wider">Total Budget</p>
              <p className="text-lg font-bold leading-none text-ink">{fmt(budget.totalBudget, currency)}</p>
              <p className="text-xs text-ink-muted mt-1 font-mono">{budget.numDays} days</p>
            </div>
          )}
          <div className="bg-paper-warm border border-line rounded-xl px-4 py-3">
            <p className="text-[10px] font-mono text-ink-muted mb-1 uppercase tracking-wider">Total Spent</p>
            <p className="text-lg font-bold leading-none text-marigold-deep">{fmt(totalSpent, currency)}</p>
            <p className="text-xs text-ink-muted mt-1 font-mono">{expenses.length} expenses</p>
          </div>
          {hasBudget && (
            <div className="bg-paper-warm border border-line rounded-xl px-4 py-3">
              <p className="text-[10px] font-mono text-ink-muted mb-1 uppercase tracking-wider">Remaining</p>
              <p className={`text-lg font-bold leading-none ${remaining < 0 ? 'text-rose' : 'text-jade'}`}>
                {fmt(Math.max(0, remaining), currency)}
              </p>
              <p className="text-xs text-ink-muted mt-1 font-mono">{remaining < 0 ? 'Over budget!' : 'left'}</p>
            </div>
          )}
          <div className="bg-paper-warm border border-line rounded-xl px-4 py-3">
            <p className="text-[10px] font-mono text-ink-muted mb-1 uppercase tracking-wider">Daily Avg</p>
            <p className={`text-lg font-bold leading-none ${overBudget ? 'text-rose' : 'text-ink'}`}>
              {dailyAvg > 0 ? fmt(dailyAvg, currency) : '—'}
            </p>
            <p className="text-xs text-ink-muted mt-1 font-mono">{overBudget ? '⚠ over pace' : 'per day'}</p>
          </div>
        </div>

        {hasBudget && (
          <>
            <div className="h-2.5 bg-line-soft rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            {overBudget && daysElapsed > 0 && (
              <p className="text-xs text-marigold-deep mt-2 font-mono">
                At this pace you'll spend {fmt(projected, currency)} — {fmt(projected - budget.totalBudget, currency)} over budget
              </p>
            )}
          </>
        )}
        {!hasBudget && (
          <p className="text-xs text-ink-muted mt-1 font-mono">
            No budget cap set —{' '}
            <button onClick={() => setShowSetup(true)} className="text-saffron hover:text-saffron-deep transition-colors">add one anytime</button>
          </p>
        )}
      </div>

      {/* Add Expense + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Add Expense */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
          <h3 className="font-semibold text-ink mb-4">Log Expense</h3>

          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-semibold font-mono">{sym}</span>
            <input type="number" min={0} placeholder="Amount" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`${inputCls} pl-7`} />
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setForm({ ...form, category: c.id })}
                className={`text-xs py-2 rounded-xl border transition-all flex flex-col items-center gap-0.5 ${
                  form.category === c.id
                    ? 'bg-saffron-subtle border-saffron/40 text-saffron-deep'
                    : 'bg-paper-warm border-line text-ink-muted hover:border-saffron/25'
                }`}>
                <span>{c.icon}</span>
                <span className="leading-tight text-center">{c.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <input type="text" placeholder="Description (optional)" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
            className={`${inputCls} mb-3`} />

          <div className="flex gap-2 mb-3">
            <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className={`${selectCls} flex-1`}>
              <option value="">Day (opt.)</option>
              {days.map((d) => <option key={d} value={d}>Day {d}</option>)}
            </select>
            {travelers.length > 1 && (
              <select value={form.paidBy || travelers[0]} onChange={(e) => setForm({ ...form, paidBy: e.target.value })} className={`${selectCls} flex-1`}>
                {travelers.map((t) => <option key={t} value={t}>{t} paid</option>)}
              </select>
            )}
          </div>

          {travelers.length > 1 && (
            <div className="mb-3">
              <p className="text-xs text-ink-muted mb-1.5 font-mono">Split equally between</p>
              <div className="flex flex-wrap gap-1.5">
                {travelers.map((t) => {
                  const active      = form.splitBetween.length === 0 || form.splitBetween.includes(t);
                  const activeSplit = form.splitBetween.length > 0 ? form.splitBetween : travelers;
                  const perPerson   = form.amount && activeSplit.length > 0 ? (parseFloat(form.amount) / activeSplit.length).toFixed(0) : null;
                  return (
                    <button key={t} onClick={() => {
                      const current = form.splitBetween.length > 0 ? form.splitBetween : travelers;
                      const next = current.includes(t) && current.length > 1 ? current.filter((x) => x !== t) : [...new Set([...current, t])];
                      setForm({ ...form, splitBetween: next });
                    }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all font-mono ${
                        active ? 'bg-saffron-subtle border-saffron/40 text-saffron-deep' : 'bg-paper-warm border-line text-ink-muted line-through'
                      }`}>
                      {t}{active && perPerson ? ` · ${sym}${perPerson}` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {addError && <p className="text-xs text-rose mb-2 font-mono">{addError}</p>}

          <button onClick={handleAddExpense} disabled={adding || !form.amount || parseFloat(form.amount) <= 0}
            className="w-full py-2.5 bg-saffron-subtle border border-saffron/30 text-saffron-deep hover:bg-saffron/15 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed font-sans">
            {adding ? 'Adding...' : '+ Add Expense'}
          </button>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
          <h3 className="font-semibold text-ink mb-4">By Category</h3>
          {totalSpent === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">No expenses yet</p>
          ) : (
            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const amt    = byCategory[cat.id] || 0;
                const catPct = (amt / totalSpent) * 100;
                if (amt === 0) return null;
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-ink-soft flex items-center gap-2"><span>{cat.icon}</span><span>{cat.label}</span></span>
                      <span className="text-sm font-semibold text-ink">{fmt(amt, currency)}</span>
                    </div>
                    <div className="h-2 bg-line-soft rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cat.color} transition-all duration-500`} style={{ width: `${(amt / maxCat) * 100}%` }} />
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5 font-mono">{catPct.toFixed(0)}% of total spend</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Who owes whom */}
      {travelers.length > 1 && expenses.length > 0 && (
        <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
          <h3 className="font-semibold text-ink mb-1">Who needs to pay whom?</h3>
          <p className="text-xs text-ink-muted mb-4 font-mono">Based on all expenses logged so far</p>
          {settlements.length === 0 ? (
            <div className="flex items-center gap-3 bg-jade-subtle border border-jade/20 rounded-xl px-4 py-3.5">
              <span className="text-xl">🎉</span>
              <p className="text-sm text-jade font-medium">Everyone is settled up — no one owes anyone!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-marigold-subtle border border-marigold/20 rounded-xl px-4 py-3.5">
                  <span className="text-xl">💸</span>
                  <p className="text-sm text-ink-soft">
                    <span className="font-bold text-ink">{s.from}</span>{' needs to pay '}
                    <span className="font-bold text-ink">{s.to}</span>
                  </p>
                  <span className="ml-auto text-base font-bold text-marigold-deep shrink-0 font-mono">{fmt(s.amount, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expense List */}
      <div className="bg-white border border-line rounded-2xl p-5 shadow-warm-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink">Expenses</h3>
          <span className="text-xs text-ink-muted font-mono">{expenses.length} total</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {[{ id: 'all', label: 'All' }, ...days.map((d) => ({ id: String(d), label: `Day ${d}` }))].map((tab) => (
            <button key={tab.id} onClick={() => setActiveDay(tab.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-xl border transition-all font-mono ${
                activeDay === tab.id
                  ? 'bg-saffron-subtle border-saffron/40 text-saffron-deep'
                  : 'bg-paper-warm border-line text-ink-muted hover:border-saffron/25'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {filteredExpenses.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-6 font-mono">
            {activeDay === 'all' ? 'No expenses yet — add one above' : `No expenses for Day ${activeDay}`}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredExpenses.map((exp) => {
              const cat = CATEGORIES.find((c) => c.id === exp.category);
              return (
                <div key={exp.id} className="flex items-center gap-3 py-2.5 px-3 bg-paper-warm rounded-xl border border-line">
                  <span className="text-lg shrink-0">{cat?.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink leading-snug">{exp.description || cat?.label}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {exp.day && <span className="text-xs text-ink-muted font-mono">Day {exp.day}</span>}
                      {travelers.length > 1 && exp.paidBy && (
                        <span className="text-xs text-ink-muted font-mono">
                          {exp.paidBy} paid · {(() => {
                            const split = exp.splitBetween?.length > 0 ? exp.splitBetween : travelers;
                            return split.length > 1 ? `${sym}${(exp.amount / split.length).toFixed(0)} each` : 'only them';
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ink shrink-0 font-mono">{fmt(exp.amount, currency)}</span>
                  <button onClick={() => handleDelete(exp.id)} title="Delete expense"
                    className="text-ink-muted hover:text-rose active:text-rose transition-colors text-lg leading-none shrink-0 p-1">×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
