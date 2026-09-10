import { useState, useEffect, useCallback } from 'react';
import PinScreen from './components/PinScreen';
import CategoryGrid from './components/CategoryGrid';
import ItemGrid from './components/ItemGrid';
import Cart from './components/Cart';
import SuccessScreen from './components/SuccessScreen';
import DailyReport from './components/DailyReport';
import Settings from './components/Settings';
import BillEditor from './components/BillEditor';
import TableSelector from './components/TableSelector';
import OrderTypeSelector from './components/OrderTypeSelector';
import AuditLog from './components/AuditLog';
import ClosingStock from './components/ClosingStock';
import OwnerReport from './components/OwnerReport';
import PurchaseEntry from './components/PurchaseEntry';
import ExpenseReport from './components/ExpenseReport';
import BackupRestore from './components/BackupRestore';
import SyncConfig from './components/SyncConfig';
import CADispatcher from './components/CADispatcher';
import EODClosing from './components/EODClosing';
import WhatsAppStatus from './components/WhatsAppStatus';
import MenuMaster from './components/MenuMaster';
import KitchenDisplay from './components/KitchenDisplay';
import PrinterSettings from './components/PrinterSettings';
import AttendanceBiometric from './components/AttendanceBiometric';
import HardwareStatus from './components/HardwareStatus';
import CustomerDatabase from './components/CustomerDatabase';
import StaffManagement from './components/StaffManagement';
import InventoryStock from './components/InventoryStock';
import VendorMaster from './components/VendorMaster';
import BusinessProfile from './components/BusinessProfile';
import RolePermissions from './components/RolePermissions';
import SendAPK from './components/SendAPK';
import { CATEGORIES } from './data/menu';
import { playButtonPress, playCheckoutSuccess, playErrorSound } from './utils/audio';
import { getPin } from './utils/pin';
import { saveBill, getAllBills, clearAllData } from './utils/storage';

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [screen, setScreen] = useState('order-type');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderType, setOrderType] = useState(null);
  const [activeTable, setActiveTable] = useState(null);
  const [tableOrders, setTableOrders] = useState({});
  const [lastBill, setLastBill] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);

  useEffect(() => {
    getPin().then(pin => {
      if (!pin) setUnlocked(true);
    });
  }, []);

  const handleSelectTable = useCallback((tableId) => {
    setActiveTable(tableId);
    if (tableOrders[tableId]) {
      setCart(tableOrders[tableId]);
    } else {
      setCart([]);
    }
    setScreen('categories');
  }, [tableOrders]);

  const handleSwitchTable = useCallback(() => {
    if (activeTable) {
      setTableOrders(prev => ({ ...prev, [activeTable]: cart }));
    }
    setScreen('table-select');
  }, [activeTable, cart]);

  const handleSwitchTakeaway = useCallback(() => {
    if (activeTable) {
      setTableOrders(prev => ({ ...prev, [activeTable]: cart }));
    }
    setActiveTable(null);
    setCart([]);
    setOrderType('takeaway');
    setScreen('categories');
  }, [activeTable, cart]);

  const handleAddToCart = useCallback((item) => {
    playButtonPress();
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const handleUpdateQty = useCallback((id, delta) => {
    playButtonPress();
    setCart(prev => {
      return prev.map(i => {
        if (i.id === id) {
          const newQty = i.qty + delta;
          return newQty > 0 ? { ...i, qty: newQty } : null;
        }
        return i;
      }).filter(Boolean);
    });
  }, []);

  const handleCheckout = useCallback(async (paymentMethod, discount = 0, customerPhone = '', customerName = '') => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const total = Math.max(0, subtotal - discount);
    const bill = {
      id: 'BILL-' + Date.now(),
      timestamp: new Date().toISOString(),
      items: cart,
      subtotal,
      discount,
      total,
      orderType: orderType || 'dine-in',
      table: activeTable || 'N/A',
      paymentMethod,
      customerPhone: customerPhone || '',
      customerName: customerName || '',
    };

    // Auto-save customer to database
    if (customerPhone && customerPhone.length >= 10) {
      try {
        const { getSetting, setSetting } = await import('./utils/storage');
        const existing = (await getSetting('customers')) || [];
        const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
        const existingIdx = existing.findIndex(c => c.phone?.replace(/[^0-9]/g, '') === cleanPhone);
        if (existingIdx >= 0) {
          // Update existing customer
          existing[existingIdx] = {
            ...existing[existingIdx],
            name: customerName || existing[existingIdx].name,
            totalVisits: (existing[existingIdx].totalVisits || 0) + 1,
            totalSpend: (existing[existingIdx].totalSpend || 0) + total,
            lastVisit: new Date().toISOString(),
          };
          await setSetting('customers', existing);
        } else {
          // Create new customer
          const newCustomer = {
            id: 'cust_' + Date.now(),
            name: customerName || 'Walk-in Customer',
            phone: customerPhone,
            email: '',
            gstin: '',
            address: '',
            loyaltyPoints: Math.floor(total / 10), // 1 point per ₹10 spent
            totalVisits: 1,
            totalSpend: total,
            lastVisit: new Date().toISOString(),
          };
          await setSetting('customers', [...existing, newCustomer]);
        }
      } catch (err) {
        console.error('Failed to auto-save customer:', err);
      }
    }

    await saveBill(bill);
    playCheckoutSuccess();
    setLastBill(bill);
    setLastPayment(paymentMethod);
    setScreen('success');
    setCart([]);
    setCartOpen(false);
    if (activeTable) {
      setTableOrders(prev => {
        const copy = { ...prev };
        delete copy[activeTable];
        return copy;
      });
    }
  }, [cart, orderType, activeTable]);

  const handleNewBill = useCallback(() => {
    setScreen('order-type');
    setSelectedCategory(null);
    setOrderType(null);
    setActiveTable(null);
    setCart([]);
  }, []);

  const handleSelectCategory = useCallback((catId) => {
    playButtonPress();
    setSelectedCategory(catId);
    setScreen('items');
  }, []);

  const handleBackToCategories = useCallback(() => {
    playButtonPress();
    setScreen('categories');
    setSelectedCategory(null);
  }, []);

  if (!unlocked) {
    return <PinScreen onUnlock={() => setUnlocked(true)} />;
  }

  const categoryName = CATEGORIES.find((c) => c.id === selectedCategory)?.name || '';

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden select-none">
      <header className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🍲</span>
          <h1 className="text-lg font-bold tracking-wide">Mehfil-E-Nihari</h1>
        </div>
        <div className="flex items-center space-x-2">
          {screen !== 'order-type' && screen !== 'success' && (
            <button
              onClick={handleSwitchTable}
              className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-xl text-amber-400 text-sm btn-press"
            >
              <span>{activeTable ? "Table " + activeTable : 'Takeaway'}</span>
            </button>
          )}
          <button
            onClick={() => { playButtonPress(); setScreen('report'); }}
            className="w-11 h-11 rounded-xl bg-slate-700/60 flex items-center justify-center text-xl btn-press hover:bg-slate-600/60 transition-colors"
            title="Daily Report"
          >
            📊
          </button>
          <button
            onClick={() => { playButtonPress(); setScreen('audit'); }}
            className="w-11 h-11 rounded-xl bg-slate-700/60 flex items-center justify-center text-xl btn-press hover:bg-slate-600/60 transition-colors"
            title="Audit Log"
          >
            📋
          </button>
          <button
            onClick={() => { playButtonPress(); setScreen('settings'); }}
            className="w-11 h-11 rounded-xl bg-slate-700/60 flex items-center justify-center text-xl btn-press hover:bg-slate-600/60 transition-colors"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {screen === 'order-type' && (
          <div className="animate-fade-in flex flex-col items-center justify-center h-full p-6">
            <span className="text-7xl mb-6">🍲</span>
            <h2 className="text-3xl font-bold text-white mb-2 text-center">Welcome to Mehfil-E-Nihari</h2>
            <p className="text-gray-400 mb-8 text-center">Select order type to begin billing</p>
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
              <button
                onClick={() => {
                  playButtonPress();
                  setOrderType('dine-in');
                  setScreen('table-select');
                }}
                className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl text-center shadow-lg btn-press"
              >
                <span className="text-4xl block mb-2">🪑</span>
                <span className="font-bold text-lg">Dine-In</span>
              </button>
              <button
                onClick={() => {
                  playButtonPress();
                  setOrderType('takeaway');
                  setScreen('categories');
                }}
                className="p-6 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl text-center shadow-lg btn-press"
              >
                <span className="text-4xl block mb-2">🛍️</span>
                <span className="font-bold text-lg">Takeaway</span>
              </button>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => { playButtonPress(); setScreen('report'); }}
                className="px-4 py-2 rounded-xl bg-slate-700/50 text-gray-400 text-sm btn-press hover:bg-slate-600/50 hover:text-white transition-colors"
              >
                Daily Report
              </button>
              <button
                onClick={() => { playButtonPress(); setScreen('settings'); }}
                className="px-4 py-2 rounded-xl bg-slate-700/50 text-gray-400 text-sm btn-press hover:bg-slate-600/50 hover:text-white transition-colors"
              >
                Settings & Config
              </button>
            </div>
          </div>
        )}

        {screen === 'table-select' && (
          <TableSelector
            activeTable={activeTable}
            onSelectTable={handleSelectTable}
            onBack={() => {
              setScreen('order-type');
              setOrderType(null);
            }}
            tableOrders={tableOrders}
          />
        )}

        {screen === 'categories' && (
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  if (orderType === 'dine-in') {
                    setScreen('table-select');
                  } else {
                    setScreen('order-type');
                    setOrderType(null);
                  }
                }}
                className="px-4 py-2 bg-slate-800 rounded-xl text-sm font-semibold btn-press hover:bg-slate-700"
              >
                ← Back
              </button>
              <h2 className="text-lg font-bold">Select Category</h2>
              <div className="w-16"></div>
            </div>
            <CategoryGrid onSelectCategory={handleSelectCategory} />
          </div>
        )}

        {screen === 'items' && (
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBackToCategories}
                className="px-4 py-2 bg-slate-800 rounded-xl text-sm font-semibold btn-press hover:bg-slate-700"
              >
                ← Categories
              </button>
              <h2 className="text-lg font-bold">{categoryName}</h2>
              <div className="w-20"></div>
            </div>
            <ItemGrid categoryId={selectedCategory} onAddToCart={handleAddToCart} />
          </div>
        )}

        {screen === 'success' && lastBill && (
          <SuccessScreen
            bill={lastBill}
            paymentMethod={lastPayment}
            onNewBill={handleNewBill}
            onViewReports={() => {
              setScreen('report');
            }}
          />
        )}

        {screen === 'report' && (
          <DailyReport
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
            onEditBill={(bill) => {
              playButtonPress();
              setScreen({ type: 'editor', bill });
            }}
          />
        )}

        {screen === 'audit' && (
          <AuditLog
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
          />
        )}

        {screen === 'closing' && (
          <ClosingStock
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
          />
        )}

        {screen === 'owner' && (
          <OwnerReport
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
          />
        )}

        {screen === 'purchase' && (
          <PurchaseEntry
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
          />
        )}

        {screen === 'expenses' && (
          <ExpenseReport
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
          />
        )}

        {screen.type === 'editor' && screen.bill && (
          <BillEditor
            bill={screen.bill}
            onBack={() => {
              playButtonPress();
              setScreen('report');
            }}
            onSaved={(updatedBill) => {
              playButtonPress();
              setScreen('report');
            }}
          />
        )}

        {screen === 'backup' && (
          <BackupRestore
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
          />
        )}

        {screen === 'sync' && (
          <SyncConfig
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
          />
        )}

        {screen === 'ca' && (
          <CADispatcher
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
          />
        )}

        {screen === 'eod' && (
          <EODClosing
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
          />
        )}

        {screen === 'whatsapp' && (
          <WhatsAppStatus
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
          />
        )}

        {screen === 'menu-master' && (
          <MenuMaster
            onBack={() => {
              playButtonPress();
              setScreen('settings');
            }}
          />
        )}

        {screen === 'kds' && (
          <KitchenDisplay onBack={() => { playButtonPress(); setScreen('settings'); }} />
        )}
        {screen === 'printer' && (
          <PrinterSettings onBack={() => { playButtonPress(); setScreen('settings'); }} />
        )}
        {screen === 'attendance' && (
          <AttendanceBiometric onBack={() => { playButtonPress(); setScreen('settings'); }} />
        )}
        {screen === 'hardware' && (
          <HardwareStatus onBack={() => { playButtonPress(); setScreen('settings'); }} />
        )}
        {screen === 'customers' && (
          <CustomerDatabase onBack={() => { playButtonPress(); setScreen('settings'); }} />
        )}
        {screen === 'staff' && (
          <StaffManagement onBack={() => { playButtonPress(); setScreen('settings'); }} />
        )}
        {screen === 'inventory' && (
          <InventoryStock onBack={() => { playButtonPress(); setScreen('settings'); }} />
        )}
        {screen === 'vendor' && (
          <VendorMaster onBack={() => { playButtonPress(); setScreen('settings'); }} />
        )}
        {screen === 'business-profile' && (
          <BusinessProfile onBack={() => { playButtonPress(); setScreen('settings'); }} />
        )}
        {screen === 'roles' && (
          <RolePermissions onBack={() => { playButtonPress(); setScreen('settings'); }} />
        )}
        {screen === 'apk' && (
          <SendAPK onBack={() => { playButtonPress(); setScreen('settings'); }} />
        )}

        {screen === 'settings' && (
          <Settings
            onBack={() => {
              playButtonPress();
              setScreen('categories');
            }}
            onNavigate={(s) => {
              playButtonPress();
              setScreen(s);
            }}
          />
        )}

        {screen !== 'order-type' && screen !== 'table-select' && screen !== 'success' && screen !== 'settings' && screen !== 'kds' && screen !== 'printer' && screen !== 'attendance' && screen !== 'hardware' && screen !== 'customers' && screen !== 'staff' && screen !== 'inventory' && screen !== 'vendor' && screen !== 'business-profile' && screen !== 'roles' && screen !== 'menu-master' && screen !== 'apk' && screen !== 'report' && screen !== 'audit' && screen !== 'closing' && screen !== 'owner' && screen !== 'purchase' && screen !== 'expenses' && screen !== 'backup' && screen !== 'sync' && screen !== 'ca' && screen !== 'eod' && screen !== 'whatsapp' && (
          <Cart
            cart={cart}
            onUpdateQty={handleUpdateQty}
            onCheckout={handleCheckout}
            orderType={orderType}
            activeTable={activeTable}
          />
        )}
      </main>
    </div>
  );
}
