import React from 'react';
import { playButtonPress } from '../utils/audio';

export default function CategoryGrid({ categories = [], selectedCategory, onSelectCategory, onBack }) {
  const safeCategories = Array.isArray(categories) ? categories : ['All', 'Nihari', 'Biryani', 'BBQ', 'Beverages'];

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white p-5 animate-fade-in overflow-y-auto">
      {onBack && (
        <button 
          onClick={() => { playButtonPress(); onBack(); }} 
          className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white text-lg btn-press px-3 py-1 rounded-xl bg-white/10 w-fit"
        >
          ← Back
        </button>
      )}
      <h1 className="text-2xl font-bold mb-4">📂 Select Category</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {safeCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              playButtonPress();
              onSelectCategory(cat);
            }}
            className={py-6 rounded-2xl font-bold text-xl btn-press shadow-lg transition-all }
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
