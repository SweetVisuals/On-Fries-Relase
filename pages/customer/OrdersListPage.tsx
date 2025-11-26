import React, { useMemo } from 'react';
import { CustomerLayout } from '../../components/CustomerLayout';
import { useStore } from '../../context/StoreContext';
import { Clock, CheckCircle2, XCircle, ChefHat, Timer } from 'lucide-react';

export const OrdersListPage = () => {
   const { orders, averageOrderTime } = useStore();

   // Filter orders for the current view (simulating "My Orders" - in a real app would filter by user ID)
   // For this demo, we'll show all orders that are not delivered/cancelled as "Active"
   // and others as "Past"

   // Sort orders: active orders oldest first, completed orders newest first
   const sortedOrders = useMemo(() => {
      const activeStatuses = ['pending', 'cooking', 'preparing', 'ready'];
      const active = orders.filter(o => activeStatuses.includes(o.status))
         .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const completed = orders.filter(o => !activeStatuses.includes(o.status))
         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return [...active, ...completed];
   }, [orders]);

   const getQueuePosition = (orderId: string) => {
      // Get all active orders sorted by creation time (oldest first)
      const activeOrders = orders
         .filter(o => ['pending', 'cooking', 'preparing'].includes(o.status))
         .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const index = activeOrders.findIndex(o => o.id === orderId);
      return index !== -1 ? index + 1 : null;
   };

   const getStatusDisplay = (status: string) => {
      switch (status) {
         case 'pending':
         case 'cooking':
         case 'preparing':
            return { label: 'In Progress', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: <ChefHat className="w-3 h-3" /> };
         case 'ready':
            return { label: 'Ready to Collect', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="w-3 h-3" /> };
         case 'delivered':
         case 'completed':
            return { label: 'Completed', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: <CheckCircle2 className="w-3 h-3" /> };
         case 'cancelled':
            return { label: 'Cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <XCircle className="w-3 h-3" /> };
         default:
            return { label: status, color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: <Clock className="w-3 h-3" /> };
      }
   };

   const getEstimatedReadyTime = (order: any) => {
      if (order.status === 'ready' || order.status === 'delivered' || order.status === 'completed' || order.status === 'cancelled') return null;

      // Use stored estimated time or calculate based on average
      if (order.estimatedTime) return order.estimatedTime;

      const createdAt = new Date(order.createdAt);
      const estimatedDate = new Date(createdAt.getTime() + averageOrderTime * 60000);
      return estimatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   };

   return (
      <CustomerLayout>
         <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="text-center py-6">
               <h1 className="text-3xl font-bold text-white font-heading uppercase">My Orders</h1>
               <p className="text-zinc-400">Track your current and past orders</p>
            </div>

            <div className="space-y-4">
               {sortedOrders.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-2xl">
                     <p className="text-zinc-500">No orders found.</p>
                  </div>
               ) : (
                  sortedOrders.map(order => {
                     const statusInfo = getStatusDisplay(order.status);
                     const queuePos = getQueuePosition(order.id);
                     const estTime = getEstimatedReadyTime(order);

                     return (
                        <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                           {/* Header */}
                           <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-800/30">
                              <div>
                                 <div className="flex items-center gap-3 mb-1">
                                    <span className="font-bold text-white text-lg">Order #{order.displayId || order.id.slice(0, 8)}</span>
                                    {queuePos && (
                                       <span className="px-2 py-0.5 bg-brand-yellow text-black text-[10px] font-bold uppercase tracking-wider rounded">
                                          Queue #{queuePos}
                                       </span>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                 </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                 <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 uppercase tracking-wide border ${statusInfo.color}`}>
                                    {statusInfo.icon}
                                    {statusInfo.label}
                                 </div>
                                 {estTime && (
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                                       <Timer className="w-3.5 h-3.5 text-brand-yellow" />
                                       <span>Est. Ready: <span className="text-white">{estTime}</span></span>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Items */}
                           <div className="p-5 space-y-3 bg-zinc-900/50">
                              {order.items.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-start text-sm">
                                    <div className="flex-1">
                                       <div className="flex items-center gap-2">
                                          <span className="font-bold text-brand-yellow">{item.quantity}x</span>
                                          <span className="text-zinc-200 font-medium">{item.name}</span>
                                       </div>
                                       {item.addons && item.addons.length > 0 && (
                                          <div className="pl-6 mt-1 text-xs text-zinc-500">
                                             {item.addons.join(', ')}
                                          </div>
                                       )}
                                    </div>
                                    <span className="text-zinc-400 font-mono">£{(item.price * item.quantity).toFixed(2)}</span>
                                 </div>
                              ))}
                           </div>

                           {/* Footer */}
                           <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-950/30">
                              <span className="text-zinc-500 text-sm font-medium">Total Paid</span>
                              <span className="text-xl font-bold text-white">£{order.total.toFixed(2)}</span>
                           </div>
                        </div>
                     );
                  })
               )}
            </div>
         </div>
      </CustomerLayout>
   );
};