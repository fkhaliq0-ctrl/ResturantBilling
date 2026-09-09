import { useState, useEffect } from 'react';
import { getTodayBills, getAllBills } from '../utils/storage';
import { playButtonPress } from '../utils/audio';

export default function DailyReport({ onBack, onEditBill }) {
  const [bills, setBills] = useState([]);
  const [view, setView] = useState('today');

  useEffect(() => {
    loadBills();
  }, [view]);

  const loadBills = async () => {
    const data = view === 'today' ? await getTodayBills() : await getAllBills();
    setBills(data.sort((a, b) => (b.id || 0) - (a.id || 0)));
  };

  const totalCash = bills.filter((b) => b.paymentMethod === 'cash').reduce((s, b) => s + b.total, 0);
  const totalUpi = bills.filter((b) => b.paymentMethod === 'upi').reduce((s, b) => s + b.total, 0);
  const totalCredit = bills.filter((b) => b.paymentMethod === 'credit').reduce((s, b) => s + b.total, 0);
  const grandTotal = totalCash + totalUpi + totalCredit;
  const billCount = bills.length;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={() => {
            playButtonPress();
            onBack();
          }}
          className="mb-3 flex items-center gap-2 text-gray-300 hover:text-white 
            transition-colors text-lg btn-press px-2 py-1 rounded-xl hover:bg-white/10"
        >
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back</span>
        </button>
        <h1 className="text-3xl font-bold text-white">📊 Sales Report</h1>
        <p className="text-amber-400/70 text-sm">Mehfil-E-Nihari</p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 p-4">
        <button
          onClick={() => {
            playButtonPress();
            setView('today');
          }}
          className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all btn-press ${
            view === 'today'
              ? 'bg-amber-500 text-white'
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          📅 Today
        </button>
        <button
          onClick={() => {
            playButtonPress();
            setView('all');
          }}
          className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all btn-press ${
            view === 'all'
              ? 'bg-amber-500 text-white'
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          📆 All Time
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-4">
        <div className="bg-slate-700/50 rounded-2xl p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">💰 Cash</p>
          <p className="text-green-400 text-xl font-bold">₹{totalCash}</p>
        </div>
        <div className="bg-slate-700/50 rounded-2xl p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">📱 UPI</p>
          <p className="text-blue-400 text-xl font-bold">₹{totalUpi}</p>
        </div>
        <div className="bg-slate-700/50 rounded-2xl p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">📋 Credit</p>
          <p className="text-purple-400 text-xl font-bold">₹{totalCredit}</p>
        </div>
      </div>
      <div className="px-4 mb-4">
        <div className="bg-slate-700/50 rounded-2xl p-3 text-center">
          <p className="text-gray-400 text-sm mb-1">📊 Total ({billCount} bills)</p>
          <p className="text-amber-400 text-2xl font-bold">₹{grandTotal}</p>
        </div>
      </div>

      {/* Bill list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="text-6xl mb-4">📋</span>
            <p className="text-lg text-center">No bills yet.<br />Start taking orders!</p>
          </div>
        ) : (
          bills.map((bill) => (
            <div
              key={bill.id}
              className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-white font-bold text-lg">#{bill.id || '—'}</span>
                  <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-bold ${
                    bill.paymentMethod === 'cash'
                      ? 'bg-green-500/20 text-green-400'
                      : bill.paymentMethod === 'credit'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {bill.paymentMethod === 'cash' ? '💵 Cash' : bill.paymentMethod === 'credit' ? '📋 Credit' : '📱 UPI'}
                  </span>
                </div>                  <span className="text-amber-400 font-bold text-xl">₹{bill.total}</span>
              </div>
              {onEditBill && (
                <button
                  onClick={() => onEditBill(bill)}
                  className="mt-2 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 
                    text-xs font-bold btn-press hover:bg-amber-500/30 transition-colors"
                >
                  ✏️ Edit / Void
                </button>
              )}
              <p className="text-gray-400 text-sm">{bill.time}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {bill.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-600/50 rounded-lg px-2 py-1 text-xs text-gray-300"
                  >
                    {item.name}
                    {item.portion ? ` (${item.portion})` : ''} ×{item.qty}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
