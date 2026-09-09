import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/storage';
import { playButtonPress, playCheckoutSuccess } from '../utils/audio';

const ROLES = ['Owner', 'Manager', 'Cashier'];
const MODULES = [
  { id: 'billing', name: '💰 Billing & Orders', desc: 'Main POS screen' },
  { id: 'reports', name: '📊 Daily Reports', desc: 'Sales & daily report' },
  { id: 'owner_reports', name: '📈 Owner Reports', desc: 'Revenue & analytics' },
  { id: 'expenses', name: '💸 Expense Reports', desc: 'Track expenses' },
  { id: 'menu_master', name: '🍽️ Menu Master', desc: 'Edit menu items & prices' },
  { id: 'inventory', name: '📦 Inventory & Stock', desc: 'Stock management' },
  { id: 'staff', name: '👥 Staff Management', desc: 'Add/edit staff' },
  { id: 'customers', name: '👤 Customer Database', desc: 'Customer profiles' },
  { id: 'vendor', name: '🏢 Vendor Master', desc: 'Supplier profiles' },
  { id: 'purchase', name: '📋 Purchase Entry', desc: 'Record purchases' },
  { id: 'closing', name: '📊 Closing Stock', desc: 'Daily stock count' },
  { id: 'eod', name: '🌙 EOD Closing', desc: 'End of day settlement' },
  { id: 'audit', name: '📝 Audit Log', desc: 'View edit history' },
  { id: 'settings', name: '⚙️ Settings', desc: 'App configuration' },
  { id: 'business', name: '🏢 Business Profile', desc: 'GST & business info' },
  { id: 'roles', name: '🛡️ Role Management', desc: 'Access control' },
  { id: 'sync', name: '☁️ Cloud Sync', desc: 'Multi-device sync' },
  { id: 'kds', name: '🍳 Kitchen Display', desc: 'Kitchen order display' },
];

const PERMS = ['view', 'edit', 'none'];

const DEFAULT_PERMS = {
  Owner: Object.fromEntries(MODULES.map(m => [m.id, 'edit'])),
  Manager: Object.fromEntries(MODULES.map(m => [m.id, ['billing', 'reports', 'menu_master', 'kds'].includes(m.id) ? 'edit' : ['staff', 'settings', 'business', 'roles', 'sync'].includes(m.id) ? 'none' : 'view'])),
  Cashier: Object.fromEntries(MODULES.map(m => [m.id, ['billing', 'reports'].includes(m.id) ? 'view' : 'none'])),
};

export default function RolePermissions({ onBack }) {
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [toast, setToast] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const saved = await getSetting('role_permissions');
    if (saved) {
      // Merge with defaults so new modules are included
      const merged = { ...DEFAULT_PERMS };
      ROLES.forEach(role => {
        if (saved[role]) {
          merged[role] = { ...DEFAULT_PERMS[role], ...saved[role] };
        }
      });
      setPerms(merged);
    }
  };

  const savePerms = async () => {
    playButtonPress();
    await setSetting('role_permissions', perms);
    playCheckoutSuccess();
    setToast('Permissions saved!');
    setTimeout(() => setToast(''), 2500);
  };

  const togglePerm = (role, moduleId) => {
    playButtonPress();
    setPerms(prev => {
      const current = prev[role]?.[moduleId] || 'none';
      const next = current === 'none' ? 'view' : current === 'view' ? 'edit' : 'none';
      return { ...prev, [role]: { ...prev[role], [moduleId]: next } };
    });
  };

  const permStyles = {
    edit: 'bg-green-500/30 text-green-400 border-green-500/40',
    view: 'bg-amber-500/30 text-amber-400 border-amber-500/40',
    none: 'bg-slate-700/30 text-gray-500 border-slate-600/30',
  };

  const permLabels = { edit: '✏️ Edit', view: '👁️ View', none: '🚫 None' };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">🛡️ Role Management</h1>
        <p className="text-gray-400 text-xs mt-1">Tap each cell to cycle: None → View → Edit</p>
      </div>

      {toast && <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">{toast}</div>}

      <div className="flex-1 overflow-y-auto p-4">
        {/* Permission Matrix */}
        <div className="space-y-2">
          {MODULES.map(mod => (
            <div key={mod.id} className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white font-bold text-xs">{mod.name}</p>
                  <p className="text-gray-500 text-[10px]">{mod.desc}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(role => {
                  const perm = perms[role]?.[mod.id] || 'none';
                  return (
                    <button key={role} onClick={() => togglePerm(role, mod.id)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all btn-press ${permStyles[perm]}`}>
                      <span className="block">{role}</span>
                      <span className="block">{permLabels[perm]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button onClick={savePerms}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold btn-press shadow-xl mt-4 sticky bottom-0">
          💾 Save Permissions
        </button>
      </div>
    </div>
  );
}
