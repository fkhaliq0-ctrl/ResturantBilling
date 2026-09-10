import { useState, useEffect, useRef } from 'react';
import { CATEGORIES, DEFAULT_ITEMS } from '../utils/menuData';
import { saveMenuItems, getMenuItems } from '../utils/storage';
import { playButtonPress } from '../utils/audio';

// ── Transliteration map for auto-generating Hindi/Urdu ──────
const HI_MAP = {
  'buff': 'बफ़', 'mutton': 'मटन', 'chicken': 'चिकन', 'nihari': 'नहारी',
  'nalli': 'नल्ली', 'biryani': 'बिरयानी', 'qorma': 'कोरमा', 'kawab': 'कबाब',
  'kheer': 'खीर', 'roti': 'रोटी', 'bheja': 'भेजा', 'butter': 'मक्खन',
  'desi ghee': 'देसी घी', 'gravy': 'ग्रेवी', 'extra': 'एक्स्ट्रा',
  'pasanda': 'पसंदा', 'cold drink': 'कोल्ड ड्रिंक', 'water': 'पानी',
};
const UR_MAP = {
  'buff': 'بف', 'mutton': 'مٹن', 'chicken': 'چکن', 'nihari': 'نہاری',
  'nalli': 'نلی', 'biryani': 'بریانی', 'qorma': 'قورمہ', 'kawab': 'کباب',
  'kheer': 'کھیر', 'roti': 'روٹی', 'bheja': 'بھیجا', 'butter': 'مکھن',
  'desi ghee': 'دیسی گھی', 'gravy': 'گریوی', 'extra': 'اضافی',
  'pasanda': 'پسندہ', 'cold drink': 'کولڈ ڈرنک', 'water': 'پانی',
};

function autoTransliterate(text, map) {
  if (!text) return '';
  let result = text.toLowerCase();
  // Sort keys by length (longest first) for multi-word matching
  const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);
  sortedKeys.forEach(key => {
    result = result.replace(new RegExp(key, 'gi'), map[key]);
  });
  return result;
}

const ICON_OPTIONS = ['🍲', '🥘', '🫕', '🍢', '🍚', '🫓', '🍮', '🥣', '🥤', '🍛', '🧈', '🍖', '🥧', '🍰', '🫔', '🌮'];

const emptyItem = {
  name: '', hi: '', ur: '', category: 'buff_nihari', icon: '🍲',
  image: '', portions: [], price: 0, note: '', outOfStock: false,
};

const emptyCat = { id: '', name: '', hi: '', ur: '', icon: '🍽️', color: 'from-amber-700 to-red-900' };

