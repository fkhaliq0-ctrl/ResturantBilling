import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/storage';
import { playButtonPress, playCheckoutSuccess } from '../utils/audio';

const empty = { name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '', paymentTerms: 'Net 30', category: 'General' };
const CATEGORIES = ['General', 'Meat Supplier', 'Spice Vendor', 'Dairy', 'Vegetables', 'Beverages', 'Packaging'];

export default function VendorMaster({ onBack }) {
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const saved = await getSetting('vendors');
    setVendors(Array.isArray(saved) ? saved : []);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const saveVendor = async (vendor) => {
    let updated = vendors.find(v => v.id === vendor.id) ? vendors.map(v => v.id === vendor.id ? vendor : v) : [...vendors, vendor];
    setVendors(updated); await setSetting('vendors', updated);
    setShowForm(false); setEditing(null);
    playCheckoutSuccess(); showToast('Vendor saved!');
  };

  const deleteVendor = async (id) => {
    if (!confirm('Remove this vendor?')) return;
    const updated = vendors.filter(v => v.id !== id);
    setVendors(updated); await setSetting('vendors', updated);
    showToast('Vendor removed');
  };

  const filtered = vendors.filter(v => v.name?.toLowerCase().includes(search.toLowerCase()) || v.contactPerson?.toLowerCase().includes(search.toLowerCase()) || v.phone?.includes(search));

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">🏢 Vendor Master</h1>
          <button onClick={() => { playButtonPress(); setEditing({ ...empty, id: 'vnd_' + Date.now() }); setShowForm(true); }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold btn-press">+ Add</button>
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search vendors..."
          className="w-full mt-3 py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
      </div>

      {toast && <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">{toast}</div>}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <span className="text-5xl block mb-4">🏢</span>
            <p className="font-bold">No vendors yet</p>
          </div>
        )}
        {filtered.map(v => (
          <div key={v.id} onClick={() => { playButtonPress(); setEditing({ ...v }); setShowForm(true); }}
            className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50 cursor-pointer hover:border-amber-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold">{v.name}</p>
                <p className="text-gray-400 text-xs">{v.contactPerson || ''} • {v.phone || 'No phone'}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-400">{v.category}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto border border-slate-600" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4">{editing.name ? 'Edit Vendor' : 'Add Vendor'}</h3>
            <div className="space-y-3">
              <input type="text" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Vendor Name *"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <input type="text" value={editing.contactPerson} onChange={e => setEditing({ ...editing, contactPerson: e.target.value })} placeholder="Contact Person"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <input type="tel" value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} placeholder="Phone"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <input type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} placeholder="Email"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <input type="text" value={editing.gstin} onChange={e => setEditing({ ...editing, gstin: e.target.value })} placeholder="GSTIN"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <textarea value={editing.address} onChange={e => setEditing({ ...editing, address: e.target.value })} placeholder="Address" rows={2}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={editing.paymentTerms} onChange={e => setEditing({ ...editing, paymentTerms: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                  <option>Cash</option><option>Net 7</option><option>Net 15</option><option>Net 30</option><option>Net 60</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => deleteVendor(editing.id)} className="py-3 px-4 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm btn-press">🗑️</button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-3 rounded-xl bg-slate-700 text-gray-300 font-bold text-sm btn-press">Cancel</button>
              <button onClick={() => { if (!editing.name.trim()) { showToast('Name required'); return; } saveVendor(editing); }}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-sm btn-press">💾 Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
