import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../utils/storage';
import { playButtonPress, playCheckoutSuccess } from '../utils/audio';

export default function AttendanceBiometric({ onBack }) {
  const [records, setRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [toast, setToast] = useState('');
  const [todayFilter, setTodayFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const saved = await getSetting('attendance_records');
    setRecords(Array.isArray(saved) ? saved : []);
    const staff = await getSetting('staff_members');
    setStaffList(Array.isArray(staff) ? staff : []);
    const bio = await getSetting('biometric_enabled');
    setBiometricEnabled(bio === true);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleClockIn = () => {
    if (!selectedStaff) { showToast('Select a staff member first'); return; }
    playButtonPress();
    const now = new Date();
    const record = {
      id: 'att_' + Date.now(),
      staffId: selectedStaff,
      staffName: staffList.find(s => s.id === selectedStaff)?.name || selectedStaff,
      clockIn: now.toISOString(),
      clockOut: null,
      date: now.toISOString().split('T')[0],
      hours: 0,
    };
    const updated = [...records, record];
    setRecords(updated);
    setSetting('attendance_records', updated);
    playCheckoutSuccess();
    showToast(`✅ ${record.staffName} clocked in at ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`);
  };

  const handleClockOut = () => {
    if (!selectedStaff) { showToast('Select a staff member first'); return; }
    playButtonPress();
    const now = new Date();
    const updated = records.map(r => {
      if (r.staffId === selectedStaff && !r.clockOut && r.date === now.toISOString().split('T')[0]) {
        const hours = ((new Date(now) - new Date(r.clockIn)) / 3600000).toFixed(1);
        return { ...r, clockOut: now.toISOString(), hours: parseFloat(hours) };
      }
      return r;
    });
    setRecords(updated);
    setSetting('attendance_records', updated);
    playCheckoutSuccess();
    showToast(`✅ ${staffList.find(s => s.id === selectedStaff)?.name || 'Staff'} clocked out`);
  };

  const toggleBiometric = async () => {
    playButtonPress();
    const newVal = !biometricEnabled;
    setBiometricEnabled(newVal);
    await setSetting('biometric_enabled', newVal);
    showToast(newVal ? '🔒 Biometric required for clock-in' : '🔓 Biometric disabled');
  };

  const todayRecords = records.filter(r => r.date === todayFilter);

  const getHoursWorked = (r) => {
    if (r.clockOut) return `${r.hours}h`;
    const elapsed = ((Date.now() - new Date(r.clockIn).getTime()) / 3600000).toFixed(1);
    return `${elapsed}h (ongoing)`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span><span className="font-semibold">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">⏱️ Attendance & Biometric</h1>
      </div>

      {toast && <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-center font-bold text-sm animate-slide-up">{toast}</div>}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Clock In/Out */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50 space-y-3">
          <h3 className="text-white font-bold">⏱️ Clock In / Out</h3>
          <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm focus:border-amber-500 focus:outline-none">
            <option value="">Select Staff Member</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name} — {s.role || 'Staff'}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleClockIn} className="py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold btn-press shadow-lg">
              ✅ Clock In
            </button>
            <button onClick={handleClockOut} className="py-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold btn-press shadow-lg">
              🚪 Clock Out
            </button>
          </div>
        </div>

        {/* Biometric Config */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50 space-y-3">
          <h3 className="text-white font-bold">🔒 Biometric Settings</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={biometricEnabled} onChange={toggleBiometric}
              className="w-5 h-5 rounded accent-amber-500" />
            <div>
              <span className="text-white text-sm font-bold block">Require Biometric for Clock-In</span>
              <span className="text-gray-500 text-xs">Staff must verify fingerprint to clock in</span>
            </div>
          </label>
          {biometricEnabled && (
            <div className="bg-amber-500/10 rounded-xl p-3 text-amber-300 text-xs">
              💡 Connect a USB fingerprint scanner via Settings → Hardware Status to enable biometric verification
            </div>
          )}
        </div>

        {/* Daily Log */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">📋 Attendance Log</h3>
            <input type="date" value={todayFilter} onChange={e => setTodayFilter(e.target.value)}
              className="py-1 px-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-xs focus:border-amber-500 focus:outline-none" />
          </div>
          {todayRecords.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No attendance records for this date</p>
          ) : (
            <div className="space-y-2">
              {todayRecords.map(r => (
                <div key={r.id} className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{r.staffName}</p>
                    <p className="text-gray-400 text-xs">
                      In: {new Date(r.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {r.clockOut && ` → Out: ${new Date(r.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${r.clockOut ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {getHoursWorked(r)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
