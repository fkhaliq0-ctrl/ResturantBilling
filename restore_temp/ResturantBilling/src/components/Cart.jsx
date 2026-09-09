import { playRemoveSound, playButtonPress } from '../utils/audio';

export default function Cart({ cart, onUpdateQty, onRemove, onCheckout, isOpen, onToggle, activeTable, orderType }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => {
          playButtonPress();
          onToggle();
        }}
        className="lg:hidden fixed bottom-4 right-4 z-50 w-16 h-16 rounded-full 
          bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl 
          flex items-center justify-center btn-press animate-pulse-glow"
      >
        <span className="text-3xl">🛒</span>
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500 
            text-white text-sm font-bold flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {/* Cart panel */}
      <div className={`
        fixed lg:static inset-y-0 right-0 z-40
        w-full sm:w-80 lg:w-80 
        bg-slate-800/95 lg:bg-slate-800 
        border-l border-slate-700
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🛒 Order
            </h2>
            <p className="text-gray-400 text-sm">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} • ₹{total}
            </p>
          </div>
          <button
            onClick={() => {
              playButtonPress();
              onToggle();
            }}
            className="lg:hidden w-10 h-10 rounded-full bg-slate-700 
              flex items-center justify-center text-white text-xl btn-press"
          >
            ✕
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <span className="text-6xl mb-4">🍲</span>
              <p className="text-lg text-center">Tap items to add<br />to your order</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-slate-700/50 rounded-xl p-3 flex items-center gap-3 
                  animate-slide-up"
              >
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                  {item.portion && (
                    <p className="text-amber-400/80 text-xs font-medium">{item.portion}</p>
                  )}
                  {item.note && (
                    <p className="text-gray-400 text-xs italic">{item.note}</p>
                  )}
                  <p className="text-amber-400 font-bold">₹{item.price * item.qty}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (item.qty === 1) {
                        playRemoveSound();
                        onRemove(item.id);
                      } else {
                        playRemoveSound();
                        onUpdateQty(item.id, item.qty - 1);
                      }
                    }}
                    className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 
                      flex items-center justify-center text-2xl font-bold btn-press
                      hover:bg-red-500/40 transition-colors"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-xl w-8 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => {
                      playButtonPress();
                      onUpdateQty(item.id, item.qty + 1);
                    }}
                    className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 
                      flex items-center justify-center text-2xl font-bold btn-press
                      hover:bg-green-500/40 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout section */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-700 space-y-3 animate-slide-up shrink-0">
            {/* Total */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-lg font-semibold">Total</span>
              <span className="text-white text-3xl font-bold">₹{total}</span>
            </div>

            {/* Payment mode buttons — 3-column grid */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                onClick={() => onCheckout('cash')}
                className="py-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 
                  text-white font-bold flex flex-col items-center gap-1 btn-press 
                  shadow-lg hover:from-green-400 hover:to-emerald-500 transition-all text-sm"
              >
                <span className="text-xl">💵</span>
                <span>Cash</span>
                <span className="text-[10px] font-normal text-green-100">₹{total}</span>
              </button>

              <button
                onClick={() => onCheckout('upi')}
                className="py-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 
                  text-white font-bold flex flex-col items-center gap-1 btn-press 
                  shadow-lg hover:from-blue-400 hover:to-indigo-500 transition-all text-sm"
              >
                <span className="text-xl">📱</span>
                <span>UPI</span>
                <span className="text-[10px] font-normal text-blue-100">₹{total}</span>
              </button>

              <button
                onClick={() => onCheckout('credit')}
                className="py-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 
                  text-white font-bold flex flex-col items-center gap-1 btn-press 
                  shadow-lg hover:from-purple-400 hover:to-violet-500 transition-all text-sm"
              >
                <span className="text-xl">📋</span>
                <span>Credit</span>
                <span className="text-[10px] font-normal text-purple-100">Pay Later</span>
              </button>
            </div>

            {/* Active table indicator */}
            {orderType === 'dine-in' && activeTable && (
              <div className="text-center text-amber-300 text-[10px] font-medium">
                🪑 Table {activeTable}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
