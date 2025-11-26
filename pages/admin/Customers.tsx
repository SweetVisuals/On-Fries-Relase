import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { Users, Mail, Search, Filter, Star } from 'lucide-react';

export const CustomersPage = () => {
  const { customers } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-8 max-w-7xl mx-auto animate-fade-in">
        
        <div className="flex justify-between items-center pb-6 border-b border-zinc-800">
           <div>
             <h2 className="text-4xl font-bold text-white font-heading uppercase">Customers</h2>
             <p className="text-zinc-400 mt-1 font-sans">Manage your customer base</p>
           </div>
           <div className="flex gap-3">
              <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-400">
                <span className="text-white font-bold mr-1">{customers.length}</span> Total
              </div>
              <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-400">
                <span className="text-brand-yellow font-bold mr-1">{customers.filter(c => c.segment === 'VIP').length}</span> VIP
              </div>
           </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search customers by name or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-300 focus:ring-1 focus:ring-brand-yellow focus:outline-none" 
                />
            </div>
            <button className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white flex items-center gap-2">
               <Filter className="w-4 h-4" /> Filters
            </button>
        </div>

        {/* Customer List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {filteredCustomers.map((customer) => (
             <div key={customer.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition-all group relative overflow-hidden">
                {/* VIP Badge */}
                {customer.segment === 'VIP' && (
                  <div className="absolute top-0 right-0 bg-brand-yellow text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl">VIP</div>
                )}
                
                <div className="flex items-center gap-4 mb-6">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      customer.segment === 'VIP' ? 'bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20' : 'bg-zinc-800 text-zinc-400'
                   }`}>
                      {customer.name.charAt(0)}
                   </div>
                   <div>
                      <h4 className="font-bold text-white text-lg">{customer.name}</h4>
                      <div className="flex items-center gap-1 text-zinc-500 text-xs">
                         <Mail className="w-3 h-3" /> {customer.email}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                   <div className="bg-zinc-950/50 rounded-lg p-3">
                      <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Total Spent</div>
                      <div className="text-white font-bold">£{customer.totalSpent.toFixed(2)}</div>
                   </div>
                   <div className="bg-zinc-950/50 rounded-lg p-3">
                      <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Orders</div>
                      <div className="text-white font-bold">{customer.totalOrders}</div>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                   <div className="text-xs text-zinc-500">Last Order: <span className="text-zinc-300">{customer.lastOrderDate}</span></div>
                   <button className="text-xs font-bold text-brand-yellow hover:underline">View Profile</button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </AdminLayout>
  );
};