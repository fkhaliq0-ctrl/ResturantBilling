import { useState, useEffect } from 'react';
import {
  getWAStatus, getWAQR, connectWA, disconnectWA,
  sendWAMessage, processWAQueue, getWALog,
} from '../utils/whatsappClient';
import { verifyOwnerPin, isOwnerPinSet } from '../utils/stock';
import { playButtonPress, playCheckoutSuccess, playErrorSound, playKeyPress } from '../utils/audio';

export default function WhatsAppStatus({ onBack }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinMode, setPinMode] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const [status, setStatus] = useState(null);
  const [qr, setQr] = useState(null);
  const [log, setLog] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');

  // Manual send form
  const [sendPhone, setSendPhone] = useState('');
  const [sendText, setSendText] = useState('');

  useEffect(() => {
    isOwnerPinSet().then((set) => {
      setPinMode(set ? 'verify' : 'setup');
    });
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadStatus();
      const interval = setInterval(loadStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const loadStatus = async () => {
    const s = await getWAStatus();
    setStatus(s);
    if (s.connected) {
      const l = await getWALog();
      setLog(l.log || []);
      setQueue(l.queue || []);
    }
  };

  const loadQR = async () => {
    const q = await getWAQR();
    if (q.connected) {
      setQr(null);
    } else if (q.qr) {
      setQr(q.qr);
    }
  };

  const handleDigit = (digit) => {
    playKeyPress();
    if (pinMode === 'setup') {
      setPinInput((prev) => {
        const next = prev + digit;
        if (next.length === 4) setTimeout(() => setPinMode('confirm'), 200);
        return next.length <= 4 ? next : prev;
      });
    } else if (pinMode === 'confirm') {
      setTimeout(() => { playCheckoutSuccess(); setAuthenticated(true); }, 200);
    } else {
      setPinInput((prev) => {
        const next = prev + digit;
        if (next.length === 4) {
          setTimeout(() => {
            verifyOwnerPin(next).then((valid) => {
              if (valid) { playCheckoutSuccess(); setTimeout(() => setAuthenticated(true), 600); }
              else { setError('Wrong PIN!'); setShake(true); playErrorSound(); setTimeout(() => { setPinInput(''); setError(''); setShake(false); }, 1200); }
            });
          }, 200);
        }
        return next.length <= 4 ? next : prev;
      });
    }
  };

  const handleBackspace = () => { playButtonPress(); setPinInput((p) => p.slice(0, -1)); };

  // ── PIN Screen ──────────────────────────────────────────────
  if (!authenticated) {
    const title = pinMode === 'setup' ? 'Set Owner PIN' : 'Enter Owner PIN';
    const subtitle = 'Owner access required for WhatsApp status';
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'back'];

    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in px-4">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400 text-lg mb-8">{subtitle}</p>

        <div className={`flex gap-4 mb-4 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-14 h-14 rounded-full border-3 flex items-center justify-center transition-all ${
              pinInput.length > i ? 'border-amber-400 bg-amber-400/30' : 'border-gray-600 bg-gray-800/50'
            }`}>
              {pinInput.length > i && <div className="w-5 h-5 rounded-full bg-white" />}
            </div>
          ))}
        </div>

        {error && <div className="text-red-400 text-xl font-bold mb-4 animate-shake">{error}</div>}

        <div className="grid grid-cols-3 gap-4 mt-4">
          {digits.map((d, idx) => {
            if (d === null) return <div key={idx} />;
            if (d === 'back') return (
              <button key={idx} onClick={handleBackspace}
                className="w-20 h-20 rounded-2xl bg-gray-700/60 text-white text-2xl flex items-center justify-center btn-press hover:bg-gray-600/80 transition-colors">⌫</button>
            );
            return (
              <button key={idx} onClick={() => handleDigit(d)}
                className="w-20 h-20 rounded-2xl bg-gradient-to-b from-gray-600 to-gray-700 text-white text-3xl font-bold flex items-center justify-center btn-press hover:from-gray-500 hover:to-gray-600 transition-all shadow-lg">{d}</button>
            );
          })}
        </div>

        {pinMode === 'setup' && (
          <button onClick={() => setAuthenticated(true)}
            className="mt-8 text-gray-500 text-lg hover:text-gray-300 transition-colors">Skip — No PIN</button>
        )}
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mt-6 text-gray-400 hover:text-white transition-colors">← Back</button>
      </div>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">📱 WhatsApp Status</h1>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            status?.connected ? 'bg-green-500/20 text-green-400' :
            status?.inWindow ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {status?.connected ? '🟢 Connected' :
             status?.status === 'qr_ready' ? '📷 Scan QR' :
             status?.status === 'connecting' ? '🔄 Connecting...' :
             '🔴 Offline'}
          </div>
        </div>
      </div>

      {message && (
        <div className={`mx-4 mt-3 p-3 rounded-xl text-center font-bold text-sm animate-slide-up ${
          msgType === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>{message}</div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Connection Status ────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-3">📡 Connection</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/50 rounded-xl p-2 text-center">
              <p className="text-gray-500">Status</p>
              <p className={`font-bold ${status?.connected ? 'text-green-400' : 'text-red-400'}`}>
                {status?.status || 'unknown'}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2 text-center">
              <p className="text-gray-500">Time Window</p>
              <p className={`font-bold ${status?.inWindow ? 'text-green-400' : 'text-red-400'}`}>
                {status?.inWindow ? '✅ Active' : '😴 Sleeping'}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2 text-center">
              <p className="text-gray-500">Current Time</p>
              <p className="text-white font-bold">{status?.currentTime || '—'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2 text-center">
              <p className="text-gray-500">Window</p>
              <p className="text-white font-bold">{status?.window || '5–11 PM'}</p>
            </div>
          </div>
        </div>

        {/* ── QR Code ──────────────────────────────────────── */}
        {status?.hasQR && !status?.connected && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <h3 className="text-white font-bold text-sm mb-3">📷 Scan QR Code</h3>
            <div className="bg-white rounded-xl p-4 flex items-center justify-center">
              {qr ? (
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr)}`}
                  alt="QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400 animate-pulse">
                  Loading QR...
                </div>
              )}
            </div>
            <p className="text-gray-400 text-xs text-center mt-2">
              Open WhatsApp → Settings → Linked Devices → Link a Device
            </p>
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-3">🔧 Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {!status?.connected ? (
              <button onClick={async () => {
                playButtonPress();
                await connectWA();
                setTimeout(loadQR, 2000);
                setMessage('Connecting...'); setMsgType('success');
              }}
                className="py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm btn-press">
                ▶️ Connect
              </button>
            ) : (
              <button onClick={async () => {
                playButtonPress();
                await disconnectWA();
                setStatus(null);
                setMessage('Disconnected'); setMsgType('success');
              }}
                className="py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm btn-press">
                ⏹️ Disconnect
              </button>
            )}
            <button onClick={async () => {
              playButtonPress();
              const result = await processWAQueue();
              setMessage(result.ok ? `Processed ${result.processed || 0} messages` : 'Queue empty');
              setMsgType('success');
            }}
              disabled={!status?.connected}
              className="py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm btn-press disabled:opacity-40">
              🔄 Process Queue ({status?.queueLength || 0})
            </button>
            <button onClick={async () => {
              playButtonPress();
              await loadStatus();
              await loadQR();
              setMessage('Refreshed'); setMsgType('success');
            }}
              className="py-3 rounded-xl bg-slate-600 text-white font-bold text-sm btn-press col-span-2">
              🔃 Refresh Status
            </button>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────── */}
        {status?.stats && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <h3 className="text-white font-bold text-sm mb-3">📊 Stats</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-500/10 rounded-xl p-2 text-center border border-green-500/20">
                <p className="text-gray-500 text-[10px]">Sent</p>
                <p className="text-green-400 font-bold text-lg">{status.stats.sent}</p>
              </div>
              <div className="bg-red-500/10 rounded-xl p-2 text-center border border-red-500/20">
                <p className="text-gray-500 text-[10px]">Failed</p>
                <p className="text-red-400 font-bold text-lg">{status.stats.failed}</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-2 text-center border border-amber-500/20">
                <p className="text-gray-500 text-[10px]">Queued</p>
                <p className="text-amber-400 font-bold text-lg">{status.stats.queued}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Manual Send ──────────────────────────────────── */}
        {status?.connected && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <h3 className="text-white font-bold text-sm mb-3">📤 Manual Send</h3>
            <div className="space-y-2">
              <input type="tel" value={sendPhone} onChange={(e) => setSendPhone(e.target.value)}
                placeholder="Phone: 919876543210"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none" />
              <textarea value={sendText} onChange={(e) => setSendText(e.target.value)}
                placeholder="Message text..."
                rows={3}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none resize-none" />
              <button onClick={async () => {
                if (!sendPhone || !sendText) return;
                playButtonPress();
                const result = await sendWAMessage(sendPhone, sendText);
                setMessage(result.ok ? (result.queued ? '📨 Queued (outside window)' : '✅ Sent!') : '❌ ' + result.error);
                setMsgType(result.ok ? 'success' : 'error');
                if (result.ok && !result.queued) { setSendPhone(''); setSendText(''); }
              }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold btn-press">
                📱 Send Message
              </button>
            </div>
          </div>
        )}

        {/* ── Sent Log ─────────────────────────────────────── */}
        {log.length > 0 && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <h3 className="text-white font-bold text-sm mb-3">📋 Recent Messages</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {log.slice(0, 10).map((entry, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-xl p-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{entry.phone}</span>
                    <span className={`font-bold ${entry.status === 'sent' ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.status}
                    </span>
                  </div>
                  <p className="text-gray-500 truncate">{entry.text}</p>
                  <p className="text-gray-600 text-[10px]">{new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Info ────────────────────────────────────────── */}
        <div className="bg-slate-700/20 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-xs">
            ⏰ WhatsApp is only active during 5 PM – 11 PM IST.<br />
            Messages outside this window are queued silently.<br />
            Server runs on port 5180 alongside the Vite dev server.
          </p>
        </div>
      </div>
    </div>
  );
}
