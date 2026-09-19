import React, { useState } from 'react';
import {
  Menu, Search, Bell, Sun, Moon, Sparkles,
  Command, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

export const Header = ({ toggleMobileMenu }) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const { user, business } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifsDropdown, setShowNotifsDropdown] = useState(false);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 rounded-lg lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Button */}
          <button
            onClick={() => setShowSearch(true)}
            className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-surface-800 hover:bg-slate-200/70 dark:hover:bg-surface-700 rounded-lg border border-slate-200/60 dark:border-slate-700 transition-all w-64 md:w-80 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search products, customers, sales...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-surface-900 text-slate-500 rounded border border-slate-200 dark:border-slate-700 shadow-xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search icon */}
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 rounded-lg sm:hidden"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifsDropdown((prev) => !prev)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 rounded-lg relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>

            {showNotifsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-brand-600 hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-surface-800/60 transition-colors flex gap-3 ${
                          !n.is_read ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          {n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : n.type === 'SALES_MILESTONE' ? (
                            <Sparkles className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-brand-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Currency / Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Live Sync
            </span>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {showSearch && <GlobalSearchModal onClose={() => setShowSearch(false)} />}
    </>
  );
};
