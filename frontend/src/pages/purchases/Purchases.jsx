import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Truck } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';

export const Purchases = () => {
  const { business, isManager } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Purchase PO Modal
  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [poItems, setPoItems] = useState([{ product_id: '', quantity: 10, unit_cost: 100, tax_rate: 18 }]);

  const currency = business?.currency_symbol || '₹';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purRes, suppRes, prodRes] = await Promise.all([
        api.get('/purchases/?limit=30'),
        api.get('/suppliers/?limit=50'),
        api.get('/products/?limit=100'),
      ]);
      setPurchases(purRes.data.items);
      setSuppliers(suppRes.data.items);
      setProducts(prodRes.data.items);
    } catch (err) {
      console.error('Failed to load purchases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchases/', {
        supplier_id: supplierId,
        items: poItems,
        payment_status: 'Paid',
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create purchase order');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Purchase Orders (Inflows)
          </h1>
          <p className="text-xs text-slate-400">
            Record supplier orders and automatically replenish inventory stock.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => {
              setSupplierId(suppliers[0]?.id || '');
              setPoItems([{ product_id: products[0]?.id || '', quantity: 20, unit_cost: products[0]?.cost_price || 100, tax_rate: 18 }]);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Purchase Order
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">PO Number</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold">Supplier</th>
                <th className="py-3 px-4 font-bold text-center">Items</th>
                <th className="py-3 px-4 font-bold text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{p.purchase_number}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(p.purchase_date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{p.supplier_name}</td>
                  <td className="py-3 px-4 text-center">{p.items?.length || 1} items</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {currency}{p.grand_total?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Purchase Order">
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Select Supplier *</label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Items Ordered</span>
            {poItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <div className="col-span-6">
                  <select
                    required
                    value={item.product_id}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].product_id = e.target.value;
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) updated[idx].unit_cost = prod.cost_price;
                      setPoItems(updated);
                    }}
                    className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].quantity = parseInt(e.target.value) || 1;
                      setPoItems(updated);
                    }}
                    placeholder="Qty"
                    className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 text-center"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    value={item.unit_cost}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].unit_cost = parseFloat(e.target.value) || 0;
                      setPoItems(updated);
                    }}
                    placeholder="Unit Cost"
                    className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 text-right"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-surface-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs"
            >
              Submit & Add Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
