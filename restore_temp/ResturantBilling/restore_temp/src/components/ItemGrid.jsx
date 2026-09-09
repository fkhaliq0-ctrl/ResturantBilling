import { useState } from 'react';
import { playAddSound, playButtonPress } from '../utils/audio';

export default function ItemGrid({ items, onAdd, onBack }) {
  const [lastAdded, setLastAdded] = useState(null);
  const [portionModal, setPortionModal] = useState(null); // item object when portion picker is open

  const handleItemClick = (item) => {
    playButtonPress();
    // If item has no portions (fixed price), add directly
    if (item.portions === null || item.portions === undefined) {
      addItemToCart(item, null);
      return;
    }
    // If item has only one portion, add directly with that portion
    if (item.portions.length === 1) {
      addItemToCart(item, item.portions[0]);
      return;
    }
    // Multiple portions — show picker
    setPortionModal(item);
  };

  const handlePortionSelect = (item, portion) => {
    playButtonPress();
    addItemToCart(item, portion);
    setPortionModal(null);
  };

  const addItemToCart = (item, portion) => {
    playAddSound();
    const cartItem = {
      id: item.id + (portion ? '_' + portion.label.toLowerCase().replace(/\s+/g, '') : ''),
      name: item.name,
      icon: item.icon,
      category: item.category,
      price: portion ? portion.price : item.price,
      portion: portion ? portion.label : null,
      note: item.note || null,
    };
    setLastAdded(cartItem.id);
    onAdd(cartItem);
    setTimeout(() => setLastAdded(null), 300);
  };

  const formatPrice = (price) => {
    if (price === 0) return 'M.R.P';
    return '₹' + price;
  };

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-3 flex items-center gap-2 text-gray-300 hover:text-white 
          transition-colors text-lg btn-press px-2 py-1 rounded-xl hover:bg-white/10"
      >
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back</span>
      </button>

      {/* Items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const hasPortions = item.portions && item.portions.length > 0;
          const startingPrice = hasPortions
            ? Math.min(...item.portions.map((p) => p.price))
            : item.price;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`
                relative rounded-2xl p-4 flex flex-col items-center justify-center
                bg-gradient-to-br from-slate-700 to-slate-800 
                border-2 border-slate-600 hover:border-amber-400
                btn-press transition-all duration-150
                shadow-md hover:shadow-xl hover:scale-105
                min-h-[130px]
                ${lastAdded === item.id ? 'animate-bounce-add border-green-400 bg-green-900/30' : ''}
              `}
            >
              <span className="text-4xl sm:text-5xl mb-2">{item.icon}</span>
              <span className="text-white font-bold text-sm sm:text-base text-center leading-tight px-1">
                {item.name}
              </span>

              {/* Price display */}
              {item.note ? (
                <span className="text-amber-300 font-bold text-sm mt-1 italic">
                  {item.note}
                </span>
              ) : hasPortions ? (
                <div className="mt-1 flex flex-col items-center">
                  {item.portions.map((p) => (
                    <span key={p.label} className="text-amber-400 font-bold text-xs sm:text-sm">
                      {p.label}: {formatPrice(p.price)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-amber-400 font-bold text-lg sm:text-xl mt-1">
                  {formatPrice(item.price)}
                </span>
              )}

              {/* Portion indicator badge */}
              {hasPortions && (
                <span className="absolute top-2 left-2 text-[9px] font-bold bg-amber-500/80 text-white 
                  rounded-full px-2 py-0.5">
                  {item.portions.map((p) => p.label).join(' / ')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Portion Selection Modal */}
      {portionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
          onClick={() => setPortionModal(null)}
        >
          <div
            className="bg-slate-800 rounded-3xl p-6 w-80 sm:w-96 shadow-2xl border border-slate-600 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <span className="text-5xl block mb-2">{portionModal.icon}</span>
              <h3 className="text-xl font-bold text-white">{portionModal.name}</h3>
              <p className="text-gray-400 text-sm mt-1">Select portion:</p>
            </div>

            <div className="space-y-3">
              {portionModal.portions.map((portion) => (
                <button
                  key={portion.label}
                  onClick={() => handlePortionSelect(portionModal, portion)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-700 
                    text-white text-xl font-bold flex items-center justify-between px-6
                    btn-press shadow-lg hover:from-amber-500 hover:to-orange-600
                    active:from-amber-700 active:to-orange-800 transition-all"
                >
                  <span>{portion.label}</span>
                  <span className="text-2xl">{formatPrice(portion.price)}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                playButtonPress();
                setPortionModal(null);
              }}
              className="w-full mt-4 py-3 rounded-xl bg-slate-600 text-gray-300 
                font-semibold btn-press hover:bg-slate-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
