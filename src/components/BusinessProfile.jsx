import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/storage';
import { playButtonPress, playCheckoutSuccess } from '../utils/audio';

const DEFAULT = {
  restaurantName: 'Mehfil-E-Nihari', tagline: 'Authentic Taste & Tradition',
  address: '', city: '', state: '', phone: '', email: '',
  gstin: '', gstRate: 5, gstInclusive: false, fssai: '',
  invoicePrefix: 'MEN', nextInvoiceNo: 1001, bankName: '', bankAccount: '', ifsc: '',
  upiId: '', pan: '',
};

export default function BusinessProfile({ onBack }) {
  const [config, setConfig] = useState(DEFAULT);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('profile');

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    const saved = await getSetting('business_profile');
    if (saved) setConfig({ ...DEFAULT, ...saved });
  };

  const saveConfig = async () => {
    playButtonPress();
    await setSetting('business_profile', config);
    playCheckoutSuccess();
    setToast('Business profile saved!');
    setTimeout(() => setToast(''), 2500);
  };

  const update = (key, val) => setConfig({ ...config, [key]: val });

  const tabs = [
    { id: 'profile', label: '🏢 Profile', icon: '🏢' },
    { id: 'tax', label: '🧾 GST & Tax', icon: '🧾' },
    { id: 'invoice', label: '📄 Invoice', icon: '📄' },
    { id: 'bank', label: '🏦 Bank', icon: '🏦' },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">🏢 Business Profile & GST</h1>
      </div>

      {toast && <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">{toast}</div>}

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${tab === t.id ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-gray-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === 'profile' && (
          <>
            <Field label="Restaurant Name" value={config.restaurantName} onChange={v => update('restaurantName', v)} />
            <Field label="Tagline" value={config.tagline} onChange={v => update('tagline', v)} />
            <Field label="Full Address" value={config.address} onChange={v => update('address', v)} textarea />
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" value={config.city} onChange={v => update('city', v)} />
              <Field label="State" value={config.state} onChange={v => update('state', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" value={config.phone} onChange={v => update('phone', v)} type="tel" />
              <Field label="Email" value={config.email} onChange={v => update('email', v)} type="email" />
            </div>
          </>
        )}

        {tab === 'tax' && (
          <>
            <Field label="GSTIN" value={config.gstin} onChange={v => update('gstin', v)} placeholder="27AABCU9603R1ZM" />
            <Field label="FSSAI License No." value={config.fssai} onChange={v => update('fssai', v)} />
            <Field label="PAN Number" value={config.pan} onChange={v => update('pan', v)} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">GST Rate (%)</label>
                <select value={config.gstRate} onChange={e => update('gstRate', Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                  <option value={0}>0% (Exempt)</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Tax Mode</label>
                <select value={config.gstInclusive ? 'inclusive' : 'exclusive'} onChange={e => update('gstInclusive', e.target.value === 'inclusive')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                  <option value="exclusive">Exclusive (Add GST on top)</option>
                  <option value="inclusive">Inclusive (GST included in price)</option>
                </select>
              </div>
            </div>
          </>
        )}

        {tab === 'invoice' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Invoice Prefix" value={config.invoicePrefix} onChange={v => update('invoicePrefix', v)} placeholder="MEN" />
              <Field label="Next Invoice No." value={config.nextInvoiceNo} onChange={v => update('nextInvoiceNo', Number(v))} type="number" />
            </div>
            <div className="bg-slate-700/30 rounded-xl p-3 text-xs text-gray-400">
              💡 Preview: <span className="text-white font-bold">{config.invoicePrefix}-{String(config.nextInvoiceNo).padStart(4, '0')}</span>
            </div>
          </>
        )}

        {tab === 'bank' && (
          <>
            <Field label="Bank Name" value={config.bankName} onChange={v => update('bankName', v)} />
            <Field label="Account Number" value={config.bankAccount} onChange={v => update('bankAccount', v)} />
            <Field label="IFSC Code" value={config.ifsc} onChange={v => update('ifsc', v)} />
            <Field label="UPI ID" value={config.upiId} onChange={v => update('upiId', v)} placeholder="merchant@upi" />
          </>
        )}

        <button onClick={saveConfig}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold btn-press shadow-xl mt-4">
          💾 Save Business Profile
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '', textarea }) {
  if (textarea) {
    return (
      <div>
        <label className="text-gray-400 text-xs mb-1 block">{label}</label>
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none resize-none" />
      </div>
    );
  }
  return (
    <div>
      <label className="text-gray-400 text-xs mb-1 block">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} placeholder={placeholder}
        className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
    </div>
  );
}
