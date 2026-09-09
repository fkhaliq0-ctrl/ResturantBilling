import { useState, useEffect } from 'react';
import { generateOwnerReport, isOwnerPinSet, setOwnerPin, verifyOwnerPin, STOCK_ITEMS } from '../utils/stock';
import { playButtonPress, playCheckoutSuccess, playErrorSound, playKeyPress } from '../utils/audio';

export default function OwnerReport({ onBack }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinMode, setPinMode] = useState(null); // 'verify', 'setup', 'confirm'
  const [pinInput, setPinInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const [date] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stock'); // stock, financial, consumption

  // Check owner PIN on mount
  useEffect(() => {
    isOwnerPinSet().then((set) => {
      setPinMode(set ? 'verify' : 'setup');
    });
  }, []);

  // Load report after auth
  useEffect(() => {
    if (authenticated && !report) {
      setLoading(true);
      generateOwnerReport(date).then((data) => {
        setReport(data);
        setLoading(false);
      });
    }
  }, [authenticated, date, report]);

  const handleDigit = (digit) => {
    playKeyPress();
    if (pinMode === 'setup') {
      setPinInput((prev) => {
        const next = prev + digit;
        if (next.length === 4) setTimeout(() => setPinMode('confirm'), 200);
        return next.length <= 4 ? next : prev;
      });
    } else if (pinMode === 'confirm') {
      setConfirmInput((prev) => {
        const next = prev + digit;
        if (next.length === 4) {
          setTimeout(() => {
            if (pinInput === next) {
              setOwnerPin(pinInput).then(() => {
                playCheckoutSuccess();
                setTimeout(() => setAuthenticated(true), 600);
              });
            } else {
              setError('PINs do not match');
              setShake(true);
              playErrorSound();
              setTimeout(() => { setPinInput(''); setConfirmInput(''); setError(''); setShake(false); setPinMode('setup'); }, 1500);
            }
          }, 200);
        }
        return next.length <= 4 ? next : prev;
      });
    } else if (pinMode === 'verify') {
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
    if (pinMode === 'confirm') setConfirmInput((p) => p.slice(0, -1));
    else setPinInput((p) => p.slice(0, -1));
  };

  // ── PIN Screen ──────────────────────────────────────────────
  if (!authenticated) {
    const currentPin = pinMode === 'confirm' ? confirmInput : pinInput;
    const title = pinMode === 'setup' ? 'Set Owner PIN' : pinMode === 'confirm' ? 'Confirm Owner PIN' : 'Enter Owner PIN';
    const subtitle = pinMode === 'setup' ? 'Choose a 4-digit owner PIN' : pinMode === 'confirm' ? 'Re-enter to confirm' : 'Owner access required';
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'back'];

    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in px-4">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400 text-lg mb-8">{subtitle}</p>

        <div className={`flex gap-4 mb-4 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-14 h-14 rounded-full border-3 flex items-center justify-center transition-all ${
              currentPin.length > i ? 'border-amber-400 bg-amber-400/30' : 'border-gray-600 bg-gray-800/50'
            }`}>
              {currentPin.length > i && <div className="w-5 h-5 rounded-full bg-white" />}
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

  // ── Owner Report ────────────────────────────────────────────
  if (loading || !report) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400 text-xl animate-pulse">Generating owner report...</p>
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
            <h1 className="text-2xl font-bold text-white">👔 Owner Report</h1>
            <p className="text-amber-400/70 text-sm">{report.date} — Confidential</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
            🔒 Owner Only
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-3 shrink-0 overflow-x-auto">
        {[
          { key: 'stock', label: '📦 Stock' },
          { key: 'financial', label: '💰 Financial' },
          { key: 'consumption', label: '📊 Consumption' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => { playButtonPress(); setActiveTab(tab.key); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap btn-press transition-all ${
              activeTab === tab.key ? 'bg-amber-500 text-white' : 'bg-slate-700 text-gray-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* ── Stock Tab ─────────────────────────────────────── */}
        {activeTab === 'stock' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/50 rounded-2xl p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">Items with Discrepancy</p>
                <p className={`text-2xl font-bold ${report.summary.totalDiscrepancyItems > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {report.summary.totalDiscrepancyItems}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-2xl p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">Bills Today</p>
                <p className="text-amber-400 text-2xl font-bold">{report.revenue.billCount}</p>
              </div>
            </div>

            {/* Stock table */}
            <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
              <h3 className="text-white font-bold mb-3">Inventory Yield Reconciliation</h3>
              <div className="space-y-2">
                {report.stockReport.map((item) => (
                  <div key={item.id} className="bg-slate-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-white font-semibold text-sm flex-1">{item.name}</span>
                      {item.discrepancy !== null && item.discrepancy !== 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.discrepancy < 0 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {item.discrepancy > 0 ? '+' : ''}{item.displayDiscrepancy} {item.displayUnit}
                        </span>
                      )}
                      {item.discrepancy === 0 && item.actualClosing !== null && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
                          ✅ Match
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <p className="text-gray-500">Opening</p>
                        <p className="text-white font-bold">{item.displayOpen}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Sold</p>
                        <p className="text-amber-400 font-bold">{item.displayConsumed}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Expected</p>
                        <p className="text-blue-400 font-bold">{item.displayExpected}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Actual</p>
                        <p className={`font-bold ${item.actualClosing === null ? 'text-gray-600' : 'text-white'}`}>
                          {item.displayClosing !== null ? item.displayClosing : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Financial Tab ─────────────────────────────────── */}
        {activeTab === 'financial' && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-700/50 rounded-2xl p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">💰 Cash</p>
                <p className="text-green-400 text-2xl font-bold">₹{report.revenue.cash}</p>
              </div>
              <div className="bg-slate-700/50 rounded-2xl p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">📱 UPI</p>
                <p className="text-blue-400 text-2xl font-bold">₹{report.revenue.upi}</p>
              </div>
              <div className="bg-slate-700/50 rounded-2xl p-4 text-center col-span-3">
                <p className="text-gray-400 text-xs mb-1">📊 Total Revenue ({report.revenue.billCount} bills)</p>
                <p className="text-amber-400 text-3xl font-bold">₹{report.revenue.total}</p>
              </div>
            </div>

            {/* Revenue per category estimate */}
            <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
              <h3 className="text-white font-bold mb-3">Revenue by Stock Category</h3>
              <div className="space-y-2">
                {Object.entries(
                  report.stockReport.reduce((acc, item) => {
                    if (!acc[item.category]) acc[item.category] = { consumed: 0, items: [] };
                    acc[item.category].consumed += item.consumed;
                    acc[item.category].items.push(item.name);
                    return acc;
                  }, {})
                ).map(([cat, data]) => {
                  const catLabels = {
                    buff_nihari: '🍲 Buff Nihari',
                    mutton_nihari: '🥘 Mutton Nihari',
                    bheja: '🫕 Bheja',
                    grill: '🍢 Grill',
                    others: '🍛 Others & Drinks',
                  };
                  const totalConsumption = report.stockReport.reduce((s, i) => s + i.consumed, 0);
                  const pct = totalConsumption > 0 ? ((data.consumed / totalConsumption) * 100).toFixed(1) : 0;

                  return (
                    <div key={cat} className="bg-slate-800/50 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-semibold text-sm">{catLabels[cat] || cat}</span>
                        <span className="text-amber-400 font-bold text-sm">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Consumption Tab ───────────────────────────────── */}
        {activeTab === 'consumption' && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <h3 className="text-white font-bold mb-3">Portion-to-Weight Consumption Ratios</h3>
            <div className="space-y-2">
              {report.stockReport.filter((r) => r.consumed > 0).map((item) => (
                <div key={item.id} className="bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-white font-semibold text-sm flex-1">{item.name}</span>
                    <span className="text-amber-400 font-bold text-sm">
                      {item.displayConsumed} {item.displayUnit} consumed
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Opening: {item.displayOpen} → Sold: {item.displayConsumed} → Remaining: {item.displayExpected}
                    {item.actualClosing !== null && ` → Actual: ${item.displayClosing}`}
                  </div>
                </div>
              ))}
              {report.stockReport.filter((r) => r.consumed > 0).length === 0 && (
                <p className="text-gray-500 text-center py-4">No consumption recorded today</p>
              )}
            </div>

            {/* Discrepancy alerts */}
            {report.stockReport.filter((r) => r.discrepancy !== null && r.discrepancy !== 0).length > 0 && (
              <div className="mt-4 bg-red-500/10 rounded-2xl p-4 border border-red-500/20">
                <h3 className="text-red-400 font-bold mb-3">⚠️ Stock Discrepancy Alerts</h3>
                <div className="space-y-2">
                  {report.stockReport.filter((r) => r.discrepancy !== null && r.discrepancy !== 0).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-white flex-1">{item.name}</span>
                      <span className={`font-bold ${item.discrepancy < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {item.discrepancy < 0 ? 'SHORTAGE' : 'EXCESS'}: {Math.abs(item.displayDiscrepancy)} {item.displayUnit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
