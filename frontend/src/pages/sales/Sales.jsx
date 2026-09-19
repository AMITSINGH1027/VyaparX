import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Plus, Search, FileText, Eye,
  Trash2, CreditCard, CheckCircle, Clock
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { InvoiceDocument } from '../../components/invoices/InvoiceDocument';

export const Sales = () => {
  const { business } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Sale POS Modal
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [saleItems, setSaleItems] = useState([
    { product_id: '', quantity: 1, unit_price: 0, discount_rate: 0, tax_rate: 18 },
  ]);

  // Invoice Preview Modal
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const currency = business?.currency_symbol || '₹';

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales/?limit=30');
      setSales(res.data.items);
    } catch (err) {
      console.error('Failed to load sales', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        api.get('/products/?limit=100'),
        api.get('/customers/?limit=100'),
      ]);
      setProducts(prodRes.data.items);
      setCustomers(custRes.data.items);
    } catch (err) {
      console.error('Failed to load meta', err);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchMeta();
  }, []);

  const handleAddItem = () => {
    setSaleItems([
      ...saleItems,
      { product_id: '', quantity: 1, unit_price: 0, discount_rate: 0, tax_rate: 18 },
    ]);
  };

  const handleRemoveItem = (index) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...saleItems];
    updated[index][field] = value;

    if (field === 'product_id') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        updated[index].unit_price = prod.selling_price;
        updated[index].tax_rate = prod.tax_rate;
      }
    }
    setSaleItems(updated);
  };

  const calculateSubtotal = () => {
    return saleItems.reduce((acc, item) => {
      const base = (item.unit_price || 0) * (item.quantity || 1);
      const disc = base * ((item.discount_rate || 0) / 100);
      return acc + (base - disc);
    }, 0);
  };

  const calculateTax = () => {
    return saleItems.reduce((acc, item) => {
      const base = (item.unit_price || 0) * (item.quantity || 1);
      const disc = base * ((item.discount_rate || 0) / 100);
      const taxable = base - disc;
      return acc + taxable * ((item.tax_rate || 0) / 100);
    }, 0);
  };

  const grandTotal = calculateSubtotal() + calculateTax();

  const handleCreateSale = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customer_id: selectedCustomerId || null,
        items: saleItems.map((it) => ({
          product_id: it.product_id,
          quantity: parseInt(it.quantity) || 1,
          unit_price: parseFloat(it.unit_price) || 0,
          discount_rate: parseFloat(it.discount_rate) || 0,
        })),
        payment_method: paymentMethod,
        payment_status: paymentStatus,
      };

      const res = await api.post('/sales/', payload);
      setShowSaleModal(false);
      fetchSales();

      // Show invoice immediately
      const detailRes = await api.get(`/sales/${res.data.id}`);
      setSelectedSaleDetail(detailRes.data);
      setShowInvoiceModal(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to complete sale');
    }
  };

  const handleViewInvoice = async (saleId) => {
    try {
      const res = await api.get(`/sales/${saleId}`);
      setSelectedSaleDetail(res.data);
      setShowInvoiceModal(true);
    } catch (err) {
      alert('Failed to load invoice details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Sales & POS Orders
          </h1>
          <p className="text-xs text-slate-400">
            Process counter sales, generate instant tax invoices, and sync inventory automatically.
          </p>
        </div>

        <button
          onClick={() => {
            setSaleItems([
              { product_id: products[0]?.id || '', quantity: 1, unit_price: products[0]?.selling_price || 0, discount_rate: 0, tax_rate: 18 },
            ]);
            setShowSaleModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> New Sale / POS
        </button>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Invoice #</th>
                <th className="py-3 px-4 font-bold">Date & Time</th>
                <th className="py-3 px-4 font-bold">Customer</th>
                <th className="py-3 px-4 font-bold text-center">Items</th>
                <th className="py-3 px-4 font-bold text-center">Payment</th>
                <th className="py-3 px-4 font-bold text-right">Grand Total</th>
                <th className="py-3 px-4 font-bold text-center">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50">
                  <td className="py-3 px-4 font-mono font-bold text-brand-600">
                    {s.invoice_number}
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(s.sale_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {s.customer_name}
                  </td>
                  <td className="py-3 px-4 text-center">{s.items_count} items</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-surface-800 text-slate-700 dark:text-slate-300">
                      {s.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {currency}{s.grand_total?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleViewInvoice(s.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 hover:bg-brand-100 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale POS Modal */}
      <Modal
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        title="Create Sale / POS Checkout"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSale} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending / Due</option>
              </select>
            </div>
          </div>

          {/* Sale Items Rows */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Products & Quantities
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Item
              </button>
            </div>

            {saleItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-surface-800/40 p-2.5 rounded-lg">
                <div className="col-span-5">
                  <select
                    required
                    value={item.product_id}
                    onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 focus:outline-hidden"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.current_stock <= 0}>
                        {p.name} (Stock: {p.current_stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                    placeholder="Qty"
                    className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 text-center focus:outline-hidden"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                    className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 text-right focus:outline-hidden"
                  />
                </div>

                <div className="col-span-2 text-right text-xs font-bold text-slate-900 dark:text-white">
                  {currency}{((item.unit_price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                </div>

                <div className="col-span-1 text-center">
                  {saleItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals Calculation Card */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-surface-800 flex justify-between items-center text-xs">
            <div className="space-y-0.5 text-slate-500">
              <p>Subtotal: {currency}{calculateSubtotal().toLocaleString('en-IN')}</p>
              <p>Tax Total: {currency}{calculateTax().toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold uppercase">Grand Total</span>
              <p className="text-xl font-black text-brand-600">
                {currency}{grandTotal.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowSaleModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-surface-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-md"
            >
              Complete Sale & Print Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Viewer Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title="Tax Invoice"
        maxWidth="max-w-4xl"
      >
        <InvoiceDocument sale={selectedSaleDetail} />
      </Modal>
    </div>
  );
};
