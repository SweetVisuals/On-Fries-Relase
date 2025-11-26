import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, History, LogOut, Menu, X, Settings } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link
      to={to}
      onClick={() => setIsMobileMenuOpen(false)}
      className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive(to)
        ? 'bg-brand-yellow text-black font-bold shadow-lg shadow-yellow-900/20'
        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white font-medium'
        }`}
    >
      <Icon className={`w-5 h-5 ${isActive(to) ? 'text-black' : 'text-zinc-500 group-hover:text-white'}`} />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-brand-black text-white flex font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-brand-dark border-r border-zinc-800 fixed h-full z-20">
        <div className="p-8 flex flex-col items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-brand-yellow overflow-hidden shadow-brand-yellow/20 shadow-lg flex-shrink-0">
              <img src="images/OnFries-Logo.png" alt="Logo" className="w-full h-full object-cover opacity-90" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight font-heading uppercase leading-none">On Fries</h1>
              <p className="text-xs text-zinc-500 mt-1 font-medium">Management System v1.0</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
          <div className="text-xs font-bold text-zinc-600 px-4 mb-2 uppercase tracking-wider">Main Menu</div>
          <NavItem to="/admin" icon={LayoutDashboard} label="Overview" />
          <NavItem to="/admin/orders" icon={ShoppingCart} label="Current Orders" />
          <NavItem to="/admin/past-orders" icon={History} label="Past Orders" />
          <div className="text-xs font-bold text-zinc-600 px-4 mt-8 mb-2 uppercase tracking-wider">Inventory & Users</div>
          <NavItem to="/admin/stock" icon={Package} label="Stock" />
          <NavItem to="/admin/customers" icon={Users} label="Customers" />
          <NavItem to="/admin/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3 px-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-white">Admin User</p>
              <p className="text-zinc-500 text-xs">Manager</p>
            </div>
          </div>
          <Link to="/" className="flex items-center justify-center space-x-2 px-4 py-2.5 text-red-400 hover:bg-red-950/30 hover:text-red-300 border border-red-900/30 rounded-xl transition-colors text-sm font-bold">
            <LogOut className="w-4 h-4" />
            <span>Exit to Store</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-brand-dark/90 backdrop-blur-xl border-b border-zinc-800 z-30 flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg border border-brand-yellow overflow-hidden">
            <img src="images/OnFries-Logo.png" alt="Logo" />
          </div>
          <span className="font-bold text-xl font-heading uppercase text-white">On Fries</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-2 hover:bg-zinc-800 rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-zinc-950 z-50 md:hidden flex flex-col animate-fade-in">
          <div className="flex items-center justify-between p-4 h-16 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg border border-brand-yellow overflow-hidden">
                <img src="images/OnFries-Logo.png" alt="Logo" />
              </div>
              <span className="font-bold text-xl font-heading uppercase text-white">On Fries</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem to="/admin" icon={LayoutDashboard} label="Overview" />
            <NavItem to="/admin/orders" icon={ShoppingCart} label="Current Orders" />
            <NavItem to="/admin/past-orders" icon={History} label="Past Orders" />
            <NavItem to="/admin/stock" icon={Package} label="Stock" />
            <NavItem to="/admin/customers" icon={Users} label="Customers" />
            <NavItem to="/admin/settings" icon={Settings} label="Settings" />

            <div className="pt-6 mt-6 border-t border-zinc-800">
              <div className="flex items-center gap-3 px-4 mb-6 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-inner">
                  <Users className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Admin User</p>
                  <p className="text-zinc-500 text-xs">Manager</p>
                </div>
              </div>
              <Link to="/" className="flex items-center space-x-3 px-4 py-3.5 text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-xl transition-colors font-bold border border-transparent hover:border-red-900/30">
                <LogOut className="w-5 h-5" />
                <span>Exit to Store</span>
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 mt-16 md:mt-0 overflow-x-hidden bg-brand-black min-h-screen">
        {children}
      </main>
    </div>
  );
};