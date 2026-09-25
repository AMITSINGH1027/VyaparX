import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Sparkles, AlertTriangle,
  Mail, Phone, MapPin, DollarSign, FileText, Check, Trash2, Edit2
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';

export const Customers = () => {
  const { business } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSales, setCustomerSales] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [newCust, setNewCust] = useState({ name: '', email: '', phone: '', address: '', city: 'Delhi', tax_id: '' });
  const [loading, setLoading] = useState(true);

  const currency = business?.currency_symbol || '₹';

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/?limit=50&search=${encodeURIComponent(search)}`);
      setCustomers(res.data.items);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleSelectCustomer = async (id) => {
    try {
      const [detailRes, recRes, salesRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/customers/${id}/recommendations`),
        api.get(`/sales/?customer_id=${id}&limit=10`),
      ]);
      setSelectedCustomer(detailRes.data);
      setRecommendations(recRes.data);
      setCustomerSales(salesRes.data.items || []);
    } catch (err) {
      console.error('Failed to load customer profile', err);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers/', newCust);
      setShowAddModal(false);
      setNewCust({ name: '', email: '', phone: '', address: '', city: 'Delhi', tax_id: '' });
      fetchCustomers();
    } catch (err) {
      alert('Failed to create customer');
    }
  };

  const handleSettlePayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      await api.post('/payments/record', {
        reference_type: 'CUSTOMER_DUES',
        customer_id: selectedCustomer.id,
        amount: parseFloat(paymentAmount) || 0,
        payment_method: paymentMethod,
        notes: `Customer dues settlement for ${selectedCustomer.name}`,
      });
      setShowPayModal(false);
      handleSelectCustomer(selectedCustomer.id);
      fetchCustomers();
      alert('Payment recorded and customer balance updated!');
    } catch (err) {
      alert('Failed to record payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Customer Relationship Management (CRM)
          </h1>
          <p className="text-xs text-slate-400">
            Track customer lifecycles, RFM segmentation clusters, purchase orders, and payment dues.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customers by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-900 focus:outline-hidden"
            />
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-bold">Customer</th>
                    <th className="py-3 px-4 font-bold">RFM Segment</th>
                    <th className="py-3 px-4 font-bold text-center">Orders</th>
                    <th className="py-3 px-4 font-bold text-right">Lifetime Spend</th>
                    <th className="py-3 px-4 font-bold text-right">Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleSelectCustomer(c.id)}
                      className={`hover:bg-brand-50/40 dark:hover:bg-surface-800/60 cursor-pointer transition-colors ${
                        selectedCustomer?.id === c.id ? 'bg-brand-50/70 dark:bg-brand-950/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {c.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{c.phone || c.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            c.rfm_segment === 'VIP Customers'
                              ? 'vip'
                              : c.rfm_segment === 'Loyal Customers'
                              ? 'primary'
                              : c.rfm_segment === 'At-Risk Customers'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {c.rfm_segment}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{c.order_count}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {currency}{c.total_spent?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        {c.outstanding_balance > 0 ? `${currency}${c.outstanding_balance?.toLocaleString('en-IN')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs h-fit space-y-6">
          {selectedCustomer ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Customer Account
                  </span>
                  <Badge variant="vip" size="sm">{selectedCustomer.rfm_segment}</Badge>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {selectedCustomer.name}
                </h3>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  {selectedCustomer.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {selectedCustomer.email}</p>}
                  {selectedCustomer.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {selectedCustomer.phone}</p>}
                  <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {selectedCustomer.city || 'Delhi'}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Outstanding Dues</span>
                  <span className="text-lg font-black text-rose-600">
                    {currency}{selectedCustomer.outstanding_balance?.toLocaleString('en-IN')}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPaymentAmount(selectedCustomer.outstanding_balance || 500);
                    setShowPayModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  Record Payment
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Order & Invoice History
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {customerSales.map((s) => (
                    <div key={s.id} className="p-2 rounded-lg bg-slate-50 dark:bg-surface-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-brand-600">{s.invoice_number}</p>
                        <p className="text-[10px] text-slate-400">{new Date(s.sale_date).toLocaleDateString('en-IN')}</p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {currency}{s.grand_total?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>AI Recommended Products</span>
                </div>

                <div className="space-y-1.5">
                  {recommendations.map((r) => (
                    <div key={r.id} className="p-2 rounded-lg bg-slate-50 dark:bg-surface-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{r.name}</p>
                        <p className="text-[10px] text-slate-400">{r.reason}</p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {currency}{r.selling_price?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Select any customer from the CRM table to view their account ledger, purchase history, and AI recommendations.
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Customer Account">
        <form onSubmit={handleAddCustomer} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={newCust.name}
              onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Email</label>
              <input
                type="email"
                value={newCust.email}
                onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Phone</label>
              <input
                type="tel"
                value={newCust.phone}
                onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-surface-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Customer Dues Payment">
        <form onSubmit={handleSettlePayment} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Payment Amount ({currency}) *</label>
            <input
              type="number"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
            >
              <option value="UPI">UPI / QR Code</option>
              <option value="Card">Credit/Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPayModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-surface-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
            >
              Confirm & Settle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
