// -- Native Bluetooth ESC/POS Thermal Printer Module ------------------
const ESC = "\x1B";
const GS = "\x1D";
const LF = "\x0A";

export const PRINTER_COMMANDS = {
  CENTER: ESC + "\x61\x01",
  LEFT: ESC + "\x61\x00",
  RIGHT: ESC + "\x61\x02",
  BOLD_ON: ESC + "\x45\x01",
  BOLD_OFF: ESC + "\x45\x00",
  UNDERLINE_ON: ESC + "\x2D\x01",
  UNDERLINE_OFF: ESC + "\x2D\x00",
  DOUBLE_HEIGHT: GS + "\x21\x10",
  NORMAL_SIZE: GS + "\x21\x00",
  CUT_PAPER: GS + "\x56\x00",
  FEED_LINE: LF,
  FEED_LINES(n) { return GS + "\x66" + String.fromCharCode(n); },
  INIT: ESC + "\x40",
};

export function isBluetoothAvailable() {
  return !!window.bluetoothSerial;
}

export function isConnected() {
  return new Promise((resolve) => {
    if (!window.bluetoothSerial) return resolve(false);
    window.bluetoothSerial.isConnected(() => resolve(true), () => resolve(false));
  });
}

export async function requestBluetoothPermissions() {
  return new Promise((resolve, reject) => {
    if (window.cordova?.plugins?.permissions) {
      window.cordova.plugins.permissions.requestPermissions(
        ["android.permission.BLUETOOTH_SCAN", "android.permission.BLUETOOTH_CONNECT"],
        (status) => status.hasPermission ? resolve(true) : reject(new Error("Permissions denied")),
        (err) => reject(err)
      );
    } else {
      resolve(true);
    }
  });
}

export async function listPairedDevices() {
  await requestBluetoothPermissions();
  return new Promise((resolve, reject) => {
    if (!window.bluetoothSerial) return reject(new Error("Plugin not available"));
    window.bluetoothSerial.enable(
      () => window.bluetoothSerial.list((d) => resolve(d || []), (err) => reject(err)),
      (err) => reject(err)
    );
  });
}

export function connectToDevice(address) {
  return new Promise((resolve, reject) => {
    if (!window.bluetoothSerial) return reject(new Error("Plugin not available"));
    window.bluetoothSerial.connect(address, () => resolve(true), () => {
      window.bluetoothSerial.connectInsecure(address, () => resolve(true), (err) => reject(err));
    });
  });
}

export async function autoConnect() {
  const devices = await listPairedDevices();
  if (devices.length === 0) throw new Error("No paired devices found");
  const printer = devices.find(d => d.name && (d.name.toLowerCase().includes("printer") || d.name.toLowerCase().includes("pos") || d.name.toLowerCase().includes("blue"))) || devices[0];
  await connectToDevice(printer.address);
  return printer.name || printer.address;
}

export function sendData(data) {
  return new Promise((resolve, reject) => {
    if (!window.bluetoothSerial) return reject(new Error("Plugin not available"));
    window.bluetoothSerial.write(data, () => resolve(true), (err) => reject(err));
  });
}

export function buildReceipt({ profile, bill, billId, discount }) {
  let r = "";
  r += PRINTER_COMMANDS.INIT;
  r += PRINTER_COMMANDS.CENTER;
  r += PRINTER_COMMANDS.DOUBLE_HEIGHT;
  r += PRINTER_COMMANDS.BOLD_ON;
  r += (profile?.name || "MEHFIL-E-NIHARI") + PRINTER_COMMANDS.BOLD_OFF + PRINTER_COMMANDS.NORMAL_SIZE;
  r += LF;

  if (profile?.tagline) r += profile.tagline + LF;
  if (profile?.fssai) r += "FSSAI Lic No: " + profile.fssai + LF;
  if (profile?.address) r += profile.address + LF;
  if (profile?.phone) r += "Phone: " + profile.phone + LF;
  if (profile?.gst || profile?.gstin) r += "GSTIN: " + (profile.gst || profile.gstin) + LF;
  r += "--------------------------------" + LF;

  r += PRINTER_COMMANDS.LEFT;
  r += "Bill: #" + billId + LF;
  r += "Date: " + (bill?.date || "") + " " + (bill?.time || "") + LF;
  r += "Payment: " + (bill?.paymentMethod || "Cash").toUpperCase() + LF;
  r += "--------------------------------" + LF;

  const items = bill?.items || [];
  items.forEach(item => {
    var nm = (item.name + " (" + (item.portion || "Regular") + ")").substring(0, 18);
    while (nm.length < 18) nm += " ";
    r += nm + "x" + item.qty + " Rs." + (item.price * item.qty) + LF;
  });

  r += "--------------------------------" + LF;
  r += "Subtotal: Rs." + (bill?.subtotal || bill?.total || 0) + LF;
  if (discount?.amount > 0) {
    r += "Discount (" + (discount.type === "percent" ? discount.value + "%" : "Flat") + "): -Rs." + discount.amount + LF;
  }
  r += PRINTER_COMMANDS.BOLD_ON;
  r += "TOTAL: Rs." + (bill?.total || 0) + LF;
  r += PRINTER_COMMANDS.BOLD_OFF;
  r += "--------------------------------" + LF;

  r += PRINTER_COMMANDS.CENTER;
  r += "Thank you! Visit us again" + LF;
  r += "www.mehfil-e-nihari.com" + LF;
  r += LF + LF;
  r += PRINTER_COMMANDS.CUT_PAPER;

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
    window.bluetoothSerial.disconnect(() => resolve(true), () => resolve(false));
  });
}


