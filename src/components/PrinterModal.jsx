import React, { useState } from "react";

const CALL_METHOD = (method, ...args) =>
  new Promise((resolve, reject) => {
    if (!window.bluetoothSerial) {
      return reject(new Error("Bluetooth plugin not available"));
    }
    window.bluetoothSerial[method](resolve, reject, ...args);
  });

const REQUEST_PERMISSIONS = () =>
  new Promise((resolve, reject) => {
    const permissions = window.cordova?.plugins?.permissions;
    if (!permissions) {
      return resolve(true);
    }
    permissions.requestPermissions(
      [
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.BLUETOOTH_CONNECT"
      ],
      (status) => {
        if (status.hasPermission) {
          resolve(true);
        } else {
          reject(new Error("Bluetooth runtime permissions denied."));
        }
      },
      reject
    );
  });

export default function PrinterModal({ isOpen, onClose, onConnected }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleOpenPicker = async () => {
    setLoading(true);
    setMessage("Requesting Bluetooth permissions...");
    try {
      await REQUEST_PERMISSIONS();
      setMessage("Fetching paired printers...");
      const list = await CALL_METHOD("list");
      setDevices(list || []);
      if (!list || list.length === 0) {
        setMessage("No paired printers found. Please pair your printer in Android Settings first.");
      } else {
        setMessage("");
      }
    } catch (err) {
      setMessage(
        err.message?.includes("denied")
          ? "Permission denied. Enable 'Nearby Devices' in your phone's App Settings."
          : "Failed to access Bluetooth devices."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (device) => {
    setLoading(true);
    setMessage(`Connecting to ${device.name || device.address}...`);
    try {
      await CALL_METHOD("connect", device.address);
      localStorage.setItem("printer_device", JSON.stringify(device));
      setMessage("Printer connected successfully!");
      setLoading(false);
      if (onConnected) onConnected(device);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setLoading(false);
      setMessage("Connection failed. Make sure the printer is turned on.");
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      handleOpenPicker();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="text-xl font-bold text-gray-900">Scan & Pair Printer</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <div className="my-4">
          {message && (
            <p className="mb-4 text-sm text-amber-800 bg-amber-50 p-3 rounded-md border border-amber-200">
              {message}
            </p>
          )}

          {loading && devices.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Loading devices...</div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {devices.map((d) => (
                <button
                  key={d.address}
                  onClick={() => handleConnect(d)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex flex-col transition-colors"
                >
                  <span className="font-semibold text-gray-800">
                    {d.name || "Unnamed Printer"}
                  </span>
                  <span className="text-xs text-gray-500">{d.address}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <button
            onClick={handleOpenPicker}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
          >
            Refresh List
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
