import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Search,
  X,
  Package,
  Users,
  Truck,
  ShoppingCart,
  ArrowRight,
  Loader2,
  Command,
  Clock3,
  FileText,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import api from '../../api/client';

export const GlobalSearchModal = ({ onClose }) => {
  const navigate = useNavigate();

  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedIndex, setSelectedIndex] = useState(0);

  /*
   * ------------------------------------------------------------
   * SEARCH CONFIG
   * ------------------------------------------------------------
   */

  const MAX_RESULTS_PER_GROUP = 8;

  /*
   * ------------------------------------------------------------
   * NORMALIZE SEARCH RESULTS
   *
   * Backend currently returns:
   * products
   * customers
   * sales
   *
   * suppliers is optional.
   * ------------------------------------------------------------
   */

  const groupedResults = useMemo(() => {
    if (!results) {
      return [];
    }

    const groups = [];

    if (Array.isArray(results.products) && results.products.length > 0) {
      groups.push({
        key: 'products',
        title: 'Products',
        icon: Package,
        iconClass: 'text-brand-600 dark:text-brand-400',
        items: results.products.slice(0, MAX_RESULTS_PER_GROUP),
      });
    }

    if (Array.isArray(results.customers) && results.customers.length > 0) {
      groups.push({
        key: 'customers',
        title: 'Customers',
        icon: Users,
        iconClass: 'text-emerald-600 dark:text-emerald-400',
        items: results.customers.slice(0, MAX_RESULTS_PER_GROUP),
      });
    }

    if (Array.isArray(results.sales) && results.sales.length > 0) {
      groups.push({
        key: 'sales',
        title: 'Invoices & Sales',
        icon: ShoppingCart,
        iconClass: 'text-purple-600 dark:text-purple-400',
        items: results.sales.slice(0, MAX_RESULTS_PER_GROUP),
      });
    }

    if (Array.isArray(results.suppliers) && results.suppliers.length > 0) {
      groups.push({
        key: 'suppliers',
        title: 'Suppliers',
        icon: Truck,
        iconClass: 'text-orange-600 dark:text-orange-400',
        items: results.suppliers.slice(0, MAX_RESULTS_PER_GROUP),
      });
    }

    if (Array.isArray(results.employees) && results.employees.length > 0) {
      groups.push({
        key: 'employees',
        title: 'Employees & Workers',
        icon: Users,
        iconClass: 'text-blue-600 dark:text-blue-400',
        items: results.employees.slice(0, MAX_RESULTS_PER_GROUP),
      });
    }

    if (Array.isArray(results.invoices) && results.invoices.length > 0) {
      groups.push({
        key: 'invoices',
        title: 'Invoices',
        icon: FileText,
        iconClass: 'text-pink-600 dark:text-pink-400',
        items: results.invoices.slice(0, MAX_RESULTS_PER_GROUP),
      });
    }

    return groups;
  }, [results]);

  /*
   * ------------------------------------------------------------
   * FLATTEN RESULTS
   *
   * Used for keyboard navigation.
   * ------------------------------------------------------------
   */

  const flatResults = useMemo(() => {
    return groupedResults.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        groupKey: group.key,
      }))
    );
  }, [groupedResults]);

  /*
   * ------------------------------------------------------------
   * TOTAL RESULTS
   * ------------------------------------------------------------
   */

  const totalResults = flatResults.length;

  /*
   * ------------------------------------------------------------
   * SEARCH API
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const trimmedQuery = query.trim();

    setSelectedIndex(0);
    setError('');

    if (!trimmedQuery) {
      setResults(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await api.get(
          `/search/?q=${encodeURIComponent(trimmedQuery)}`,
          {
            signal: controller.signal,
          }
        );

        setResults(res.data || {});
      } catch (err) {
        /*
         * Ignore cancelled requests.
         */
        if (
          err?.code === 'ERR_CANCELED' ||
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError'
        ) {
          return;
        }

        console.error('Global search error:', err);

        setResults(null);

        setError(
          err?.response?.data?.detail ||
            'Unable to search right now. Please try again.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  /*
   * ------------------------------------------------------------
   * FOCUS INPUT
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  /*
   * ------------------------------------------------------------
   * ESC + KEYBOARD NAVIGATION
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const handleKeyDown = (event) => {
      /*
       * ESC
       */
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      /*
       * ARROW DOWN
       */
      if (event.key === 'ArrowDown') {
        event.preventDefault();

        if (flatResults.length === 0) {
          return;
        }

        setSelectedIndex((prev) =>
          prev >= flatResults.length - 1 ? 0 : prev + 1
        );

        return;
      }

      /*
       * ARROW UP
       */
      if (event.key === 'ArrowUp') {
        event.preventDefault();

        if (flatResults.length === 0) {
          return;
        }

        setSelectedIndex((prev) =>
          prev <= 0 ? flatResults.length - 1 : prev - 1
        );

        return;
      }

      /*
       * ENTER
       */
      if (event.key === 'Enter') {
        event.preventDefault();

        const selected = flatResults[selectedIndex];

        if (selected?.link) {
          handleSelect(selected.link);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [flatResults, selectedIndex, onClose]);

  /*
   * ------------------------------------------------------------
   * SELECT RESULT
   * ------------------------------------------------------------
   */

  const handleSelect = (link) => {
    if (!link) {
      return;
    }

    navigate(link);
    onClose();
  };

  /*
   * ------------------------------------------------------------
   * CLEAR SEARCH
   * ------------------------------------------------------------
   */

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setError('');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  /*
   * ------------------------------------------------------------
   * RESULT INDEX
   * ------------------------------------------------------------
   */

  const getFlatIndex = (groupKey, itemId) => {
    let index = 0;

    for (const group of groupedResults) {
      for (const item of group.items) {
        if (group.key === groupKey && item.id === itemId) {
          return index;
        }

        index += 1;
      }
    }

    return -1;
  };

  /*
   * ------------------------------------------------------------
   * KEYBOARD SELECTED ITEM
   * ------------------------------------------------------------
   */

  const isSelected = (groupKey, itemId) => {
    const index = getFlatIndex(groupKey, itemId);

    return index === selectedIndex;
  };

  /*
   * ------------------------------------------------------------
   * RENDER RESULT ITEM
   * ------------------------------------------------------------
   */

  const renderResultItem = (group, item) => {
    const Icon = group.icon;

    const index = getFlatIndex(group.key, item.id);

    const selected = index === selectedIndex;

    return (
      <button
        key={`${group.key}-${item.id}`}
        type="button"
        onClick={() => handleSelect(item.link)}
        onMouseEnter={() => setSelectedIndex(index)}
        className={`w-full text-left p-3 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
          selected
            ? 'bg-brand-50 dark:bg-brand-950/40 ring-1 ring-brand-200 dark:ring-brand-800'
            : 'hover:bg-slate-50 dark:hover:bg-surface-800'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">

          {/* Icon */}
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              selected
                ? 'bg-white dark:bg-surface-900 shadow-sm'
                : 'bg-slate-100 dark:bg-surface-800'
            }`}
          >
            <Icon
              className={`w-4 h-4 ${group.iconClass}`}
            />
          </div>

          {/* Text */}
          <div className="min-w-0">

            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {item.title || 'Untitled'}
            </p>

            {item.subtitle && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                {item.subtitle}
              </p>
            )}

          </div>
        </div>

        {/* Arrow */}
        <ArrowRight
          className={`w-4 h-4 shrink-0 transition-all ${
            selected
              ? 'text-brand-600 dark:text-brand-400 translate-x-0 opacity-100'
              : 'text-slate-400 opacity-0 -translate-x-1'
          }`}
        />
      </button>
    );
  };

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      {/* Backdrop */}

      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}

      <div className="min-h-full flex items-start justify-center p-3 sm:p-4 pt-10 sm:pt-20">

        <div
          className="relative w-full max-w-2xl bg-white dark:bg-surface-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >

          {/* =================================================
              SEARCH HEADER
          ================================================== */}

          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800">

            <div className="flex items-center gap-3">

              {/* Search icon */}

              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>

              {/* Input */}

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                autoComplete="off"
                spellCheck="false"
                placeholder="Search products, customers, sales..."
                className="flex-1 min-w-0 bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />

              {/* Loading */}

              {loading && (
                <Loader2 className="w-4 h-4 text-brand-500 animate-spin shrink-0" />
              )}

              {/* Clear */}

              {!loading && query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-800 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Close */}

              <button
                type="button"
                onClick={onClose}
                className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-800 transition-colors"
              >
                <span>ESC</span>
              </button>

            </div>

            {/* Search meta */}

            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">

              <div className="flex items-center gap-2">

                <span className="inline-flex items-center gap-1">
                  <Command className="w-3 h-3" />
                  Global Search
                </span>

                {query.trim() && !loading && (
                  <>
                    <span>•</span>

                    <span>
                      {totalResults}{' '}
                      {totalResults === 1
                        ? 'result'
                        : 'results'}
                    </span>
                  </>
                )}

              </div>

              <span className="hidden sm:flex items-center gap-1">
                <span>↑</span>
                <span>↓</span>
                <span>navigate</span>
                <span className="mx-1">•</span>
                <CornerDownLeft className="w-3 h-3" />
                <span>open</span>
              </span>

            </div>

          </div>

          {/* =================================================
              RESULTS AREA
          ================================================== */}

          <div className="max-h-[65vh] sm:max-h-[500px] overflow-y-auto">

            {/* Empty / initial state */}

            {!query.trim() && (
              <div className="p-8 sm:p-12 text-center">

                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Search VyaparX
                </h3>

                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Quickly find products, customers,
                  invoices and sales from anywhere in
                  your business.
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">

                  {[
                    {
                      label: 'Products',
                      icon: Package,
                    },
                    {
                      label: 'Customers',
                      icon: Users,
                    },
                    {
                      label: 'Invoices',
                      icon: FileText,
                    },
                    {
                      label: 'Suppliers',
                      icon: Truck,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <span
                        key={item.label}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-surface-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                      >
                        <Icon className="w-3 h-3" />
                        {item.label}
                      </span>
                    );
                  })}

                </div>

              </div>
            )}

            {/* Loading */}

            {query.trim() && loading && (
              <div className="p-5 space-y-3">

                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-surface-800" />

                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-40 bg-slate-100 dark:bg-surface-800 rounded" />
                      <div className="h-2.5 w-56 bg-slate-100 dark:bg-surface-800 rounded" />
                    </div>
                  </div>
                ))}

              </div>
            )}

            {/* Error */}

            {query.trim() && !loading && error && (
              <div className="p-8 text-center">

                <div className="mx-auto w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-3">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                </div>

                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Search failed
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setResults(null);

                    /*
                     * Re-trigger search by briefly changing
                     * the value and restoring it.
                     */
                    const current = query;

                    setQuery('');

                    setTimeout(() => {
                      setQuery(current);
                    }, 20);
                  }}
                  className="mt-4 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors"
                >
                  Try Again
                </button>

              </div>
            )}

            {/* Results */}

            {query.trim() &&
              !loading &&
              !error &&
              results && (
                <div className="p-3 sm:p-4">

                  {groupedResults.length > 0 ? (
                    <div className="space-y-5">

                      {groupedResults.map((group) => {
                        const Icon = group.icon;

                        return (
                          <div key={group.key}>

                            {/* Group header */}

                            <div className="flex items-center justify-between px-2 mb-1.5">

                              <div className="flex items-center gap-2">

                                <Icon
                                  className={`w-3.5 h-3.5 ${group.iconClass}`}
                                />

                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  {group.title}
                                </span>

                              </div>

                              <span className="text-[10px] text-slate-400">
                                {group.items.length}
                                {group.items.length >=
                                  MAX_RESULTS_PER_GROUP
                                  ? '+'
                                  : ''}
                              </span>

                            </div>

                            {/* Results */}

                            <div className="space-y-0.5">

                              {group.items.map((item) =>
                                renderResultItem(
                                  group,
                                  item
                                )
                              )}

                            </div>

                          </div>
                        );
                      })}

                    </div>
                  ) : (
                    /* No results */

                    <div className="py-10 px-4 text-center">

                      <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                        <Search className="w-5 h-5 text-slate-400" />
                      </div>

                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        No results found
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        We couldn't find anything matching
                        <span className="font-semibold text-slate-500 dark:text-slate-300">
                          {' '}
                          "{query}"
                        </span>
                      </p>

                      <p className="text-[10px] text-slate-400 mt-3">
                        Try a product name, customer name,
                        invoice number or phone number.
                      </p>

                    </div>
                  )}

                </div>
              )}

          </div>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-surface-950/40">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3 text-[10px] text-slate-400">

                <span className="hidden sm:inline-flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  <ArrowDown className="w-3 h-3" />
                  Navigate
                </span>

                <span className="hidden sm:inline-flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" />
                  Open
                </span>

                <span className="inline-flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  Live search
                </span>

              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default GlobalSearchModal;