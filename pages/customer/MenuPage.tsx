import React, { useState } from 'react';
import { CustomerLayout } from '../../components/CustomerLayout';
import { CATEGORIES } from '../../constants';
import { Search, Clock, Plus } from 'lucide-react';
import { MenuItem } from '../../types';
import { CustomerItemModal } from '../../components/CustomerItemModal';
import { useStore } from '../../context/StoreContext';

export const MenuPage = () => {
  const { filteredMenu, settings } = useStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const displayedMenu = filteredMenu.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Debug logging
    console.log('Filtering item:', item.name, 'category:', item.category, 'activeCategory:', activeCategory, 'matchesCategory:', matchesCategory);

    // Only show these items in the main menu grid
    const validItems = [
      'Deluxe Steak & Fries',
      'Steak & Fries',
      'Steak Only',
      'Signature Fries',
      'Kids Meal',
      'Kids Fries',
      'Coca Cola',
      'Coke',
      'Coke Zero',
      'Tango Mango',
      'Sprite'
    ];

    const isValidItem = validItems.includes(item.name);
    return matchesCategory && matchesSearch && isValidItem;
  });

  return (
    <CustomerLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Text */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-white mb-2 font-heading uppercase">Our Menu</h1>
          <p className="text-zinc-400">Fresh steak and fries with premium add-ons</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-600 focus:ring-1 focus:ring-brand-yellow focus:outline-none"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${activeCategory === cat.id
                ? 'bg-brand-yellow text-black border-brand-yellow'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedMenu.map((item) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4 hover:border-zinc-700 transition-colors group relative">
              <div className="flex-1 flex flex-col min-h-[120px]">
                <div className="mb-auto">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-white text-lg leading-tight pr-2">{item.name}</h3>
                  </div>
                  <p className="text-brand-yellow font-bold mb-2">£{item.price.toFixed(2)}</p>
                  <p className="text-zinc-400 text-xs line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs bg-zinc-950/50 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" /> {item.time}
                  </div>
                  <button
                    onClick={() => setSelectedItem(item)}
                    disabled={!settings?.is_store_open}
                    className="bg-brand-yellow text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-yellow-900/20"
                  >
                    <Plus className="w-4 h-4" /> {!settings?.is_store_open ? 'Closed' : 'Order'}
                  </button>
                </div>
              </div>
              <div className="w-28 h-full min-h-[120px] flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
          ))}
        </div>

        {displayedMenu.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <p>No items found matching your criteria.</p>
          </div>
        )}
      </div>

      <CustomerItemModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />
    </CustomerLayout>
  );
};