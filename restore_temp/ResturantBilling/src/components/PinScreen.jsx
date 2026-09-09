import { useState, useCallback, useEffect } from 'react';
import { isPinSet, setPin, verifyPin } from '../utils/pin';
import { playKeyPress, playButtonPress, playErrorSound, playCheckoutSuccess } from '../utils/audio';

export default function PinScreen({ onUnlock }) {
  const [mode, setMode] = useState('loading'); // loading, verify, setup, confirm
  const [pin, setPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    isPinSet().then((set) => {
      setMode(set ? 'verify' : 'setup');
    });
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    playErrorSound();
    setTimeout(() => setShake(false), 500);
  }, []);

  const handleDigit = useCallback((digit) => {
    playKeyPress();
    if (mode === 'setup') {
      setPinInput((prev) => {
        const next = prev + digit;
        if (next.length === 4) {
          setTimeout(() => setMode('confirm'), 200);
        }
        return next.length <= 4 ? next : prev;
      });
    } else if (mode === 'confirm') {
      setConfirmPin((prev) => {
        const next = prev + digit;
        if (next.length === 4) {
          setTimeout(() => {
            if (pin === next) {
              setPin(pin).then(() => {
                playCheckoutSuccess();
                setTimeout(() => onUnlock(), 800);
              });
            } else {
              setError('PINs do not match! Try again');
              triggerShake();
              setTimeout(() => {
                setPinInput('');
                setConfirmPin('');
                setError('');
                setMode('setup');
              }, 1500);
            }
          }, 200);
        }
        return next.length <= 4 ? next : prev;
      });
    } else if (mode === 'verify') {
      setPinInput((prev) => {
        const next = prev + digit;
        if (next.length === 4) {
          setTimeout(() => {
            verifyPin(next).then((valid) => {
              if (valid) {
                playCheckoutSuccess();
                setTimeout(() => onUnlock(), 800);
              } else {
                setError('Wrong PIN!');
                triggerShake();
                setTimeout(() => {
                  setPinInput('');
                  setError('');
                }, 1200);
              }
            });
          }, 200);
        }
        return next.length <= 4 ? next : prev;
      });
    }
  }, [mode, pin, onUnlock, triggerShake]);

  const handleBackspace = useCallback(() => {
    playButtonPress();
    if (mode === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPinInput((prev) => prev.slice(0, -1));
    }
  }, [mode]);

  if (mode === 'loading') {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-2xl animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  const currentPin = mode === 'confirm' ? confirmPin : pin;
  const title = mode === 'setup' ? 'Set Your PIN'
    : mode === 'confirm' ? 'Confirm PIN'
    : 'Enter PIN';
  const subtitle = mode === 'setup' ? 'Choose a 4-digit PIN'
    : mode === 'confirm' ? 'Re-enter your PIN'
    : 'Enter your 4-digit PIN';

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'back'];

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Lock icon */}
      <div className="text-6xl mb-4">🔒</div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
      <p className="text-gray-400 text-lg mb-8">{subtitle}</p>

      {/* PIN dots */}
      <div className={`flex gap-4 mb-4 ${shake ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-full border-3 flex items-center justify-center transition-all duration-200 ${
              currentPin.length > i
                ? mode === 'confirm' && pin !== confirmPin && currentPin.length === 4
                  ? 'border-red-500 bg-red-500/30'
                  : 'border-green-400 bg-green-400/30'
                : 'border-gray-600 bg-gray-800/50'
            }`}
          >
            {currentPin.length > i && (
              <div className="w-5 h-5 rounded-full bg-white" />
            )}
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-red-400 text-xl font-bold mb-4 animate-shake">
          {error}
        </div>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {digits.map((d, idx) => {
          if (d === null) return <div key={idx} />;
          if (d === 'back') {
            return (
              <button
                key={idx}
                onClick={handleBackspace}
                className="w-20 h-20 rounded-2xl bg-gray-700/60 text-white text-2xl 
                  flex items-center justify-center btn-press active:bg-gray-600 
                  transition-colors hover:bg-gray-600/80"
              >
                ⌫
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleDigit(d)}
              className="w-20 h-20 rounded-2xl bg-gradient-to-b from-gray-600 to-gray-700 
                text-white text-3xl font-bold flex items-center justify-center btn-press
                active:from-gray-500 active:to-gray-600 hover:from-gray-500 hover:to-gray-600
                transition-all shadow-lg"
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Skip option for first-time setup */}
      {mode === 'setup' && (
        <button
          onClick={() => {
            playButtonPress();
            onUnlock();
          }}
          className="mt-8 text-gray-500 text-lg hover:text-gray-300 transition-colors"
        >
          Skip PIN Setup →
        </button>
      )}
    </div>
  );
}
