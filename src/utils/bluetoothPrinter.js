// ── Native Bluetooth ESC/POS Thermal Printer Module ──────────────────
const ESC = '\x1B';
const GS = '\x1D';
const LF = '\x0A';

export const Commands = {
CENTER: ESC + '\x61\x01',
LEFT: ESC + '\x61\x00',
RIGHT: ESC + '\x61\x02',
BOLD_ON: ESC + '\x45\x01',
BOLD_OFF: ESC + '\x45\x00',
UNDERLINE_ON: ESC + '\x2D\x01',
UNDERLINE_OFF: ESC + '\x2D\x00',
DOUBLE_HEIGHT: GS + '\x21\x10',
NORMAL_SIZE: GS + '\x21\x00',
CUT_PAPER: GS + '\x56\x00',
FEED_LINE: LF,
FEED_LINES(n) { return GS + '\x66' + String.fromCharCode(n); },
INIT: ESC + '\x40',
};

export function isBluetoothAvailable() {
return !!window.bluetoothSerial;
}

export function isConnected() {
return new Promise((resolve) => {
if (!window.bluetoothSerial) return resolve(false);
window.bluetoothSerial.isConnected(
  () => resolve(true),
  () => resolve(false)
);
});
}

// Explicitly prompt for Android 12+ permissions before executing native calls
export async function requestBluetoothPermissions() {
return new Promise((resolve, reject) => {
if (window.cordova && window.cordova.plugins && window.cordova.plugins.permissions) {
  const permissions = [
    "android.permission.BLUETOOTH_SCAN",
    "android.permission.BLUETOOTH_CONNECT"
  ];
  window.cordova.plugins.permissions.requestPermissions(
    permissions,
    (status) => {
      if (status.hasPermission) {
        resolve(true);
      } else {
        reject(new Error("Bluetooth runtime permissions denied by user."));
      }
    },
    (err) => reject(new Error("Failed to request permissions: " + JSON.stringify(err)))
  );
} else {
  // Non-Cordova or browser environment, skip gracefully
  resolve(true);
}
});
}

export async function listPairedDevices() {
await requestBluetoothPermissions();
return new Promise((resolve, reject) => {
if (!window.bluetoothSerial) return reject(new Error('Bluetooth plugin not available'));

window.bluetoothSerial.enable(
  () => {
    window.bluetoothSerial.list(
      (devices) => resolve(devices || []),
      (err) => reject(new Error('Failed to list devices: ' + JSON.stringify(err)))
    );
  },
  (err) => reject(new Error('Bluetooth is disabled or permission denied: ' + JSON.stringify(err)))
);
});
}

export function connectToDevice(address) {
return new Promise((resolve, reject) => {
if (!window.bluetoothSerial) return reject(new Error('Bluetooth plugin not available'));
window.bluetoothSerial.connect(address,
  () => resolve(true),
  () => {
    window.bluetoothSerial.connectInsecure(address,
      () => resolve(true),
      (err) => reject(new Error('Connection failed: ' + JSON.stringify(err)))
    );
  }
);
});
}

export async function autoConnect() {
const devices = await listPairedDevices();
if (devices.length === 0) throw new Error('No paired Bluetooth devices found');

// Filter specifically for your thermal printer name
const printer = devices.find(d => 
d.name && (d.name.toLowerCase().includes('printer') || d.name.toLowerCase().includes('pos') || d.name.toLowerCase().includes('blue'))
) || devices[0];

await connectToDevice(printer.address);
return printer.name || printer.address;
}

export function sendData(data) {
return new Promise((resolve, reject) => {
if (!window.bluetoothSerial) return reject(new Error('Bluetooth plugin not available'));
window.bluetoothSerial.write(data,
  () => resolve(true),
  (err) => reject(new Error('Write failed: ' + JSON.stringify(err)))
);
});
}

export function buildReceipt({ profile, bill, billId, discount }) {
let r = '';
r += Commands.INIT;
r += Commands.CENTER;
r += Commands.DOUBLE_HEIGHT;
r += Commands.BOLD_ON;
r += (profile?.name || 'MEHFIL-E-NIHARI') + Commands.BOLD_OFF + Commands.NORMAL_SIZE;
r += LF;
if (profile?.address) r += profile.address + LF;
if (profile?.phone) r += 'Phone: ' + profile.phone + LF;
if (profile?.gst) r += 'GSTIN: ' + profile.gst + LF;
r += '--------------------------------' + LF;

r += Commands.LEFT;
r += 'Bill: #' + billId + LF;
r += 'Date: ' + (bill?.date || '') + ' ' + (bill?.time || '') + LF;
r += 'Payment: ' + (bill?.paymentMethod || 'Cash').toUpperCase() + LF;
r += '--------------------------------' + LF;

const items = bill?.items || [];
items.forEach(item => {
var nm = (item.name + ' (' + (item.portion || 'Regular') + ')').substring(0, 18);
while (nm.length < 18) nm += ' ';
r += nm + 'x' + item.qty + ' Rs.' + (item.price * item.qty) + LF;
});

r += '--------------------------------' + LF;
r += 'Subtotal: Rs.' + (bill?.subtotal || bill?.total || 0) + LF;
if (discount?.amount > 0) {
r += 'Discount (' + (discount.type === 'percent' ? discount.value + '%' : 'Flat') + '): -Rs.' + discount.amount + LF;
}
r += Commands.BOLD_ON;
r += 'TOTAL: Rs.' + (bill?.total || 0) + LF;
r += Commands.BOLD_OFF;
r += '--------------------------------' + LF;

r += Commands.CENTER;
r += 'Thank you! Visit us again' + LF;
r += 'www.mehfil-e-nihari.com' + LF;
r += LF;
r += LF;
r += Commands.CUT_PAPER;

return r;
}

export async function printReceipt(receiptData) {
const connected = await isConnected();
if (!connected) {
await autoConnect();
}
await sendData(receiptData);
return true;
}

export function disconnect() {
return new Promise((resolve) => {
if (!window.bluetoothSerial) return resolve(true);
window.bluetoothSerial.disconnect(
  () => resolve(true),
  () => resolve(false)
);
});
}
