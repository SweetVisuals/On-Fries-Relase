import React, { useState } from 'react';
import { X, Check, Package } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StockItem } from '../types';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockModal: React.FC<StockModalProps> = ({ isOpen, onClose }) => {
  const { addStockItem, suppliers } = useStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food');
  const [quantity, setQuantity] = useState(0);
  const [location, setLocation] = useState<'Trailer' | 'Lockup'>('Trailer');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StockItem = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        category,
        quantity,
        location,
        supplier: supplier || undefined,
        notes: notes || undefined,
        lowStockThreshold
    };
    await addStockItem(newItem);
    // Reset
    setName('');
    setCategory('Food');
    setQuantity(0);
    setSupplier('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
         <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h2 className="font-bold text-white text-xl font-heading uppercase">Add Stock Item</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
         </div>

         <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Item Name</label>
               <input
                 required
                 type="text"
                 value={name}
                 onChange={e => setName(e.target.value)}
                 className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                 placeholder="e.g. Burger Buns"
               />
            </div>

            <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Category</label>
               <select
                   value={category}
                   onChange={e => setCategory(e.target.value)}
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none appearance-none"
               >
                   <option value="Food">Food</option>
                   <option value="Drinks">Drinks</option>
                   <option value="Essentials">Essentials</option>
                   <option value="Ingredients">Ingredients</option>
               </select>
            </div>

            <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Location</label>
               <select
                   value={location}
                   onChange={e => setLocation(e.target.value as any)}
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none appearance-none"
               >
                   <option value="Trailer">Trailer</option>
                   <option value="Lockup">Lockup</option>
               </select>
            </div>

            <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Supplier</label>
               <select
                 value={supplier}
                 onChange={e => setSupplier(e.target.value)}
                 className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none appearance-none"
               >
                 <option value="">Select Supplier</option>
                 {suppliers.map(s => (
                   <option key={s.id} value={s.name}>
                     {s.name}
                   </option>
                 ))}
               </select>
            </div>

            <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Notes</label>
               <textarea
                 value={notes}
                 onChange={e => setNotes(e.target.value)}
                 className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                 placeholder="Additional notes..."
                 rows={3}
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Quantity</label>
                    <input
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Low Stock Alert</label>
                    <input
                        type="number"
                        min="0"
                        value={lowStockThreshold}
                        onChange={e => setLowStockThreshold(parseInt(e.target.value) || 0)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                    />
                </div>
            </div>

            <button type="submit" className="w-full bg-brand-yellow text-black font-bold py-3 rounded-xl mt-4 hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
               <Check className="w-5 h-5" /> Add Item
            </button>
         </form>
      </div>
    </div>
  );
}