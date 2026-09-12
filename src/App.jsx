import { useState, useEffect, useCallback, useRef } from 'react';
import PinScreen from './components/PinScreen';
import CategoryGrid from './components/CategoryGrid';
import ItemGrid from './components/ItemGrid';
import Cart from './components/Cart';
import TableSelector from './components/TableSelector';
import SuccessScreen from './components/SuccessScreen';
import DailyReport from './components/DailyReport';
import Settings from './components/Settings';
import BillEditor from './components/BillEditor';
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
import ItemMaster from './components/ItemMaster';
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
import { CATEGORIES, DEFAULT_ITEMS } from './utils/menuData';
import { saveMenuItems, getMenuItems, saveBill } from './utils/storage';
import { playButtonPress, playCheckoutSuccess } from './utils/audio';
import { logEdit, snapshotBill } from './utils/auditLog';

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [screen, setScreen] = useState('order-type'); // order-type → table-select → categories → items → success
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  // ── Order type & table state ──────────────────────────────
  const [orderType, setOrderType] = useState(null); // 'dine-in' | 'takeaway'
  const [activeTable, setActiveTable] = useState(null); // number
  const [tableOrders, setTableOrders] = useState({}); // { 1: [...cart], 3: [...cart] }

  // ── Active cart audit: snapshot when first item added ───────
  const cartSnapshotRef = useRef(null);
  const activeBillAuditRef = useRef([]);

  // ── Initialize cloud sync on mount ─────────────────────────
  useEffect(() => {
    import('./utils/sync').then(({ initSync }) => {
      initSync().catch(() => {});
    });
  }, []);

  // Initialize menu items + migrate image URLs from DEFAULT_ITEMS
  useEffect(() => {
    const initMenu = async () => {
      let items = await getMenuItems();
      if (!items || items.length === 0) {
        await saveMenuItems(DEFAULT_ITEMS);
        items = DEFAULT_ITEMS;
      } else {
        // Always refresh image URLs from DEFAULT_ITEMS (fixes broken URLs)
        const defaultMap = Object.fromEntries(DEFAULT_ITEMS.map(d => [d.id, d]));
        let needsUpdate = false;
        items = items.map(item => {
          const def = defaultMap[item.id];
          if (def?.image && item.image !== def.image) {
            needsUpdate = true;
            return { ...item, image: def.image };
          }
          return item;
        });
        if (needsUpdate) await saveMenuItems(items);
      }
      setMenuItems(items);
    };
    initMenu();
  }, []);

  const getItemsForCategory = useCallback(
    (categoryId) => menuItems.filter((item) => item.category === categoryId),
    [menuItems]
  );

  // ── Order type selection ──────────────────────────────────
  const handleSelectOrderType = useCallback((type) => {
    playButtonPress();
    setOrderType(type);
    if (type === 'takeaway') {
      setActiveTable(null);
      setScreen('categories');
    } else {
      setScreen('table-select');
    }
  }, []);

  // ── Table selection ───────────────────────────────────────
  const handleSelectTable = useCallback((tableNum) => {
    playButtonPress();
    setActiveTable(tableNum);
    // Restore cart for this table if it has items
    const existingOrder = tableOrders[tableNum] || [];
    setCart(existingOrder);
    setScreen('categories');
  }, [tableOrders]);

  // ── Switch table (from active-table pill) ──────────────────
  const handleSwitchTable = useCallback(() => {
    playButtonPress();
    const ct = cartRef.current;
    const at = activeTableRef.current;
    if (at !== null) {
      setTableOrders(prev => ({ ...prev, [at]: [...ct] }));
    }
    setScreen('table-select');
  }, []);

  // ── Switch to takeaway ────────────────────────────────────
  const handleSwitchToTakeaway = useCallback(() => {
    playButtonPress();
    const ct = cartRef.current;
    const at = activeTableRef.current;
    if (at !== null) {
      setTableOrders(prev => ({ ...prev, [at]: [...ct] }));
    }
    setOrderType('takeaway');
    setActiveTable(null);
    setCart([]);
    setScreen('categories');
  }, []);

  // ── Cart operations with audit logging ──────────────────────
  const handleAddToCart = useCallback((item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const handleUpdateQty = useCallback((itemId, qty) => {
    setCart((prev) => {
      const oldItem = prev.find((i) => i.id === itemId);
      const newCart = prev.map((i) => (i.id === itemId ? { ...i, qty } : i)).filter((i) => i.qty > 0);

      // Audit: log qty change
      if (oldItem && qty > 0 && qty !== oldItem.qty) {
        logEdit({
          billId: 'active-cart',
          action: 'item_qty_changed',
          before: { ...oldItem, total: oldItem.price * oldItem.qty },
          after: { ...oldItem, qty, price: oldItem.price, total: oldItem.price * qty },
          details: `${oldItem.name} qty ${oldItem.qty} → ${qty}`,
        });
        activeBillAuditRef.current.push({ action: 'item_qty_changed', itemId, from: oldItem.qty, to: qty });
      }
      // Audit: log item removal via qty 0
      if (oldItem && qty <= 0) {
        logEdit({
          billId: 'active-cart',
          action: 'item_removed',
          before: { ...oldItem, total: oldItem.price * oldItem.qty },
          after: null,
          details: `Removed ${oldItem.name} (${oldItem.portion || 'Fixed'}) × ${oldItem.qty}`,
        });
        activeBillAuditRef.current.push({ action: 'item_removed', itemId });
      }

      return newCart;
    });
  }, []);

  const handleRemoveFromCart = useCallback((itemId) => {
    setCart((prev) => {
      const oldItem = prev.find((i) => i.id === itemId);
      if (oldItem) {
        logEdit({
          billId: 'active-cart',
          action: 'item_removed',
          before: { ...oldItem, total: oldItem.price * oldItem.qty },
          after: null,
          details: `Removed ${oldItem.name} (${oldItem.portion || 'Fixed'}) × ${oldItem.qty}`,
        });
        activeBillAuditRef.current.push({ action: 'item_removed', itemId });
      }
      return prev.filter((i) => i.id !== itemId);
    });
  }, []);

  // Refs for stale closure prevention
  const cartRef = useRef(cart);
  const activeTableRef = useRef(activeTable);
  const orderTypeRef = useRef(orderType);
  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { activeTableRef.current = activeTable; }, [activeTable]);
  useEffect(() => { orderTypeRef.current = orderType; }, [orderType]);

  const handleCheckout = useCallback(
    async (paymentOrMethod) => {
      // Support both string ('cash') and object ({ method: 'credit', name, phone })
      const method = typeof paymentOrMethod === 'object' ? paymentOrMethod.method : paymentOrMethod;
      const creditInfo = typeof paymentOrMethod === 'object' ? paymentOrMethod : null;
      const currentCart = cartRef.current;
      const currentTable = activeTableRef.current;
      const currentOrderType = orderTypeRef.current;
      if (!currentCart || currentCart.length === 0) return;

      const total = currentCart.reduce((sum, item) => sum + item.price * item.qty, 0);
      const now = new Date();
      const bill = {
        items: [...currentCart],
        subtotal: total,
        total,
        originalTotal: total,
        paymentMethod: method,
        orderType: currentOrderType || 'takeaway',
        tableNumber: currentTable || null,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        timestamp: now.toISOString(),
        creditName: creditInfo?.name || null,
        creditPhone: creditInfo?.phone || null,
      };

      try {
        const billId = await saveBill(bill);
        bill.id = billId;
      } catch {
        bill.id = 'local-' + Date.now();
      }

      playCheckoutSuccess();
      setLastBill(bill);
      setLastPayment(method);
      setScreen('success');
      setCart([]);
      setCartOpen(false);
      // Clear table orders for this table
      if (activeTable !== null) {
        setTableOrders(prev => {
          const next = { ...prev };
          delete next[activeTable];
          return next;
        });
        setActiveTable(null);
      }
      setOrderType(null);
      cartSnapshotRef.current = null;
      activeBillAuditRef.current = [];
    },
    []
  );

  const handleNewBill = useCallback(() => {
    playButtonPress();
    setLastBill(null);
    setLastPayment(null);
    setScreen('order-type');
    setSelectedCategory(null);
    setOrderType(null);
    setActiveTable(null);
    setTableOrders({});
  }, []);

  // ── Back to order from success screen ────────────────────
  const handleBackToOrder = useCallback(() => {
    playButtonPress();
    if (lastBill) {
      setCart(lastBill.items || []);
    }
    setScreen('categories');
    setLastBill(null);
    setLastPayment(null);
  }, [lastBill]);

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
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍲</span>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Mehfil-E-Nihari</h1>
            <p className="text-amber-400/80 text-xs font-medium">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Active table / order type pill — always visible when in order flow */}
          {screen !== 'order-type' && screen !== 'success' && (
            <button
              onClick={handleSwitchTable}
              className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 
                rounded-xl px-3 py-1.5 text-amber-300 text-xs font-bold btn-press 
                hover:bg-amber-500/30 transition-colors"
              title="Switch Table"
            >
              🪑 {activeTable ? `T${activeTable}` : orderType === 'takeaway' ? 'Takeaway' : 'Table'}
            </button>
          )}
          <button
            onClick={() => {
              playButtonPress();
              setScreen('report');
            }}
            className="w-11 h-11 rounded-xl bg-slate-700/60 flex items-center justify-center 
              text-xl btn-press hover:bg-slate-600/60 transition-colors"
            title="Sales Report"
          >
            📊
          </button>
          <button
            onClick={() => {
              playButtonPress();
              setScreen('audit');
            }}
            className="w-11 h-11 rounded-xl bg-slate-700/60 flex items-center justify-center 
              text-xl btn-press hover:bg-slate-600/60 transition-colors"
            title="Audit Log"
          >
            📝
          </button>
          <button
            onClick={() => {
              playButtonPress();
              setScreen('settings');
            }}
            className="w-11 h-11 rounded-xl bg-slate-700/60 flex items-center justify-center 
              text-xl btn-press hover:bg-slate-600/60 transition-colors"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main content + Cart sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {/* ── Order Type Selection ───────────────────────── */}
          {screen === 'order-type' && (
            <div className="animate-fade-in flex flex-col items-center justify-center h-full">
              <span className="text-7xl mb-6">🍲</span>
              <h2 className="text-3xl font-bold text-white mb-2 text-center">Welcome to Mehfil-E-Nihari</h2>
              <p className="text-gray-400 text-sm mb-8 text-center">Select order type to begin</p>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <button
                  onClick={() => handleSelectOrderType('dine-in')}
                  className="py-8 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 
                    text-white flex flex-col items-center gap-3 btn-press shadow-xl 
                    hover:from-amber-500 hover:to-orange-600 hover:scale-105 transition-all"
                >
                  <span className="text-5xl">🍽️</span>
                  <span className="text-xl font-bold">Dine-In</span>
                  <span className="text-amber-200 text-xs">Select Table</span>
                </button>

                <button
                  onClick={() => handleSelectOrderType('takeaway')}
                  className="py-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 
                    text-white flex flex-col items-center gap-3 btn-press shadow-xl 
                    hover:from-blue-500 hover:to-indigo-600 hover:scale-105 transition-all"
                >
                  <span className="text-5xl">📦</span>
                  <span className="text-xl font-bold">Takeaway</span>
                  <span className="text-blue-200 text-xs">Counter Order</span>
                </button>
              </div>

              {/* Quick access to reports/settings */}
              <div className="flex items-center gap-3 mt-10">
                <button
                  onClick={() => { playButtonPress(); setScreen('report'); }}
                  className="px-4 py-2 rounded-xl bg-slate-700/50 text-gray-400 text-sm btn-press 
                    hover:bg-slate-600/50 hover:text-white transition-colors"
                >
                  📊 Reports
                </button>
                <button
                  onClick={() => { playButtonPress(); setScreen('settings'); }}
                  className="px-4 py-2 rounded-xl bg-slate-700/50 text-gray-400 text-sm btn-press 
                    hover:bg-slate-600/50 hover:text-white transition-colors"
                >
                  ⚙️ Settings
                </button>
              </div>
            </div>
          )}

          {/* ── Table Selection (Dine-In) ──────────────────── */}
          {screen === 'table-select' && (
            <TableSelector
              activeTable={activeTable}
              onSelectTable={handleSelectTable}
              orderType={orderType}
              onBack={() => {
                playButtonPress();
                setScreen('order-type');
                setOrderType(null);
              }}
              tableOrders={tableOrders}
            />
          )}

          {/* ── All Items (flat grid, no category selection) ── */}
          {screen === 'categories' && (
            <div>
              {/* Back to order type */}
              <button
                onClick={() => {
                  playButtonPress();
                  if (orderType === 'dine-in') {
                    if (activeTable !== null) {
                      setTableOrders(prev => ({ ...prev, [activeTable]: [...cart] }));
                    }
                    setScreen('table-select');
                  } else {
                    setScreen('order-type');
                    setOrderType(null);
                  }
                }}
                className="mb-3 flex items-center gap-2 text-gray-300 hover:text-white 
                  transition-colors text-sm btn-press px-3 py-1.5 rounded-xl hover:bg-white/10"
              >
                <span className="text-lg">←</span>
                <span className="font-semibold">
                  {orderType === 'dine-in' ? 'Change Table' : 'Change Order Type'}
                </span>
              </button>
              <ItemGrid
                items={menuItems}
                categories={CATEGORIES}
                onAdd={handleAddToCart}
                onBack={() => {
                  playButtonPress();
                  if (orderType === 'dine-in') {
                    if (activeTable !== null) {
                      setTableOrders(prev => ({ ...prev, [activeTable]: [...cart] }));
                    }
                    setScreen('table-select');
                  } else {
                    setScreen('order-type');
                    setOrderType(null);
                  }
                }}
              />
            </div>
          )}

          {/* ── Success Screen ─────────────────────────────── */}
          {screen === 'success' && lastBill && (
            <SuccessScreen
              bill={lastBill}
              paymentMethod={lastPayment}
              onNewBill={handleNewBill}
              onBackToOrder={handleBackToOrder}
            />
          )}

          {/* ── Reports & Settings screens ─────────────────── */}
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
                setLastBill(updatedBill);
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
        </div>

        {/* Cart — only show when in order flow */}
        {!['order-type', 'table-select', 'success', 'settings', 'report', 'audit', 'closing', 'owner', 'purchase', 'expenses', 'backup', 'sync', 'ca', 'eod', 'whatsapp', 'menu-master', 'kds', 'printer', 'attendance', 'hardware', 'customers', 'staff', 'inventory', 'vendor', 'business-profile', 'roles', 'apk'].includes(screen) && screen?.type !== 'editor' && (
          <Cart
            cart={cart}
            onUpdateQty={handleUpdateQty}
            onRemove={handleRemoveFromCart}
            onCheckout={handleCheckout}
            isOpen={cartOpen}
            onToggle={() => setCartOpen((prev) => !prev)}
            activeTable={activeTable}
            orderType={orderType}
          />
        )}
      </div>
    </div>
  );
}
