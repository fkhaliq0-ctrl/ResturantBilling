import { useState } from 'react';
import { playAddSound, playButtonPress } from '../utils/audio';

export default function ItemGrid({ items, onAdd, onBack, categories }) {
  const [lastAdded, setLastAdded] = useState(null);
  const [portionModal, setPortionModal] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [filterCat, setFilterCat] = useState('all');

  // ── Flat mode: categories prop present = show all items ──
  const flatMode = !!categories;

  const handleItemClick = (item) => {
    playButtonPress();
    if (item.portions === null || item.portions === undefined) {
      addItemToCart(item, null);
      return;
    }
    if (item.portions.length === 1) {
      addItemToCart(item, item.portions[0]);
      return;
    }
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

  const getStartingPrice = (item) => {
    if (item.portions && item.portions.length > 0) {
      return Math.min(...item.portions.map(p => p.price));
    }
    return item.price || 0;
  };

  // ── Sort & filter items ─────────────────────────────────
  const sortedItems = [...items]
    .filter(i => filterCat === 'all' || i.category === filterCat)
    .sort((a, b) => {
      if (sortBy === 'low-high') return getStartingPrice(a) - getStartingPrice(b);
      if (sortBy === 'high-low') return getStartingPrice(b) - getStartingPrice(a);
      return 0;
    });

  // ── Group by category for flat mode ─────────────────────
  const groupedItems = flatMode
    ? (categories || [])
        .map(cat => ({
          ...cat,
          items: sortedItems.filter(i => i.category === cat.id),
        }))
        .filter(g => g.items.length > 0)
    : [];

  // ── Render a single item card (image-forward design) ───
  const renderItemCard = (item) => {
    const hasPortions = item.portions && item.portions.length > 0;
    const hasImage = !!item.image;

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        className={`
          relative rounded-2xl overflow-hidden flex flex-col
          border-2 border-slate-600 hover:border-amber-400
          btn-press transition-all duration-150
          shadow-md hover:shadow-xl hover:scale-[1.03]
          ${lastAdded === item.id ? 'animate-bounce-add border-green-400 ring-2 ring-green-400' : ''}
        `}
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
      >
        {/* ── Image Section ──────────────────────────── */}
        {hasImage ? (
          <div className="relative w-full h-[110px] sm:h-[130px] overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback emoji when image fails */}
            <div className="hidden w-full h-full items-center justify-center bg-slate-700">
              <span className="text-5xl">{item.icon}</span>
            </div>
            {/* Gradient overlay at bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/90 to-transparent" />
            {/* Price badge on image */}
            <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold rounded-lg px-2 py-1 shadow-lg">
              {hasPortions ? `from ${formatPrice(getStartingPrice(item))}` : formatPrice(item.price)}
            </span>
            {/* Portion badge on image */}
            {hasPortions && (
              <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-amber-300 text-[10px] font-bold rounded-lg px-2 py-1">
                {item.portions.map(p => p.label).join(' / ')}
              </span>
            )}
          </div>
        ) : (
          /* ── Emoji fallback (no image) ────────────── */
          <div className="w-full h-[100px] flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
            <span className="text-5xl sm:text-6xl">{item.icon}</span>
          </div>
        )}

        {/* ── Info Block (dark charcoal) ────────────── */}
        <div className="w-full px-3 py-2.5 flex flex-col gap-0.5">
          <span className="text-white font-bold text-[13px] sm:text-sm text-center leading-tight line-clamp-1">
            {item.name}
          </span>
          {item.hi && (
            <span className="text-amber-300/80 text-[11px] text-center leading-tight line-clamp-1">
              {item.hi}
            </span>
          )}
          {item.ur && (
            <span className="text-gray-400 text-[11px] text-center leading-tight line-clamp-1" dir="rtl">
              {item.ur}
            </span>
          )}

          {/* Price / Portions */}
          {item.note ? (
            <span className="text-amber-300 font-bold text-sm mt-1 italic text-center">{item.note}</span>
          ) : hasPortions ? (
            <div className="mt-1 flex flex-col items-center gap-0.5">
              {item.portions.map((p) => (
                <span key={p.label} className="text-amber-400 font-bold text-[11px] sm:text-xs">
                  {p.label}: {formatPrice(p.price)}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-amber-400 font-bold text-base sm:text-lg mt-1 text-center">
              {formatPrice(item.price)}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Back button + Sort + Filter */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-300 hover:text-white 
            transition-colors text-lg btn-press px-2 py-1 rounded-xl hover:bg-white/10 shrink-0"
        >
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back</span>
        </button>

        {flatMode && (
          <select
            value={filterCat}
            onChange={(e) => { playButtonPress(); setFilterCat(e.target.value); }}
            className="bg-slate-700 border border-slate-600 rounded-xl px-2 py-1.5 text-white text-xs font-bold 
              focus:outline-none focus:border-amber-400 btn-press shrink-0"
          >
            <option value="all">🍽️ All Items</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        )}

        <select
          value={sortBy}
          onChange={(e) => { playButtonPress(); setSortBy(e.target.value); }}
          className="bg-slate-700 border border-slate-600 rounded-xl px-2 py-1.5 text-white text-xs font-bold 
            focus:outline-none focus:border-amber-400 btn-press ml-auto shrink-0"
        >
          <option value="default">🔄 Default</option>
          <option value="low-high">💰 Low→High</option>
          <option value="high-low">💎 High→Low</option>
        </select>
      </div>

      {/* ── Flat mode: All items grouped by category ─────── */}
      {flatMode && filterCat === 'all' ? (
        <div className="space-y-6">
          {groupedItems.map((group) => (
            <div key={group.id}>
              {/* Category header */}
              <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 bg-slate-900/90 backdrop-blur-sm py-2 -mx-1 px-1 rounded-xl">
                {/* Category image or icon */}
                {group.image ? (
                  <img src={group.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <span className="text-3xl">{group.icon}</span>
                )}
                <div className="flex-1">
                  <h3 className="text-white font-bold text-base">{group.name}</h3>
                  {group.hi && <span className="text-amber-300/70 text-xs mr-2">{group.hi}</span>}
                  {group.ur && <span className="text-amber-300/50 text-xs" dir="rtl">{group.ur}</span>}
                </div>
                <span className="text-gray-500 text-xs bg-slate-700 rounded-full px-2 py-0.5">
                  {group.items.length}
                </span>
              </div>
              {/* Items grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.items.map(item => renderItemCard(item))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Single category or filtered view ────────────── */
        <>
          {sortedItems.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <span className="text-5xl block mb-3">📋</span>
              <p>No items match.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedItems.map(item => renderItemCard(item))}
            </div>
          )}
        </>
      )}

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
              {portionModal.image ? (
                <img src={portionModal.image} alt="" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3" />
              ) : (
                <span className="text-5xl block mb-2">{portionModal.icon}</span>
              )}
              <h3 className="text-xl font-bold text-white">{portionModal.name}</h3>
              {portionModal.hi && <p className="text-amber-300/70 text-sm mt-0.5">{portionModal.hi}</p>}
              {portionModal.ur && <p className="text-gray-400 text-sm mt-0.5" dir="rtl">{portionModal.ur}</p>}
              <p className="text-gray-400 text-sm mt-2">Select portion:</p>
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
              onClick={() => { playButtonPress(); setPortionModal(null); }}
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
