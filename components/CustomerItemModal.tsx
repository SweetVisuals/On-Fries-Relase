import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { MenuItem, OrderItem } from '../types';
import { ITEM_ADDONS, ADDON_PRICES } from '../constants';

interface CustomerItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
}

interface AddonSelection {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const CustomerItemModal: React.FC<CustomerItemModalProps> = ({ isOpen, onClose, item }) => {
  const { menu, addToCart, settings } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const [selectedSauce, setSelectedSauce] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDrink(null);
      setSelectedSauce(null);
      setQuantity(1);
      setSelections({});
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // Get available addons for this item
  const itemAddons = ITEM_ADDONS[item.name] || { extras: [], sauces: [] };

  // Debug logs
  console.log('Current Item:', item.name);
  console.log('Menu Items:', menu.map(m => m.name));
  console.log('Item Addons Config:', itemAddons);

  // Use menu from context instead of MOCK_MENU to ensure IDs match
  const availableExtras = menu.filter(m => itemAddons.extras.includes(m.name));
  const availableSauces = menu.filter(m => itemAddons.sauces.includes(m.name));
  const drinks = menu.filter(m => m.category === 'Drinks');

  const updateSelection = (itemId: string, delta: number) => {
    setSelections(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
    }));
  };

  const calculateTotal = () => {
    let total = item.price;

    // Add extras/drinks cost
    // Add extras/drinks cost
    Object.entries(selections).forEach(([id, qty]) => {
      const addon = menu.find(m => m.id === id);
      if (addon) {
        const addonPrice = ADDON_PRICES[addon.name] || addon.price;
        total += addonPrice * (qty as number);
      }
    });

    if (selectedDrink) {
      const drink = menu.find(m => m.id === selectedDrink);
      if (drink) {
        // Drink is free for Kids Meal
        if (item.name !== 'Kids Meal') {
          total += drink.price;
        }
      }
    }

    if (selectedSauce) {
      const sauce = menu.find(m => m.id === selectedSauce);
      // Sauce is free for Kids Meal
      if (sauce && item.name !== 'Kids Meal') {
        total += sauce.price;
      }
    }

    return total * quantity;
  };

  const handleAddToCart = () => {
    const addonStrings: string[] = [];
    let unitPrice = item.price;

    // Process selections
    Object.entries(selections).forEach(([id, qty]) => {

      const quantity = qty as number;
      if (quantity > 0) {
        const addon = menu.find(m => m.id === id);
        if (addon) {
          addonStrings.push(`${addon.name} x${quantity}`);
          const addonPrice = ADDON_PRICES[addon.name] || addon.price;
          unitPrice += addonPrice * quantity;
        }
      }
    });
    if (selectedDrink) {
      const drink = menu.find(m => m.id === selectedDrink);
      if (drink) {
        addonStrings.push(drink.name);
        // Drink is free for Kids Meal
        if (item.name !== 'Kids Meal') {
          unitPrice += drink.price;
        }
      }
    }

    if (selectedSauce) {
      const sauce = menu.find(m => m.id === selectedSauce);
      if (sauce) {
        addonStrings.push(sauce.name);
        // Free for Kids Meal, otherwise charge (though current logic only supports free sauce for Kids Meal via this specific flow if we don't add price here)
        // actually unitPrice is base price. We need to add sauce price if NOT kids meal.
        if (item.name !== 'Kids Meal') {
          unitPrice += sauce.price;
        }
      }
    }

    const orderItem: OrderItem = {
      menuItemId: item.id,
      name: item.name + (addonStrings.length > 0 ? ' + Add-ons' : ''),
      price: unitPrice, // This is unit price including add-ons
      quantity: quantity,
      addons: addonStrings
    };

    addToCart(orderItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end md:items-center justify-center backdrop-blur-sm md:p-4">
      <div className="w-full md:max-w-2xl bg-zinc-950 border-t md:border border-zinc-800 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">

        {/* Header */}
        <div className="relative h-48 md:h-56 w-full shrink-0">
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-t-3xl opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/80 text-white transition-colors backdrop-blur-sm">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-3xl font-bold text-white font-heading uppercase leading-none mb-1">{item.name}</h2>
            <p className="text-zinc-400 line-clamp-1">{item.description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Extras Section */}
          {availableExtras.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Extras</h3>
              <div className="space-y-3">
                {availableExtras.map(extra => (
                  <div key={extra.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                    <div>
                      <div className="font-bold text-white">{extra.name}</div>
                      <div className="text-brand-yellow text-xs font-bold">£{(ADDON_PRICES[extra.name] || extra.price).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                      <button
                        onClick={() => updateSelection(extra.id, -1)}
                        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${!selections[extra.id] ? 'text-zinc-600 cursor-default' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        disabled={!selections[extra.id]}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center text-white">{selections[extra.id] || 0}</span>
                      <button
                        onClick={() => updateSelection(extra.id, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sauces Section */}
          {availableSauces.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">{item.name === 'Kids Meal' ? 'Sauce (Required)' : 'Sauces'}</h3>
              <div className="space-y-3">
                {item.name === 'Kids Meal' ? (
                  // Radio button style for Kids Meal
                  availableSauces.map(sauce => (
                    <div
                      key={sauce.id}
                      onClick={() => setSelectedSauce(sauce.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedSauce === sauce.id
                        ? 'bg-brand-yellow/10 border-brand-yellow'
                        : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedSauce === sauce.id ? 'border-brand-yellow' : 'border-zinc-600'
                          }`}>
                          {selectedSauce === sauce.id && <div className="w-3 h-3 rounded-full bg-brand-yellow" />}
                        </div>
                        <span className={`font-bold ${selectedSauce === sauce.id ? 'text-white' : 'text-zinc-400'}`}>{sauce.name}</span>
                      </div>
                      <span className="text-brand-yellow text-xs font-bold">Free</span>
                    </div>
                  ))
                ) : (
                  // Standard +/- counters
                  availableSauces.map(sauce => (
                    <div key={sauce.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                      <div>
                        <div className="font-bold text-white">{sauce.name}</div>
                        <div className="text-brand-yellow text-xs font-bold">£{sauce.price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-3 bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                        <button
                          onClick={() => updateSelection(sauce.id, -1)}
                          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${!selections[sauce.id] ? 'text-zinc-600 cursor-default' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                          disabled={!selections[sauce.id]}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center text-white">{selections[sauce.id] || 0}</span>
                        <button
                          onClick={() => updateSelection(sauce.id, 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Drinks Section */}
          <section>
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">{item.name === 'Kids Meal' ? 'Drink (Required)' : 'Drinks'}</h3>
            <div className="space-y-3">
              {item.name === 'Kids Meal' ? (
                <>
                  {drinks.map(drink => (
                    <div
                      key={drink.id}
                      onClick={() => setSelectedDrink(drink.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedDrink === drink.id
                        ? 'bg-brand-yellow/10 border-brand-yellow'
                        : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedDrink === drink.id ? 'border-brand-yellow' : 'border-zinc-600'
                          }`}>
                          {selectedDrink === drink.id && <div className="w-3 h-3 rounded-full bg-brand-yellow" />}
                        </div>
                        <span className={`font-bold ${selectedDrink === drink.id ? 'text-white' : 'text-zinc-400'}`}>{drink.name}</span>
                      </div>
                      <div className="text-brand-yellow text-xs font-bold">Free</div>
                    </div>
                  ))}
                  {/* None Option */}
                  <div
                    onClick={() => setSelectedDrink('none')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedDrink === 'none'
                      ? 'bg-brand-yellow/10 border-brand-yellow'
                      : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedDrink === 'none' ? 'border-brand-yellow' : 'border-zinc-600'
                        }`}>
                        {selectedDrink === 'none' && <div className="w-3 h-3 rounded-full bg-brand-yellow" />}
                      </div>
                      <span className={`font-bold ${selectedDrink === 'none' ? 'text-white' : 'text-zinc-400'}`}>None</span>
                    </div>
                    <div className="text-brand-yellow text-xs font-bold">Free</div>
                  </div>
                </>
              ) : (
                // Standard +/- counters
                drinks.map(drink => (
                  <div key={drink.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                    <div>
                      <div className="font-bold text-white">{drink.name}</div>
                      <div className="text-brand-yellow text-xs font-bold">£{drink.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                      <button
                        onClick={() => updateSelection(drink.id, -1)}
                        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${!selections[drink.id] ? 'text-zinc-600 cursor-default' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        disabled={!selections[drink.id]}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center text-white">{selections[drink.id] || 0}</span>
                      <button
                        onClick={() => updateSelection(drink.id, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <span className="text-zinc-400 font-medium">Total Amount</span>
            <span className="text-3xl font-bold text-white">£{calculateTotal().toFixed(2)}</span>
          </div>

          <div className="flex gap-4">
            {/* Quantity Control for Main Item Bundle */}
            <div className="flex items-center gap-4 px-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-zinc-400 hover:text-white p-2"><Minus className="w-5 h-5" /></button>
              <span className="font-bold text-lg w-4 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="text-zinc-400 hover:text-white p-2"><Plus className="w-5 h-5" /></button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={(item.name === 'Kids Meal' && (!selectedSauce || !selectedDrink)) || !settings?.is_store_open}
              className="flex-1 bg-brand-yellow hover:bg-yellow-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-yellow-900/20 uppercase tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-5 h-5" /> {!settings?.is_store_open ? 'Store Closed' : 'Add to Cart'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};