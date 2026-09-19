import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Calendar, DollarSign, TrendingUp, Boxes } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const Reports = () => {
  const { business } = useAuth();
  const [activeTab, setActiveTab] = useState('pnl'); // 'pnl', 'sales', 'inventory'
  const [pnl, setPnl] = useState(null);
  const [salesSummary, setSalesSummary] = useState(null);
  const [invReport, setInvReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const currency = business?.currency_symbol || '₹';

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const [pnlRes, salesRes, invRes] = await Promise.all([
          api.get('/reports/profit-loss'),
          api.get('/reports/sales?period=monthly'),
          api.get('/reports/inventory'),
        ]);
        setPnl(pnlRes.data);
        setSalesSummary(salesRes.data);
        setInvReport(invRes.data);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Executive Financial & Operations Reports
          </h1>
          <p className="text-xs text-slate-400">
            Comprehensive P&L statements, tax audits, and inventory asset valuations.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Print / Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'pnl' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400'
          }`}
        >
          Profit & Loss Statement
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'sales' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400'
          }`}
        >
          Sales & Tax Audit
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'inventory' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400'
          }`}
        >
          Inventory Asset Valuation
        </button>
      </div>

      {/* Tab 1: P&L Statement */}
      {activeTab === 'pnl' && pnl && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {business?.name || 'VyaparX Enterprises'}
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1">STATEMENT OF PROFIT AND LOSS</p>
            <p className="text-[11px] text-slate-400">Generated on {new Date().toLocaleDateString('en-IN')}</p>
          </div>

          <div className="space-y-4 text-xs divide-y divide-slate-100 dark:divide-slate-800">
            {/* Revenue */}
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">I. Gross Revenue from Sales</p>
                <p className="text-[11px] text-slate-400">Total completed invoice billings</p>
              </div>
              <span className="font-black text-base text-slate-900 dark:text-white">
                {currency}{pnl.revenue?.toLocaleString('en-IN')}
              </span>
            </div>

            {/* COGS */}
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">II. Cost of Goods Sold (COGS)</p>
                <p className="text-[11px] text-slate-400">Procurement cost of sold items</p>
              </div>
              <span className="font-bold text-rose-600 text-sm">
                -{currency}{pnl.cogs?.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between items-center py-3 bg-brand-50/50 dark:bg-brand-950/20 px-3 rounded-lg">
              <div>
                <p className="font-extrabold text-brand-700 dark:text-brand-300 text-sm">
                  III. Gross Profit (I - II)
                </p>
                <p className="text-[10px] text-brand-500">Gross Margin: {pnl.gross_margin_pct}%</p>
              </div>
              <span className="font-black text-base text-brand-700 dark:text-brand-300">
                {currency}{pnl.gross_profit?.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Operating Expenses */}
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">IV. Total Operating Expenses</p>
                <p className="text-[11px] text-slate-400">Salaries, Rent, Utilities, Marketing</p>
              </div>
              <span className="font-bold text-rose-600 text-sm">
                -{currency}{pnl.operating_expenses?.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Net Profit */}
            <div className="flex justify-between items-center pt-4 pb-2 bg-emerald-50 dark:bg-emerald-950/40 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <div>
                <p className="font-black text-emerald-800 dark:text-emerald-200 text-base">
                  NET BUSINESS PROFIT (III - IV)
                </p>
                <p className="text-xs text-emerald-600 font-bold">Net Profit Margin: {pnl.net_margin_pct}%</p>
              </div>
              <span className="font-black text-2xl text-emerald-700 dark:text-emerald-300">
                {currency}{pnl.net_profit?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sales Summary */}
      {activeTab === 'sales' && salesSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Revenue</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {currency}{salesSummary.total_revenue?.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-5 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Orders</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {salesSummary.total_orders} Orders
            </h3>
          </div>
          <div className="p-5 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">GST / Tax Collected</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {currency}{salesSummary.total_tax_collected?.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-5 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Average Order Value</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {currency}{salesSummary.average_order_value?.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>
      )}

      {/* Tab 3: Inventory Valuation */}
      {activeTab === 'inventory' && invReport && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase">Inventory Cost Asset</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {currency}{invReport.inventory_cost_value?.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Total capital locked in stock</p>
          </div>
          <div className="p-6 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase">Retail Realization Value</span>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">
              {currency}{invReport.inventory_retail_value?.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Expected return at selling price</p>
          </div>
          <div className="p-6 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-emerald-500 uppercase">Unrealized Gross Margin</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {currency}{invReport.potential_profit?.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Gross profit upside across {invReport.total_units_in_stock} units</p>
          </div>
        </div>
      )}
    </div>
  );
};