export default function ItemMaster({ onBack }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [tab, setTab] = useState('items'); // items | categories
  const [editing, setEditing] = useState(null); // item object or null
  const [showForm, setShowForm] = useState(false);
  const [catEditing, setCatEditing] = useState(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [search, setSearch] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [editMode, setEditMode] = useState('url'); // 'url' or 'file'
  const formRef = useRef(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    let stored = await getMenuItems();
    if (!stored || stored.length === 0) {
      await saveMenuItems(DEFAULT_ITEMS);
      stored = DEFAULT_ITEMS;
    }
    setItems(stored);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const persistItems = async (newItems) => {
    setSaving(true);
    await saveMenuItems(newItems);
    setItems(newItems);
    setSaving(false);
  };

  // ── Item CRUD ────────────────────────────────────────────
  const handleAddItem = () => {
    playButtonPress();
    setEditing({ ...emptyItem, id: 'item_' + Date.now() });
    setImageUrl('');
    setImagePreview('');
    setEditMode('url');
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleEditItem = (item) => {
    playButtonPress();
    setEditing({ ...item });
    setImageUrl(item.image || '');
    setImagePreview(item.image || '');
    setEditMode(item.image?.startsWith('data:') ? 'file' : 'url');
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleDeleteItem = async (itemId) => {
    playButtonPress();
    if (!confirm('Delete this item permanently?')) return;
    const newItems = items.filter(i => i.id !== itemId);
    await persistItems(newItems);
    showToast('Item deleted');
  };

  const handleSaveItem = async () => {
    if (!editing.name.trim()) {
      showToast('Item name is required');
      return;
    }
    playButtonPress();
    const item = { ...editing, image: imageUrl || editing.image || '' };
    let newItems;
    if (items.find(i => i.id === item.id)) {
      newItems = items.map(i => i.id === item.id ? item : i);
    } else {
      newItems = [...items, item];
    }
    await persistItems(newItems);
    setShowForm(false);
    setEditing(null);
    showToast('Item saved!');
  };

  const handleToggleOOS = async (itemId) => {
    playButtonPress();
    const newItems = items.map(i =>
      i.id === itemId ? { ...i, outOfStock: !i.outOfStock } : i
    );
    await persistItems(newItems);
  };

  // ── Category CRUD ────────────────────────────────────────
  const handleAddCategory = () => {
    playButtonPress();
    setCatEditing({ ...emptyCat, id: 'cat_' + Date.now() });
    setShowCatForm(true);
  };

  const handleEditCategory = (cat) => {
    playButtonPress();
    setCatEditing({ ...cat });
    setShowCatForm(true);
  };

  const handleDeleteCategory = async (catId) => {
    playButtonPress();
    const itemCount = items.filter(i => i.category === catId).length;
    if (itemCount > 0) {
      showToast(`Cannot delete — ${itemCount} items still in this category`);
      return;
    }
    if (!confirm('Delete this category permanently?')) return;
    setCategories(prev => prev.filter(c => c.id !== catId));
    showToast('Category deleted');
  };

  const handleSaveCategory = () => {
    if (!catEditing.name.trim()) {
      showToast('Category name is required');
      return;
    }
    playButtonPress();
    if (categories.find(c => c.id === catEditing.id)) {
      setCategories(prev => prev.map(c => c.id === catEditing.id ? catEditing : c));
    } else {
      setCategories(prev => [...prev, catEditing]);
    }
    setShowCatForm(false);
    setCatEditing(null);
    showToast('Category saved!');
  };

  // ── Portion helpers ──────────────────────────────────────
  const addPortion = () => {
    if (!editing) return;
    setEditing(prev => ({
      ...prev,
      portions: [...(prev.portions || []), { label: '', price: 0 }],
    }));
  };

  const updatePortion = (idx, field, value) => {
    setEditing(prev => {
      const portions = [...(prev.portions || [])];
      portions[idx] = { ...portions[idx], [field]: field === 'price' ? Number(value) || 0 : value };
      return { ...prev, portions };
    });
  };

  const removePortion = (idx) => {
    setEditing(prev => ({
      ...prev,
      portions: (prev.portions || []).filter((_, i) => i !== idx),
    }));
  };

  // ── Get starting price for sorting ──────────────────────
  const getStartingPrice = (item) => {
    if (item.portions && item.portions.length > 0) {
      return Math.min(...item.portions.map(p => p.price));
    }
    return item.price || 0;
  };

  // ── Filtered & sorted items ─────────────────────────────
  const filtered = items
    .filter(i => {
      if (filterCat !== 'all' && i.category !== filterCat) return false;
      if (search) {
        const s = search.toLowerCase();
        return i.name.toLowerCase().includes(s) ||
          (i.hi || '').toLowerCase().includes(s) ||
          (i.ur || '').includes(s);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'low-high') return getStartingPrice(a) - getStartingPrice(b);
      if (sortBy === 'high-low') return getStartingPrice(b) - getStartingPrice(a);
      return 0;
    });

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <button
          onClick={() => { playButtonPress(); onBack(); }}
          className="mb-3 flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm btn-press px-2 py-1 rounded-xl hover:bg-white/10"
        >
          <span className="text-lg">←</span>
          <span className="font-semibold">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">🍽️ Item Master</h1>
        <p className="text-gray-400 text-sm">Add, edit, or remove menu items</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 shrink-0">
        <button
          onClick={() => { playButtonPress(); setTab('items'); }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all btn-press ${tab === 'items' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-gray-300'}`}
        >
          📋 Items ({items.length})
        </button>
        <button
          onClick={() => { playButtonPress(); setTab('categories'); }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all btn-press ${tab === 'categories' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-gray-300'}`}
        >
          📂 Categories ({categories.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* ── ITEMS TAB ────────────────────────────────────── */}
        {tab === 'items' && (
          <>
            {/* Add button */}
            <button
              onClick={handleAddItem}
              className="w-full mb-3 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold text-sm btn-press shadow-lg hover:from-green-500 hover:to-emerald-600 transition-all"
            >
              ➕ Add New Item
            </button>

            {/* Search, Filter & Sort */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
              />
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-xl px-2 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="all">All</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => { playButtonPress(); setSortBy(e.target.value); }}
                className="bg-slate-700 border border-slate-600 rounded-xl px-2 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="default">🔄 Default</option>
                <option value="low-high">💰 Low→High</option>
                <option value="high-low">💎 High→Low</option>
              </select>
            </div>

            {/* Add/Edit Form */}
            {showForm && editing && (
              <div ref={formRef} className="bg-slate-700/50 rounded-2xl p-4 mb-4 border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-lg">
                    {items.find(i => i.id === editing.id) ? '✏️ Edit Item' : '➕ Add Item'}
                  </h3>
                  <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>

                {/* Image preview */}
                <div className="mb-3">
                  <div className="w-20 h-20 rounded-xl bg-slate-600 flex items-center justify-center overflow-hidden border-2 border-slate-500">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" onError={() => setImagePreview('')} />
                    ) : (
                      <span className="text-4xl">{editing.icon}</span>
                    )}
                  </div>
                </div>

                {/* Image URL */}
                <div className="mb-3">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Image Source</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setEditMode('url')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold btn-press ${editMode === 'url' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-gray-300'}`}
                    >
                      🌐 URL
                    </button>
                    <button
                      onClick={() => setEditMode('file')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold btn-press ${editMode === 'file' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-gray-300'}`}
                    >
                      📁 File
                    </button>
                  </div>
                  
                  {editMode === 'url' ? (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => { setImageUrl(e.target.value); setImagePreview(e.target.value); }}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                      {imageUrl && (
                        <button onClick={() => { setImageUrl(''); setImagePreview(''); }} className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold btn-press">Clear</button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const base64 = e.target.result;
                              setImageUrl(base64);
                              setImagePreview(base64);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="flex-1 bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                      {imageUrl && (
                        <button onClick={() => { setImageUrl(''); setImagePreview(''); }} className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold btn-press">Clear</button>
                      )}
                    </div>
                  )}
                </div>

                {/* Category */}
                <div className="mb-3">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Category</label>
                  <select
                    value={editing.category}
                    onChange={(e) => setEditing(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Icon */}
                <div className="mb-3">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setEditing(prev => ({ ...prev, icon }))}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl btn-press transition-all ${editing.icon === icon ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-slate-600 hover:bg-slate-500'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* English Name */}
                <div className="mb-2">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">English Name *</label>
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setEditing(prev => ({
                        ...prev,
                        name,
                        hi: autoTransliterate(name, HI_MAP),
                        ur: autoTransliterate(name, UR_MAP),
                      }));
                    }}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                    placeholder="Buff Nihari"
                  />
                </div>

                {/* Hindi Name */}
                <div className="mb-2">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Hindi Name (हिंदी)</label>
                  <input
                    type="text"
                    value={editing.hi}
                    onChange={(e) => setEditing(prev => ({ ...prev, hi: e.target.value }))}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                    placeholder="बफ़ नहारी"
                  />
                </div>

                {/* Urdu Name */}
                <div className="mb-3">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Urdu Name (اردو)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={editing.ur}
                    onChange={(e) => setEditing(prev => ({ ...prev, ur: e.target.value }))}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                    placeholder="بف نہاری"
                  />
                </div>

                {/* Note */}
                <div className="mb-3">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Note (optional)</label>
                  <input
                    type="text"
                    value={editing.note || ''}
                    onChange={(e) => setEditing(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                    placeholder="M.R.P, Seasonal, etc."
                  />
                </div>

                {/* Fixed price vs Portions */}
                <div className="mb-3">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Pricing</label>
                  {(editing.portions && editing.portions.length > 0) ? (
                    <div className="space-y-2">
                      {editing.portions.map((p, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={p.label}
                            onChange={(e) => updatePortion(idx, 'label', e.target.value)}
                            placeholder="Label (e.g. Single)"
                            className="flex-1 bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                          />
                          <input
                            type="number"
                            value={p.price}
                            onChange={(e) => updatePortion(idx, 'price', e.target.value)}
                            placeholder="₹"
                            className="w-24 bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                          />
                          <button onClick={() => removePortion(idx)} className="text-red-400 hover:text-red-300 text-lg btn-press">✕</button>
                        </div>
                      ))}
                      <button
                        onClick={addPortion}
                        className="w-full py-2 rounded-lg bg-slate-600 text-gray-300 text-sm font-bold btn-press hover:bg-slate-500 transition-colors"
                      >
                        ➕ Add Portion
                      </button>
                      <button
                        onClick={() => setEditing(prev => ({ ...prev, portions: [] }))}
                        className="w-full py-2 rounded-lg bg-slate-600 text-gray-400 text-xs btn-press hover:bg-slate-500 transition-colors"
                      >
                        Switch to Fixed Price
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <span className="text-gray-400 text-sm">₹</span>
                        <input
                          type="number"
                          value={editing.price || 0}
                          onChange={(e) => setEditing(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                          placeholder="Price"
                          className="flex-1 bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <button
                        onClick={() => setEditing(prev => ({ ...prev, portions: [{ label: 'Single', price: prev.price || 0 }], price: undefined }))}
                        className="w-full py-2 rounded-lg bg-slate-600 text-gray-300 text-sm font-bold btn-press hover:bg-slate-500 transition-colors"
                      >
                        ➕ Add Portions Instead
                      </button>
                    </div>
                  )}
                </div>

                {/* Save / Cancel */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveItem}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold text-sm btn-press shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? '⏳ Saving...' : '💾 Save Item'}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setEditing(null); }}
                    className="px-4 py-3 rounded-xl bg-slate-600 text-gray-300 font-bold text-sm btn-press hover:bg-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Items list */}
            {filtered.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                <span className="text-5xl block mb-3">📋</span>
                <p>{items.length === 0 ? 'No items yet. Add your first item!' : 'No items match your search.'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(item => {
                  const cat = categories.find(c => c.id === item.category);
                  const hasPortions = item.portions && item.portions.length > 0;
                  return (
                    <div
                      key={item.id}
                      className={`bg-slate-700/50 rounded-xl p-3 flex items-center gap-3 transition-all ${item.outOfStock ? 'opacity-50' : ''}`}
                    >
                      {/* Image / Icon */}
                      <div className="w-12 h-12 rounded-lg bg-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        ) : null}
                        <span className={`text-2xl ${item.image ? 'hidden' : ''}`}>{item.icon}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{item.name}</p>
                        {item.hi && <p className="text-gray-400 text-xs">{item.hi}</p>}
                        {item.ur && <p className="text-gray-500 text-xs" dir="rtl">{item.ur}</p>}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] bg-slate-600 text-gray-300 rounded px-1.5 py-0.5">{cat?.icon} {cat?.name}</span>
                          {hasPortions ? (
                            item.portions.map(p => (
                              <span key={p.label} className="text-amber-400 text-[10px] font-bold">{p.label}: ₹{p.price}</span>
                            ))
                          ) : (
                            <span className="text-amber-400 text-[10px] font-bold">₹{item.price || 0}</span>
                          )}
                          {item.outOfStock && <span className="text-red-400 text-[10px] font-bold">🚫 OOS</span>}
                          {item.note && <span className="text-gray-500 text-[10px] italic">{item.note}</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleOOS(item.id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm btn-press transition-colors ${item.outOfStock ? 'bg-red-500/30 text-red-300' : 'bg-slate-600 text-gray-400 hover:text-green-300'}`}
                          title={item.outOfStock ? 'Mark In Stock' : 'Mark Out of Stock'}
                        >
                          {item.outOfStock ? '🚫' : '✅'}
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm btn-press hover:bg-blue-500/30"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-sm btn-press hover:bg-red-500/30"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── CATEGORIES TAB ──────────────────────────────── */}
        {tab === 'categories' && (
          <>
            <button
              onClick={handleAddCategory}
              className="w-full mb-3 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold text-sm btn-press shadow-lg hover:from-green-500 hover:to-emerald-600 transition-all"
            >
              ➕ Add New Category
            </button>

            {showCatForm && catEditing && (
              <div className="bg-slate-700/50 rounded-2xl p-4 mb-4 border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-lg">
                    {categories.find(c => c.id === catEditing.id) ? '✏️ Edit Category' : '➕ Add Category'}
                  </h3>
                  <button onClick={() => { setShowCatForm(false); setCatEditing(null); }} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>

                <div className="mb-2">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setCatEditing(prev => ({ ...prev, icon }))}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl btn-press transition-all ${catEditing.icon === icon ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-slate-600 hover:bg-slate-500'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-2">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">English Name *</label>
                  <input
                    type="text"
                    value={catEditing.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCatEditing(prev => ({
                        ...prev,
                        name,
                        hi: autoTransliterate(name, HI_MAP),
                        ur: autoTransliterate(name, UR_MAP),
                      }));
                    }}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                    placeholder="Category Name"
                  />
                </div>

                <div className="mb-2">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Hindi (हिंदी)</label>
                  <input
                    type="text"
                    value={catEditing.hi}
                    onChange={(e) => setCatEditing(prev => ({ ...prev, hi: e.target.value }))}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-gray-300 text-xs font-bold mb-1 block">Urdu (اردو)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={catEditing.ur}
                    onChange={(e) => setCatEditing(prev => ({ ...prev, ur: e.target.value }))}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-2">
                  <button onClick={handleSaveCategory} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold text-sm btn-press shadow-lg transition-all">
                    💾 Save
                  </button>
                  <button onClick={() => { setShowCatForm(false); setCatEditing(null); }} className="px-4 py-3 rounded-xl bg-slate-600 text-gray-300 font-bold text-sm btn-press hover:bg-slate-500 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {categories.map(cat => {
                const count = items.filter(i => i.category === cat.id).length;
                return (
                  <div key={cat.id} className="bg-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-3xl">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{cat.name}</p>
                      {cat.hi && <p className="text-gray-400 text-xs">{cat.hi}</p>}
                      {cat.ur && <p className="text-gray-500 text-xs" dir="rtl">{cat.ur}</p>}
                      <p className="text-gray-500 text-xs mt-0.5">{count} items</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditCategory(cat)} className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm btn-press hover:bg-blue-500/30" title="Edit">✏️</button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-sm btn-press hover:bg-red-500/30" title="Delete">🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl animate-slide-up z-50">
          ✅ {toast}
        </div>
      )}
    </div>
  );
}
