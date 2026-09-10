import React, { useState } from 'react';
import { playButtonPress, playSuccessSound, playErrorSound } from '../utils/audio';

export default function MenuMaster({ menuItems, setMenuItems, onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Nihari');
  const [image, setImage] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name || !price) {
      playErrorSound();
      return;
    }
    playSuccessSound();
    if (editingItem) {
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? { ...item, name, price: Number(price), category, image: image || item.image } : item));
    } else {
      setMenuItems([...menuItems, { id: Date.now(), name, price: Number(price), category, image: image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500' }]);
    }
    setEditingItem(null);
    setName('');
    setPrice('');
    setImage('');
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white p-5 animate-fade-in overflow-y-auto">
      <button onClick={() => { playButtonPress(); onBack(); }} className="mb-4 flex items-center gap-2 text-gray-300 hover:text-white text-lg btn-press px-3 py-1 rounded-xl bg-white/10 w-fit">← Back</button>
      <h1 className="text-2xl font-bold mb-4">📋 Menu Master & Item Management</h1>
      <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 mb-6">
        <h2 className="text-lg font-bold mb-3">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Item Name" value={name} onChange={(e) => setName(e.target.value)} className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-white" />
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-white" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-white">
            <option value="Nihari">Nihari</option>
            <option value="Biryani">Biryani</option>
            <option value="BBQ">BBQ</option>
            <option value="Beverages">Beverages</option>
          </select>
          <div className="flex flex-col gap-2">
            <input type="text" placeholder="Image URL (http://...)" value={image.startsWith('data:') ? '' : image} onChange={(e) => setImage(e.target.value)} className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm" />
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
          </div>
          <button type="submit" className="md:col-span-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold btn-press shadow-lg">{editingItem ? 'Update Item' : 'Add Item'}</button>
        </form>
      </div>
    </div>
  );
}
