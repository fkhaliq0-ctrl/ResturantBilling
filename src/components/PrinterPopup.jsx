import { useState, useEffect, useCallback } from "react";
import { playButtonPress, playErrorSound, playCheckoutSuccess } from "../utils/audio";
import {
  isBluetoothAvailable,
  listPairedDevices,
  connectToDevice,
  isConnected,
  disconnect,
} from "../utils/bluetoothPrinter";

const STORAGE_KEY = "connected_printer_mac";

export default function PrinterPopup({ open, onClose }) {
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectedName, setConnectedName] = useState("");
  const [selectedMac, setSelectedMac] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // ── Check saved printer on mount ──
  useEffect(() => {
    if (!open) return;
    setError("");
    setToast("");
    const savedMac = localStorage.getItem(STORAGE_KEY);
    const savedName = localStorage.getItem("connected_printer_name") || "";
    if (savedMac) setSelectedMac(savedMac);
    if (savedName) setConnectedName(savedName);
    checkConnection();
  }, [open]);

  const checkConnection = useCallback(async () => {
    try {
      const ok = await isConnected();
      setConnected(ok);
      if (!ok) {
        setConnectedName("");
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("connected_printer_name");
      }
    } catch {
      setConnected(false);
    }
  }, []);

  // ── Scan for paired devices ──
  const handleScan = useCallback(async () => {
    playButtonPress();
    if (!isBluetoothAvailable()) {
      setError("Bluetooth plugin not available. Install the Bluetooth Serial plugin first.");
      return;
    }
    setScanning(true);
    setError("");
    setDevices([]);
    try {
      const list = await listPairedDevices();
      setDevices(list);
      if (list.length === 0) {
        setError("No paired devices found. Pair your printer in Android Bluetooth settings first.");
      }
    } catch (err) {
      setError("Scan failed: " + (err?.message || "Unknown error"));
      playErrorSound();
    } finally {
      setScanning(false);
    }
  }, []);

  // ── Connect to a device ──
  const handleConnect = useCallback(async (device) => {
    playButtonPress();
    setConnecting(true);
    setError("");
    setSelectedMac(device.address);
    try {
      await connectToDevice(device.address);
      const name = device.name || device.address;
      setConnected(true);
      setConnectedName(name);
      localStorage.setItem(STORAGE_KEY, device.address);
      localStorage.setItem("connected_printer_name", name);
      playCheckoutSuccess();
      setToast("Connected to " + name);
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setError("Connection failed: " + (err?.message || "Unknown error"));
      playErrorSound();
      setConnected(false);
      setSelectedMac("");
    } finally {
      setConnecting(false);
    }
  }, []);

  // ── Disconnect ──
  const handleDisconnect = useCallback(async () => {
    playButtonPress();
    try {
      await disconnect();
      setConnected(false);
      setConnectedName("");
      setSelectedMac("");
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("connected_printer_name");
      setToast("Printer disconnected");
      setTimeout(() => setToast(""), 3000);
    } catch {
      setError("Disconnect failed");
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-slate-800 rounded-2xl border border-slate-600 shadow-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">
              🖨️
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Printer Setup</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={
                    "inline-block w-2 h-2 rounded-full " +
                    (connected ? "bg-green-400 animate-pulse" : "bg-red-400")
                  }
                />
                <span className="text-xs text-gray-400">
                  {connected ? connectedName || "Connected" : "Not connected"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => { playButtonPress(); onClose(); }}
            className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-600/60 transition-colors btn-press"
          >
            ✕
          </button>
        </div>

        {/* ── Toast ── */}
        {toast && (
          <div className="mx-4 mt-3 p-2 rounded-xl bg-green-500/20 text-green-400 text-center text-xs font-bold animate-slide-up">
            {toast}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mx-4 mt-3 p-2 rounded-xl bg-red-500/20 text-red-400 text-center text-xs font-bold">
            {error}
          </div>
        )}

        {/* ── Connected Status Card ── */}
        {connected && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-lg">✓</span>
              <div>
                <p className="text-green-400 text-xs font-bold">Printer Connected</p>
                <p className="text-gray-300 text-xs">{connectedName}</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold btn-press hover:bg-red-500/30 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* ── Scan Button ── */}
        <div className="px-4 pt-3">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm btn-press shadow-lg flex items-center justify-center gap-2 hover:from-blue-400 hover:to-indigo-500 transition-all"
          >
            {scanning ? (
              <>
                <span className="animate-spin">⟳</span> Scanning...
              </>
            ) : (
              <>
                🔍 Scan Printers
              </>
            )}
          </button>
        </div>

        {/* ── Device List ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {devices.length === 0 && !scanning && !error && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Tap "Scan Printers" to discover paired Bluetooth devices
            </div>
          )}

          {devices.map((device, idx) => {
            const isSelected = device.address === selectedMac;
            return (
              <button
                key={device.address || idx}
                onClick={() => handleConnect(device)}
                disabled={connecting && isSelected}
                className={
                  "w-full p-3 rounded-xl border text-left transition-all btn-press " +
                  (isSelected && connected
                    ? "bg-green-500/10 border-green-500/40"
                    : isSelected
                    ? "bg-blue-500/10 border-blue-500/40"
                    : "bg-slate-700/40 border-slate-600/50 hover:bg-slate-600/40 hover:border-slate-500/50")
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        "w-9 h-9 rounded-lg flex items-center justify-center text-lg " +
                        (isSelected && connected
                          ? "bg-green-500/20"
                          : "bg-slate-600/50")
                      }
                    >
                      {connecting && isSelected ? (
                        <span className="animate-spin">⟳</span>
                      ) : isSelected && connected ? (
                        "✓"
                      ) : (
                        "🖨️"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {device.name || "Unknown Device"}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {device.address}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isSelected && connected ? (
                      <span className="text-green-400 text-xs font-bold">Connected</span>
                    ) : connecting && isSelected ? (
                      <span className="text-blue-400 text-xs font-bold">Connecting...</span>
                    ) : (
                      <span className="text-gray-400 text-xs font-bold px-2 py-1 rounded-lg bg-slate-600/50">
                        Tap to connect
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Footer Tips ── */}
        <div className="px-4 py-3 border-t border-slate-700">
          <p className="text-gray-500 text-[10px] text-center leading-tight">
            Make sure your ESC/POS thermal printer is powered on and paired via Android Bluetooth settings before scanning.
          </p>
        </div>
      </div>
    </div>
  );
}
