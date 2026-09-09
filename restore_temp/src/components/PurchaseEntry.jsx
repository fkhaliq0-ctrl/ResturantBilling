import { useState, useEffect } from 'react';
import { savePurchase, getPurchasesByDate, deletePurchase, getVendors } from '../utils/expenses';
import { DEFAULT_VENDORS, EXPENSE_CATEGORIES } from '../utils/expenses';
import { playButtonPress, playCheckoutSuccess, playRemoveSound, playErrorSound } from '../utils/audio';

export default function PurchaseEntry({ onBack }) {
  const [date] = useState(() => new Date().toISOString().split('T')[0]);
  const [vendors, setVendors] = useState(DEFAULT_VENDORS);
  const [todayEntries, setTodayEntries] = useState([]);
  const [saved, setSaved] = useState(false);

  // Form state
  const [form, setForm] = useState({
    itemName: '',
    category: 'Raw Material',
    vendor: '',
    quantity: '',
    unit: 'kg',
    amount: '',
    paymentMethod: 'cash',
    notes: '',
  });

  const [showVendorInput, setShowVendorInput] = useState(false);

  useEffect(() => {
    loadEntries();
    loadVendors();
  }, [date]);

  const loadEntries = async () => {
    const entries = await getPurchasesByDate(date);
    setTodayEntries(entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  };

  const loadVendors = async () => {
    const v = await getVendors();
    setVendors(v);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.itemName.trim()) {
      playErrorSound();
      alert('Please enter an item name');
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      playErrorSound();
      alert('Please enter a valid amount');
      return;
    }

    playButtonPress();

    await savePurchase({
      date,
      itemName: form.itemName.trim(),
      category: form.category,
      vendor: form.vendor || 'Unknown',
      quantity: form.quantity ? parseFloat(form.quantity) : null,
      unit: form.unit,
      amount: parseFloat(form.amount),
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim(),
    });

    playCheckoutSuccess();
    setSaved(true);

    // Reset form (keep vendor for quick consecutive entries)
    setForm((prev) => ({
      ...prev,
      itemName: '',
      quantity: '',
      amount: '',
      notes: '',
    }));

    await loadEntries();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    playRemoveSound();
    await deletePurchase(id);
    await loadEntries();
  };

  const todayTotal = todayEntries.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button
          onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white 
            transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10"
        >
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">📋 Purchase Entry</h1>
            <p className="text-gray-400 text-sm">{date} — Daily ledger</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Today's Total</p>
            <p className="text-amber-400 font-bold text-xl">₹{todayTotal}</p>
          </div>
        </div>
      </div>

      {/* Saved confirmation */}
      {saved && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-green-500/20 text-green-400 text-center font-bold animate-slide-up">
          ✅ Entry saved!
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Entry Form ──────────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50 space-y-3">
          <h3 className="text-amber-400 font-bold text-sm">➕ New Entry</h3>

          {/* Item Name */}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Item / Expense Name *</label>
            <input
              type="text"
              value={form.itemName}
              onChange={(e) => handleChange('itemName', e.target.value)}
              placeholder="e.g. Imran Gosht, LPG, Tamatar"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 
                text-white text-sm focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Category + Unit row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 
                  text-white text-sm focus:border-amber-500 focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 
                  text-white text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="pcs">pcs</option>
                <option value="doz">dozen</option>
                <option value="litre">litre</option>
                <option value="瓶">bottle</option>
                <option value="box">box</option>
                <option value="bag">bag</option>
                <option value="cylinder">cylinder</option>
              </select>
            </div>
          </div>

          {/* Quantity + Amount row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Quantity (optional)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="e.g. 5"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 
                  text-white text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Amount (₹) *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="e.g. 500"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 
                  text-white text-sm font-bold focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Vendor */}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Supplier / Vendor</label>
            <div className="flex gap-2">
              <select
                value={showVendorInput ? '__custom__' : form.vendor}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setShowVendorInput(true);
                    handleChange('vendor', '');
                  } else {
                    setShowVendorInput(false);
                    handleChange('vendor', e.target.value);
                  }
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 
                  text-white text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="">-- Select --</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
                <option value="__custom__">+ Type New Vendor</option>
              </select>
            </div>
            {showVendorInput && (
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => handleChange('vendor', e.target.value)}
                placeholder="Enter vendor name"
                className="w-full mt-2 py-2.5 px-3 rounded-xl bg-slate-800 border border-amber-500 
                  text-white text-sm focus:outline-none"
                autoFocus
              />
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'cash', label: '💵 Cash', color: 'green' },
                { key: 'paytm', label: '📱 Paytm', color: 'blue' },
                { key: 'online', label: '🏦 Online', color: 'purple' },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => handleChange('paymentMethod', m.key)}
                  className={`py-2.5 rounded-xl text-sm font-bold btn-press transition-all ${
                    form.paymentMethod === m.key
                      ? `bg-${m.color}-500/30 border-2 border-${m.color}-400 text-${m.color}-300`
                      : 'bg-slate-800 border-2 border-slate-600 text-gray-400'
                  }`}
                  style={form.paymentMethod === m.key ? {
                    backgroundColor: m.color === 'green' ? 'rgb(34 197 94 / 0.3)' :
                      m.color === 'blue' ? 'rgb(59 130 246 / 0.3)' : 'rgb(168 85 247 / 0.3)',
                    borderColor: m.color === 'green' ? '#4ade80' :
                      m.color === 'blue' ? '#60a5fa' : '#c084fc',
                    color: m.color === 'green' ? '#86efac' :
                      m.color === 'blue' ? '#93c5fd' : '#d8b4fe',
                  } : {}}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Notes (optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any notes..."
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 
                text-white text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 
              text-white text-lg font-bold btn-press shadow-xl
              active:from-amber-600 active:to-orange-700 transition-all"
          >
            💾 Save Entry
          </button>
        </div>

        {/* ── Today's Entries ─────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-sm">📋 Today's Entries ({todayEntries.length})</h3>
            <span className="text-amber-400 font-bold">₹{todayTotal}</span>
          </div>

          {todayEntries.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No entries yet today</p>
          ) : (
            <div className="space-y-2">
              {todayEntries.map((entry) => (
                <div key={entry.id} className="bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm truncate">{entry.itemName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-600 text-gray-300">
                          {entry.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        {entry.vendor && <span>🏪 {entry.vendor}</span>}
                        {entry.quantity && <span>📦 {entry.quantity} {entry.unit}</span>}
                        <span className={
                          entry.paymentMethod === 'cash' ? 'text-green-400' :
                          entry.paymentMethod === 'paytm' ? 'text-blue-400' : 'text-purple-400'
                        }>
                          {entry.paymentMethod === 'cash' ? '💵' :
                           entry.paymentMethod === 'paytm' ? '📱' : '🏦'} {entry.paymentMethod}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-amber-400 font-bold">₹{entry.amount}</span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 
                          flex items-center justify-center text-xs btn-press
                          hover:bg-red-500/40 transition-colors"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
