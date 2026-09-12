import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/storage';
import { playButtonPress, playCheckoutSuccess } from '../utils/audio';

const APK_CONFIG_KEY = 'apk_distribution_config';

const DEFAULT_CONFIG = {
  apkUrl: 'https://github.com/fkhaliq0-ctrl/ResturantBilling/releases/latest/download/Mehfil-E-Nihari.apk',
  appName: 'Mehfil-E-Nihari POS',
  version: '1.2.0',
  ownerPhone: '919999999999',
};

export default function SendAPK({ onBack }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [editMode, setEditMode] = useState(true); // Start in edit mode so fields are visible
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const saved = await getSetting(APK_CONFIG_KEY);
    if (saved) setConfig({ ...DEFAULT_CONFIG, ...saved });
  };

  const saveConfig = async () => {
    playButtonPress();
    await setSetting(APK_CONFIG_KEY, config);
    setEditMode(false);
    showToast('Config saved!');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const buildWhatsAppMessage = (staffPhone) => {
    const msg = encodeURIComponent(
      `📱 *${config.appName}*\n\n` +
      `Download & install the latest version:\n\n` +
      `📲 ${config.apkUrl}\n\n` +
      `Version: ${config.version}\n\n` +
      `⚠️ Before installing:\n` +
      `1. Uninstall old version if present\n` +
      `2. Allow "Install from unknown sources"\n` +
      `3. Open the link and tap Download\n\n` +
      `— Mehfil-E-Nihari Management`
    );

    // If phone number provided, send directly; otherwise open general share
    if (staffPhone && staffPhone.length >= 10) {
      const cleanPhone = staffPhone.replace(/[^0-9]/g, '');
      const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
      return `https://wa.me/${phoneWithCountry}?text=${msg}`;
    }
    return `https://wa.me/?text=${msg}`;
  };

  const handleSendWhatsApp = () => {
    playButtonPress();
    const url = buildWhatsAppMessage(phone);
    window.open(url, '_blank');
    if (phone) showToast('Opening WhatsApp...');
    else showToast('Opening WhatsApp share...');
  };

  const handleCopyLink = async () => {
    playButtonPress();
    try {
      await navigator.clipboard.writeText(config.apkUrl);
      playCheckoutSuccess();
      showToast('✅ Link copied to clipboard!');
    } catch {
      // Fallback for non-HTTPS
      const input = document.createElement('input');
      input.value = config.apkUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      playCheckoutSuccess();
      showToast('✅ Link copied!');
    }
  };

  const handleShareLink = () => {
    playButtonPress();
    if (navigator.share) {
      navigator.share({
        title: `${config.appName} Download`,
        text: `Download ${config.appName} POS app`,
        url: config.apkUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button
          onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white
            transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10"
        >
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">📱 Send APK to Staff</h1>
            <p className="text-gray-400 text-sm">Share the POS app with staff members</p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">
          {toast}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── APK Info Card ────────────────────────────────── */}
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-700/20 rounded-2xl p-5 border border-green-500/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <span className="text-4xl">📱</span>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">{config.appName}</h3>
              <p className="text-green-300 text-sm">Version {config.version}</p>
              <p className="text-gray-400 text-xs mt-1">Tap below to share the download link</p>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSendWhatsApp}
            className="py-5 rounded-2xl bg-gradient-to-br from-green-500 to-green-600
              text-white flex flex-col items-center gap-2 btn-press shadow-xl
              hover:from-green-400 hover:to-green-500 transition-all"
          >
            <span className="text-3xl">💬</span>
            <span className="text-sm font-bold">Send via WhatsApp</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="py-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
              text-white flex flex-col items-center gap-2 btn-press shadow-xl
              hover:from-blue-400 hover:to-indigo-500 transition-all"
          >
            <span className="text-3xl">📋</span>
            <span className="text-sm font-bold">Copy Link</span>
          </button>
        </div>

        <button
          onClick={handleShareLink}
          className="w-full py-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600
            text-white flex items-center justify-center gap-3 btn-press shadow-xl
            hover:from-purple-400 hover:to-violet-500 transition-all"
        >
          <span className="text-2xl">🔗</span>
          <span className="font-bold">Share Download Link</span>
        </button>

        {/* ── WhatsApp Phone Input ─────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-3">📱 Send to Specific Staff</h3>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Staff phone (e.g. 9876543210)"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 border border-slate-600
                text-white text-sm focus:border-green-500 focus:outline-none"
            />
            <button
              onClick={handleSendWhatsApp}
              disabled={!phone || phone.length < 10}
              className="px-5 py-3 rounded-xl bg-green-500 text-white font-bold text-sm
                btn-press disabled:opacity-40 disabled:cursor-not-allowed
                hover:bg-green-400 transition-colors"
            >
              Send
            </button>
          </div>
          {phone && phone.length >= 10 && (
            <p className="text-green-400 text-xs mt-2">
              ✅ Will send to: +91 {phone}
            </p>
          )}
        </div>

        {/* ── Configuration ────────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-sm">⚙️ APK Configuration</h3>
            <button
              onClick={() => { playButtonPress(); setEditMode(!editMode); }}
              className="text-amber-400 text-xs font-bold btn-press"
            >
              {editMode ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {!editMode ? (
            <div className="space-y-2 text-xs">
              <div className="bg-slate-800/50 rounded-xl p-3">
                <p className="text-gray-500">Download URL</p>
                <p className="text-white font-mono text-[11px] break-all">{config.apkUrl}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-gray-500">App Name</p>
                  <p className="text-white font-bold">{config.appName}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-gray-500">Version</p>
                  <p className="text-white font-bold">{config.version}</p>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <p className="text-gray-500">Owner Phone</p>
                <p className="text-white font-bold">{config.ownerPhone}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">APK Download URL</label>
                <input
                  type="url"
                  value={config.apkUrl}
                  onChange={(e) => setConfig({ ...config, apkUrl: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600
                    text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">App Name</label>
                  <input
                    type="text"
                    value={config.appName}
                    onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600
                      text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Version</label>
                  <input
                    type="text"
                    value={config.version}
                    onChange={(e) => setConfig({ ...config, version: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600
                      text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Owner Phone (for WhatsApp)</label>
                <input
                  type="tel"
                  value={config.ownerPhone}
                  onChange={(e) => setConfig({ ...config, ownerPhone: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600
                    text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
              <button
                onClick={saveConfig}
                className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-sm btn-press"
              >
                💾 Save Configuration
              </button>
            </div>
          )}
        </div>

        {/* ── Pre-filled WhatsApp Message Preview ──────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-2">💬 Message Preview</h3>
          <div className="bg-green-900/30 rounded-xl p-3 text-xs text-green-300 whitespace-pre-line border border-green-800/30">
            {`📱 *${config.appName}*

Download & install the latest version:

📲 ${config.apkUrl}

Version: ${config.version}

⚠️ Before installing:
1. Uninstall old version if present
2. Allow "Install from unknown sources"
3. Open the link and tap Download

— Mehfil-E-Nihari Management`}
          </div>
        </div>
      </div>
    </div>
  );
}
