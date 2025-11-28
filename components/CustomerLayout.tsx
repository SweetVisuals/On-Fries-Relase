import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Utensils, List, User, LogIn, ShoppingBag, Info } from 'lucide-react';
import { CartDrawer } from './CartDrawer';
import { useStore } from '../context/StoreContext';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { cart, user } = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Trigger bump animation when cart length changes
  useEffect(() => {
    if (cart.length > 0) {
      setAnimateCart(true);
      const timer = setTimeout(() => setAnimateCart(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cart.length]);

  return (
    <div className="min-h-screen bg-brand-black text-white flex flex-col">
      {/* Top Nav (Desktop & Mobile) */}
      <header className="bg-brand-dark border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-zinc-800 rounded-full border border-brand-yellow overflow-hidden">
               <img src="/images/OnFries-Logo.png" alt="Logo" />
             </div>
             <span className="font-bold text-xl tracking-tight text-brand-yellow">On Fries</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Cart Button Desktop */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className={`relative p-2 text-zinc-400 hover:text-white transition-all md:mr-4 ${animateCart ? 'text-brand-yellow scale-110' : ''}`}
            >
               <ShoppingBag className={`w-5 h-5 ${animateCart ? 'animate-bump' : ''}`} />
               {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-yellow text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                     {cart.length}
                  </span>
               )}
            </button>

            {user ? (
              <Link to="/profile" className="hidden md:flex text-xs text-zinc-500 hover:text-white items-center gap-1 font-medium">
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link to="/profile" className="hidden md:flex text-xs text-zinc-500 hover:text-white items-center gap-1 font-medium">
                <LogIn className="w-5 h-5" /> Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-8 max-w-4xl mx-auto w-full p-4">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-dark border-t border-zinc-800 pb-safe z-30">
        <div className="flex justify-around items-center h-16 px-2">
          <Link 
            to="/" 
            className={`flex flex-col items-center space-y-1 min-w-[50px] ${isActive('/') ? 'text-brand-yellow' : 'text-zinc-500'}`}
          >
            <Utensils className="w-6 h-6" />
            <span className="text-[10px] font-medium">Menu</span>
          </Link>
          
          {/* Mobile Cart Trigger */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className={`flex flex-col items-center space-y-1 min-w-[50px] ${isCartOpen ? 'text-brand-yellow' : 'text-zinc-500'}`}
          >
             <div className="relative">
                <ShoppingBag className={`w-6 h-6 ${animateCart ? 'text-brand-yellow animate-bump' : ''}`} />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-yellow text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-zinc-900">
                     {cart.length}
                  </span>
                )}
             </div>
            <span className="text-[10px] font-medium">Cart</span>
          </button>

          <Link 
            to="/orders" 
            className={`flex flex-col items-center space-y-1 min-w-[50px] ${isActive('/orders') ? 'text-brand-yellow' : 'text-zinc-500'}`}
          >
            <List className="w-6 h-6" />
            <span className="text-[10px] font-medium">Orders</span>
          </Link>
          <Link 
            to="/profile" 
            className={`flex flex-col items-center space-y-1 min-w-[50px] ${isActive('/profile') ? 'text-brand-yellow' : 'text-zinc-500'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
          <Link 
            to="/about" 
            className={`flex flex-col items-center space-y-1 min-w-[50px] ${isActive('/about') ? 'text-brand-yellow' : 'text-zinc-500'}`}
          >
            <Info className="w-6 h-6" />
            <span className="text-[10px] font-medium">About</span>
          </Link>
        </div>
      </nav>

      {/* Desktop Navigation (Hidden on mobile) */}
      <div className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 px-6 py-3 rounded-full shadow-2xl z-30 gap-8">
          <Link to="/" className={`flex items-center gap-2 font-medium ${isActive('/') ? 'text-brand-yellow' : 'text-zinc-400 hover:text-white'}`}>
            <Utensils className="w-5 h-5" /> Menu
          </Link>
          <Link to="/orders" className={`flex items-center gap-2 font-medium ${isActive('/orders') ? 'text-brand-yellow' : 'text-zinc-400 hover:text-white'}`}>
            <List className="w-5 h-5" /> Orders
          </Link>
          <Link to="/about" className={`flex items-center gap-2 font-medium ${isActive('/about') ? 'text-brand-yellow' : 'text-zinc-400 hover:text-white'}`}>
            <Info className="w-5 h-5" /> About
          </Link>
          <Link to="/profile" className={`flex items-center gap-2 font-medium ${isActive('/profile') ? 'text-brand-yellow' : 'text-zinc-400 hover:text-white'}`}>
            <User className="w-5 h-5" /> Profile
          </Link>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};