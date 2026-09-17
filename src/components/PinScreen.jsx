import { useState, useEffect } from 'react';

export default function PinScreen({ onUnlock, onAuthenticated, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const roles = [
    { id: 'owner', title: 'Owner', subtitle: 'Full Access & Reports', icon: '👑', pin: '1234' },
    { id: 'manager', title: 'Manager', subtitle: 'Operations & Stock', icon: '🛡️', pin: '5678' },
    { id: 'cashier', title: 'Cashier', subtitle: 'Billing Only', icon: '💳', pin: '0000' }
  ];

  const handleNumPress = (num) => {
    const newPin = pin + num;
    if (newPin.length <= 4) {
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const verifyPin = (enteredPin) => {
    const roleObj = roles.find(r => r.id === selectedRole);
    if (roleObj && enteredPin === roleObj.pin) {
      try {
        const staffData = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('staff') : null;
        const staffList = JSON.parse(staffData || '[]');
        const activeStaff = staffList.find(s => s.role === roleObj.id || s.name?.toLowerCase() === roleObj.title?.toLowerCase());
        if (activeStaff && activeStaff.isActive === false) {
          setError(true);
          setPin('');
          if (typeof alert === 'function') {
            alert('❌ Account deactivated. Contact admin to reactivate.');
          }
          setTimeout(() => { setError(false); }, 600);
          return;
        }
      } catch (e) {}

      const unlockHandler = onUnlock || onAuthenticated || onLoginSuccess;
      if (typeof unlockHandler === 'function') {
        unlockHandler(roleObj);
      } else if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
        window.dispatchEvent(new CustomEvent('user-authenticated', { detail: roleObj }));
      }
    } else {
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 600);
    }
  };

  useEffect(() => {
    if (!selectedRole) return;
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumPress(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleClear();
      } else if (e.key === 'Enter') {
        if (pin.length === 4) verifyPin(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [selectedRole, pin]);

  if (!selectedRole) {
    return (
      <div style={{ flex: 1, height: '100%', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#fbbf24' }}>Select Your Role</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 32 }}>Choose your profile to access the billing system</p>

        <div style={{ width: '100%', maxWidth: 600 }}>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              style={{ width: '100%', padding: 24, borderRadius: 16, backgroundColor: '#1e293b', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#334155', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ fontSize: 36, marginBottom: 8 }}>{r.icon}</span>
              <span style={{ fontSize: 20, marginBottom: 4, color: '#ffffff', fontWeight: 'bold' }}>{r.title}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.subtitle}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentRole = roles.find(r => r.id === selectedRole);

  return (
    <div style={{ flex: 1, height: '100%', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <button
        onClick={() => { setSelectedRole(null); setPin(''); }}
        style={{ position: 'absolute', top: 24, left: 24, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}
      >
        ← Back to Roles
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 36 }}>{currentRole.icon}</span>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#fbbf24' }}>{currentRole.title} PIN</h2>
        <p style={{ color: '#94a3b8', fontSize: 12 }}>Enter 4-digit PIN for access</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: 12, marginBottom: 32 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              borderWidth: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pin.length > i ? '#fbbf24' : '#1e293b',
              borderColor: error ? '#ef4444' : (pin.length > i ? '#f59e0b' : '#334155')
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 'bold', color: pin.length > i ? '#0f172a' : 'transparent' }}>
              {pin.length > i ? '•' : ''}
            </span>
          </div>
        ))}
      </div>

      <div style={{ width: 256, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumPress(num.toString())}
            style={{ width: 72, height: 56, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold', color: '#ffffff', cursor: 'pointer' }}
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          style={{ width: 72, height: 56, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}
        >
          Clear
        </button>
        <button
          onClick={() => handleNumPress('0')}
          style={{ width: 72, height: 56, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold', color: '#ffffff', cursor: 'pointer' }}
        >
          0
        </button>
        <button
          onClick={() => {
            if (pin.length === 4) verifyPin(pin);
          }}
          style={{ width: 72, height: 56, borderRadius: 12, backgroundColor: 'rgba(34, 197, 94, 0.2)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
