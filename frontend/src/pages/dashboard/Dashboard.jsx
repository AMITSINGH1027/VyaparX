import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Sparkles,
  Plus,
  ArrowRight,
  Package,
  Receipt,
  CreditCard,
  Bot,
  Zap,
  Store,
  Copy,
  Check,
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';

const COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
];

export const Dashboard = () => {
  const { user, business } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState(null);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  /*
   * ============================================================
   * USER / BUSINESS ROLE
   * ============================================================
   */

  const userRole = String(user?.role || '').toUpperCase();

  const isOwner =
    userRole === 'OWNER' ||
    userRole === 'BUSINESS_OWNER';

  /*
   * Owner:
   *   Heading -> Business name
   *
   * Worker:
   *   Heading -> Worker full name
   */

  const displayName = isOwner
    ? business?.name || 'My Business Dashboard'
    : `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
      'Employee';

  const currency = business?.currency_symbol || '₹';

  /*
   * Business Unique Code
   *
   * This code belongs to the business and should only be visible
   * to the owner because the owner shares it with employees.
   */

  const businessCode = business?.unique_code || '';

  /*
   * ============================================================
   * COPY BUSINESS CODE
   * ============================================================
   */

  const handleCopyBusinessCode = async () => {
    if (!businessCode || !isOwner) return;

    try {
      await navigator.clipboard.writeText(businessCode);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy business code:', error);
    }
  };

  /*
   * ============================================================
   * LOAD DASHBOARD DATA
   * ============================================================
   */

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [
          kpiRes,
          trendRes,
          catRes,
          topRes,
          sumRes,
        ] = await Promise.all([
          api.get('/analytics/kpis'),
          api.get('/analytics/revenue-trend?days=14'),
          api.get('/analytics/sales-category'),
          api.get('/analytics/top-products?limit=5'),
          api.get('/ai/summary'),
        ]);

        setKpis(kpiRes.data);
        setRevenueTrends(trendRes.data || []);
        setCategorySales(catRes.data || []);
        setTopProducts(topRes.data || []);
        setAiSummary(sumRes.data);
      } catch (err) {
        console.error(
          'Failed to load dashboard data',
          err
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  /*
   * ============================================================
   * LOADING STATE
   * ============================================================
   */

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 dark:bg-surface-800 rounded-2xl" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 bg-slate-200 dark:bg-surface-800 rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* =====================================================
          Welcome Banner
      ====================================================== */}

      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        <div className="w-full">

          {/* AI Status */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-300" />

            <span>
              AI Business Intelligence Active
            </span>
          </div>

          {/* =================================================
              ROLE BASED NAME
          ================================================== */}

          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {displayName}
          </h1>

          {/* =================================================
              ROLE BASED SUBTITLE
          ================================================== */}

          <p className="text-xs text-brand-100 mt-1 max-w-xl">
            {isOwner
              ? (
                  aiSummary?.overview ||
                  'Real-time financial summary, automated tax accounting, and predictive ML insights.'
                )
              : (
                  `Employee at ${
                    business?.name || 'your business'
                  }`
                )}
          </p>

          {/* =================================================
              BUSINESS UNIQUE CODE
              
              ONLY OWNER CAN SEE THIS
          ================================================= */}

          {isOwner && businessCode && (
            <div className="mt-4 inline-flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">

              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-brand-100">
                  Business Unique Code
                </p>

                <p className="mt-0.5 text-lg font-black tracking-wider font-mono">
                  {businessCode}
                </p>

                <p className="text-[10px] text-brand-100 mt-0.5">
                  Share this code with your employees
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyBusinessCode}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white text-brand-700 hover:bg-brand-50 text-xs font-bold transition-colors shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>

            </div>
          )}

        </div>

        {/* =====================================================
            ACTION BUTTONS
        ====================================================== */}

        <div className="flex items-center gap-2 flex-wrap shrink-0">

          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            Add Product
          </button>

          <button
            onClick={() => navigate('/sales')}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-brand-700 hover:bg-brand-50 rounded-lg text-xs font-bold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Sale / POS
          </button>

        </div>

      </div>

      {/* =====================================================
          Primary KPI Grid
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Total Revenue"
          value={`${currency}${(
            kpis?.revenue || 0
          ).toLocaleString('en-IN')}`}
          change={
            kpis?.revenue_growth_pct
              ? `+${kpis.revenue_growth_pct}%`
              : '0%'
          }
          trend={
            kpis?.revenue_growth_pct > 0
              ? 'up'
              : 'neutral'
          }
          icon={DollarSign}
          color="brand"
        />

        <StatCard
          title="Net Profit"
          value={`${currency}${(
            kpis?.net_profit || 0
          ).toLocaleString('en-IN')}`}
          change={
            kpis?.net_margin_pct
              ? `${kpis.net_margin_pct}% margin`
              : '0% margin'
          }
          trend={
            kpis?.net_profit > 0
              ? 'up'
              : 'neutral'
          }
          icon={TrendingUp}
          color="emerald"
        />

        <StatCard
          title="Operating Expenses"
          value={`${currency}${(
            kpis?.expenses || 0
          ).toLocaleString('en-IN')}`}
          change="Tracked disbursements"
          trend="neutral"
          icon={CreditCard}
          color="rose"
        />

        <StatCard
          title="Active Customers"
          value={(
            kpis?.total_customers || 0
          ).toString()}
          change={`${kpis?.total_sales || 0} completed orders`}
          trend="neutral"
          icon={Users}
          color="indigo"
        />

      </div>

      {/* =====================================================
          Secondary Metrics
      ====================================================== */}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Products Catalog
          </span>

          <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">
            {kpis?.total_products || 0}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Low Stock Alerts
          </span>

          <span
            className={`text-lg font-black mt-1 block ${
              kpis?.low_stock_products > 0
                ? 'text-amber-500'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {kpis?.low_stock_products || 0}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Avg Order Value
          </span>

          <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">
            {currency}
            {(
              kpis?.average_order_value || 0
            ).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Procurement
          </span>

          <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">
            {currency}
            {(
              kpis?.total_purchases || 0
            ).toLocaleString('en-IN')}
          </span>
        </div>

      </div>

      {/* =====================================================
          Main Charts
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Chart */}

        <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">

          <div className="flex justify-between items-center mb-4">

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Revenue Trajectory (14-Day Velocity)
              </h3>

              <p className="text-xs text-slate-400">
                Daily transaction volume
              </p>
            </div>

          </div>

          {(kpis?.total_sales || 0) === 0 ? (

            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">

              <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />

              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No sales transactions yet
              </p>

              <p className="text-[11px] text-slate-400 mt-0.5">
                Click 'New Sale / POS' to record your first sale.
              </p>

            </div>

          ) : (

            <div className="h-64">

              <ResponsiveContainer width="100%" height="100%">

                <AreaChart data={revenueTrends}>

                  <defs>
                    <linearGradient
                      id="revGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#4f46e5"
                        stopOpacity={0.4}
                      />

                      <stop
                        offset="95%"
                        stopColor="#4f46e5"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={11}
                  />

                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(v) =>
                      `${currency}${(
                        v / 1000
                      ).toFixed(0)}k`
                    }
                  />

                  <Tooltip
                    formatter={(v) => [
                      `${currency}${v.toLocaleString(
                        'en-IN'
                      )}`,
                      'Revenue',
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fill="url(#revGrad)"
                  />

                </AreaChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>

        {/* Category Sales */}

        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sales by Category
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              Volume distribution across catalog
            </p>
          </div>

          {categorySales.length === 0 ? (

            <div className="h-48 flex flex-col items-center justify-center text-center p-4">

              <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />

              <p className="text-xs text-slate-400">
                No category sales recorded yet
              </p>

            </div>

          ) : (

            <div className="h-48">

              <ResponsiveContainer width="100%" height="100%">

                <PieChart>

                  <Pie
                    data={categorySales}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                  >

                    {categorySales.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[
                              index % COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(v) =>
                      `${currency}${v.toLocaleString(
                        'en-IN'
                      )}`
                    }
                  />

                </PieChart>

              </ResponsiveContainer>

            </div>

          )}

          <div className="space-y-1 mt-2">

            {categorySales
              .slice(0, 4)
              .map((c, i) => (

                <div
                  key={c.category}
                  className="flex items-center justify-between text-xs"
                >

                  <div className="flex items-center gap-1.5">

                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          COLORS[
                            i % COLORS.length
                          ],
                      }}
                    />

                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                      {c.category}
                    </span>

                  </div>

                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currency}
                    {c.revenue.toLocaleString(
                      'en-IN'
                    )}
                  </span>

                </div>

              ))}

          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;