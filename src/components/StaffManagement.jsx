import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/storage';
import { playButtonPress, playCheckoutSuccess } from '../utils/audio';

const ROLES = ['Owner', 'Manager', 'Cashier', 'Chef', 'Waiter', 'Cleaner', 'Other'];

const empty = { name: '', phone: '', role: 'Cashier', employmentType: 'monthly', baseSalary: 0, joinDate: '', status: 'active', notes: '' };

export default function StaffManagement({ onBack }) {
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState(null);
  const [salaryTab, setSalaryTab] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const saved = await getSetting('staff_members');
    setStaff(Array.isArray(saved) ? saved : []);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const saveStaff = async (member) => {
    let updated = staff.find(s => s.id === member.id) ? staff.map(s => s.id === member.id ? member : s) : [...staff, member];
    setStaff(updated);
    await setSetting('staff_members', updated);
    setShowForm(false); setEditing(null);
    playCheckoutSuccess();
    showToast('Staff member saved!');
  };

  const deleteStaff = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    const updated = staff.filter(s => s.id !== id);
    setStaff(updated); await setSetting('staff_members', updated);
    showToast('Staff removed'); setSelected(null);
  };

  const filtered = staff.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search) || s.role?.toLowerCase().includes(search.toLowerCase()));

  const roleColors = {
    Owner: 'from-red-500 to-rose-600', Manager: 'from-amber-500 to-orange-600', Cashier: 'from-green-500 to-emerald-600',
    Chef: 'from-blue-500 to-indigo-600', Waiter: 'from-purple-500 to-violet-600', Cleaner: 'from-gray-500 to-slate-600',
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">👥 Staff Management</h1>
          <button onClick={() => { playButtonPress(); setEditing({ ...empty, id: 'staff_' + Date.now() }); setShowForm(true); }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold btn-press">+ Add</button>
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search staff..."
          className="w-full mt-3 py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
      </div>

      {toast && <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">{toast}</div>}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <span className="text-5xl block mb-4">👥</span>
            <p className="font-bold">No staff members yet</p>
          </div>
        )}
        {filtered.map(m => (
          <div key={m.id} onClick={() => { playButtonPress(); setSelected(m); }}
            className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50 cursor-pointer hover:border-amber-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${roleColors[m.role] || 'from-gray-500 to-slate-600'} flex items-center justify-center text-white font-bold text-sm`}>
                {m.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">{m.name}</p>
                <p className="text-gray-400 text-xs">{m.role} • {m.employmentType === 'monthly' ? 'Monthly' : 'Daily'} • ₹{(m.baseSalary || 0).toLocaleString()}/mo</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${m.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {m.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && !showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-md border border-slate-600" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="bg-slate-700/50 rounded-xl p-3"><span className="text-gray-400">Role:</span> <span className="text-white">{selected.role}</span></div>
              <div className="bg-slate-700/50 rounded-xl p-3"><span className="text-gray-400">Phone:</span> <span className="text-white">{selected.phone || 'N/A'}</span></div>
              <div className="bg-slate-700/50 rounded-xl p-3"><span className="text-gray-400">Type:</span> <span className="text-white capitalize">{selected.employmentType}</span></div>
              <div className="bg-slate-700/50 rounded-xl p-3"><span className="text-gray-400">Salary:</span> <span className="text-amber-400 font-bold">₹{(selected.baseSalary || 0).toLocaleString()}/{selected.employmentType === 'monthly' ? 'mo' : 'day'}</span></div>
              <div className="bg-slate-700/50 rounded-xl p-3"><span className="text-gray-400">Joined:</span> <span className="text-white">{selected.joinDate || 'N/A'}</span></div>
              {selected.notes && <div className="bg-slate-700/50 rounded-xl p-3"><span className="text-gray-400">Notes:</span> <span className="text-white">{selected.notes}</span></div>}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setEditing({ ...selected }); setShowForm(true); setSelected(null); }}
                className="flex-1 py-3 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-sm btn-press">✏️ Edit</button>
              <button onClick={() => deleteStaff(selected.id)}
                className="py-3 px-4 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm btn-press">🗑️</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto border border-slate-600" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4">{editing.name ? 'Edit Staff' : 'Add Staff'}</h3>
            <div className="space-y-3">
              <input type="text" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Full Name *"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <input type="tel" value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} placeholder="Phone Number"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <select value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={editing.employmentType} onChange={e => setEditing({ ...editing, employmentType: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                <option value="monthly">Monthly Salary</option>
                <option value="daily">Daily Wages</option>
              </select>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Base Salary (₹)</label>
                <input type="number" value={editing.baseSalary} onChange={e => setEditing({ ...editing, baseSalary: Number(e.target.value) })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              </div>
              <input type="date" value={editing.joinDate} onChange={e => setEditing({ ...editing, joinDate: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <textarea value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} placeholder="Notes" rows={2}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none resize-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-gray-300 font-bold text-sm btn-press">Cancel</button>
              <button onClick={() => { if (!editing.name.trim()) { showToast('Name required'); return; } saveStaff(editing); }}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-sm btn-press">💾 Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
