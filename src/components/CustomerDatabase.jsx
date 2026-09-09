import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/storage';
import { getAll } from '../utils/storage';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from '../utils/audio';

export default function CustomerDatabase({ onBack }) {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const empty = { name: '', phone: '', email: '', gstin: '', address: '', loyaltyPoints: 0, totalVisits: 0, totalSpend: 0, lastVisit: null };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const saved = await getSetting('customers');
    setCustomers(Array.isArray(saved) ? saved : []);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const saveCustomer = async (cust) => {
    let updated;
    if (customers.find(c => c.id === cust.id)) {
      updated = customers.map(c => c.id === cust.id ? cust : c);
    } else {
      updated = [...customers, cust];
    }
    setCustomers(updated);
    await setSetting('customers', updated);
    setShowForm(false);
    setEditing(null);
    playCheckoutSuccess();
    showToast('Customer saved!');
  };

  const deleteCustomer = async (id) => {
    if (!confirm('Delete this customer?')) return;
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    await setSetting('customers', updated);
    showToast('Customer deleted');
    setSelectedCustomer(null);
  };

  const linkBill = async (customer) => {
    // Called from checkout to link a bill to a customer
    playButtonPress();
    const updated = customers.map(c => {
      if (c.id === customer.id) {
        return {
          ...c,
          totalVisits: (c.totalVisits || 0) + 1,
          lastVisit: new Date().toISOString(),
        };
      }
      return c;
    });
    setCustomers(updated);
    await setSetting('customers', updated);
  };

  const addLoyaltyPoints = async (customerId, points) => {
    const updated = customers.map(c =>
      c.id === customerId ? { ...c, loyaltyPoints: (c.loyaltyPoints || 0) + points } : c
    );
    setCustomers(updated);
    await setSetting('customers', updated);
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">👤 Customer Database</h1>
          <button onClick={() => { playButtonPress(); setEditing({ ...empty, id: 'cust_' + Date.now() }); setShowForm(true); }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold btn-press">+ Add</button>
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name, phone, or email..."
          className="w-full mt-3 py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
      </div>

      {toast && <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">{toast}</div>}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <span className="text-5xl block mb-4">👤</span>
            <p className="font-bold">No customers yet</p>
            <p className="text-sm">Add your first customer to start tracking</p>
          </div>
        )}
        {filtered.map(cust => (
          <div key={cust.id} onClick={() => { playButtonPress(); setSelectedCustomer(cust); }}
            className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50 cursor-pointer hover:border-amber-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold">{cust.name}</p>
                <p className="text-gray-400 text-xs">{cust.phone || 'No phone'}</p>
              </div>
              <div className="text-right">
                <p className="text-amber-400 text-xs font-bold">{cust.loyaltyPoints || 0} pts</p>
                <p className="text-gray-500 text-xs">{cust.totalVisits || 0} visits</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && !showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto border border-slate-600" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">{selectedCustomer.name}</h3>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="bg-slate-700/50 rounded-xl p-3"><span className="text-gray-400">Phone:</span> <span className="text-white">{selectedCustomer.phone || 'N/A'}</span></div>
              <div className="bg-slate-700/50 rounded-xl p-3"><span className="text-gray-400">Email:</span> <span className="text-white">{selectedCustomer.email || 'N/A'}</span></div>
              <div className="bg-slate-700/50 rounded-xl p-3"><span className="text-gray-400">GSTIN:</span> <span className="text-white">{selectedCustomer.gstin || 'N/A'}</span></div>
              <div className="bg-slate-700/50 rounded-xl p-3"><span className="text-gray-400">Address:</span> <span className="text-white">{selectedCustomer.address || 'N/A'}</span></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-500/20 rounded-xl p-3 text-center">
                  <p className="text-amber-400 text-xl font-bold">{selectedCustomer.totalVisits || 0}</p>
                  <p className="text-gray-400 text-xs">Visits</p>
                </div>
                <div className="bg-green-500/20 rounded-xl p-3 text-center">
                  <p className="text-green-400 text-xl font-bold">{selectedCustomer.loyaltyPoints || 0}</p>
                  <p className="text-gray-400 text-xs">Points</p>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-3 text-center">
                  <p className="text-blue-400 text-xl font-bold">₹{(selectedCustomer.totalSpend || 0).toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">Total Spend</p>
                </div>
              </div>
              {selectedCustomer.lastVisit && (
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <span className="text-gray-400">Last Visit:</span> <span className="text-white">{new Date(selectedCustomer.lastVisit).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setEditing({ ...selectedCustomer }); setShowForm(true); setSelectedCustomer(null); }}
                className="flex-1 py-3 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-sm btn-press">✏️ Edit</button>
              <button onClick={() => deleteCustomer(selectedCustomer.id)}
                className="py-3 px-4 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm btn-press">🗑️</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto border border-slate-600" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4">{editing.name ? 'Edit Customer' : 'Add Customer'}</h3>
            <div className="space-y-3">
              <input type="text" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Full Name *"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <input type="tel" value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} placeholder="Phone Number"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <input type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} placeholder="Email"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <input type="text" value={editing.gstin} onChange={e => setEditing({ ...editing, gstin: e.target.value })} placeholder="GSTIN (for B2B)"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <textarea value={editing.address} onChange={e => setEditing({ ...editing, address: e.target.value })} placeholder="Address" rows={2}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none resize-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-gray-300 font-bold text-sm btn-press">Cancel</button>
              <button onClick={() => { if (!editing.name.trim()) { showToast('Name is required'); return; } saveCustomer(editing); }}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-sm btn-press">💾 Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
