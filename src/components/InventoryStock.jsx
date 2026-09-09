import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/storage';
import { playButtonPress, playCheckoutSuccess } from '../utils/audio';

const UNITS = ['kg', 'g', 'pcs', 'litre', 'ml', 'dozen', 'pack'];
const CATEGORIES = ['Meat', 'Spices', 'Vegetables', 'Dairy', 'Beverages', 'Packaging', 'Other'];

const empty = { name: '', category: 'Meat', stock: 0, unit: 'kg', reorderLevel: 10, costPerUnit: 0, supplier: '' };

export default function InventoryStock({ onBack }) {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [toast, setToast] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const saved = await getSetting('inventory_items');
    setItems(Array.isArray(saved) ? saved : []);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const saveItem = async (item) => {
    let updated = items.find(i => i.id === item.id) ? items.map(i => i.id === item.id ? item : i) : [...items, item];
    setItems(updated); await setSetting('inventory_items', updated);
    setShowForm(false); setEditing(null);
    playCheckoutSuccess(); showToast('Inventory item saved!');
  };

  const deleteItem = async (id) => {
    if (!confirm('Remove from inventory?')) return;
    const updated = items.filter(i => i.id !== id);
    setItems(updated); await setSetting('inventory_items', updated);
    showToast('Item removed');
  };

  const adjustStock = async (id, delta) => {
    const updated = items.map(i => i.id === id ? { ...i, stock: Math.max(0, (i.stock || 0) + delta) } : i);
    setItems(updated); await setSetting('inventory_items', updated);
  };

  const filtered = items.filter(i => {
    const matchSearch = i.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || i.category === filterCat;
    return matchSearch && matchCat;
  });

  const lowStockItems = items.filter(i => (i.stock || 0) <= (i.reorderLevel || 0) && (i.stock || 0) > 0);
  const outOfStock = items.filter(i => (i.stock || 0) === 0);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">📦 Inventory & Stock</h1>
          <button onClick={() => { playButtonPress(); setEditing({ ...empty, id: 'inv_' + Date.now() }); setShowForm(true); }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold btn-press">+ Add</button>
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search inventory..."
          className="w-full mt-3 py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
        {/* Alert badges */}
        <div className="flex gap-2 mt-2">
          {lowStockItems.length > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400">⚠️ {lowStockItems.length} Low Stock</span>}
          {outOfStock.length > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400">🚫 {outOfStock.length} Out of Stock</span>}
        </div>
      </div>

      {toast && <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">{toast}</div>}

      {/* Category filter */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto shrink-0">
        <button onClick={() => setFilterCat('all')} className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${filterCat === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-gray-400'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${filterCat === c ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-gray-400'}`}>{c}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <span className="text-5xl block mb-4">📦</span>
            <p className="font-bold">No inventory items</p>
          </div>
        )}
        {filtered.map(item => {
          const isLow = (item.stock || 0) <= (item.reorderLevel || 0) && (item.stock || 0) > 0;
          const isOut = (item.stock || 0) === 0;
          return (
            <div key={item.id} className={`bg-slate-700/30 rounded-2xl p-3 border ${isOut ? 'border-red-500/40' : isLow ? 'border-amber-500/40' : 'border-slate-600/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{item.name}</p>
                  <p className="text-gray-400 text-xs">{item.category} • ₹{(item.costPerUnit || 0)}/{item.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustStock(item.id, -1)} className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold btn-press">−</button>
                  <div className="text-center w-16">
                    <p className={`font-bold text-lg ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'}`}>{item.stock || 0}</p>
                    <p className="text-gray-500 text-[10px]">{item.unit}</p>
                  </div>
                  <button onClick={() => adjustStock(item.id, 1)} className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center font-bold btn-press">+</button>
                  <button onClick={() => { playButtonPress(); setEditing({ ...item }); setShowForm(true); }}
                    className="w-8 h-8 rounded-lg bg-slate-600/50 text-gray-400 flex items-center justify-center text-sm btn-press">✏️</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Form */}
      {showForm && editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto border border-slate-600" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4">{editing.name ? 'Edit Item' : 'Add Item'}</h3>
            <div className="space-y-3">
              <input type="text" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Item Name *"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Stock Qty</label>
                  <input type="number" value={editing.stock} onChange={e => setEditing({ ...editing, stock: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Unit</label>
                  <select value={editing.unit} onChange={e => setEditing({ ...editing, unit: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Reorder Level</label>
                  <input type="number" value={editing.reorderLevel} onChange={e => setEditing({ ...editing, reorderLevel: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Cost per Unit (₹)</label>
                  <input type="number" value={editing.costPerUnit} onChange={e => setEditing({ ...editing, costPerUnit: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
                </div>
              </div>
              <input type="text" value={editing.supplier} onChange={e => setEditing({ ...editing, supplier: e.target.value })} placeholder="Supplier (optional)"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-gray-300 font-bold text-sm btn-press">Cancel</button>
              <button onClick={() => { if (!editing.name.trim()) { showToast('Name required'); return; } saveItem(editing); }}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-sm btn-press">💾 Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
