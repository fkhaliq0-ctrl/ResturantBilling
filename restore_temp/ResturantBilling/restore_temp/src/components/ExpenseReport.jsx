import { useState, useEffect } from 'react';
import { generateExpenseReport, generateMonthlyExpenseReport } from '../utils/expenses';
import { verifyOwnerPin, isOwnerPinSet } from '../utils/stock';
import { playButtonPress, playCheckoutSuccess, playErrorSound, playKeyPress } from '../utils/audio';

export default function ExpenseReport({ onBack }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinMode, setPinMode] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const [view, setView] = useState('today'); // today, month
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // "2026-08"

  useEffect(() => {
    isOwnerPinSet().then((set) => {
      // If owner PIN is not set, still require it for expense report
      setPinMode(set ? 'verify' : 'setup');
    });
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadReport();
    }
  }, [authenticated, view]);

  const loadReport = async () => {
    setLoading(true);
    const data = view === 'today'
      ? await generateExpenseReport(today)
      : await generateMonthlyExpenseReport(currentMonth);
    setReport(data);
    setLoading(false);
  };

  const handleDigit = (digit) => {
    playKeyPress();
    if (pinMode === 'setup') {
      setPinInput((prev) => {
        const next = prev + digit;
        if (next.length === 4) setTimeout(() => setPinMode('confirm'), 200);
        return next.length <= 4 ? next : prev;
      });
    } else if (pinMode === 'confirm') {
      // For expense report, just verify the owner PIN exists
      // If no PIN set, just authenticate
      setTimeout(() => {
        playCheckoutSuccess();
        setAuthenticated(true);
      }, 200);
    } else {
      setPinInput((prev) => {
        const next = prev + digit;
        if (next.length === 4) {
          setTimeout(() => {
            verifyOwnerPin(next).then((valid) => {
              if (valid) {
                playCheckoutSuccess();
                setTimeout(() => setAuthenticated(true), 600);
              } else {
                setError('Wrong PIN!');
                setShake(true);
                playErrorSound();
                setTimeout(() => { setPinInput(''); setError(''); setShake(false); }, 1200);
              }
            });
          }, 200);
        }
        return next.length <= 4 ? next : prev;
      });
    }
  };

  const handleBackspace = () => {
    playButtonPress();
    setPinInput((p) => p.slice(0, -1));
  };

  // ── PIN Screen ──────────────────────────────────────────────
  if (!authenticated) {
    const title = pinMode === 'setup' ? 'Set Owner PIN' : 'Enter Owner PIN';
    const subtitle = pinMode === 'setup' ? 'Choose a 4-digit PIN for owner access' : 'Owner access required for expense reports';
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'back'];

    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in px-4">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400 text-lg mb-8">{subtitle}</p>

        <div className={`flex gap-4 mb-4 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-14 h-14 rounded-full border-3 flex items-center justify-center transition-all ${
              pinInput.length > i ? 'border-amber-400 bg-amber-400/30' : 'border-gray-600 bg-gray-800/50'
            }`}>
              {pinInput.length > i && <div className="w-5 h-5 rounded-full bg-white" />}
            </div>
          ))}
        </div>

        {error && <div className="text-red-400 text-xl font-bold mb-4 animate-shake">{error}</div>}

        <div className="grid grid-cols-3 gap-4 mt-4">
          {digits.map((d, idx) => {
            if (d === null) return <div key={idx} />;
            if (d === 'back') return (
              <button key={idx} onClick={handleBackspace}
                className="w-20 h-20 rounded-2xl bg-gray-700/60 text-white text-2xl flex items-center justify-center btn-press hover:bg-gray-600/80 transition-colors">
                ⌫
              </button>
            );
            return (
              <button key={idx} onClick={() => handleDigit(d)}
                className="w-20 h-20 rounded-2xl bg-gradient-to-b from-gray-600 to-gray-700 text-white text-3xl font-bold flex items-center justify-center btn-press hover:from-gray-500 hover:to-gray-600 transition-all shadow-lg">
                {d}
              </button>
            );
          })}
        </div>

        {pinMode === 'setup' && (
          <button onClick={() => setAuthenticated(true)}
            className="mt-8 text-gray-500 text-lg hover:text-gray-300 transition-colors">
            Skip — No PIN (not recommended)
          </button>
        )}

        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mt-6 text-gray-400 hover:text-white transition-colors">
          ← Back
        </button>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────
  if (loading || !report) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400 text-xl animate-pulse">Loading expense report...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white 
            transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">💰 Expense Report</h1>
            <p className="text-gray-400 text-sm">{report.label} — Confidential</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
            🔒 Owner Only
          </span>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 p-3 shrink-0">
        <button onClick={() => { playButtonPress(); setView('today'); setReport(null); }}
          className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all btn-press ${
            view === 'today' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-gray-300'
          }`}>
          📅 Today
        </button>
        <button onClick={() => { playButtonPress(); setView('month'); setReport(null); }}
          className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all btn-press ${
            view === 'month' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-gray-300'
          }`}>
          📆 This Month
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/50 rounded-2xl p-4 text-center col-span-2">
            <p className="text-gray-400 text-xs mb-1">💰 Total Expenses ({report.totalEntries} entries)</p>
            <p className="text-amber-400 text-3xl font-bold">₹{report.totalAmount}</p>
          </div>
          <div className="bg-green-500/10 rounded-2xl p-4 text-center border border-green-500/20">
            <p className="text-gray-400 text-xs mb-1">💵 Cash</p>
            <p className="text-green-400 text-xl font-bold">₹{report.paymentBreakdown.cash}</p>
          </div>
          <div className="bg-blue-500/10 rounded-2xl p-4 text-center border border-blue-500/20">
            <p className="text-gray-400 text-xs mb-1">📱 Paytm</p>
            <p className="text-blue-400 text-xl font-bold">₹{report.paymentBreakdown.paytm}</p>
          </div>
          <div className="bg-purple-500/10 rounded-2xl p-4 text-center border border-purple-500/20 col-span-2">
            <p className="text-gray-400 text-xs mb-1">🏦 Online</p>
            <p className="text-purple-400 text-xl font-bold">₹{report.paymentBreakdown.online}</p>
          </div>
        </div>

        {/* Cash vs Digital bar */}
        {report.totalAmount > 0 && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <h3 className="text-white font-bold text-sm mb-3">Cash vs Digital Split</h3>
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 transition-all"
                style={{ width: `${(report.paymentBreakdown.cash / report.totalAmount * 100).toFixed(1)}%` }}
              />
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 transition-all"
                style={{ width: `${(report.paymentBreakdown.paytm / report.totalAmount * 100).toFixed(1)}%` }}
              />
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 transition-all"
                style={{ width: `${(report.paymentBreakdown.online / report.totalAmount * 100).toFixed(1)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>💵 {report.totalAmount > 0 ? (report.paymentBreakdown.cash / report.totalAmount * 100).toFixed(1) : 0}%</span>
              <span>📱 {report.totalAmount > 0 ? (report.paymentBreakdown.paytm / report.totalAmount * 100).toFixed(1) : 0}%</span>
              <span>🏦 {report.totalAmount > 0 ? (report.paymentBreakdown.online / report.totalAmount * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        )}

        {/* By Vendor */}
        {report.byVendor.length > 0 && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <h3 className="text-white font-bold text-sm mb-3">🏪 Expenses by Vendor</h3>
            <div className="space-y-2">
              {report.byVendor.map((v) => (
                <div key={v.name} className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">{v.name}</p>
                    <p className="text-gray-500 text-xs">{v.count} entries</p>
                  </div>
                  <span className="text-amber-400 font-bold">₹{v.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By Category */}
        {report.byCategory.length > 0 && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <h3 className="text-white font-bold text-sm mb-3">📂 Expenses by Category</h3>
            <div className="space-y-2">
              {report.byCategory.map((c) => {
                const pct = report.totalAmount > 0 ? (c.total / report.totalAmount * 100).toFixed(1) : 0;
                return (
                  <div key={c.name} className="bg-slate-800/50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold text-sm">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs">{c.count} entries</span>
                        <span className="text-amber-400 font-bold text-sm">₹{c.total}</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All entries */}
        {report.entries.length > 0 && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <h3 className="text-white font-bold text-sm mb-3">📋 All Entries</h3>
            <div className="space-y-2">
              {report.entries.map((entry) => (
                <div key={entry.id} className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{entry.itemName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {entry.vendor && <span>🏪 {entry.vendor}</span>}
                      {entry.quantity && <span>📦 {entry.quantity} {entry.unit}</span>}
                      <span className={
                        entry.paymentMethod === 'cash' ? 'text-green-400' :
                        entry.paymentMethod === 'paytm' ? 'text-blue-400' : 'text-purple-400'
                      }>
                        {entry.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold">₹{entry.amount}</span>
                    <p className="text-gray-500 text-[10px]">{entry.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <span className="text-5xl mb-3">📋</span>
            <p className="text-center">No expenses recorded{view === 'today' ? ' today' : ' this month'}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
