import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { BusinessSetup } from './pages/onboarding/BusinessSetup';

import { Dashboard } from './pages/dashboard/Dashboard';
import { Products } from './pages/products/Products';
import { Inventory } from './pages/inventory/Inventory';
import { Sales } from './pages/sales/Sales';
import { Invoices } from './pages/invoices/Invoices';
import { Purchases } from './pages/purchases/Purchases';
import { Customers } from './pages/customers/Customers';
import { Suppliers } from './pages/suppliers/Suppliers';
import { Expenses } from './pages/expenses/Expenses';
import { Reports } from './pages/reports/Reports';
import { Analytics } from './pages/analytics/Analytics';
import { MLHub } from './pages/ml/MLHub';
import { AIInsights } from './pages/ai/AIInsights';
import { AIAssistant } from './pages/ai/AIAssistant';
import { Employees } from './pages/employees/Employees';
import { Settings } from './pages/settings/Settings';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs">Loading VyaparX...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<ProtectedRoute><BusinessSetup /></ProtectedRoute>} />

              {/* Protected App Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="sales" element={<Sales />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="customers" element={<Customers />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="reports" element={<Reports />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="ml-hub" element={<MLHub />} />
                <Route path="ai-insights" element={<AIInsights />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="employees" element={<Employees />} />
                <Route path="settings" element={<Settings />} />
                <Route
                  path="admin"
                  element={
                    <SuperAdminRoute>
                      <AdminDashboard />
                    </SuperAdminRoute>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
