import { useState, useEffect } from 'react';
import {
  getCAContacts, saveCAContacts, getCurrentQuarter,
  buildQuarterlyReport, formatCAReport, sendToBothCA,
  sendCAToWhatsApp, markAsSent, getLastSent, isQuarterDue,
} from '../utils/caDispatcher';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from '../utils/audio';

export default function CADispatcher({ onBack }) {
  const [contacts, setContacts] = useState({ phone1: '', name1: '', phone2: '', name2: '' });
  const [currentQ, setCurrentQ] = useState(null);
  const [report, setReport] = useState(null);
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastSent, setLastSentState] = useState(null);
  const [quarterDue, setQuarterDue] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');
  const [selectedQ, setSelectedQ] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const c = await getCAContacts();
    setContacts(c);
    const q = getCurrentQuarter();
    setCurrentQ(q);
    setSelectedQ(q);
    const ls = await getLastSent();
    setLastSentState(ls);
    const due = await isQuarterDue();
    setQuarterDue(due);
    setLoading(false);
  };

  const handleSaveContacts = async () => {
    playButtonPress();
    await saveCAContacts(contacts);
    playCheckoutSuccess();
    setMessage('✅ CA contacts saved!');
    setMsgType('success');
  };

  const handleGenerateReport = async (quarterObj) => {
    playButtonPress();
    setGenerating(true);
    try {
      const q = quarterObj || selectedQ;
      const r = await buildQuarterlyReport(q.quarter, q.year);
      setReport(r);
      const text = formatCAReport(r);
      setReportText(text);
    } catch (err) {
      playErrorSound();
      setMessage('❌ Error: ' + err.message);
      setMsgType('error');
    }
    setGenerating(false);
  };

  const handleSendBoth = () => {
    if (!contacts.phone1 && !contacts.phone2) {
      playErrorSound();
      setMessage('❌ Add at least one CA phone number');
      setMsgType('error');
      return;
    }
    if (!reportText) {
      playErrorSound();
      setMessage('❌ Generate report first');
      setMsgType('error');
      return;
    }

    playButtonPress();
    const sent = sendToBothCA(contacts, reportText);
    playCheckoutSuccess();
    setMessage(`📱 Opening WhatsApp for: ${sent.join(', ')}`);
    setMsgType('success');
    markAsSent(selectedQ.quarter);
    setLastSentState({ quarter: selectedQ.quarter, timestamp: new Date().toISOString() });
  };

  const handleSendSingle = (phoneNum, name) => {
    if (!phoneNum) {
      playErrorSound();
      return;
    }
    if (!reportText) {
      playErrorSound();
      setMessage('❌ Generate report first');
      setMsgType('error');
      return;
    }
    playButtonPress();
    sendCAToWhatsApp(phoneNum, reportText);
    playCheckoutSuccess();
    setMessage(`📱 Opening WhatsApp for ${name || phoneNum}`);
    setMsgType('success');
  };

  const quarters = [
    { quarter: 'Q1', label: 'Q1 (Apr-Jun)', months: 'Apr–Jun' },
    { quarter: 'Q2', label: 'Q2 (Jul-Sep)', months: 'Jul–Sep' },
    { quarter: 'Q3', label: 'Q3 (Oct-Dec)', months: 'Oct–Dec' },
    { quarter: 'Q4', label: 'Q4 (Jan-Mar)', months: 'Jan–Mar' },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400 text-xl animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button onClick={() => { playButtonPress(); onBack(); }}
          className="mb-2 flex items-center gap-2 text-gray-300 hover:text-white 
            transition-colors btn-press px-2 py-1 rounded-xl hover:bg-white/10">
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">📊 CA Report Dispatcher</h1>
            <p className="text-gray-400 text-sm">Quarterly GST & sales report for your CA</p>
          </div>
          {quarterDue && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold animate-pulse">
              ⚠️ Report Due
            </span>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-4 mt-3 p-3 rounded-xl text-center font-bold text-sm animate-slide-up ${
          msgType === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Quarterly Alert ──────────────────────────────── */}
        {quarterDue && (
          <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30">
            <h3 className="text-amber-400 font-bold text-sm mb-1">⚠️ Quarterly Report Due!</h3>
            <p className="text-gray-300 text-xs">
              Your {currentQ.quarter} {currentQ.year} GST report hasn't been sent to your CA yet.
              Generate and send it now to stay compliant.
            </p>
          </div>
        )}

        {/* ── CA Contacts ──────────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-3">📞 CA Office Contacts</h3>
          <div className="space-y-3">
            {/* CA 1 */}
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-amber-400 text-xs font-bold mb-2">CA Office 1</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={contacts.name1}
                  onChange={(e) => setContacts((p) => ({ ...p, name1: e.target.value }))}
                  placeholder="Name (e.g. Sharma & Co)"
                  className="py-2 px-3 rounded-xl bg-slate-700 border border-slate-600 
                    text-white text-xs focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="tel"
                  value={contacts.phone1}
                  onChange={(e) => setContacts((p) => ({ ...p, phone1: e.target.value }))}
                  placeholder="WhatsApp: 919876543210"
                  className="py-2 px-3 rounded-xl bg-slate-700 border border-slate-600 
                    text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
            {/* CA 2 */}
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-gray-400 text-xs font-bold mb-2">CA Office 2 (Optional)</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={contacts.name2}
                  onChange={(e) => setContacts((p) => ({ ...p, name2: e.target.value }))}
                  placeholder="Name"
                  className="py-2 px-3 rounded-xl bg-slate-700 border border-slate-600 
                    text-white text-xs focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="tel"
                  value={contacts.phone2}
                  onChange={(e) => setContacts((p) => ({ ...p, phone2: e.target.value }))}
                  placeholder="WhatsApp: 919876543210"
                  className="py-2 px-3 rounded-xl bg-slate-700 border border-slate-600 
                    text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
            <button onClick={handleSaveContacts}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm btn-press">
              💾 Save Contacts
            </button>
          </div>
        </div>

        {/* ── Quarter Selector ─────────────────────────────── */}
        <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
          <h3 className="text-white font-bold text-sm mb-3">📅 Select Quarter</h3>
          <div className="grid grid-cols-2 gap-2">
            {quarters.map((q) => {
              const isCurrent = currentQ.quarter === q.quarter;
              const isSelected = selectedQ?.quarter === q.quarter && selectedQ?.year === currentQ.year;
              const sentThisQ = lastSent?.quarter === q.quarter;
              return (
                <button key={q.quarter}
                  onClick={() => setSelectedQ({ ...q, year: currentQ.year })}
                  className={`py-3 rounded-xl text-sm font-bold btn-press transition-all border-2 ${
                    isSelected
                      ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                      : 'bg-slate-800/50 border-slate-600 text-gray-400 hover:border-slate-500'
                  }`}>
                  <div>{q.label}</div>
                  {isCurrent && <div className="text-[10px] text-amber-400/70">Current</div>}
                  {sentThisQ && <div className="text-[10px] text-green-400">✅ Sent</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Generate Report ──────────────────────────────── */}
        <button
          onClick={() => handleGenerateReport()}
          disabled={generating}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 
            text-white text-lg font-bold btn-press shadow-xl disabled:opacity-50
            flex items-center justify-center gap-2"
        >
          {generating ? '⏳ Generating...' : '📊 Generate Quarterly Report'}
        </button>

        {/* ── Report Preview ───────────────────────────────── */}
        {report && (
          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/50">
            <h3 className="text-white font-bold text-sm mb-3">
              📋 Report Preview — {report.quarter} {report.year}
            </h3>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-slate-800/50 rounded-xl p-2 text-center">
                <p className="text-gray-500 text-[10px]">Sales</p>
                <p className="text-green-400 font-bold text-sm">₹{report.sales.total.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-2 text-center">
                <p className="text-gray-500 text-[10px]">Expenses</p>
                <p className="text-red-400 font-bold text-sm">₹{report.expenses.total.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-2 text-center">
                <p className="text-gray-500 text-[10px]">GST</p>
                <p className="text-amber-400 font-bold text-sm">₹{report.gst.total.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Report text preview */}
            <div className="bg-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto">
              <pre className="text-gray-300 text-[10px] whitespace-pre-wrap font-mono leading-relaxed">
                {reportText}
              </pre>
            </div>

            {/* Send buttons */}
            <div className="mt-3 space-y-2">
              {/* Send to both */}
              <button onClick={handleSendBoth}
                disabled={!contacts.phone1 && !contacts.phone2}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 
                  text-white font-bold btn-press shadow-lg disabled:opacity-40
                  flex items-center justify-center gap-2"
              >
                📱 Send to Both CA Offices
              </button>

              {/* Send individually */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleSendSingle(contacts.phone1, contacts.name1)}
                  disabled={!contacts.phone1}
                  className="py-2.5 rounded-xl bg-green-500/20 text-green-400 font-bold text-xs 
                    btn-press disabled:opacity-40 border border-green-500/30">
                  📱 Send to CA 1
                </button>
                <button onClick={() => handleSendSingle(contacts.phone2, contacts.name2)}
                  disabled={!contacts.phone2}
                  className="py-2.5 rounded-xl bg-green-500/20 text-green-400 font-bold text-xs 
                    btn-press disabled:opacity-40 border border-green-500/30">
                  📱 Send to CA 2
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Last Sent Info ───────────────────────────────── */}
        {lastSent && (
          <div className="bg-slate-700/20 rounded-2xl p-4 text-center">
            <p className="text-gray-500 text-xs">
              Last sent: {lastSent.quarter} on{' '}
              {new Date(lastSent.timestamp).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* ── Info ────────────────────────────────────────── */}
        <div className="bg-slate-700/20 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-xs">
            💡 GST quarterly returns are due by the 18th of the month following the quarter.<br />
            Report includes: Sales, GST (5%), Expenses, Top Items, Net Profit.<br />
            WhatsApp opens with the formatted report ready to send.
          </p>
        </div>
      </div>
    </div>
  );
}
