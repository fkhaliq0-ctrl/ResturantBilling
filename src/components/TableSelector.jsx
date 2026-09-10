import { useState } from 'react';
import { playButtonPress } from '../utils/audio';

const TABLES = Array.from({ length: 20 }, (_, i) => i + 1);

export default function TableSelector({ activeTable, onSelectTable, orderType, onBack, tableOrders = {} }) {
  const [selected, setSelected] = useState(activeTable || null);

  const handleSelect = (num) => {
    playButtonPress();
    setSelected(num);
    onSelectTable(num);
  };

  const getTableStatus = (num) => {
    if (selected === num) return 'active';
    const order = tableOrders[num];
    if (order && order.length > 0) return 'occupied';
    return 'empty';
  };

  const getTableStyles = (status) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-300 text-white shadow-xl scale-105 ring-2 ring-amber-300/50';
      case 'occupied':
        return 'bg-gradient-to-br from-green-700 to-emerald-800 border-green-500 text-white shadow-lg';
      default:
        return 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-gray-300 hover:border-amber-400 hover:scale-105';
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍽️</span>
          <div>
            <h2 className="text-xl font-bold text-white">
              {orderType === 'dine-in' ? 'Select Table' : 'Takeaway Order'}
            </h2>
            <p className="text-gray-400 text-sm">
              {orderType === 'dine-in'
                ? 'Tap a table to start or switch order'
                : 'Counter order — no table needed'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            playButtonPress();
            onBack();
          }}
          className="w-11 h-11 rounded-xl bg-slate-700/60 flex items-center justify-center 
            text-xl btn-press hover:bg-slate-600/60 transition-colors"
          title="Back to Order Type"
        >
          ←
        </button>
      </div>

      {/* Active table pill */}
      {selected && (
        <div className="px-4 py-2 shrink-0">
          <div className="flex items-center justify-between bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪑</span>
              <div>
                <p className="text-amber-300 font-bold text-sm">Active Table</p>
                <p className="text-white text-lg font-bold">Table {selected}</p>
              </div>
            </div>
            {tableOrders[selected] && tableOrders[selected].length > 0 && (
              <span className="bg-green-500/30 text-green-300 text-xs font-bold px-3 py-1 rounded-full">
                {tableOrders[selected].reduce((s, i) => s + i.qty, 0)} items
              </span>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-2 flex items-center gap-4 text-xs text-gray-400 shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500"></span> Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-600"></span> Occupied
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-600"></span> Empty
        </span>
      </div>

      {/* Table grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {TABLES.map((num) => {
            const status = getTableStatus(num);
            const style = getTableStyles(status);
            const order = tableOrders[num];
            const itemCount = order ? order.reduce((s, i) => s + i.qty, 0) : 0;

            return (
              <button
                key={num}
                onClick={() => handleSelect(num)}
                className={`
                  relative rounded-2xl p-3 flex flex-col items-center justify-center
                  border-2 transition-all duration-150 btn-press
                  min-h-[90px] ${style}
                `}
              >
                <span className="text-2xl mb-1">
                  {status === 'occupied' ? '🍽️' : status === 'active' ? '✅' : '🪑'}
                </span>
                <span className="font-bold text-base">
                  T{num}
                </span>
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 
                    text-white text-[10px] font-bold flex items-center justify-center shadow">
                    {itemCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm button */}
      {selected && (
        <div className="px-4 pb-4 pt-2 shrink-0">
          <button
            onClick={() => {
              playButtonPress();
              onBack();
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 
              text-white text-xl font-bold btn-press shadow-xl 
              hover:from-amber-400 hover:to-orange-500 transition-all"
          >
            ✅ Start Order — Table {selected}
          </button>
        </div>
      )}
    </div>
  );
}
