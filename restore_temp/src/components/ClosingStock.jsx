import { useState, useEffect } from 'react';
import { STOCK_ITEMS, saveClosingStock, getClosingStock, getOpeningStock } from '../utils/stock';
import { getTodayBills } from '../utils/storage';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from '../utils/audio';

export default function ClosingStock({ onBack, onSaved }) {
  const [date] = useState(() => new Date().toISOString().split('T')[0]);
  const [openingStock, setOpeningStock] = useState({});
  const [entries, setEntries] = useState({});
  const [todayBills, setTodayBills] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Load opening stock (carry-over from yesterday)
      const opening = await getOpeningStock(date);
      setOpeningStock(opening);

      // Check if closing stock already entered today
      const existing = await getClosingStock(date);
      if (existing) {
        setEntries(existing.entries || {});
        setAlreadySaved(true);
      } else {
        // Pre-fill with opening stock (default: assume nothing left)
        const init = {};
        STOCK_ITEMS.forEach((item) => {
          init[item.id] = { leftover: 0, notes: '' };
        });
        setEntries(init);
      }

      // Load today's bills for summary
      const bills = await getTodayBills();
      setTodayBills(bills);
      setTotalRevenue(bills.reduce((s, b) => s + b.total, 0));
      setLoading(false);
    };
    load();
  }, [date]);

  const handleChange = (itemId, value) => {
    const num = value === '' ? 0 : parseFloat(value) || 0;
    setEntries((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), leftover: num },
    }));
    setAlreadySaved(false);
  };

  const handleNotesChange = (itemId, notes) => {
    setEntries((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), notes },
    }));
  };

  const handleSave = async () => {
    playButtonPress();
    await saveClosingStock(date, entries);
    playCheckoutSuccess();
    setSaved(true);
    setAlreadySaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400 text-xl animate-pulse">Loading stock data...</p>
      </div>
    );
  }

  // Group by category
  const grouped = {};
  STOCK_ITEMS.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const categoryLabels = {
    buff_nihari: { name: 'Buff Nihari', icon: '🍲' },
    mutton_nihari: { name: 'Mutton Nihari', icon: '🥘' },
    bheja: { name: 'Bheja', icon: '🫕' },
    grill: { name: 'Grill', icon: '🍢' },
    others: { name: 'Others & Drinks', icon: '🍛' },
  };

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
            <h1 className="text-2xl font-bold text-white">📦 Closing Stock</h1>
            <p className="text-gray-400 text-sm">{date} — Enter leftover quantities</p>
          </div>
          {alreadySaved && (
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
              ✅ Saved
            </span>
          )}
        </div>
      </div>

      {/* Today's summary bar */}
      <div className="flex gap-3 px-4 py-3 shrink-0 overflow-x-auto">
        <div className="bg-slate-700/50 rounded-xl px-4 py-2 text-center min-w-[100px]">
          <p className="text-gray-400 text-xs">Bills</p>
          <p className="text-white font-bold text-lg">{todayBills.length}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl px-4 py-2 text-center min-w-[100px]">
          <p className="text-gray-400 text-xs">Revenue</p>
          <p className="text-amber-400 font-bold text-lg">₹{totalRevenue}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl px-4 py-2 text-center min-w-[100px]">
          <p className="text-gray-400 text-xs">Items Sold</p>
          <p className="text-green-400 font-bold text-lg">
            {todayBills.reduce((s, b) => s + (b.items?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Saved confirmation */}
      {saved && (
        <div className="mx-4 mb-2 p-3 rounded-xl bg-green-500/20 text-green-400 text-center font-bold animate-slide-up">
          ✅ Closing stock saved! Will carry over to tomorrow.
        </div>
      )}

      {/* Stock entry form */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {Object.entries(grouped).map(([catId, items]) => {
          const cat = categoryLabels[catId] || { name: catId, icon: '📦' };
          return (
            <div key={catId} className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
              <h3 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span> {cat.name}
              </h3>
              <div className="space-y-3">
                {items.map((item) => {
                  const entry = entries[item.id] || { leftover: 0, notes: '' };
                  const opening = openingStock[item.id] || 0;
                  const displayOpening = item.unit === 'kg' ? (opening / 1000).toFixed(2) : opening;

                  return (
                    <div key={item.id} className="bg-slate-800/50 rounded-xl p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">{item.name}</p>
                          <p className="text-gray-500 text-xs">
                            Opening: {displayOpening} {item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step={item.unit === 'kg' ? '0.5' : '1'}
                            value={entry.leftover || ''}
                            onChange={(e) => handleChange(item.id, e.target.value)}
                            placeholder="0"
                            className="w-20 py-2 px-2 rounded-lg bg-slate-700 border border-slate-600 
                              text-white text-sm text-center font-bold
                              focus:border-amber-500 focus:outline-none transition-colors"
                          />
                          <span className="text-gray-400 text-xs w-6">{item.unit}</span>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={entry.notes || ''}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        placeholder="Notes (optional)"
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-700/50 border border-slate-600/50 
                          text-gray-300 text-xs focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="p-4 border-t border-slate-700 shrink-0">
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 
            text-white text-xl font-bold btn-press shadow-xl
            active:from-amber-600 active:to-orange-700 transition-all"
        >
          💾 Save Closing Stock
        </button>
        <p className="text-gray-500 text-xs text-center mt-2">
          Today's leftover → Tomorrow's opening stock
        </p>
      </div>
    </div>
  );
}
