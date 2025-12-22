import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { Search, Plus, Clock, Edit, Trash2, CheckCircle, ChefHat, Bell, Flame, Beef, Carrot } from 'lucide-react';
import { OrderModal } from '../../components/OrderModal';
import { Order } from '../../types';

export const CurrentOrdersPage = () => {
  const { orders, updateOrderStatus, deleteOrder } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter out completed/cancelled orders for this view
  // We include pending and cooking for the main view
  const activeOrders = orders.filter(o =>
    ['pending', 'cooking', 'ready'].includes(o.status) &&
    (o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm))
  );

  // Calculate Grill Items (Only from Pending and Cooking status)
  const grillOrders = orders.filter(o => ['pending', 'cooking'].includes(o.status));

  const grillStats = {
    steaks: 0,
    lamb: 0,
    shortRib: 0,
    kidsCone: 0
  };

  grillOrders.forEach(order => {
    order.items.forEach(item => {
      const name = item.name.toLowerCase();

      // Count main items
      if (name.includes('deluxe steak')) grillStats.steaks += 2 * item.quantity;
      else if (name.includes('steak')) grillStats.steaks += item.quantity;
      else if (name.includes('lamb')) grillStats.lamb += 2 * item.quantity;
      else if (name.includes('rib')) grillStats.shortRib += 2 * item.quantity;
      else if (name.includes('cone')) grillStats.kidsCone += item.quantity;

      // Count addons
      if (item.addons && item.addons.length > 0) {
        item.addons.forEach(addon => {
          if (addon.startsWith('Lamb')) grillStats.lamb += 2 * item.quantity;
          else if (addon.startsWith('Short Rib')) grillStats.shortRib += 2 * item.quantity;
          else if (addon.startsWith('Steak')) grillStats.steaks += item.quantity;
        });
      }
    });
  });

  // Helper component for elapsed time
  const OrderTimer = ({ createdAt }: { createdAt: string }) => {
    const [elapsed, setElapsed] = React.useState('');

    React.useEffect(() => {
      const interval = setInterval(() => {
        const start = new Date(createdAt).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000);

        const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        setElapsed(`${minutes}:${seconds}`);
      }, 1000);

      return () => clearInterval(interval);
    }, [createdAt]);

    return <span>{elapsed}</span>;
  };

  const handleNextStatus = (orderId: string, currentStatus: string) => {
    if (currentStatus === 'pending') updateOrderStatus(orderId, 'ready');
    else if (currentStatus === 'cooking') updateOrderStatus(orderId, 'ready');
    else if (currentStatus === 'ready') updateOrderStatus(orderId, 'delivered');
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteOrder(orderId);
    }
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'cooking': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'ready': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getNextActionLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Mark Ready';
      case 'cooking': return 'Mark Ready';
      case 'ready': return 'Mark Delivered';
      default: return 'Complete';
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-8 animate-fade-in">

        {/* Header */}
        <div className="flex justify-between items-center py-3 md:py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-white font-heading uppercase">Kitchen Display</h2>
            <p className="text-zinc-400 mt-1 font-sans text-xs md:text-base">Manage active orders</p>
          </div>
          <button
            onClick={handleNewOrder}
            className="bg-brand-yellow hover:bg-yellow-400 text-black font-bold px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-yellow-500/20"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-sm md:text-base">New Order</span>
          </button>
        </div>

        {/* Grill Station View */}
        <div>
          <div className="flex items-center gap-2 mb-2 md:mb-4 text-zinc-400 uppercase text-[10px] md:text-xs font-bold tracking-wider">
            <Flame className="w-3 h-3 md:w-4 md:h-4 text-orange-500" /> Grill Station Summary
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-3 md:p-4 rounded-xl flex justify-between items-center">
              <div className="flex flex-col">
                <Beef className="w-4 h-4 md:w-6 md:h-6 text-zinc-500 mb-1 md:mb-2" />
                <span className="text-xs md:text-sm font-bold text-white">Steaks</span>
                <span className="text-[10px] md:text-xs text-zinc-500">to cook</span>
              </div>
              <div className="text-xl md:text-3xl font-bold text-white">{grillStats.steaks}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-3 md:p-4 rounded-xl flex justify-between items-center">
              <div className="flex flex-col">
                <Beef className="w-4 h-4 md:w-6 md:h-6 text-zinc-500 mb-1 md:mb-2" />
                <span className="text-xs md:text-sm font-bold text-white">Lamb</span>
                <span className="text-[10px] md:text-xs text-zinc-500">to cook</span>
              </div>
              <div className="text-xl md:text-3xl font-bold text-white">{grillStats.lamb}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-3 md:p-4 rounded-xl flex justify-between items-center">
              <div className="flex flex-col">
                <Flame className="w-4 h-4 md:w-6 md:h-6 text-zinc-500 mb-1 md:mb-2" />
                <span className="text-xs md:text-sm font-bold text-white">Short Rib</span>
                <span className="text-[10px] md:text-xs text-zinc-500">to cook</span>
              </div>
              <div className="text-xl md:text-3xl font-bold text-white">{grillStats.shortRib}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-3 md:p-4 rounded-xl flex justify-between items-center">
              <div className="flex flex-col">
                <Carrot className="w-4 h-4 md:w-6 md:h-6 text-zinc-500 mb-1 md:mb-2" />
                <span className="text-xs md:text-sm font-bold text-white">Kids Cone</span>
                <span className="text-[10px] md:text-xs text-zinc-500">to cook</span>
              </div>
              <div className="text-xl md:text-3xl font-bold text-white">{grillStats.kidsCone}</div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 border-t border-zinc-800 pt-4 md:pt-8 no-scrollbar">
          {/* Pending Card Removed as per request */}
          <div className="px-4 py-2 md:px-6 md:py-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3 min-w-[140px] md:min-w-[200px]">
            <div className="p-1.5 md:p-2 bg-orange-500/10 rounded-lg"><ChefHat className="w-4 h-4 md:w-5 md:h-5 text-orange-500" /></div>
            <div>
              <div className="text-lg md:text-2xl font-bold text-white">{activeOrders.filter(o => o.status === 'cooking').length}</div>
              <div className="text-[10px] md:text-xs text-zinc-500 font-medium uppercase">Cooking</div>
            </div>
          </div>
          <div className="px-4 py-2 md:px-6 md:py-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3 min-w-[140px] md:min-w-[200px]">
            <div className="p-1.5 md:p-2 bg-emerald-500/10 rounded-lg"><CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" /></div>
            <div>
              <div className="text-lg md:text-2xl font-bold text-white">{activeOrders.filter(o => o.status === 'ready').length}</div>
              <div className="text-[10px] md:text-xs text-zinc-500 font-medium uppercase">Ready to Serve</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 md:left-4 md:top-3.5 md:w-5 md:h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 md:pl-12 md:py-3 text-sm md:text-base text-white focus:ring-1 focus:ring-brand-yellow focus:outline-none"
          />
        </div>

        {/* Orders Grid */}
        {activeOrders.length === 0 ? (
          <div className="text-center py-12 md:py-20 bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-2xl">
            <div className="inline-block p-3 md:p-4 bg-zinc-800 rounded-full mb-3 md:mb-4">
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-zinc-500" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white">All Caught Up!</h3>
            <p className="text-sm md:text-base text-zinc-500 mt-2">No active orders in the kitchen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-xl hover:border-zinc-700 transition-all">
                {/* Header */}
                <div className="p-3 md:p-5 border-b border-zinc-800 flex justify-between items-start bg-zinc-800/30">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base md:text-lg font-bold text-white">
                        {order.displayId ? `ORDER #${order.displayId.toString().padStart(3, '0')}` : `ORDER #${order.id.slice(0, 3).toUpperCase()}`}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <h3 className="text-sm md:text-base font-medium text-zinc-300">{order.customerName}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(order)} className="p-1.5 md:p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteOrder(order.id)} className="p-1.5 md:p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Timer Info */}
                <div className="px-3 py-2 md:px-5 md:py-3 bg-zinc-950/30 flex items-center gap-2 text-[10px] md:text-xs font-medium text-zinc-500 border-b border-zinc-800/50">
                  <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="ml-auto text-brand-yellow font-mono">
                    <OrderTimer createdAt={order.createdAt} />
                  </span>
                </div>

                {/* Items */}
                <div className="p-3 md:p-5 flex-1 space-y-3 md:space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-brand-yellow text-base md:text-lg">{item.quantity}x</span>
                          <span className="font-medium text-sm md:text-base text-white">{item.name}</span>
                        </div>
                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-1 pl-6 space-y-1">
                            {item.addons.map(addon => (
                              <div key={addon} className="text-[10px] md:text-xs text-zinc-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-zinc-600"></span> {addon}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Footer */}
                <div className="p-3 md:p-4 border-t border-zinc-800 bg-zinc-900 mt-auto">
                  <button
                    onClick={() => handleNextStatus(order.id, order.status)}
                    className={`w-full py-3 md:py-3.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 shadow-lg ${order.status === 'pending' ? 'bg-brand-yellow text-black hover:bg-yellow-400 shadow-yellow-900/20' :
                      order.status === 'cooking' ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-900/20' :
                        'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-900/20'
                      }`}
                  >
                    {order.status === 'pending' && <CheckCircle className="w-4 h-4" />}
                    {order.status === 'cooking' && <CheckCircle className="w-4 h-4" />}
                    {order.status === 'ready' && <Bell className="w-4 h-4" />}
                    {getNextActionLabel(order.status)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderToEdit={editingOrder}
      />
    </AdminLayout>
  );
};
