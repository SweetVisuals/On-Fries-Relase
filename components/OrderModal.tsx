import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

import { X, Plus, Minus, Check, Trash2, ChevronLeft, ArrowRight, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderItem, Order, MenuItem } from '../types';
import { ITEM_ADDONS, ADDON_PRICES } from '../constants';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: Order | null;
}

const SECTIONS = [
  { id: 'Main', label: 'Mains' },
  { id: 'Kids', label: 'Kids' },
  { id: 'Drinks', label: 'Drinks' },
];

// Custom hook to get the previous value of a prop or state
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, orderToEdit }) => {
  const { menu, addOrder, editOrder, deleteOrder } = useStore();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('Main');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: number }>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isOrderDetailsCollapsed, setIsOrderDetailsCollapsed] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollTop = useRef(0);

  const prevIsOpen = usePrevious(isOpen);
  const prevOrderToEditId = usePrevious(orderToEdit?.id);

  useEffect(() => {
    // When modal opens for a new order (no orderToEdit, and prevIsOpen was false)
    if (isOpen && !orderToEdit && !prevIsOpen) {
      setCart([]);
      setCustomerName('');
      setCurrentStep(2);
      setIsOrderDetailsCollapsed(true);
      setSelectedSection('Main');
      setCustomizingItem(null);
      setSelectedAddons({});
    }
    // When a different order is selected for edit (isOpen is true, and orderToEdit.id changes)
    else if (isOpen && orderToEdit && prevOrderToEditId !== orderToEdit.id) {
      setCart(orderToEdit.items);
      setCustomerName(orderToEdit.customerName);
      setCurrentStep(2); // Start at menu for edits
      setIsOrderDetailsCollapsed(true);
      setSelectedSection('Main');
      setCustomizingItem(null); // Reset customization when switching orders
      setSelectedAddons({}); // Reset addons when switching orders
    }
    // When modal closes
    else if (!isOpen && prevIsOpen) {
      // Reset all states when modal is closed
      setCart([]);
      setCustomerName('');
      setSelectedSection('Main');
      setCustomizingItem(null);
      setSelectedAddons({});
      setCurrentStep(1);
      setIsOrderDetailsCollapsed(true);
    }
  }, [isOpen, orderToEdit, prevIsOpen, prevOrderToEditId]);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = savedScrollTop.current;
    }
  }, [selectedAddons]);

  if (!isOpen) return null;

  const handleItemClick = (item: MenuItem) => {
    const hasAddons = ITEM_ADDONS[item.name];
    if (hasAddons) {
      setCustomizingItem(item);
      setSelectedAddons({});
    } else {
      addToCart(item, []);
    }
  };

  const incrementAddon = (addon: string) => {
    savedScrollTop.current = scrollRef.current?.scrollTop || 0;
    setSelectedAddons(prev => ({ ...prev, [addon]: (prev[addon] || 0) + 1 }));
  };

  const decrementAddon = (addon: string) => {
    savedScrollTop.current = scrollRef.current?.scrollTop || 0;
    setSelectedAddons(prev => {
      const newAddons = { ...prev };
      if (newAddons[addon] > 1) {
        newAddons[addon]--;
      } else {
        delete newAddons[addon];
      }
      return newAddons;
    });
  };

  const toggleAddon = (addon: string) => {
    savedScrollTop.current = scrollRef.current?.scrollTop || 0;
    setSelectedAddons(prev => {
      const newAddons = { ...prev };
      if (newAddons[addon]) {
        delete newAddons[addon];
      } else {
        // If it's a drink for Kids Meal, remove other drinks
        if (customizingItem?.name === 'Kids Meal' && ITEM_ADDONS['Kids Meal'].drinks.includes(addon)) {
          // Remove other drinks
          ITEM_ADDONS['Kids Meal'].drinks.forEach(drink => {
            if (drink !== addon) {
              delete newAddons[drink];
            }
          });
        }
        newAddons[addon] = 1;
      }
      return newAddons;
    });
  };
  const confirmCustomization = () => {
    if (customizingItem) {
      const addonsArray = Object.entries(selectedAddons).flatMap(([addon, quantity]) => Array(quantity).fill(addon)) as string[];
      addToCart(customizingItem, addonsArray);
      setCustomizingItem(null); // Go back to menu after adding customized item
      setSelectedAddons({}); // Clear selected addons for the next customization
    }
  };

  const addToCart = (item: MenuItem, addons: string[]) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(i =>
        i.menuItemId === item.id &&
        JSON.stringify(i.addons?.sort()) === JSON.stringify(addons.sort())
      );

      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }

      return [...prev, {
        menuItemId: item.id,
        name: item.name === 'Deluxe Steak & Fries' ? 'Deluxe Steak' : item.name,
        price: item.price,
        quantity: 1,
        addons: addons
      }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
      .filter(item => item.quantity > 0));
  };

  const calculateItemTotal = (item: OrderItem) => {
    let itemPrice = item.price;
    let freeSauceAvailable = item.name === 'Kids Meal';
    item.addons.forEach(addon => {
      let price = ADDON_PRICES[addon] || 0;
      const isSauce = ['Green Sauce', 'Red Sauce'] .includes(addon);
      if (freeSauceAvailable && isSauce) {
        price = 0;
        freeSauceAvailable = false;
      }
      const isDrink = !isSauce;
      if (item.name === 'Kids Meal' && isDrink) {
        price = 0;
      }
      itemPrice += price;
    });    return itemPrice * item.quantity;
  };

  const total = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = () => {
    if (!customerName || cart.length === 0) return;

    const orderData = {
      customerName,
      items: cart,
      total,
    };

    if (orderToEdit) {
      editOrder({ ...orderToEdit, ...orderData });
    } else {
      addOrder({
        id: '',
        status: 'cooking',
        createdAt: new Date().toISOString(),
        estimatedTime: new Date(Date.now() + 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...orderData
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (orderToEdit && confirm('Are you sure you want to delete this order?')) {
      deleteOrder(orderToEdit.id);
      onClose();
    }
  };

  const filteredMenu = menu.filter(m => m.category === selectedSection);

  const MenuSelection = () => (
    <div className="flex flex-col h-full">
      {customizingItem ? (
        <div key={customizingItem.id} className="flex flex-col h-full">
          <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-4">
            <button onClick={() => setCustomizingItem(null)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white font-heading uppercase">Customize {customizingItem.name === 'Deluxe Steak & Fries' ? 'Deluxe Steak' : customizingItem.name}</h2>
              <p className="text-zinc-400 text-sm">Select extras and sauces</p>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-zinc-950 space-y-8" style={{ WebkitOverflowScrolling: 'touch' }}>
            {ITEM_ADDONS[customizingItem.name]?.extras?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Extras</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ITEM_ADDONS[customizingItem.name].extras.map(addon => {
                    const count = selectedAddons[addon] || 0;
                    const isMainItem = customizingItem.category === 'Main';
                    if (isMainItem || customizingItem.name === 'Kids Meal') {
                      return (
                        <div key={addon} className={`p-4 rounded-xl border text-left flex justify-between items-center ${count > 0 ? 'bg-brand-yellow/10 border-brand-yellow text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                          <div>
                            <span className="font-medium">{addon}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-zinc-800/50 rounded-full p-1 border border-zinc-700/50">
                            <button tabIndex={-1} onClick={() => decrementAddon(addon)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="text-base font-bold w-5 text-center text-white">{count}</span>
                            <button tabIndex={-1} onClick={() => incrementAddon(addon)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button tabIndex={-1} key={addon} onClick={() => toggleAddon(addon)} className={`p-4 rounded-xl border text-left flex justify-between items-center ${selectedAddons[addon] ? 'bg-brand-yellow/10 border-brand-yellow text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                        <span className="font-medium">{addon}</span>
                        <span className="text-sm font-bold text-brand-yellow">+£{ADDON_PRICES[addon]?.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {ITEM_ADDONS[customizingItem.name]?.sauces?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Sauces</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ITEM_ADDONS[customizingItem.name].sauces.map(sauce => {
                    const count = selectedAddons[sauce] || 0;
                    const isMainItem = customizingItem.category === 'Main';
                    const isFree = customizingItem.name === 'Kids Meal' && !Object.keys(selectedAddons).some(a => ['Green Sauce', 'Red Sauce'].includes(a) && a !== sauce);
                    if (isMainItem) {
                      return (
                        <div key={sauce} className={`p-4 rounded-xl border text-left flex justify-between items-center ${count > 0 ? 'bg-brand-yellow/10 border-brand-yellow text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                          <div>
                            <span className="font-medium">{sauce}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-zinc-800/50 rounded-full p-1 border border-zinc-700/50">
                            <button tabIndex={-1} onClick={() => decrementAddon(sauce)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="text-base font-bold w-5 text-center text-white">{count}</span>
                            <button tabIndex={-1} onClick={() => incrementAddon(sauce)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button tabIndex={-1} key={sauce} onClick={() => toggleAddon(sauce)} className={`p-4 rounded-xl border text-left flex justify-between items-center ${selectedAddons[sauce] ? 'bg-brand-yellow/10 border-brand-yellow text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                        <span className="font-medium">{sauce}</span>
                        {ADDON_PRICES[sauce] && !isFree ? <span className="text-sm font-bold text-brand-yellow">+£{ADDON_PRICES[sauce]?.toFixed(2)}</span> : <span className="text-xs font-bold text-zinc-500 uppercase">Free</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
             {ITEM_ADDONS[customizingItem.name]?.drinks?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Drinks</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ITEM_ADDONS[customizingItem.name].drinks.map(drink => {
                        const count = selectedAddons[drink] || 0;
                        const isMainItem = customizingItem.category === 'Main';
                        if (isMainItem) {
                          return (
                            <div key={drink} className={`p-4 rounded-xl border text-left flex justify-between items-center ${count > 0 ? 'bg-brand-yellow/10 border-brand-yellow text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                              <div>
                                <span className="font-medium">{drink}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-zinc-800/50 rounded-full p-1 border border-zinc-700/50">
                                <button tabIndex={-1} onClick={() => decrementAddon(drink)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                                <span className="text-base font-bold w-5 text-center text-white">{count}</span>
                                <button tabIndex={-1} onClick={() => incrementAddon(drink)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <button
                            tabIndex={-1}
                            key={drink}
                            onClick={() => toggleAddon(drink)}
                            className={`p-4 rounded-xl border text-left flex justify-between items-center ${selectedAddons[drink]
                              ? 'bg-brand-yellow/10 border-brand-yellow text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                          >
                            <span className="font-medium">{drink}</span>
                            {customizingItem.name === 'Kids Meal' ? <span className="text-xs font-bold text-zinc-500 uppercase">Free</span> : <span className="text-sm font-bold text-brand-yellow">+£{ADDON_PRICES[drink]?.toFixed(2)}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
          </div>
          <div className="p-6 border-t border-zinc-800 bg-zinc-900">
            <button onClick={confirmCustomization} className="w-full py-4 bg-brand-yellow text-black font-bold text-lg rounded-xl hover:bg-yellow-400 shadow-lg shadow-yellow-900/20">
              Add to Order
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentStep(1)} className="md:hidden p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold text-white font-heading uppercase">{orderToEdit ? 'Edit Order' : 'New Order'}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors md:hidden">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {SECTIONS.map(section => (
                <button key={section.id} onClick={() => setSelectedSection(section.id)} className={`px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap flex-1 border-2 ${selectedSection === section.id ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'}`}>
                  {section.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenu.map(item => (
                <button key={item.id} onClick={() => handleItemClick(item)} className="flex flex-col items-start p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-brand-yellow group text-left hover:shadow-lg hover:shadow-yellow-900/10">
                  <div className="flex justify-between w-full mb-2">
                    <span className="font-bold text-white text-sm">{item.name === 'Deluxe Steak & Fries' ? 'Deluxe Steak' : item.name}</span>
                    <span className="font-bold text-brand-yellow text-sm">£{item.price.toFixed(2)}</span>
                  </div>
                  {ITEM_ADDONS[item.name] && <div className="mt-2 text-xs text-brand-yellow font-medium uppercase tracking-wide">Customizable</div>}
                </button>
              ))}
              {filteredMenu.length === 0 && <div className="col-span-full text-center py-12 text-zinc-500">No items in this category.</div>}
            </div>
          </div>
          <div className="md:hidden p-6 border-t border-zinc-800 bg-zinc-900">
             <button onClick={() => setCurrentStep(3)} disabled={cart.length === 0} className="w-full py-4 bg-brand-yellow text-black font-bold text-lg rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-900/20 flex justify-center items-center gap-2">
                View Order <ArrowRight className="w-5 h-5" />
              </button>
          </div>
        </>
      )}
    </div>
  );

  const CollapsibleOrderDetails = () => (
    <div className="md:hidden bg-zinc-900 border-b border-zinc-800">
      <div className="p-4 flex justify-between items-center" onClick={() => setIsOrderDetailsCollapsed(!isOrderDetailsCollapsed)}>
        <h3 className="font-bold text-white text-lg font-heading uppercase">Order Details ({totalItems} items)</h3>
        <button className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
          {isOrderDetailsCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>
      {!isOrderDetailsCollapsed && (
        <div className="p-4 pt-0">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer Name / Table No." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-yellow focus:outline-none font-medium" autoFocus disabled={!!orderToEdit} />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-900">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 opacity-50">
                <div className="p-4 bg-zinc-800 rounded-full"><Plus className="w-6 h-6" /></div>
                <p>Add items from menu</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex justify-between items-start group hover:border-zinc-700 transition-colors">
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm">{item.name}</div>
                    {item.addons && item.addons.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.addons.map((addon, aIdx) => (
                          <div key={aIdx} className="text-xs text-zinc-500 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-zinc-700"></span>{addon}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-brand-yellow text-xs font-bold mt-1">£{calculateItemTotal(item).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-3 bg-zinc-900 rounded-lg p-1 border border-zinc-800 h-fit">
                    <button onClick={() => updateQuantity(idx, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-bold w-5 text-center text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(idx, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  const CartDetails = () => (
    <div className="flex flex-col h-full bg-zinc-900">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/50">
        <div className="flex items-center gap-4">
            <button onClick={() => setCurrentStep(2)} className="md:hidden p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
            <h3 className="font-bold text-white text-lg font-heading uppercase">Order Details</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer Name / Table No." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-yellow focus:outline-none font-medium" autoFocus disabled={!!orderToEdit} />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-900">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 opacity-50">
            <div className="p-4 bg-zinc-800 rounded-full"><Plus className="w-6 h-6" /></div>
            <p>Add items from menu</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex justify-between items-start group hover:border-zinc-700 transition-colors">
              <div className="flex-1">
                <div className="font-bold text-white text-sm">{item.name}</div>
                {item.addons && item.addons.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {item.addons.map((addon, aIdx) => (
                      <div key={aIdx} className="text-xs text-zinc-500 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>{addon}
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-brand-yellow text-xs font-bold mt-1">£{calculateItemTotal(item).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900 rounded-lg p-1 border border-zinc-800 h-fit">
                <button onClick={() => updateQuantity(idx, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"><Minus className="w-3 h-3" /></button>
                <span className="text-sm font-bold w-5 text-center text-white">{item.quantity}</span>
                <button onClick={() => updateQuantity(idx, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-6 bg-zinc-950 border-t border-zinc-800">
        <div className="flex justify-between items-end mb-4">
          <span className="text-zinc-400 font-medium">Total Amount</span>
          <span className="text-3xl font-bold text-white">£{total.toFixed(2)}</span>
        </div>
        <div className="flex gap-3">
          {orderToEdit && <button onClick={handleDelete} className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:text-red-400 hover:bg-red-900/10 hover:border-red-900/30 transition-all"><Trash2 className="w-5 h-5" /></button>}
          <button onClick={handleSubmit} disabled={!customerName || cart.length === 0} className="flex-1 py-4 bg-brand-yellow text-black font-bold text-lg rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-900/20 flex justify-center items-center gap-2 uppercase tracking-wide">
            <Check className="w-5 h-5" /> {orderToEdit ? 'Update Order' : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 md:flex md:items-center md:justify-center md:p-4">
      <div className="w-full h-full bg-zinc-950 md:max-w-5xl md:border md:border-zinc-800 md:rounded-3xl flex flex-col md:flex-row md:shadow-2xl overflow-hidden md:max-h-[90vh]">
        {/* Mobile View */}
        <div className="md:hidden h-full flex flex-col">
          {currentStep === 1 && !orderToEdit && (
            <div className="flex flex-col h-full justify-between p-6 bg-zinc-950">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-white font-heading uppercase">New Order</h2>
                  <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-2">
                  <label htmlFor="customerName" className="text-sm font-bold text-zinc-400">Customer Name / Table No.</label>
                  <input id="customerName" type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter name or table number" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-yellow focus:outline-none font-medium text-lg" autoFocus />
                </div>
              </div>
              <button onClick={() => setCurrentStep(2)} disabled={!customerName} className="w-full py-4 bg-brand-yellow text-black font-bold text-lg rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-900/20 flex justify-center items-center gap-2">
                Next <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
          {(currentStep === 2 || (orderToEdit && currentStep === 2)) && (
            <div className="flex flex-col h-full">
              {orderToEdit && <CollapsibleOrderDetails />}
              <MenuSelection />
            </div>
          )}
          {(currentStep === 3 || (orderToEdit && currentStep === 3)) && <CartDetails />}
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex flex-1 h-full">
          <div className="flex-1 flex flex-col border-r border-zinc-800 h-full overflow-hidden relative"><MenuSelection /></div>
          <div className="w-full md:w-[380px] flex flex-col bg-zinc-900 h-full"><CartDetails /></div>
        </div>
      </div>
    </div>
  );
};
