import { useState } from 'react';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from '../utils/audio';
import { setPin, verifyPin, changePin } from '../utils/pin';
import { clearAllData } from '../utils/storage';

export default function Settings({ onBack, onNavigate }) {
  const [pinMode, setPinMode] = useState(null); // null, 'change', 'set'
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // success, error

  const handlePinChange = async () => {
    if (pinMode === 'change') {
      if (newPin.length !== 4 || oldPin.length !== 4) {
        setMessage('Enter all 4 digits');
        setMessageType('error');
        playErrorSound();
        return;
      }
      if (newPin !== confirmNewPin) {
        setMessage('New PINs do not match');
        setMessageType('error');
        playErrorSound();
        return;
      }
      const result = await changePin(oldPin, newPin);
      if (result) {
        playCheckoutSuccess();
        setMessage('PIN changed successfully!');
        setMessageType('success');
        setTimeout(() => {
          setPinMode(null);
          setOldPin('');
          setNewPin('');
          setConfirmNewPin('');
          setMessage('');
        }, 1500);
      } else {
        playErrorSound();
        setMessage('Wrong current PIN');
        setMessageType('error');
      }
    } else {
      if (newPin.length !== 4) {
        setMessage('Enter a 4-digit PIN');
        setMessageType('error');
        playErrorSound();
        return;
      }
      if (newPin !== confirmNewPin) {
        setMessage('PINs do not match');
        setMessageType('error');
        playErrorSound();
        return;
      }
      await setPin(newPin);
      playCheckoutSuccess();
      setMessage('PIN set successfully!');
      setMessageType('success');
      setTimeout(() => {
        setPinMode(null);
        setNewPin('');
        setConfirmNewPin('');
        setMessage('');
      }, 1500);
    }
  };

  const handleClearData = async () => {
    if (confirm('⚠️ This will delete ALL bills and data. Are you sure?')) {
      if (confirm('This cannot be undone. Confirm?')) {
        await clearAllData();
        playCheckoutSuccess();
        setMessage('All data cleared!');
        setMessageType('success');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={() => {
            playButtonPress();
            onBack();
          }}
          className="mb-3 flex items-center gap-2 text-gray-300 hover:text-white 
            transition-colors text-lg btn-press px-2 py-1 rounded-xl hover:bg-white/10"
        >
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back</span>
        </button>
        <h1 className="text-3xl font-bold text-white">⚙️ Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Message */}
        {message && (
          <div className={`p-3 rounded-xl text-center font-bold text-lg ${
            messageType === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {message}
          </div>
        )}

        {pinMode === null ? (
          <>
            {/* Daily Operations */}
            <div className="bg-slate-700/50 rounded-2xl p-5 space-y-3">
              <h2 className="text-xl font-bold text-white">📦 Daily Operations</h2>
              <button
                onClick={() => {
                  playButtonPress();
                  onNavigate?.('eod');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                🧾 End-of-Day Closing
              </button>
              <button
                onClick={() => {
                  playButtonPress();
                  onNavigate?.('purchase');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                📋 Purchase Entry
              </button>
              <button
                onClick={() => {
                  playButtonPress();
                  onNavigate?.('closing');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                📦 Closing Stock Entry
              </button>
              <button
                onClick={() => {
                  playButtonPress();
                  onNavigate?.('expenses');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                💰 Expense Report (Owner)
              </button>
              <button
                onClick={() => {
                  playButtonPress();
                  onNavigate?.('owner');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                👔 Owner Report (Protected)
              </button>
            </div>

            {/* PIN Settings */}
            <div className="bg-slate-700/50 rounded-2xl p-5 space-y-3">
              <h2 className="text-xl font-bold text-white">🔐 PIN Lock</h2>
              <button
                onClick={() => {
                  playButtonPress();
                  setPinMode('change');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                🔑 Change PIN
              </button>
              <button
                onClick={() => {
                  playButtonPress();
                  setPinMode('set');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                ➕ Set New PIN
              </button>
            </div>

            {/* CA Dispatcher */}
            <div className="bg-slate-700/50 rounded-2xl p-5 space-y-3">
              <h2 className="text-xl font-bold text-white">📊 Tax & Compliance</h2>
              <button
                onClick={() => {
                  playButtonPress();
                  onNavigate?.('ca');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                📊 Quarterly CA Report (WhatsApp)
              </button>
            </div>

            {/* WhatsApp */}
            <div className="bg-slate-700/50 rounded-2xl p-5 space-y-3">
              <h2 className="text-xl font-bold text-white">📱 WhatsApp Service</h2>
              <button
                onClick={() => {
                  playButtonPress();
                  onNavigate?.('whatsapp');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                📱 WhatsApp Status (Owner)
              </button>
              <p className="text-gray-500 text-xs">Active 5 PM – 11 PM IST only</p>
            </div>

            {/* Cloud Sync */}
            <div className="bg-slate-700/50 rounded-2xl p-5 space-y-3">
              <h2 className="text-xl font-bold text-white">☁️ Cloud & Multi-Device</h2>
              <button
                onClick={() => {
                  playButtonPress();
                  onNavigate?.('sync');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                ☁️ Cloud Sync (Multi-Device)
              </button>
            </div>

            {/* Backup & Export */}
            <div className="bg-slate-700/50 rounded-2xl p-5 space-y-3">
              <h2 className="text-xl font-bold text-white">💾 Backup & Export</h2>
              <button
                onClick={() => {
                  playButtonPress();
                  onNavigate?.('backup');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                💾 Backup, Restore & CSV Export
              </button>
            </div>

            {/* Data Management */}
            <div className="bg-slate-700/50 rounded-2xl p-5 space-y-3">
              <h2 className="text-xl font-bold text-white">⚠️ Danger Zone</h2>
              <button
                onClick={() => {
                  playButtonPress();
                  handleClearData();
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                🗑️ Clear All Data
              </button>
            </div>

            {/* About */}
            <div className="bg-slate-700/50 rounded-2xl p-5 text-center">
              <p className="text-gray-400 text-sm">
                Mehfil-E-Nihari — Billing App v1.0<br />
                100% Offline • No Subscriptions • Free
              </p>
            </div>
          </>
        ) : (
          /* PIN Setup / Change Form */
          <div className="bg-slate-700/50 rounded-2xl p-5 space-y-4">
            <h2 className="text-xl font-bold text-white">
              {pinMode === 'change' ? '🔑 Change PIN' : '➕ Set New PIN'}
            </h2>
            
            {pinMode === 'change' && (
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Current PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-slate-600 
                    text-white text-2xl text-center tracking-[0.5em] font-bold
                    focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="••••"
                />
              </div>
            )}
            
            <div>
              <label className="text-gray-400 text-sm mb-1 block">New PIN</label>
              <input
                type="password"
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-slate-600 
                  text-white text-2xl text-center tracking-[0.5em] font-bold
                  focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="••••"
              />
            </div>
            
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Confirm New PIN</label>
              <input
                type="password"
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-slate-600 
                  text-white text-2xl text-center tracking-[0.5em] font-bold
                  focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="••••"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  playButtonPress();
                  setPinMode(null);
                  setOldPin('');
                  setNewPin('');
                  setConfirmNewPin('');
                  setMessage('');
                }}
                className="flex-1 py-4 rounded-xl bg-slate-600 text-white text-lg font-bold btn-press"
              >
                Cancel
              </button>
              <button
                onClick={handlePinChange}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 
                  text-white text-lg font-bold btn-press shadow-lg"
              >
                ✅ Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
