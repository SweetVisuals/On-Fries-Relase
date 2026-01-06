import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OverviewPage } from './pages/admin/Overview';
import { CurrentOrdersPage } from './pages/admin/CurrentOrders';
import { StockPage } from './pages/admin/Stock';
import { CustomersPage } from './pages/admin/Customers';
import { PastOrdersPage } from './pages/admin/PastOrders';
import { SettingsPage } from './pages/admin/Settings';
import { MenuPage } from './pages/customer/MenuPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { OrdersListPage } from './pages/customer/OrdersListPage';
import { AboutPage } from './pages/customer/AboutPage';
import { RefundPolicyPage } from './pages/customer/RefundPolicyPage';
import { TermsOfServicePage } from './pages/customer/TermsOfServicePage';
import { PrivacyPolicyPage } from './pages/customer/PrivacyPolicyPage';
import { CookieConsent } from './components/CookieConsent';

const App: React.FC = () => {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<MenuPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />

          {/* Admin Routes - Protected */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><OverviewPage /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><CurrentOrdersPage /></ProtectedRoute>} />
          <Route path="/admin/past-orders" element={<ProtectedRoute requireAdmin><PastOrdersPage /></ProtectedRoute>} />
          <Route path="/admin/stock" element={<ProtectedRoute requireAdmin><StockPage /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute requireAdmin><CustomersPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <CookieConsent />
      </HashRouter>
    </StoreProvider>
  );
};

export default App;