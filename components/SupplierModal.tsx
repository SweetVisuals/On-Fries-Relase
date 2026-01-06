import React, { useState } from 'react';
import { X, Check, Truck, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Supplier } from '../types';
import { supabase } from '../lib/supabase';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose }) => {
  const { addSupplier, suppliers, deleteSupplier } = useStore();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await addSupplier({ name });

      // Reset form
      setName('');
    } catch (err: any) {
      console.error('Error adding supplier:', err);
      if (err.code === '23505') {
        setError('A supplier with this name already exists.');
      } else {
        setError('Failed to add supplier. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 shrink-0">
          <h2 className="font-bold text-white text-xl font-heading uppercase">Manage Suppliers</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8">
          {/* Add New Supplier Form */}
          <section>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand-yellow" />
              Add New Supplier
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Supplier Name *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                  placeholder="e.g. Local Supplier Ltd"
                />
              </div>

              <button type="submit" className="w-full bg-brand-yellow text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> Add Supplier
              </button>
            </form>
          </section>

          {/* Existing Suppliers List */}
          <section>
            <h3 className="text-lg font-bold text-white mb-4">Existing Suppliers</h3>
            <div className="space-y-2">
              {suppliers.length === 0 ? (
                <p className="text-zinc-500 text-sm">No suppliers added yet.</p>
              ) : (
                suppliers.map(supplier => (
                  <div key={supplier.id} className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                    <h4 className="font-bold text-white">{supplier.name}</h4>
                    <button
                      onClick={() => {
                        if (confirm(`Delete supplier "${supplier.name}"?`)) {
                          deleteSupplier(supplier.id);
                        }
                      }}
                      className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete supplier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}