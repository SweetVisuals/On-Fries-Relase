import React, { useState } from 'react';
import { X, Trash2, CreditCard, ShoppingBag, Loader2, Check, List, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Order, CartItem } from '../types';
import SquarePaymentForm from './SquarePaymentForm';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, clearCart, addOrder, settings, user, averageOrderTime } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderReference, setOrderReference] = useState('');

  if (!isOpen && !completedOrder && !isProcessing) return null;

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Generate order reference
    const orderRef = `ONF-${Date.now()}`;
    setOrderReference(orderRef);
    setShowPaymentForm(true);
    setPaymentError(null);
  };

  const handlePaymentSuccess = async (payment: any) => {
    try {
      // Set processing state to show spinner
      setIsProcessing(true);

      console.log('Starting order creation process...', {
        customerName: 'Customer Test',
        items: cart,
        total: total,
        paymentId: payment.id,
        orderReference
      });

      // Create order in database
      const orderPayload = {
        customerName: 'Customer Test',
        status: 'cooking' as const,
        items: [...cart] as CartItem[],
        total: total,
        estimatedTime: new Date(Date.now() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        paymentId: payment.id
      };

      const createdOrder = await addOrder(orderPayload);

      if (createdOrder) {
        setCompletedOrder(createdOrder);
        clearCart();
        setShowPaymentForm(false);
      } else {
        throw new Error('Failed to create order');
      }

    } catch (error: any) {
      console.error('Error creating order:', error);
      setPaymentError(error instanceof Error ? error.message : 'Order creation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setShowPaymentForm(false);
    setOrderReference('');
    setPaymentError(error);
  };

  const handleBackToCart = () => {
    setShowPaymentForm(false);
    setOrderReference('');
    setPaymentError(null);
  };

  const handleCloseSuccess = () => {
    setCompletedOrder(null);
    onClose();
  };

  // Processing Screen Overlay
  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-yellow/20 blur-xl rounded-full"></div>
          <Loader2 className="w-16 h-16 text-brand-yellow animate-spin relative z-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mt-8 mb-2 font-heading uppercase tracking-wide">Processing Payment</h2>
        <p className="text-zinc-500">Please wait while we confirm your order...</p>
      </div>
    );
  }

  if (completedOrder) {
    // return <PaymentModal order={completedOrder} onClose={handleCloseSuccess} />;
    // Now handled inline below
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-zinc-950 border-l border-zinc-800 z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {completedOrder ? (
          // Success UI
          <div className="h-full flex flex-col animate-fade-in">
            {/* Success Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                </div>
                <h2 className="text-xl font-bold text-white">Order Confirmed</h2>
              </div>
              <button onClick={handleCloseSuccess} className="text-zinc-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Success Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
                <p className="text-zinc-400 text-sm">Your order has been placed successfully.</p>
              </div>

              {/* Receipt Card */}
              <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-zinc-800 bg-zinc-800/50 flex items-center gap-3">
                  <div className="p-2 bg-zinc-700 rounded-lg">
                    <List className="w-4 h-4 text-zinc-300" />
                  </div>
                  <span className="font-bold text-white text-sm">Order #{completedOrder.id}</span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Customer:</span>
                    <span className="font-bold text-white">{completedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Payment:</span>
                    <span className="font-bold text-emerald-500">COMPLETED</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Payment ID:</span>
                    <span className="font-mono text-zinc-300 text-xs">{completedOrder.paymentId || `pay_${Math.random().toString(36).substr(2, 8)}`}</span>
                  </div>

                  <div className="h-px bg-zinc-800 my-2"></div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Items Ordered:</p>
                    <div className="max-h-32 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                      {completedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-zinc-300 truncate pr-4 flex-1">{item.name} x{item.quantity}</span>
                          <span className="text-white font-medium">£{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-zinc-800 my-2"></div>

                  <div className="flex justify-between items-end">
                    <span className="font-bold text-white text-lg">Total:</span>
                    <span className="font-bold text-white text-xl">£{completedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="w-full bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4">
                <div className="p-2 rounded-full border border-blue-400 text-blue-400 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-white text-sm">Estimated Delivery</p>
                  <p className="text-blue-200 text-sm">{completedOrder.estimatedTime}</p>
                  <p className="text-blue-400 text-xs mt-0.5">(Approximately {averageOrderTime} minutes)</p>
                </div>
              </div>
            </div>

            {/* Success Footer */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-900 space-y-3">
              <Link to="/orders" onClick={handleCloseSuccess} className="block w-full py-3.5 bg-brand-yellow text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-900/20 text-center">
                View My Orders
              </Link>
              <button onClick={handleCloseSuccess} className="block w-full py-3.5 bg-transparent border border-zinc-800 text-zinc-300 font-bold rounded-xl hover:bg-zinc-900 hover:text-white transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Menu
              </button>
            </div>
          </div>
        ) : (
          // Standard Cart UI
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-brand-yellow" />
                <h2 className="text-xl font-bold text-white">Your Orders</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-bold text-zinc-400">{cart.length} Items</span>
                <button onClick={onClose} className="text-zinc-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm">Add some delicious items from the menu!</p>
                  <button onClick={onClose} className="mt-6 px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm font-bold hover:bg-zinc-800 transition-colors">
                    Browse Menu
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 relative group hover:border-zinc-700 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white pr-8">{item.name}</h4>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="p-2 bg-zinc-950 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors absolute top-4 right-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-col text-sm text-zinc-400">
                        {item.addons && item.addons.map((addon, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <div className="w-1 h-1 rounded-full bg-zinc-600"></div> {addon}
                          </div>
                        ))}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-zinc-500 font-mono mb-0.5">Qty: {item.quantity}</div>
                        <div className="text-brand-yellow font-bold text-lg">£{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-zinc-900 border-t border-zinc-800">
              {!showPaymentForm ? (
                <>
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-zinc-400 font-bold text-lg">Total:</span>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-brand-yellow">£{total.toFixed(2)}</span>
                      <p className="text-zinc-500 text-xs mt-1">~{averageOrderTime} min wait</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {!user ? (
                      <Link
                        to="/profile"
                        onClick={onClose}
                        className="w-full py-4 bg-brand-yellow text-black font-bold text-lg rounded-xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-900/20 flex justify-center items-center gap-2"
                      >
                        <CreditCard className="w-5 h-5" />
                        Log In to Order
                      </Link>
                    ) : (
                      <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || !settings?.is_store_open}
                        className="w-full py-4 bg-brand-yellow text-black font-bold text-lg rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-900/20 flex justify-center items-center gap-2"
                      >
                        <CreditCard className="w-5 h-5" />
                        {!settings?.is_store_open ? 'Store Closed' : 'Pay Securely'}
                      </button>
                    )}

                    <button
                      onClick={clearCart}
                      disabled={cart.length === 0}
                      className="w-full py-3 bg-zinc-950 border border-zinc-800 text-zinc-400 font-bold rounded-xl hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors text-sm"
                    >
                      Clear Cart
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-zinc-400 font-bold text-lg">Total:</span>
                    <span className="text-3xl font-bold text-brand-yellow">£{total.toFixed(2)}</span>
                  </div>

                  {paymentError && (
                    <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      {paymentError}
                    </div>
                  )}

                  <SquarePaymentForm
                    amount={total}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    orderReference={orderReference}
                    disabled={false}
                  />

                  <button
                    onClick={handleBackToCart}
                    className="w-full py-3 bg-zinc-950 border border-zinc-800 text-zinc-400 font-bold rounded-xl hover:text-white hover:bg-zinc-800 transition-colors text-sm"
                  >
                    Back to Cart
                  </button>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </>
  );
};