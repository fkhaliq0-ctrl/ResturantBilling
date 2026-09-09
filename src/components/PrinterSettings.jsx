import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/storage';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from '../utils/audio';

const DEFAULT_CONFIG = {
  printerName: '',
  paperWidth: '80mm', // 58mm or 80mm
  autoPrint: true,
  kotAutoPrint: true,
  kotCategories: { bar: '', kitchen: '', all: '' }, // category → printer routing
  printCopies: 1,
  headerText: 'Mehfil-E-Nihari',
  footerText: 'Thank you! Visit again.',
  showTax: true,
  showGSTIN: false,
};

const CONFIG_KEY = 'printer_settings';

export default function PrinterSettings({ onBack }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [toast, setToast] = useState('');
  const [testPrinting, setTestPrinting] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    const saved = await getSetting(CONFIG_KEY);
    if (saved) setConfig({ ...DEFAULT_CONFIG, ...saved });
  };

  const saveConfig = async () => {
    playButtonPress();
    await setSetting(CONFIG_KEY, config);
    playCheckoutSuccess();
    setToast('Printer settings saved!');
    setTimeout(() => setToast(''), 2500);
  };

  const testPrint = async () => {
    setTestPrinting(true);
    playButtonPress();
    setTimeout(() => {
      window.print();
      setTestPrinting(false);
      setToast('Test print sent!');
      setTimeout(() => setToast(''), 2500);
    }, 500);
  };

  const detectPrinters = async () => {
    playButtonPress();
    setToast('🔍 Scanning for printers...');
    setTimeout(() => {
      setToast('💡 Connect a USB thermal printer and it will appear in system print dialog');
      setTimeout(() => setToast(''), 3000);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">🖨️ Printer & KOT Settings</h1>
      </div>

      {toast && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">{toast}</div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Printer Setup */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50 space-y-3">
          <h3 className="text-white font-bold">🖨️ Thermal Printer</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Paper Width</label>
              <select value={config.paperWidth} onChange={e => setConfig({ ...config, paperWidth: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                <option value="58mm">58mm (Small)</option>
                <option value="80mm">80mm (Standard)</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Print Copies</label>
              <select value={config.printCopies} onChange={e => setConfig({ ...config, printCopies: Number(e.target.value) })}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
                <option value={1}>1 Copy</option>
                <option value={2}>2 Copies</option>
                <option value={3}>3 Copies</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={config.autoPrint} onChange={e => setConfig({ ...config, autoPrint: e.target.checked })}
              className="w-5 h-5 rounded accent-amber-500" />
            <span className="text-white text-sm">Auto-print bill on checkout</span>
          </label>
          <button onClick={detectPrinters}
            className="w-full py-3 rounded-xl bg-blue-500/20 text-blue-400 font-bold text-sm btn-press hover:bg-blue-500/30">
            🔍 Detect Connected Printers
          </button>
          <button onClick={testPrint} disabled={testPrinting}
            className="w-full py-3 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-sm btn-press hover:bg-amber-500/30 disabled:opacity-40">
            {testPrinting ? '⏳ Printing...' : '🖨️ Print Test Page'}
          </button>
        </div>

        {/* KOT Settings */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50 space-y-3">
          <h3 className="text-white font-bold">📋 Kitchen Order Ticket (KOT)</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={config.kotAutoPrint} onChange={e => setConfig({ ...config, kotAutoPrint: e.target.checked })}
              className="w-5 h-5 rounded accent-amber-500" />
            <span className="text-white text-sm">Auto-print KOT on new order</span>
          </label>
        </div>

        {/* Receipt Header/Footer */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50 space-y-3">
          <h3 className="text-white font-bold">🧾 Receipt Customization</h3>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Header Text</label>
            <input type="text" value={config.headerText} onChange={e => setConfig({ ...config, headerText: e.target.value })}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Footer Text</label>
            <input type="text" value={config.footerText} onChange={e => setConfig({ ...config, footerText: e.target.value })}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={config.showTax} onChange={e => setConfig({ ...config, showTax: e.target.checked })}
              className="w-5 h-5 rounded accent-amber-500" />
            <span className="text-white text-sm">Show tax breakdown on receipt</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={config.showGSTIN} onChange={e => setConfig({ ...config, showGSTIN: e.target.checked })}
              className="w-5 h-5 rounded accent-amber-500" />
            <span className="text-white text-sm">Show GSTIN on receipt</span>
          </label>
        </div>

        <button onClick={saveConfig}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold btn-press shadow-xl">
          💾 Save Printer Settings
        </button>
      </div>
    </div>
  );
}
