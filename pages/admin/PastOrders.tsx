import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { Search, CheckCircle2, XCircle, Calendar, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export const PastOrdersPage = () => {
  const { orders, deleteOrder } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Filter for delivered or cancelled orders
  const pastOrders = orders.filter(o =>
    ['delivered', 'cancelled'].includes(o.status) &&
    (o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm))
  );

  const toggleExpand = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6 max-w-7xl mx-auto animate-fade-in">
        <div className="py-4 border-b border-zinc-800">
          <h2 className="text-4xl font-bold text-white font-heading uppercase">Order History</h2>
          <p className="text-zinc-400 mt-1 font-sans">Archive of completed and cancelled orders</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none"
          />
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 border-b border-zinc-800">
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider w-10"></th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Order ID</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Customer</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Total</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Order Time</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Items</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {pastOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-zinc-500">No past orders found.</td>
                  </tr>
                ) : (
                  pastOrders.map(order => (
                    <React.Fragment key={order.id}>
                      <tr
                        onClick={() => toggleExpand(order.id)}
                        className={`cursor-pointer transition-colors ${expandedOrder === order.id ? 'bg-zinc-800/40' : 'hover:bg-zinc-800/30'}`}
                      >
                        <td className="p-4 text-zinc-500">
                          {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                        <td className="p-4 font-mono text-sm text-zinc-300">{order.displayId || `#${order.id.slice(0, 8)}`}</td>
                        <td className="p-4 font-medium text-white">{order.customerName}</td>
                        <td className="p-4 text-sm text-zinc-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-white">£{order.total.toFixed(2)}</td>
                        <td className="p-4 text-sm text-zinc-400 font-mono">
                          {order.completedAt ? (() => {
                            const start = new Date(order.createdAt).getTime();
                            const end = new Date(order.completedAt).getTime();
                            const diff = Math.floor((end - start) / 1000);
                            const minutes = Math.floor(diff / 60);
                            const seconds = diff % 60;
                            return `${minutes}m ${seconds}s`;
                          })() : '-'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            {order.status === 'delivered' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-right text-sm text-zinc-400">
                          {order.items.length} items
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm('Delete order?')) deleteOrder(order.id); }}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {expandedOrder === order.id && (
                        <tr className="bg-black/20">
                          <td colSpan={9} className="p-0">
                            <div className="p-4 pl-16 bg-zinc-950/30 border-t border-zinc-800/50 shadow-inner">
                              <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2 tracking-wider">Order Items</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                                    <div className="font-bold text-brand-yellow text-lg">{item.quantity}x</div>
                                    <div>
                                      <div className="font-medium text-sm text-white">{item.name}</div>
                                      <div className="text-xs text-zinc-500">£{item.price.toFixed(2)} ea</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {order.notes && (
                                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-200/80 italic">
                                  <span className="font-bold not-italic text-yellow-500 mr-2">Note:</span>
                                  {order.notes}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-4">
          {pastOrders.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded-xl">No past orders.</div>
          ) : (
            pastOrders.map(order => (
              <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-800/30 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{order.displayId || `#${order.id.slice(0, 5)}`}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-400">{order.customerName}</div>
                  </div>
                  <button
                    onClick={() => { if (confirm('Delete order?')) deleteOrder(order.id); }}
                    className="p-2 bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Date</span>
                    <span className="text-white">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Total</span>
                    <span className="text-white font-bold">£{order.total.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-800/50">
                    <button onClick={() => toggleExpand(order.id)} className="w-full text-xs text-zinc-400 flex items-center justify-center gap-1 py-1 hover:text-white">
                      {expandedOrder === order.id ? 'Hide Items' : `View ${order.items.length} Items`}
                      {expandedOrder === order.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  {expandedOrder === order.id && (
                    <div className="space-y-2 pt-2 animate-fade-in">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-zinc-300">{item.quantity}x {item.name}</span>
                          <span className="text-zinc-500">£{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.notes && (
                        <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-200/80 italic">
                          <span className="font-bold not-italic text-yellow-500 mr-2">Note:</span>
                          {order.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};