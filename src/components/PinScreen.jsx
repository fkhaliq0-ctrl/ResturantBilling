import { useState } from 'react';
import { playButtonPress, playErrorSound, playCheckoutSuccess } from '../utils/audio';

export default function PinScreen({ onUnlock, onAuthenticated, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const roles = [
    { id: 'owner', title: 'Owner', subtitle: 'Full Access & Reports', icon: '👑', color: 'from-amber-500 to-yellow-600', pin: '1234' },
    { id: 'manager', title: 'Manager', subtitle: 'Operations & Stock', icon: '🛡️', color: 'from-blue-500 to-indigo-600', pin: '5678' },
    { id: 'cashier', title: 'Cashier', subtitle: 'Billing Only', icon: '💳', color: 'from-emerald-500 to-green-600', pin: '0000' }
  ];

  const handleNumPress = (num) => {
    playButtonPress();
    const newPin = pin + num;
    if (newPin.length <= 4) {
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleClear = () => {
    playButtonPress();
    setPin('');
    setError(false);
  };

  const verifyPin = (enteredPin) => {
    const roleObj = roles.find(r => r.id === selectedRole);
    if (roleObj && enteredPin === roleObj.pin) {
      playCheckoutSuccess();
      const unlockHandler = onUnlock || onAuthenticated || onLoginSuccess;
      if (typeof unlockHandler === 'function') {
        unlockHandler(roleObj);
      } else {
        window.dispatchEvent(new CustomEvent('user-authenticated', { detail: roleObj }));
      }
    } else {
      playErrorSound();
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 600);
    }
  };

  if (!selectedRole) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white animate-fade-in">
        <img src="/logo.png" alt="Mehfil-E-Nihari" className="w-28 h-auto object-contain mb-4 drop-shadow-lg" />
        <h1 className="text-2xl font-bold mb-2 text-amber-400">Select Your Role</h1>
        <p className="text-gray-400 text-sm mb-8">Choose your profile to access the billing system</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => { playButtonPress(); setSelectedRole(r.id); }}
              className={`p-6 rounded-2xl bg-gradient-to-br ${r.color} text-white font-bold flex flex-col items-center text-center btn-press shadow-xl hover:scale-105 transition-transform`}
            >
              <span className="text-4xl mb-3">{r.icon}</span>
              <span className="text-xl mb-1">{r.title}</span>
              <span className="text-xs text-white/80 font-normal">{r.subtitle}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentRole = roles.find(r => r.id === selectedRole);

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white animate-fade-in">
      <button
        onClick={() => { playButtonPress(); setSelectedRole(null); setPin(''); }}
        className="absolute top-6 left-6 text-gray-400 hover:text-white text-sm flex items-center gap-1 btn-press px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700"
      >
        ← Back to Roles
      </button>

      <div className="text-center mb-6">
        <span className="text-4xl">{currentRole.icon}</span>
        <h2 className="text-2xl font-bold mt-2 text-amber-400">{currentRole.title} PIN</h2>
        <p className="text-gray-400 text-xs">Enter 4-digit PIN for access</p>
      </div>

      <div className={`flex gap-3 mb-8 ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
              pin.length > i
                ? 'bg-amber-500 border-amber-400 text-slate-900'
                : 'bg-slate-800 border-slate-700 text-transparent'
            } ${error ? 'border-red-500 bg-red-500/20' : ''}`}
          >
            {pin.length > i ? '•' : ''}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 w-64">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumPress(num.toString())}
            className="h-14 rounded-xl bg-slate-800 border border-slate-700 text-xl font-bold hover:bg-slate-700 btn-press text-white"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="h-14 rounded-xl bg-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/30 btn-press flex items-center justify-center border border-red-500/30"
        >
          Clear
        </button>
        <button
          onClick={() => handleNumPress('0')}
          className="h-14 rounded-xl bg-slate-800 border border-slate-700 text-xl font-bold hover:bg-slate-700 btn-press text-white"
        >
          0
        </button>
        <button
          onClick={() => {
            if (pin.length === 4) verifyPin(pin);
          }}
          className="h-14 rounded-xl bg-green-500/20 text-green-400 text-sm font-bold hover:bg-green-500/30 btn-press flex items-center justify-center border border-green-500/30"
        >
          Enter
        </button>
      </div>
    </div>
  );
}
