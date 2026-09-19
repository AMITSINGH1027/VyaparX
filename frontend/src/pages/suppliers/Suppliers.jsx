import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Mail, Phone, DollarSign, Trash2 } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';

export const Suppliers = () => {
  const { business, isManager } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSupp, setSelectedSupp] = useState(null);
  const [payAmount, setPayAmount] = useState(1000);
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [newSupp, setNewSupp] = useState({ name: '', contact_person: '', email: '', phone: '', city: 'New Delhi' });

  const currency = business?.currency_symbol || '₹';

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers/?limit=50');
      setSuppliers(res.data.items);
    } catch (err) {
      console.error('Failed to load suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/suppliers/', newSupp);
      setShowModal(false);
      setNewSupp({ name: '', contact_person: '', email: '', phone: '', city: 'New Delhi' });
      fetchSuppliers();
    } catch (err) {
      alert('Failed to add supplier');
    }
  };

  const handleSettleSupplierDues = async (e) => {
    e.preventDefault();
    if (!selectedSupp) return;
    try {
      await api.post('/payments/record', {
        reference_type: 'SUPPLIER_DUES',
        supplier_id: selectedSupp.id,
        amount: parseFloat(payAmount) || 0,
        payment_method: payMethod,
        notes: `Procurement dues settlement to ${selectedSupp.name}`,
      });
      setShowPayModal(false);
      fetchSuppliers();
      alert('Supplier payment recorded and ledger updated!');
    } catch (err) {
      alert('Failed to record supplier payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Supplier & Procurement Directory
          </h1>
          <p className="text-xs text-slate-400">
            Manage distributor relationships, contact personnel, and purchase ledgers.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="p-5 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</h3>
                <p className="text-xs text-slate-400">{s.contact_person || 'Distributor Rep'}</p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                <Truck className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-500">
              {s.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {s.email}</p>}
              {s.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {s.phone}</p>}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Procured</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {currency}{s.total_purchases_amount?.toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedSupp(s);
                  setPayAmount(s.outstanding_balance || 2000);
                  setShowPayModal(true);
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
              >
                Disburse Pay
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Supplier">
        <form onSubmit={handleAddSupplier} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Company / Supplier Name *</label>
            <input
              type="text"
              required
              value={newSupp.name}
              onChange={(e) => setNewSupp({ ...newSupp, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Contact Person</label>
            <input
              type="text"
              value={newSupp.contact_person}
              onChange={(e) => setNewSupp({ ...newSupp, contact_person: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Email</label>
              <input
                type="email"
                value={newSupp.email}
                onChange={(e) => setNewSupp({ ...newSupp, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Phone</label>
              <input
                type="tel"
                value={newSupp.phone}
                onChange={(e) => setNewSupp({ ...newSupp, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
              />
            </div>
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
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Supplier Payment">
        <form onSubmit={handleSettleSupplierDues} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Payment Amount ({currency}) *</label>
            <input
              type="number"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Payment Method</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800"
            >
              <option value="Bank Transfer">Bank Transfer / NEFT</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
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
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Confirm Disbursement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
