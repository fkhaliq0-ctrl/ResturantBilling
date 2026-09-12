import React, { useState, useEffect, useRef } from 'react';
import { loadBusinessProfileSync } from '../utils/storage';

export default function BusinessProfile({ onBack }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [businessData, setBusinessData] = useState({
    name: 'MEHFIL-E-NIHARI',
    tagline: 'Authentic Taste & Tradition',
    address: '12A/107, Main Road, Opp metro Pillar No 196, Maujpur, Delhi - 110053',
    city: 'Delhi',
    state: 'Delhi',
    phone: '+91 9990515151',
    email: '',
    gst: '07ABXFM3984H1ZG',
    gstin: '07ABXFM3984H1ZG',
    fssai: '23323004001056',
    invoicePrefix: 'MEN',
    nextInvoiceNo: '1001',
    upiId: '',
    bankName: '',
    accountNo: '',
    ifsc: '',
    logo: '/logo.png',
    logoUrl: '',
  });
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const loaded = loadBusinessProfileSync();
      setBusinessData(prev => ({
        ...prev,
        ...loaded,
        name: loaded.restaurantName || loaded.name || prev.name,
        gstin: loaded.gstin || loaded.gst || prev.gstin,
        gst: loaded.gstin || loaded.gst || prev.gst,
        logo: loaded.logoPath || loaded.logo || prev.logo,
        tagline: loaded.tagline || prev.tagline,
        city: loaded.city || prev.city,
        state: loaded.state || prev.state,
        email: loaded.email || prev.email,
        fssai: loaded.fssai || prev.fssai,
        invoicePrefix: loaded.invoicePrefix || prev.invoicePrefix,
        nextInvoiceNo: loaded.nextInvoiceNo || prev.nextInvoiceNo,
        upiId: loaded.upiId || prev.upiId,
        bankName: loaded.bankName || prev.bankName,
        accountNo: loaded.accountNo || prev.accountNo,
        ifsc: loaded.ifsc || prev.ifsc,
        logoUrl: loaded.logoUrl || prev.logoUrl || '',
      }));
    } catch (e) {
      console.error('Failed to load business profile:', e);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    try {
      const saveData = {
        ...businessData,
        restaurantName: businessData.name,
        gstin: businessData.gstin || businessData.gst,
        gst: businessData.gstin || businessData.gst,
        logoPath: businessData.logo,
        logo: businessData.logo,
        logoUrl: businessData.logoUrl,
        tagline: businessData.tagline,
        city: businessData.city,
        state: businessData.state,
        email: businessData.email,
        fssai: businessData.fssai,
        invoicePrefix: businessData.invoicePrefix,
        nextInvoiceNo: businessData.nextInvoiceNo,
        upiId: businessData.upiId,
        bankName: businessData.bankName,
        accountNo: businessData.accountNo,
        ifsc: businessData.ifsc,
      };
      localStorage.setItem('business_profile', JSON.stringify(saveData));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save. Please try again.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBusinessData(prev => ({ ...prev, logo: reader.result, logoUrl: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUrlChange = (url) => {
    setBusinessData(prev => ({ ...prev, logoUrl: url, logo: url }));
  };

  const inputCls = "mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm p-2 border focus:border-amber-500 focus:ring-1 focus:ring-amber-500";
  const labelCls = "block text-sm font-medium text-gray-300";

  const tabs = [
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'gst', icon: '🧾', label: 'GST & Tax' },
    { id: 'invoice', icon: '🧾', label: 'Invoice' },
    { id: 'bank', icon: '🏦', label: 'Bank' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto text-white">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {onBack && (
          <button onClick={onBack} className="px-3 py-1.5 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition">
            ← Back
          </button>
        )}
        <h2 className="text-xl md:text-2xl font-bold">Business Profile & Settings</h2>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-700 pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition ${
              activeTab === t.id ? 'bg-amber-600 text-white shadow-lg' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Save Feedback */}
      {saved && (
        <div className="mb-4 p-3 rounded-lg bg-green-900/50 border border-green-600 text-green-300 text-sm flex items-center gap-2">
          ✅ Business profile saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 bg-gray-900 p-6 rounded-lg border border-gray-800">

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Restaurant Name *</label>
              <input type="text" required value={businessData.name} onChange={(e) => setBusinessData({...businessData, name: e.target.value})} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tagline / Slogan</label>
              <input type="text" value={businessData.tagline} onChange={(e) => setBusinessData({...businessData, tagline: e.target.value})} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Full Address *</label>
              <input type="text" required value={businessData.address} onChange={(e) => setBusinessData({...businessData, address: e.target.value})} className={inputCls} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input type="text" value={businessData.city} onChange={(e) => setBusinessData({...businessData, city: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input type="text" value={businessData.state} onChange={(e) => setBusinessData({...businessData, state: e.target.value})} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Contact Phone *</label>
                <input type="tel" required value={businessData.phone} onChange={(e) => setBusinessData({...businessData, phone: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={businessData.email} onChange={(e) => setBusinessData({...businessData, email: e.target.value})} placeholder="restaurant@email.com" className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* ── GST & Tax Tab ── */}
        {activeTab === 'gst' && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>GSTIN / Tax ID</label>
              <input type="text" value={businessData.gstin || businessData.gst} onChange={(e) => setBusinessData({...businessData, gstin: e.target.value, gst: e.target.value})} placeholder="e.g. 07ABXFM3984H1ZG" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>FSSAI License No.</label>
              <input type="text" value={businessData.fssai} onChange={(e) => setBusinessData({...businessData, fssai: e.target.value})} placeholder="e.g. 23323004001056" className={inputCls} />
            </div>
            <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-400">
              💡 Enter your GSTIN and FSSAI numbers here. These will automatically appear on all invoices, receipts, and thermal prints.
            </div>
          </div>
        )}

        {/* ── Invoice Tab ── */}
        {activeTab === 'invoice' && (
          <div className="space-y-5">
            {/* Logo Section */}
            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
              <h3 className="text-sm font-bold text-amber-400 mb-3">🖼️ Restaurant Logo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Browser */}
                <div>
                  <label className={labelCls}>📂 Upload from PC</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-600 border border-gray-600 transition text-left truncate">
                      {businessData.logo && businessData.logo.startsWith('data:') ? '📷 Image loaded — click to change' : '📂 Browse image file...'}
                    </button>
                  </div>
                </div>
                {/* URL Input */}
                <div>
                  <label className={labelCls}>🔗 Image URL / Web Link</label>
                  <input type="url" value={businessData.logoUrl || ''} onChange={(e) => handleLogoUrlChange(e.target.value)}
                    placeholder="https://example.com/logo.png" className={inputCls} />
                </div>
              </div>
              {/* Logo Preview */}
              {businessData.logo && (
                <div className="mt-4 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-white flex items-center justify-center overflow-hidden border-2 border-amber-500">
                    <img src={businessData.logo} alt="Logo Preview" className="max-w-full max-h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                  <div className="text-xs text-gray-400">
                    <p>Preview of current logo</p>
                    <button type="button" onClick={() => setBusinessData(prev => ({...prev, logo: '', logoUrl: ''}))}
                      className="mt-1 text-red-400 hover:text-red-300 underline text-xs">
                      Remove logo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Settings */}
            <div>
              <h3 className="text-sm font-bold text-amber-400 mb-3">🧾 Invoice Numbering</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Invoice Prefix</label>
                  <input type="text" value={businessData.invoicePrefix} onChange={(e) => setBusinessData({...businessData, invoicePrefix: e.target.value})} placeholder="MEN" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Next Invoice No.</label>
                  <input type="number" value={businessData.nextInvoiceNo} onChange={(e) => setBusinessData({...businessData, nextInvoiceNo: e.target.value})} placeholder="1001" className={inputCls} />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Preview: <span className="font-mono text-amber-400 text-lg">{businessData.invoicePrefix}-{businessData.nextInvoiceNo}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Bank Tab ── */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>UPI ID (for QR codes)</label>
              <input type="text" value={businessData.upiId} onChange={(e) => setBusinessData({...businessData, upiId: e.target.value})} placeholder="e.g. mehfil@upi" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bank Name</label>
              <input type="text" value={businessData.bankName} onChange={(e) => setBusinessData({...businessData, bankName: e.target.value})} placeholder="e.g. State Bank of India" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Account Number</label>
                <input type="text" value={businessData.accountNo} onChange={(e) => setBusinessData({...businessData, accountNo: e.target.value})} placeholder="Account Number" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>IFSC Code</label>
                <input type="text" value={businessData.ifsc} onChange={(e) => setBusinessData({...businessData, ifsc: e.target.value})} placeholder="e.g. SBIN0001234" className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button type="submit"
          className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold text-lg transition shadow-lg shadow-green-600/20">
          💾 Save Business Profile
        </button>
      </form>
    </div>
  );
}
