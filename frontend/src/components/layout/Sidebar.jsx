import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Boxes, Users, Truck,
  ShoppingCart, Receipt, CreditCard, FileSpreadsheet,
  BarChart3, Sparkles, Bot, UserCheck, Settings,
  LogOut, Store, FileText, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isMobileOpen, closeMobile }) => {
  const { user, business, logout, isOwner, isManager } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const navSections = [
    ...(isSuperAdmin
      ? [
          {
            title: 'PLATFORM ADMIN',
            items: [{ label: 'Admin Overview', path: '/admin', icon: Shield }],
          },
        ]
      : []),
    {
      title: 'CORE OPERATIONS',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Products', path: '/products', icon: Package },
        { label: 'Inventory', path: '/inventory', icon: Boxes },
        { label: 'Sales & POS', path: '/sales', icon: ShoppingCart },
        { label: 'Invoices', path: '/invoices', icon: FileText },
        { label: 'Purchases', path: '/purchases', icon: Receipt },
        { label: 'Customers', path: '/customers', icon: Users },
        { label: 'Suppliers', path: '/suppliers', icon: Truck },
        { label: 'Expenses', path: '/expenses', icon: CreditCard },
      ],
    },
    {
      title: 'INTELLIGENCE & ML',
      items: [
        { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
        { label: 'Analytics', path: '/analytics', icon: BarChart3 },
        { label: 'ML Hub', path: '/ml-hub', icon: Sparkles },
        { label: 'AI Insights', path: '/ai-insights', icon: Sparkles },
        { label: 'AI Assistant', path: '/ai-assistant', icon: Bot },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        ...(isOwner ? [{ label: 'Employees', path: '/employees', icon: UserCheck }] : []),
        { label: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-surface-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight text-slate-900 dark:text-white">
                Vyapar<span className="text-brand-600 dark:text-brand-400">X</span>
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                AI Business OS
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60">
          <div className="bg-slate-50 dark:bg-surface-800/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
              {business?.name?.[0] || 'V'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {business?.name || 'No Business Active'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {business?.business_type || 'Click to Setup'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-surface-800/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
                {user?.first_name?.[0] || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user?.full_name || user?.first_name || 'User'}
                </p>
                <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 uppercase tracking-wider">
                  {user?.role?.replace('_', ' ') || 'OWNER'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
