import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Layers } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const Analytics = () => {
  const { business } = useAuth();
  const [trends, setTrends] = useState([]);
  const [catSales, setCatSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [invStatus, setInvStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const currency = business?.currency_symbol || '₹';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trRes, catRes, topRes, invRes] = await Promise.all([
          api.get('/analytics/revenue-trend?days=30'),
          api.get('/analytics/sales-category'),
          api.get('/analytics/top-products?limit=8'),
          api.get('/analytics/inventory-status'),
        ]);
        setTrends(trRes.data);
        setCatSales(catRes.data);
        setTopProducts(topRes.data);
        setInvStatus(invRes.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Business Intelligence & Analytics
        </h1>
        <p className="text-xs text-slate-400">
          In-depth financial trends, product velocity metrics, and stock distribution.
        </p>
      </div>

      {/* 30-Day Revenue Line Chart */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          30-Day Revenue Trajectory
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="anRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`${currency}${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#anRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Margins & Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Top Product Revenue vs Gross Profit
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickFormatter={(n) => n.split(' ')[0]} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `${currency}${v.toLocaleString('en-IN')}`} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="total_revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Catalog Mix Revenue Share</h3>
            <p className="text-xs text-slate-400 mb-4">Volume breakdown across categories</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catSales} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={75}>
                  {catSales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${currency}${v.toLocaleString('en-IN')}`} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
