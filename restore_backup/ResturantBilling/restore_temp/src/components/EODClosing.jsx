import { useState, useEffect } from 'react';
import { getDaySalesBreakdown, reconcile, saveDayClosing, getDayClosing, isTodayClosed } from '../utils/eodClosing';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from '../utils/audio';

export default function EODClosing({ onBack }) {
  const [date] = useState(() => new Date().toISOString().split('T')[0]);
  const [breakdown, setBreakdown] = useState(null);
  const [cashInHand, setCashInHand] = useState('');
  const [coins, setCoins] = useState('');
  const [upiCollected, setUpiCollected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [alreadyClosed, setAlreadyClosed] = useState(false);
  const [reconResult, setReconResult] = useState(null);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    const bd = await getDaySalesBreakdown(date);
    setBreakdown(bd);

    // Pre-fill UPI from actual sales
    setUpiCollected(String(bd.upiSales));

    const closed = await isTodayClosed(date);
    if (closed) {
      const existing = await getDayClosing(date);
      setCashInHand(String(existing.cashInHand || ''));
      setCoins(String(existing.coins || ''));
      setUpiCollected(String(existing.upiCollected || bd.upiSales));
      setAlreadyClosed(true);
      // Re-reconcile
      const recon = reconcile(
        existing.cashInHand || 0, existing.coins || 0,
        existing.upiCollected || bd.upiSales, bd
      );
      setReconResult(recon);
    }
    setLoading(false);
  };

  // Live reconciliation as user types
  useEffect(() => {
    if (!breakdown) return;
    const cash = parseFloat(cashInHand) || 0;
    const coinVal = parseFloat(coins) || 0;
    const upi = parseFloat(upiCollected) || 0;
    if (cash > 0 || coinVal > 0 || upi > 0) {
      setReconResult(reconcile(cash, coinVal, upi, breakdown));
    } else {
      setReconResult(null);
    }
  }, [cashInHand, coins, upiCollected, breakdown]);

  const handleSave = async () => {
    if (!cashInHand && !coins) {
      playErrorSound();
      alert('Please enter at least Cash in Hand or Coins');
      return;
    }

    playButtonPress();

    const cash = parseFloat(cashInHand) || 0;
    const coinVal = parseFloat(coins) || 0;
    const upi = parseFloat(upiCollected) || 0;
    const recon = reconcile(cash, coinVal, upi, breakdown);

    await saveDayClosing({
      date,
      cashInHand: cash,
      coins: coinVal,
      upiCollected: upi,
      reconciliation: recon,
      breakdown,
      closed: true,
    });

    playCheckoutSuccess();
    setSaved(true);
    setAlreadyClosed(true);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400 text-xl animate-pulse">Loading sales data...</p>
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
            <h1 className="text-2xl font-bold text-white">🧾 End-of-Day Closing</h1>
            <p className="text-gray-400 text-sm">{date} — Daily cash reconciliation</p>
          </div>
          {alreadyClosed && (
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
              ✅ Closed
            </span>
          )}
        </div>
      </div>

      {/* Saved confirmation */}
      {saved && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-green-500/20 text-green-400 text-center font-bold animate-slide-up">
          ✅ Daily closing saved!
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Today's Sales Summary ────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-amber-400 font-bold text-sm mb-3">📊 Today's Sales</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 rounded-xl p-2 text-center">
              <p className="text-gray-500 text-[10px]">Bills</p>
              <p className="text-white font-bold text-lg">{breakdown?.billCount || 0}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2 text-center">
              <p className="text-gray-500 text-[10px]">Items Sold</p>
              <p className="text-white font-bold text-lg">{breakdown?.totalItems || 0}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2 text-center">
              <p className="text-gray-500 text-[10px]">Total Sales</p>
              <p className="text-amber-400 font-bold text-lg">₹{breakdown?.totalSales || 0}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-green-500/10 rounded-xl p-2 text-center border border-green-500/20">
              <p className="text-gray-500 text-[10px]">💵 Cash Sales</p>
              <p className="text-green-400 font-bold">₹{breakdown?.cashSales || 0}</p>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-2 text-center border border-blue-500/20">
              <p className="text-gray-500 text-[10px]">📱 UPI Sales</p>
              <p className="text-blue-400 font-bold">₹{breakdown?.upiSales || 0}</p>
            </div>
          </div>
          {breakdown?.totalExpenses > 0 && (
            <div className="bg-red-500/10 rounded-xl p-2 text-center border border-red-500/20 mt-2">
              <p className="text-gray-500 text-[10px]">📦 Today's Expenses</p>
              <p className="text-red-400 font-bold">₹{breakdown.totalExpenses}</p>
            </div>
          )}
        </div>

        {/* ── Cash Entry ───────────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-3">💰 Count Your Cash</h3>
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">💵 Total Cash in Hand (Notes)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={cashInHand}
                onChange={(e) => setCashInHand(e.target.value)}
                placeholder={`Expected: ₹${breakdown?.cashSales || 0}`}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-slate-600 
                  text-white text-xl font-bold focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">🪙 Total Coins</label>
              <input
                type="number"
                min="0"
                step="1"
                value={coins}
                onChange={(e) => setCoins(e.target.value)}
                placeholder="Enter coin amount"
                className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-slate-600 
                  text-white text-xl font-bold focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">📱 UPI Amount Collected</label>
              <input
                type="number"
                min="0"
                step="1"
                value={upiCollected}
                onChange={(e) => setUpiCollected(e.target.value)}
                placeholder={`Expected: ₹${breakdown?.upiSales || 0}`}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-slate-600 
                  text-white text-xl font-bold focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* ── Reconciliation ───────────────────────────────── */}
        {reconResult && (
          <div className={`rounded-2xl p-4 border ${
            reconResult.balanced
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <h3 className={`font-bold text-sm mb-3 ${
              reconResult.balanced ? 'text-green-400' : 'text-red-400'
            }`}>
              {reconResult.balanced ? '✅ Balanced!' : reconResult.status === 'excess' ? '⚠️ Excess Cash' : '⚠️ Shortage'}
            </h3>

            <div className="space-y-2">
              {/* Physical cash */}
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">💵 Cash in Hand</span>
                  <span className="text-white font-bold">₹{reconResult.cashInHand}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">🪙 Coins</span>
                  <span className="text-white font-bold">₹{reconResult.coins}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-600 mt-1 pt-1">
                  <span className="text-gray-400">Physical Cash Total</span>
                  <span className="text-green-400 font-bold">₹{reconResult.physicalCash}</span>
                </div>
              </div>

              {/* UPI */}
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">📱 UPI Collected</span>
                  <span className="text-white font-bold">₹{reconResult.upiCollected}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">📱 UPI Expected</span>
                  <span className="text-gray-300">₹{breakdown?.upiSales || 0}</span>
                </div>
                {reconResult.upiDifference !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">UPI Difference</span>
                    <span className={`font-bold ${reconResult.upiDifference > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {reconResult.upiDifference > 0 ? '+' : ''}₹{reconResult.upiDifference}
                    </span>
                  </div>
                )}
              </div>

              {/* Grand total */}
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Payments (Cash + UPI)</span>
                  <span className="text-white font-bold text-lg">₹{reconResult.totalPayments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Expected Total Sales</span>
                  <span className="text-gray-300">₹{reconResult.expectedTotal}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-600 mt-1 pt-1">
                  <span className="text-white font-bold">Difference</span>
                  <span className={`text-xl font-bold ${
                    reconResult.difference === 0 ? 'text-green-400' :
                    reconResult.difference > 0 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {reconResult.difference === 0 ? '₹0 ✅' :
                     `${reconResult.difference > 0 ? '+' : ''}₹${reconResult.difference}`}
                  </span>
                </div>
              </div>

              {/* Status message */}
              <div className={`text-center py-2 rounded-xl font-bold text-sm ${
                reconResult.balanced ? 'bg-green-500/20 text-green-400' :
                reconResult.status === 'excess' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {reconResult.balanced ? '✅ Cash matches sales perfectly!' :
                 reconResult.status === 'excess' ? `💰 ₹${reconResult.difference} excess — verify entries` :
                 `📉 ₹${Math.abs(reconResult.difference)} shortage — verify entries`}
              </div>
            </div>
          </div>
        )}

        {/* ── Save Button ──────────────────────────────────── */}
        <button
          onClick={handleSave}
          disabled={saved}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 
            text-white text-lg font-bold btn-press shadow-xl
            active:from-amber-600 active:to-orange-700 transition-all
            disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saved ? '✅ Closing Saved' : '💾 Save Daily Closing'}
        </button>

        {alreadyClosed && !saved && (
          <p className="text-gray-500 text-xs text-center">
            This day was previously closed. You can re-enter and re-save.
          </p>
        )}
      </div>
    </div>
  );
}
