import React, { useState, useEffect } from 'react';
import { FileText, Search, Printer, Eye } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { InvoiceDocument } from '../../components/invoices/InvoiceDocument';

export const Invoices = () => {
  const { business } = useAuth();
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const currency = business?.currency_symbol || '₹';

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales/?limit=50');
      setSales(res.data.items);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handlePreview = async (id) => {
    try {
      const res = await api.get(`/sales/${id}`);
      setSelectedSale(res.data);
      setShowModal(true);
    } catch (err) {
      alert('Failed to load invoice');
    }
  };

  const filtered = sales.filter(
    (s) =>
      s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      s.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Invoices Registry
          </h1>
          <p className="text-xs text-slate-400">
            Search, preview, print, and export generated business invoices.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-900 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Invoice #</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold">Customer Details</th>
                <th className="py-3 px-4 font-bold">Payment Method</th>
                <th className="py-3 px-4 font-bold text-right">Grand Total</th>
                <th className="py-3 px-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50">
                  <td className="py-3 px-4 font-mono font-bold text-brand-600">
                    {s.invoice_number}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(s.sale_date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {s.customer_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{s.payment_method}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {currency}{s.grand_total?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handlePreview(s.id)}
                      className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 hover:bg-brand-100 transition-colors"
                      title="Preview / Print"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Invoice Document"
        maxWidth="max-w-4xl"
      >
        <InvoiceDocument sale={selectedSale} />
      </Modal>
    </div>
  );
};
