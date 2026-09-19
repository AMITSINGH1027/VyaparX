import React, { useState, useEffect } from 'react';
import {
  Boxes, AlertTriangle, ArrowUpDown, Plus,
  History, CheckCircle2, TrendingDown, RefreshCw
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

export const Inventory = () => {
  const { business, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState('levels'); // 'levels', 'movements', 'alerts'
  const [movements, setMovements] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjData, setAdjData] = useState({
    product_id: '',
    quantity_change: 0,
    movement_type: 'ADJUSTMENT',
    notes: '',
  });

  const currency = business?.currency_symbol || '₹';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [movRes, alertRes, prodRes] = await Promise.all([
        api.get('/inventory/movements?limit=30'),
        api.get('/inventory/alerts'),
        api.get('/products/?limit=100'),
      ]);
      setMovements(movRes.data.items);
      setAlerts(alertRes.data);
      setProducts(prodRes.data.items);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjust', adjData);
      setShowAdjustModal(false);
      setAdjData({ product_id: '', quantity_change: 0, movement_type: 'ADJUSTMENT', notes: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Adjustment failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Inventory Management
          </h1>
          <p className="text-xs text-slate-400">
            Track real-time stock levels, movement history, and automated restock alerts.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setShowAdjustModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" /> Stock Adjustment
          </button>
        )}
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total SKUs</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{products.length}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-500 uppercase">Low Stock Alerts</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{alerts.length}</h3>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-500 uppercase">Stock Valuation</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {currency}{products.reduce((acc, p) => acc + p.current_stock * p.cost_price, 0).toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('levels')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'levels'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          Live Stock Levels ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'alerts'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          Restock Optimizer
          {alerts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 text-[10px]">
              {alerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'movements'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          Movement Audit Logs ({movements.length})
        </button>
      </div>

      {/* Tab 1: Live Stock Levels */}
      {activeTab === 'levels' && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Product Item</th>
                  <th className="py-3 px-4 font-bold">SKU</th>
                  <th className="py-3 px-4 font-bold text-center">Current Stock</th>
                  <th className="py-3 px-4 font-bold text-center">Alert Threshold</th>
                  <th className="py-3 px-4 font-bold text-right">Cost Value</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {products.map((p) => {
                  const isLow = p.current_stock <= p.min_stock_alert && p.current_stock > 0;
                  const isOut = p.current_stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{p.sku}</td>
                      <td className="py-3 px-4 text-center font-bold text-sm">
                        <span
                          className={
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900 dark:text-white'
                          }
                        >
                          {p.current_stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">{p.min_stock_alert}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                        {currency}{(p.current_stock * p.cost_price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'} size="sm">
                          {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'HEALTHY'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Restock Alerts & Recommendations */}
      {activeTab === 'alerts' && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 bg-amber-500/5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Automated Restock Calculator
              </h3>
              <p className="text-[11px] text-slate-400">
                Formula: Recommended Stock = Predicted Demand + Safety Stock - Current Stock
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Product Item</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold text-center">Current Stock</th>
                  <th className="py-3 px-4 font-bold text-center">Min Threshold</th>
                  <th className="py-3 px-4 font-bold text-center text-brand-600">
                    Recommended Reorder
                  </th>
                  <th className="py-3 px-4 font-bold text-center">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {alerts.map((a) => (
                  <tr key={a.product_id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {a.product_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{a.category_name || 'General'}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">{a.current_stock}</td>
                    <td className="py-3 px-4 text-center text-slate-400">{a.min_stock_alert}</td>
                    <td className="py-3 px-4 text-center font-bold text-brand-600 text-sm">
                      +{a.recommended_reorder} units
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={a.status === 'OUT_OF_STOCK' ? 'danger' : 'warning'} size="sm">
                        {a.status.replace('_', ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Movement Audit Logs */}
      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                  <th className="py-3 px-4 font-bold">Product Item</th>
                  <th className="py-3 px-4 font-bold">Movement Type</th>
                  <th className="py-3 px-4 font-bold text-center">Qty Change</th>
                  <th className="py-3 px-4 font-bold text-center">Prev → New</th>
                  <th className="py-3 px-4 font-bold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {m.product_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={m.quantity_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                      {m.previous_stock} → {m.new_stock}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{m.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title="Manual Stock Adjustment"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Select Product *</label>
            <select
              required
              value={adjData.product_id}
              onChange={(e) => setAdjData({ ...adjData, product_id: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
            >
              <option value="">Choose product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current Stock: {p.current_stock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Movement Type</label>
              <select
                value={adjData.movement_type}
                onChange={(e) => setAdjData({ ...adjData, movement_type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              >
                <option value="ADJUSTMENT">Adjustment (Count Correction)</option>
                <option value="DAMAGE">Damaged Goods (-)</option>
                <option value="RETURN">Customer Return (+)</option>
                <option value="TRANSFER">Warehouse Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Quantity Change (+ or -) *
              </label>
              <input
                type="number"
                required
                placeholder="e.g. +5 or -2"
                value={adjData.quantity_change}
                onChange={(e) => setAdjData({ ...adjData, quantity_change: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Reason / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Physical inventory audit discrepancy"
              value={adjData.notes}
              onChange={(e) => setAdjData({ ...adjData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdjustModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-surface-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs"
            >
              Apply Stock Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
