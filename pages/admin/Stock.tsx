import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { ChevronDown, Plus, Minus, AlertTriangle, PenTool, X, Check, Edit2, Save, X as XIcon, Eye, Trash2 } from 'lucide-react';
import { StockItem } from '../../types';
import { StockModal } from '../../components/StockModal';
import { SupplierModal } from '../../components/SupplierModal';
import { supabase } from '../../lib/supabase';

export const StockPage = () => {
  const { stock, updateStock, updateStockItem, signatures, signStock, suppliers, deleteStockItem } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  // Edit Details Modal State
  const [editingDetailItem, setEditingDetailItem] = useState<StockItem | null>(null);
  const [detailSupplier, setDetailSupplier] = useState('');
  const [detailNotes, setDetailNotes] = useState('');

  const [signLocation, setSignLocation] = useState<'Trailer' | 'Lockup'>('Trailer');
  const [signerName, setSignerName] = useState('');

  // View Note Modal State
  const [viewingNoteItem, setViewingNoteItem] = useState<StockItem | null>(null);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Trailer-Food': false,
    'Trailer-Drinks': false,
    'Trailer-Essentials': false,
    'Trailer-Ingredients': false,
    'Lockup-Food': false,
    'Lockup-Drinks': false,
    'Lockup-Essentials': false,
    'Lockup-Ingredients': false,
  });

  const [editingQuantities, setEditingQuantities] = useState<Record<string, number>>({});

  const trailerStock = stock.filter(i => i.location === 'Trailer');
  const lockupStock = stock.filter(i => i.location === 'Lockup');

  const handleIncrement = (item: StockItem) => {
    const current = editingQuantities[item.id] !== undefined ? editingQuantities[item.id] : item.quantity;
    if (editingQuantities[item.id] === undefined) {
      setEditingQuantities(prev => ({ ...prev, [item.id]: item.quantity }));
    }
    updateEditingQuantity(item.id, current + 1);
  };

  const handleDecrement = (item: StockItem) => {
    const current = editingQuantities[item.id] !== undefined ? editingQuantities[item.id] : item.quantity;
    if (editingQuantities[item.id] === undefined) {
      setEditingQuantities(prev => ({ ...prev, [item.id]: item.quantity }));
    }
    updateEditingQuantity(item.id, Math.max(0, current - 1));
  };

  const toggleCategory = (location: string, category: string) => {
    const key = `${location}-${category}`;
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const openEditDetails = (item: StockItem) => {
    setEditingDetailItem(item);
    setDetailSupplier(item.supplier || '');
    setDetailNotes(item.notes || '');
  };

  const closeEditDetails = () => {
    setEditingDetailItem(null);
    setDetailSupplier('');
    setDetailNotes('');
  };

  const saveEditDetails = async () => {
    if (!editingDetailItem) return;

    try {
      const updates = {
        supplier: detailSupplier || null,
        notes: detailNotes || null
      };

      const { error } = await supabase
        .from('stock_items')
        .update(updates)
        .eq('id', editingDetailItem.id);

      if (error) throw error;

      updateStockItem(editingDetailItem.id, updates);
      closeEditDetails();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const updateEditingQuantity = (id: string, quantity: number) => {
    setEditingQuantities(prev => ({ ...prev, [id]: quantity }));
  };

  const saveQuantity = (itemId: string) => {
    const newQuantity = editingQuantities[itemId];
    if (newQuantity === undefined) return;

    updateStockItem(itemId, { quantity: newQuantity });
    setEditingQuantities(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      return newState;
    });
  };

  const cancelEditingQuantity = (itemId: string) => {
    setEditingQuantities(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      return newState;
    });
  };

  const handleSign = async () => {
    if (!signerName.trim()) return;
    try {
      await signStock(signLocation, signerName.trim());
      setIsSignModalOpen(false);
      setSignerName('');
    } catch (error) {
      console.error('Error signing:', error);
    }
  };

  const getLastSignature = (location: 'Trailer' | 'Lockup') => {
    return signatures.filter(s => s.location === location)[0];
  };

  const categories = ['Food', 'Drinks', 'Essentials', 'Ingredients'];

  const StockTable = ({ title, items, badgeColor }: { title: string, items: StockItem[], badgeColor: string }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-8 shadow-lg">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/30">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-xl text-white font-heading uppercase tracking-wide">{title}</h3>
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md text-black uppercase tracking-wide ${badgeColor}`}>Live</span>
        </div>
      </div>
      <div className="divide-y divide-zinc-800">
        {categories.map(category => {
          const categoryItems = items.filter(item => item.category === category);
          const isExpanded = expandedCategories[`${title.split(' ')[0]}-${category}`];
          return (
            <div key={category}>
              <div
                className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${isExpanded ? 'bg-zinc-800/60 border-b border-zinc-800' : 'hover:bg-zinc-800/30'
                  }`}
                onClick={() => toggleCategory(title.split(' ')[0], category)}
              >
                <h4 className="font-bold text-white text-lg">{category}</h4>
                <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>

              {isExpanded && (
                <div className="px-6 pb-4 pt-4 bg-zinc-900/50">
                  {categoryItems.length === 0 ? (
                    <div className="text-center text-zinc-500 py-4">No items in this category.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs font-bold text-zinc-400 uppercase tracking-wide">
                            <th className="pb-2 w-1/3">Stock</th>
                            <th className="pb-2 w-1/6 hidden md:table-cell">Supplier</th>
                            <th className="pb-2 w-1/6">Quantity</th>
                            <th className="pb-2 w-1/4 hidden md:table-cell">Notes</th>
                            <th className="pb-2 w-1/6">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {categoryItems.map(item => (
                            <tr key={item.id} className="hover:bg-zinc-800/30">
                              <td className="py-3 w-1/3">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-white">{item.name}</span>
                                  {item.quantity <= item.lowStockThreshold && (
                                    <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                      <AlertTriangle className="w-3 h-3" /> Low Stock
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 w-1/6 hidden md:table-cell">
                                <div className="relative group">
                                  <select
                                    value={item.supplier || ''}
                                    onChange={(e) => updateStockItem(item.id, { supplier: e.target.value })}
                                    className="w-full bg-transparent border border-transparent rounded-lg pl-2 pr-8 py-1.5 text-sm text-zinc-400 group-hover:text-zinc-300 focus:text-white hover:bg-zinc-900/50 focus:bg-zinc-900 focus:border-zinc-800 focus:ring-1 focus:ring-brand-yellow focus:outline-none appearance-none cursor-pointer transition-all"
                                  >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => (
                                      <option key={s.id} value={s.name}>
                                        {s.name}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-500 pointer-events-none transition-colors" />
                                </div>
                              </td>
                              <td className="py-3 w-1/6">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center bg-zinc-950 rounded-lg border border-zinc-800 p-1">
                                    <button
                                      onClick={() => handleDecrement(item)}
                                      className="w-8 h-8 flex items-center justify-center rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={editingQuantities[item.id] ?? item.quantity}
                                      onChange={(e) => updateEditingQuantity(item.id, parseInt(e.target.value) || 0)}
                                      className="w-12 text-center font-mono font-bold text-lg text-white bg-zinc-950 border-0 focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                                    />
                                    <button
                                      onClick={() => handleIncrement(item)}
                                      className="w-8 h-8 flex items-center justify-center rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                  {editingQuantities[item.id] !== undefined && (
                                    <>
                                      <button
                                        onClick={() => saveQuantity(item.id)}
                                        className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                        title="Save"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => cancelEditingQuantity(item.id)}
                                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                        title="Cancel"
                                      >
                                        <XIcon className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 w-1/4 text-zinc-300 hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                  {item.notes ? (
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate text-sm text-zinc-400">
                                        {item.notes}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-700 text-sm px-2">-</span>
                                  )}
                                  {item.notes && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingNoteItem(item);
                                      }}
                                      className="p-1 text-zinc-500 hover:text-brand-yellow transition-colors shrink-0"
                                      title="View full note"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 w-1/6">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEditDetails(item)}
                                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                    title="Edit supplier and notes"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this item?')) {
                                        deleteStockItem(item.id);
                                      }
                                    }}
                                    className="p-2 bg-zinc-800 hover:bg-red-900/30 rounded-lg text-red-500 hover:text-red-400 transition-colors"
                                    title="Delete item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                  }
                </div>
              )
              }
            </div>
          );
        })}
      </div >
      {/* Signing Section */}
      < div className="p-6 border-t border-zinc-800 bg-zinc-800/20" >
        <div className="flex items-center justify-between">
          <div>
            {(() => {
              const lastSig = getLastSignature(title.split(' ')[0] as 'Trailer' | 'Lockup');
              return lastSig ? (
                <p className="text-sm text-zinc-400">
                  Last signed: <span className="text-white">{lastSig.signedBy}</span> on {new Date(lastSig.signedAt).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-sm text-zinc-400">Not signed yet</p>
              );
            })()}
          </div>
          <button
            onClick={() => {
              setSignLocation(title.split(' ')[0] as 'Trailer' | 'Lockup');
              setIsSignModalOpen(true);
            }}
            className="px-4 py-2 bg-brand-yellow text-black font-bold rounded-lg text-sm transition-colors flex items-center gap-2 hover:bg-yellow-400"
          >
            <PenTool className="w-4 h-4" /> Sign for Today
          </button>
        </div>
      </div >
    </div >
  );

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6 max-w-6xl mx-auto animate-fade-in">
        <div className="flex justify-between items-end pb-6">
          <div>
            <h2 className="text-4xl font-bold text-white font-heading uppercase">Inventory</h2>
            <p className="text-zinc-400 mt-1 font-sans">Track stock levels across locations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-brand-yellow text-black font-bold rounded-lg text-sm transition-colors flex items-center gap-2 hover:bg-yellow-400"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          </div>
        </div>

        <StockTable title="Trailer Inventory" items={trailerStock} badgeColor="bg-brand-yellow" />
        <StockTable title="Lockup Storage" items={lockupStock} badgeColor="bg-blue-400" />
      </div>

      <StockModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <SupplierModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} />

      {/* Sign Modal */}
      {isSignModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="font-bold text-white text-xl font-heading uppercase">Sign {signLocation} Stock Card</h2>
              <button onClick={() => setIsSignModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Your Name</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <button
                onClick={handleSign}
                disabled={!signerName.trim()}
                className="w-full bg-brand-yellow text-black font-bold py-3 rounded-xl mt-4 hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" /> Sign Stock Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {editingDetailItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h2 className="font-bold text-white text-xl font-heading uppercase">Edit Details</h2>
                <p className="text-zinc-400 text-sm">{editingDetailItem.name}</p>
              </div>
              <button onClick={closeEditDetails} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Supplier */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Supplier</label>
                <select
                  value={detailSupplier}
                  onChange={e => setDetailSupplier(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none appearance-none"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Notes</label>
                <textarea
                  value={detailNotes}
                  onChange={e => setDetailNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none resize-none min-h-[120px]"
                  placeholder="Add notes about this item..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeEditDetails}
                  className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditDetails}
                  className="flex-1 px-4 py-3 bg-brand-yellow text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Note Modal */}
      {viewingNoteItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h2 className="font-bold text-white text-xl font-heading uppercase">Item Note</h2>
                <p className="text-zinc-400 text-sm">{viewingNoteItem.name}</p>
              </div>
              <button onClick={() => setViewingNoteItem(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                <p className="text-zinc-300 whitespace-pre-wrap">{viewingNoteItem.notes}</p>
              </div>
              <button
                onClick={() => setViewingNoteItem(null)}
                className="w-full mt-6 bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
