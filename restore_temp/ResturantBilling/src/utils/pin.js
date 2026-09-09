import { getSetting, setSetting } from './storage';

const PIN_KEY = 'app_pin_hash';

// Simple hash (not cryptographically secure, but fine for a PIN lock)
function hashPin(pin) {
  let hash = 0;
  const str = 'salt_' + pin + '_restaurant';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export async function isPinSet() {
  const stored = await getSetting(PIN_KEY);
  return !!stored;
}

export async function setPin(pin) {
  const hash = hashPin(pin);
  await setSetting(PIN_KEY, hash);
}

export async function verifyPin(pin) {
  const stored = await getSetting(PIN_KEY);
  if (!stored) return true; // No PIN set yet
  return hashPin(pin) === stored;
}

export async function changePin(oldPin, newPin) {
  const valid = await verifyPin(oldPin);
  if (!valid) return false;
  await setPin(newPin);
  return true;
}
