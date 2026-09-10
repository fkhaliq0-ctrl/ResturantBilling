import React from 'react';
import { playButtonPress } from '../utils/audio';

export default function TableSelector({ onSelectTable, onBack }) {
  const tables = Array.from({ length: 12 }, (_, i) => 'Table ' + (i + 1));

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white p-5 animate-fade-in overflow-y-auto">
      <button onClick={() => { playButtonPress(); onBack(); }} className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white text-lg btn-press px-3 py-1 rounded-xl bg-white/10 w-fit">← Back</button>
      <h1 className="text-2xl font-bold mb-4">🍽️ Select Dine-In Table</h1>
      <div className="grid grid-cols-3 gap-4">
        {tables.map(table => (
          <button key={table} onClick={() => { playButtonPress(); onSelectTable(table); }} className="py-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-bold text-xl btn-press shadow-lg">
            {table}
          </button>
        ))}
      </div>
    </div>
  );
}
