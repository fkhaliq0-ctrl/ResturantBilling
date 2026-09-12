// ── Native Bluetooth ESC/POS Thermal Printer Module ─────
// Provides clean API for connecting and printing to thermal printers
// via cordova-plugin-bluetooth-serial (Capacitor) on Android

// ── ESC/POS Command Helpers ─────────────────────────────
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

// ── Check if Bluetooth is available ─────────────────────
export function isBluetoothAvailable() {
  return !!window.bluetoothSerial;
}

// ── Check connection status ─────────────────────────────
export function isConnected() {
  return new Promise((resolve) => {
    if (!window.bluetoothSerial) return resolve(false);
    window.bluetoothSerial.isConnected(
      () => resolve(true),
      () => resolve(false)
    );
  });
}

// ── List paired devices ─────────────────────────────────
export function listPairedDevices() {
  return new Promise((resolve, reject) => {
    if (!window.bluetoothSerial) return reject(new Error('Bluetooth plugin not available'));
    window.bluetoothSerial.list(
      (devices) => resolve(devices || []),
      (err) => reject(new Error('Failed to list devices: ' + JSON.stringify(err)))
    );
  });
}

// ── Connect to a device ─────────────────────────────────
export function connectToDevice(address) {
  return new Promise((resolve, reject) => {
    if (!window.bluetoothSerial) return reject(new Error('Bluetooth plugin not available'));
    window.bluetoothSerial.connect(address,
      () => resolve(true),
      () => {
        // Try insecure connection as fallback
        window.bluetoothSerial.connectInsecure(address,
          () => resolve(true),
          (err) => reject(new Error('Connection failed: ' + JSON.stringify(err)))
        );
      }
    );
  });
}

// ── Auto-connect to first paired printer ────────────────
export async function autoConnect() {
  const devices = await listPairedDevices();
  if (devices.length === 0) throw new Error('No paired Bluetooth devices found');
  const printer = devices[0];
  await connectToDevice(printer.address);
  return printer.name || printer.address;
}

// ── Send raw data to printer ────────────────────────────
export function sendData(data) {
  return new Promise((resolve, reject) => {
    if (!window.bluetoothSerial) return reject(new Error('Bluetooth plugin not available'));
    window.bluetoothSerial.write(data,
      () => resolve(true),
      (err) => reject(new Error('Write failed: ' + JSON.stringify(err)))
    );
  });
}

// ── Build receipt data ──────────────────────────────────
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

  // Items
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

  // Footer
  r += Commands.CENTER;
  r += 'Thank you! Visit us again' + LF;
  r += 'www.mehfil-e-nihari.com' + LF;
  r += LF;
  r += LF;
  r += Commands.CUT_PAPER;

  return r;
}

// ── Print receipt (connect if needed) ───────────────────
export async function printReceipt(receiptData) {
  const connected = await isConnected();
  if (!connected) {
    await autoConnect();
  }
  await sendData(receiptData);
  return true;
}

// ── Disconnect ──────────────────────────────────────────
export function disconnect() {
  return new Promise((resolve) => {
    if (!window.bluetoothSerial) return resolve(true);
    window.bluetoothSerial.disconnect(
      () => resolve(true),
      () => resolve(false)
    );
  });
}
