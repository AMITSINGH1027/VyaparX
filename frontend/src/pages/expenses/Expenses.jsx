import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';

const EXP_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e'];

export const Expenses = () => {
  const { business, isManager } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Office Supplies',
    description: '',
    amount: 1000,
    payment_method: 'Bank Transfer',
  });

  const currency = business?.currency_symbol || '₹';

  const fetchData = async () => {
    try {
      const [expRes, breakRes] = await Promise.all([
        api.get('/expenses/?limit=50'),
        api.get('/analytics/expense-breakdown'),
      ]);
      setExpenses(expRes.data.items);
      setBreakdown(breakRes.data);
    } catch (err) {
      console.error('Failed to load expenses', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses/', formData);
      setShowModal(false);
      setFormData({ category: 'Office Supplies', description: '', amount: 1000, payment_method: 'Bank Transfer' });
      fetchData();
    } catch (err) {
      alert('Failed to log expense');
    }
  };

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Operational Expenses Tracker
          </h1>
          <p className="text-xs text-slate-400">
            Log overhead costs, salaries, rent, and utility disbursements.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Log New Expense
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses List */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Description</th>
                  <th className="py-3 px-4 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(e.expense_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 dark:bg-surface-800 text-slate-700 dark:text-slate-300">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {e.description}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      -{currency}{e.amount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Category Donut */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Expense Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">Total tracked: {currency}{totalExpense.toLocaleString('en-IN')}</p>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={EXP_COLORS[index % EXP_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `${currency}${val.toLocaleString('en-IN')}`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2">
            {breakdown.slice(0, 5).map((b, i) => (
              <div key={b.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EXP_COLORS[i % EXP_COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-300">{b.category}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currency}{b.amount?.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Operating Expense">
        <form onSubmit={handleAddExpense} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Expense Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
            >
              <option value="Rent">Rent</option>
              <option value="Salary">Salary</option>
              <option value="Electricity">Electricity</option>
              <option value="Internet">Internet</option>
              <option value="Transport">Transport</option>
              <option value="Marketing">Marketing</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly High-Speed Fiber Internet Bill"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Disbursed Amount ({currency}) *</label>
            <input
              type="number"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
            />
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
              Log Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
