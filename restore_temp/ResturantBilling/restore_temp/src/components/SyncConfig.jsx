import { useState, useEffect } from 'react';
import {
  getFirebaseConfig, testConnection, isSyncEnabled,
  getDeviceName, setDeviceName, isCloudConnected, onConnectionChange,
} from '../utils/cloud';
import {
  initSync, getSyncStatus, fullSyncAll, fullPullAll, onSyncChange,
  setupCloudSync, stopSync,
} from '../utils/sync';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from '../utils/audio';

export default function SyncConfig({ onBack }) {
  const [config, setConfig] = useState(null);
  const [syncEnabled, setEnabled] = useState(false);
  const [deviceName, setDevice] = useState('');
  const [status, setStatus] = useState(getSyncStatus());
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  // Form fields
  const [formFields, setFormFields] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });

  useEffect(() => {
    loadData();
    const unsubSync = onSyncChange(setStatus);
    const unsubConn = onConnectionChange(setConnected);
    return () => { unsubSync(); unsubConn(); };
  }, []);

  const loadData = async () => {
    const cfg = await getFirebaseConfig();
    setConfig(cfg);
    const enabled = await isSyncEnabled();
    setEnabled(enabled);
    setDevice(getDeviceName());
    setConnected(isCloudConnected());

    if (cfg) {
      setFormFields({
        apiKey: cfg.apiKey || '',
        authDomain: cfg.authDomain || '',
        projectId: cfg.projectId || '',
        storageBucket: cfg.storageBucket || '',
        messagingSenderId: cfg.messagingSenderId || '',
        appId: cfg.appId || '',
      });
    }

    if (enabled) {
      initSync();
    }
  };

  const handleSaveConfig = async () => {
    if (!formFields.projectId || !formFields.apiKey) {
      playErrorSound();
      setMessage('Project ID and API Key are required');
      setMsgType('error');
      return;
    }

    playButtonPress();
    setTesting(true);

    // Test with provided config
    const testConfig = {
      apiKey: formFields.apiKey,
      authDomain: formFields.authDomain || `${formFields.projectId}.firebaseapp.com`,
      projectId: formFields.projectId,
      storageBucket: formFields.storageBucket || `${formFields.projectId}.appspot.com`,
      messagingSenderId: formFields.messagingSenderId,
      appId: formFields.appId,
    };

    try {
      const ok = await setupCloudSync(testConfig, deviceName || 'Desktop');
      if (ok) {
        const result = await testConnection();
        if (result.ok) {
          playCheckoutSuccess();
          setMessage('✅ Connected to Firebase!');
          setMsgType('success');
          setEnabled(true);
          setConnected(true);
          setShowSetup(false);
        } else {
          playErrorSound();
          setMessage('❌ Connection failed: ' + result.error);
          setMsgType('error');
        }
      } else {
        playErrorSound();
        setMessage('❌ Failed to initialize cloud sync');
        setMsgType('error');
      }
    } catch (err) {
      playErrorSound();
      setMessage('❌ Error: ' + err.message);
      setMsgType('error');
    }
    setTesting(false);
  };

  const handleTestConnection = async () => {
    playButtonPress();
    setTesting(true);
    const result = await testConnection();
    setTesting(false);
    if (result.ok) {
      playCheckoutSuccess();
      setMessage('✅ ' + result.message);
      setMsgType('success');
      setConnected(true);
    } else {
      playErrorSound();
      setMessage('❌ ' + result.error);
      setMsgType('error');
      setConnected(false);
    }
  };

  const handleFullSync = async () => {
    playButtonPress();
    setSyncing(true);
    setMessage('⏳ Syncing all data to cloud...');
    setMsgType('info');
    try {
      const results = await fullSyncAll();
      const total = Object.values(results).reduce((s, r) => s + (r.count || 0), 0);
      playCheckoutSuccess();
      setMessage(`✅ Synced ${total} records to cloud`);
      setMsgType('success');
    } catch (err) {
      playErrorSound();
      setMessage('❌ Sync failed: ' + err.message);
      setMsgType('error');
    }
    setSyncing(false);
  };

  const handleFullPull = async () => {
    if (!confirm('⚠️ This will merge cloud data into local. Continue?')) return;
    playButtonPress();
    setSyncing(true);
    setMessage('⏳ Pulling data from cloud...');
    setMsgType('info');
    try {
      const results = await fullPullAll();
      const total = Object.values(results).reduce((s, r) => s + (r.count || 0), 0);
      playCheckoutSuccess();
      setMessage(`✅ Pulled ${total} records from cloud`);
      setMsgType('success');
    } catch (err) {
      playErrorSound();
      setMessage('❌ Pull failed: ' + err.message);
      setMsgType('error');
    }
    setSyncing(false);
  };

  const handleToggleSync = async () => {
    playButtonPress();
    const newVal = !syncEnabled;
    if (newVal) {
      const ok = await initSync();
      if (ok) {
        setEnabled(true);
      } else {
        playErrorSound();
        setMessage('Cannot enable — configure Firebase first');
        setMsgType('error');
      }
    } else {
      stopSync();
      setEnabled(false);
    }
  };

  const handleSaveDeviceName = () => {
    playButtonPress();
    setDeviceName(deviceName || 'Desktop');
    playCheckoutSuccess();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white 
            transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">☁️ Cloud Sync</h1>
            <p className="text-gray-400 text-sm">Multi-device real-time sync</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {connected ? '🟢 Connected' : '🔴 Offline'}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-4 mt-3 p-3 rounded-xl text-center font-bold text-sm animate-slide-up ${
          msgType === 'success' ? 'bg-green-500/20 text-green-400' :
          msgType === 'error' ? 'bg-red-500/20 text-red-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {message}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Connection Status ────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-3">📡 Sync Status</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/50 rounded-xl p-2 text-center">
              <p className="text-gray-500">Status</p>
              <p className={`font-bold ${syncEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                {syncEnabled ? '🟢 Active' : '⚫ Off'}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2 text-center">
              <p className="text-gray-500">Queue</p>
              <p className="text-amber-400 font-bold">{status.queueLength} pending</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2 text-center">
              <p className="text-gray-500">Device</p>
              <p className="text-white font-bold">{status.deviceName}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2 text-center">
              <p className="text-gray-500">Last Sync</p>
              <p className="text-gray-300 font-bold text-[10px]">
                {status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Device Name ──────────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-2">📱 Device Name</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDevice(e.target.value)}
              placeholder="e.g. Counter 1, Manager Phone"
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 
                text-white text-sm focus:border-amber-500 focus:outline-none"
            />
            <button onClick={handleSaveDeviceName}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm btn-press">
              Save
            </button>
          </div>
        </div>

        {/* ── Firebase Config ──────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-sm">🔥 Firebase Config</h3>
            <button onClick={() => setShowSetup(!showSetup)}
              className="text-amber-400 text-xs font-bold btn-press">
              {showSetup ? 'Hide' : config ? 'Edit' : 'Setup'}
            </button>
          </div>

          {config && !showSetup && (
            <div className="bg-slate-800/50 rounded-xl p-3 text-xs">
              <p className="text-gray-400">Project: <span className="text-white font-bold">{config.projectId}</span></p>
              <p className="text-gray-400">App ID: <span className="text-white font-bold">{config.appId?.slice(0, 20)}...</span></p>
            </div>
          )}

          {(!config || showSetup) && (
            <div className="space-y-2 mt-3">
              <p className="text-gray-400 text-xs">
                Get these values from <span className="text-amber-400">Firebase Console → Project Settings → General</span>
              </p>
              {[
                { key: 'projectId', label: 'Project ID', placeholder: 'mehfil-e-nihari-xxxxx', required: true },
                { key: 'apiKey', label: 'API Key', placeholder: 'AIzaSy...', required: true },
                { key: 'authDomain', label: 'Auth Domain', placeholder: 'mehfil-e-nihari-xxxxx.firebaseapp.com' },
                { key: 'storageBucket', label: 'Storage Bucket', placeholder: 'mehfil-e-nihari-xxxxx.appspot.com' },
                { key: 'messagingSenderId', label: 'Messaging Sender ID', placeholder: '123456789' },
                { key: 'appId', label: 'App ID', placeholder: '1:123456789:web:abc123' },
              ].map((f) => (
                <input
                  key={f.key}
                  type="text"
                  value={formFields[f.key]}
                  onChange={(e) => setFormFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 border border-slate-600 
                    text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              ))}
              <div className="flex gap-2">
                <button onClick={handleTestConnection} disabled={testing}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 
                    text-white font-bold text-sm btn-press disabled:opacity-50">
                  {testing ? '⏳ Testing...' : '🔌 Test Connection'}
                </button>
                <button onClick={handleSaveConfig} disabled={testing}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 
                    text-white font-bold text-sm btn-press disabled:opacity-50">
                  {testing ? '⏳ Saving...' : '💾 Save & Connect'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sync Actions ─────────────────────────────────── */}
        {syncEnabled && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <h3 className="text-white font-bold text-sm mb-3">🔄 Sync Actions</h3>
            <div className="space-y-2">
              <button onClick={handleFullSync} disabled={syncing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 
                  text-white font-bold btn-press shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {syncing ? '⏳ Syncing...' : '⬆️ Push All to Cloud'}
              </button>
              <button onClick={handleFullPull} disabled={syncing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 
                  text-white font-bold btn-press shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {syncing ? '⏳ Pulling...' : '⬇️ Pull All from Cloud'}
              </button>
              <button onClick={handleToggleSync}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 
                  text-white font-bold btn-press shadow-lg flex items-center justify-center gap-2">
                ⏹️ Disable Sync
              </button>
            </div>
          </div>
        )}

        {/* ── Enable sync if not yet ───────────────────────── */}
        {!syncEnabled && config && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <button onClick={handleToggleSync}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 
                text-white text-lg font-bold btn-press shadow-xl flex items-center justify-center gap-2">
              ▶️ Enable Cloud Sync
            </button>
          </div>
        )}

        {/* ── Info ────────────────────────────────────────── */}
        <div className="bg-slate-700/20 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-xs">
            ☁️ Cloud sync requires a Firebase project with Firestore enabled.<br />
            Free tier: 1 GiB storage, 50K reads/day, 20K writes/day.<br />
            Local IndexedDB always works as fallback when offline.<br />
            All devices sharing the same Firebase project stay in sync.
          </p>
        </div>
      </div>
    </div>
  );
}
