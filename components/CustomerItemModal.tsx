import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Info } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { MenuItem, OrderItem } from '../types';
import { ITEM_ADDONS, ADDON_INFO } from '../constants';

interface CustomerItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
}

export const CustomerItemModal: React.FC<CustomerItemModalProps> = ({ isOpen, onClose, item }) => {
  const { addToCart, settings, addonPrices } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, 'allergens' | 'dietary' | null>>({});
  // Keeping these for Kids Meal specific logic which might need single selection
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const [selectedSauce, setSelectedSauce] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDrink(null);
      setSelectedSauce(null);
      setQuantity(1);
      setSelections({});
      setExpandedItems({});
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // Get available addons for this item directly from constants
  const rawAddons = ITEM_ADDONS[item.name] || { extras: [], sauces: [], drinks: [] };

  // Filter out hidden addons
  const filterAddons = (list: string[] = []) => {
    return list.filter(name => !settings?.hidden_addons?.includes(name));
  };

  const itemAddons = {
    extras: filterAddons(rawAddons.extras),
    sauces: filterAddons(rawAddons.sauces),
    drinks: filterAddons(rawAddons.drinks)
  };
  const isMainItem = item.category === 'Main';


  const toggleExpaded = (e: React.MouseEvent, name: string, type: 'allergens' | 'dietary') => {
    e.stopPropagation();
    setExpandedItems(prev => ({
      ...prev,
      [name]: prev[name] === type ? null : type
    }));
  };

  const renderAddonInfo = (name: string, info: any) => {
    const isVeganOrVeg = info?.dietary?.some((d: string) => d === 'Vegan' || d === 'Vegetarian');
    const hasAllergens = info?.allergens?.length > 0;

    return (
      <div className="flex gap-1.5 shrink-0">
        {isVeganOrVeg && (
          <button
            onClick={(e) => toggleExpaded(e, name, 'dietary')}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors border ${expandedItems[name] === 'dietary'
              ? 'bg-green-500/20 text-green-500 border-green-500/40'
              : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
              }`}
            title="Vegetarian/Vegan"
          >
            V
          </button>
        )}
        {hasAllergens && (
          <button
            onClick={(e) => toggleExpaded(e, name, 'allergens')}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors border ${expandedItems[name] === 'allergens'
              ? 'bg-red-500/20 text-red-500 border-red-500/40'
              : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
              }`}
            title="Contains Allergens"
          >
            <span className="font-bold font-serif text-[12px] leading-none pt-[1px]">i</span>
          </button>
        )}
      </div>
    );
  };

  const updateSelection = (addonName: string, delta: number) => {
    setSelections(prev => ({
      ...prev,
      [addonName]: Math.max(0, (prev[addonName] || 0) + delta)
    }));
  };

  const toggleSelection = (addonName: string) => {
    setSelections(prev => {
      const newState = { ...prev };
      if (newState[addonName]) {
        delete newState[addonName];
      } else {
        // If it works like a toggle (radio-ish behavior for non-main items in some contexts, but here we stick to simple toggle or counter)
        // Admin uses toggle for non-main sauces/drinks.
        // For Customer UI robustness, let's allow multiple unless specifically restricted?
        // Admin logic:
        // - Extras: always counters
        // - Sauces/Drinks: If Main -> counters. If not Main -> toggle.
        newState[addonName] = 1;
      }
      return newState;
    });
  };


  const calculateTotal = () => {
    let total = item.price * quantity;

    // Add addons cost
    Object.entries(selections).forEach(([name, qty]) => {
      const price = addonPrices[name] || 0;
      const count = qty as number;
      // Check for free logic (Kids Meal specific)
      let effectivePrice = price;

      // Logic from OrderModal:
      const isSauce = ['Green Sauce'].includes(name);
      const freeSauceAvailable = item.name === 'Kids Meal';

      if (freeSauceAvailable && isSauce) {
        // In Kids meal, perhaps one sauce is free? 
        // Admin Logic: "freeSauceAvailable = item.name === 'Kids Meal'; ... if (freeSauceAvailable && isSauce) { price = 0; freeSauceAvailable = false; }"
        // This implies the *first* sauce encountered in loop is free.
        // But here we are iterating entries.
        // Let's simplify: If Kids Meal, basic sauce selection (radio) is free.
        // If we use the selection state for Kids Meal (radio logic below), we handle it separately.
      }

      if (item.name !== 'Kids Meal') {
        total += effectivePrice * count;
      } else {
        // For Kids Meal, we use different state for required tokens (selectedDrink, selectedSauce)
        // If they are in `selections` (extras), we add them. 
        // Extras for Kids Meal: Short Rib, Lamb, Steak. These are NOT free.
        if (itemAddons.extras.includes(name)) {
          total += effectivePrice * count;
        }
      }
    });

    // Kids Meal Specifics (Radio selections)
    if (item.name === 'Kids Meal') {
      // Drink is free
      // Sauce is free
      // So no price addition for selectedDrink/selectedSauce
    } else {
      // If we used the radio logic for non-Kids Meal (unlikely given Admin logic, but just in case)
      if (selectedDrink && selectedDrink !== 'none') {
        total += (addonPrices[selectedDrink] || 0) * quantity;
      }
      if (selectedSauce) {
        total += (addonPrices[selectedSauce] || 0) * quantity;
      }
    }

    return total;
  };

  const calculateUnitTotal = () => {
    let unitTotal = item.price;

    // Add addons cost per unit
    Object.entries(selections).forEach(([name, qty]) => {
      const price = addonPrices[name] || 0;
      const count = qty as number;
      // For standard items (Main), we multiply by addon qty inside the item qty
      // Wait, `selections` tracks TOTAL addons for the single item being customized?
      // In Admin: `addToCart(item, addonsArray)` where addonsArray is e.g. ['Steak', 'Steak']
      // The price calculation sums up addons. 
      // Here we are adding 1 item with X addons.
      // So `unitTotal` should include the cost of all selected addons.

      if (item.name !== 'Kids Meal') {
        unitTotal += price * count;
      } else {
        if (itemAddons.extras.includes(name)) {
          unitTotal += price * count;
        }
      }
    });
    return unitTotal;
  }


  const handleAddToCart = () => {
    const addonStrings: string[] = [];

    // Process selections (Counters/Toggles)
    Object.entries(selections).forEach(([name, qty]) => {
      const count = qty as number;
      for (let i = 0; i < count; i++) {
        addonStrings.push(name);
      }
    });

    // Process Kids Meal Radio Selections
    if (item.name === 'Kids Meal') {
      if (selectedDrink && selectedDrink !== 'none') addonStrings.push(selectedDrink);
      if (selectedSauce) addonStrings.push(selectedSauce);
    }

    const unitPrice = calculateUnitTotal();

    const orderItem: OrderItem = {
      menuItemId: item.id,
      name: item.name,
      price: unitPrice,
      quantity: quantity,
      addons: addonStrings
    };

    addToCart(orderItem);
    onClose();
  };

  const renderCounter = (name: string, price: number) => {
    const info = ADDON_INFO[name];
    const isExpanded = expandedItems[name];

    return (
      <div key={name} className={`p-4 rounded-xl border text-left flex justify-between items-start ${selections[name] > 0 ? 'bg-brand-yellow/10 border-brand-yellow text-white' : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-400'}`}>
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{name}</span>
          </div>
          <div className="text-brand-yellow text-xs font-bold">+£{price.toFixed(2)}</div>

          {/* Expanded Info */}
          {isExpanded && (
            <div className="mt-2 text-xs p-2 bg-black/20 rounded border border-white/5 animate-fade-in space-y-1 cursor-default" onClick={e => e.stopPropagation()}>
              {expandedItems[name] === 'allergens' && info?.allergens?.length > 0 && (
                <div>
                  <span className="text-red-400 font-bold">Contains:</span> <span className="text-zinc-400">{info.allergens.join(', ')}</span>
                </div>
              )}
              {expandedItems[name] === 'dietary' && info?.dietary?.length > 0 && (
                <div>
                  <span className="text-green-400 font-bold">Dietary:</span> <span className="text-zinc-400">{info.dietary.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          {renderAddonInfo(name, info)}

          <div className="flex items-center gap-2 bg-zinc-800/50 rounded-full p-1 border border-zinc-700/50">
            <button onClick={() => updateSelection(name, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors" disabled={!selections[name]}>
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-base font-bold w-5 text-center text-white">{selections[name] || 0}</span>
            <button onClick={() => updateSelection(name, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderToggle = (name: string, price: number, isFree: boolean) => {
    const info = ADDON_INFO[name];
    const isExpanded = expandedItems[name];
    const isSelected = !!selections[name];

    return (
      <button
        key={name}
        onClick={() => toggleSelection(name)}
        className={`p-4 rounded-xl border text-left flex justify-between items-start ${isSelected ? 'bg-brand-yellow/10 border-brand-yellow text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
      >
        <div className="flex-1 pr-4">
          <span className="font-medium">{name}</span>
          {!isFree && <div className="text-sm font-bold text-brand-yellow mt-1">+£{price.toFixed(2)}</div>}
          {isFree && <div className="text-xs font-bold text-zinc-500 uppercase mt-1">Free</div>}

          {/* Expanded Info */}
          {isExpanded && (
            <div className="mt-2 text-xs p-2 bg-black/20 rounded border border-white/5 animate-fade-in space-y-1 cursor-default" onClick={e => e.stopPropagation()}>
              {expandedItems[name] === 'allergens' && info?.allergens?.length > 0 && (
                <div>
                  <span className="text-red-400 font-bold">Contains:</span> <span className="text-zinc-400">{info.allergens.join(', ')}</span>
                </div>
              )}
              {expandedItems[name] === 'dietary' && info?.dietary?.length > 0 && (
                <div>
                  <span className="text-green-400 font-bold">Dietary:</span> <span className="text-zinc-400">{info.dietary.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          {renderAddonInfo(name, info)}
        </div>
      </button>
    );
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
            {item.allergens && item.allergens.length > 0 && (
              <p className="text-zinc-500 text-sm mt-1">
                <span className="font-bold text-zinc-400">Contains:</span> {item.allergens.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Extras Section */}
          {itemAddons.extras && itemAddons.extras.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Extras</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {itemAddons.extras.map(extra => renderCounter(extra, addonPrices[extra] || 0))}
              </div>
            </section>
          )}

          {/* Sauces Section */}
          {itemAddons.sauces && itemAddons.sauces.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">{item.name === 'Kids Meal' ? 'Sauce (Required)' : 'Sauces'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.name === 'Kids Meal' ? (
                  // Radio button style for Kids Meal
                  itemAddons.sauces.map(sauce => {
                    const info = ADDON_INFO[sauce];
                    const isExpanded = expandedItems[sauce];
                    const isSelected = selectedSauce === sauce;

                    return (
                      <div
                        key={sauce}
                        onClick={() => setSelectedSauce(sauce)}
                        className={`flex justify-between items-start p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                          ? 'bg-brand-yellow/10 border-brand-yellow'
                          : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
                          }`}
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex shrink-0 items-center justify-center ${isSelected ? 'border-brand-yellow' : 'border-zinc-600'
                              }`}>
                              {isSelected && <div className="w-3 h-3 rounded-full bg-brand-yellow" />}
                            </div>
                            <span className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{sauce}</span>
                          </div>

                          {/* Expanded Info */}
                          {isExpanded && (
                            <div className="mt-2 text-xs p-2 bg-black/20 rounded border border-white/5 animate-fade-in space-y-1 cursor-default" onClick={e => e.stopPropagation()}>
                              {expandedItems[sauce] === 'allergens' && info?.allergens?.length > 0 && (
                                <div>
                                  <span className="text-red-400 font-bold">Contains:</span> <span className="text-zinc-400">{info.allergens.join(', ')}</span>
                                </div>
                              )}
                              {expandedItems[sauce] === 'dietary' && info?.dietary?.length > 0 && (
                                <div>
                                  <span className="text-green-400 font-bold">Dietary:</span> <span className="text-zinc-400">{info.dietary.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {renderAddonInfo(sauce, info)}
                          <span className="text-brand-yellow text-xs font-bold mt-1">Free</span>
                        </div>
                      </div>
                    );
                  })
                ) : isMainItem ? (
                  // Counters for Main items
                  itemAddons.sauces.map(sauce => renderCounter(sauce, addonPrices[sauce] || 0))
                ) : (
                  // Toggles for others (though currently logic defaults everything else to toggles if not main? Admin logic supports toggles for non-main)
                  itemAddons.sauces.map(sauce => renderToggle(sauce, addonPrices[sauce] || 0, false))
                )}
              </div>
            </section>
          )}

          {/* Drinks Section */}
          {item.category !== 'Drinks' && itemAddons.drinks && itemAddons.drinks.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">{item.name === 'Kids Meal' ? 'Drink (Required)' : 'Drinks'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.name === 'Kids Meal' ? (
                  <>
                    {itemAddons.drinks.map(drink => (
                      <div
                        key={drink}
                        onClick={() => setSelectedDrink(drink)}
                        className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedDrink === drink
                          ? 'bg-brand-yellow/10 border-brand-yellow'
                          : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border flex shrink-0 items-center justify-center ${selectedDrink === drink ? 'border-brand-yellow' : 'border-zinc-600'
                            }`}>
                            {selectedDrink === drink && <div className="w-3 h-3 rounded-full bg-brand-yellow" />}
                          </div>
                          <span className={`font-bold ${selectedDrink === drink ? 'text-white' : 'text-zinc-400'}`}>{drink}</span>
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
                ) : isMainItem ? (
                  // Counters for Main items
                  itemAddons.drinks.map(drink => renderCounter(drink, addonPrices[drink] || 0))
                ) : (
                  // Toggles
                  itemAddons.drinks.map(drink => renderToggle(drink, addonPrices[drink] || 0, false))
                )}
              </div>
            </section>
          )}
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