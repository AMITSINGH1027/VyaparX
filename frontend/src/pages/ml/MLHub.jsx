import React, { useState, useEffect } from 'react';
import {
  Sparkles, TrendingUp, Users, AlertTriangle,
  RefreshCw, CheckCircle, ShieldAlert, Cpu
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, BarChart, Bar
} from 'recharts';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const MLHub = () => {
  const { business } = useAuth();
  const [segments, setSegments] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [demand, setDemand] = useState([]);
  const [churnRadar, setChurnRadar] = useState([]);
  const [training, setTraining] = useState(false);
  const [loading, setLoading] = useState(true);

  const currency = business?.currency_symbol || '₹';

  const loadMLData = async () => {
    try {
      setLoading(true);
      const [segRes, foreRes, demRes, churnRes] = await Promise.all([
        api.get('/ml/customer-segments'),
        api.get('/ml/sales-forecast'),
        api.get('/ml/demand-predictions'),
        api.get('/ml/churn-radar'),
      ]);
      setSegments(segRes.data);
      setForecast(foreRes.data);
      setDemand(demRes.data);
      setChurnRadar(churnRes.data);
    } catch (err) {
      console.error('Failed to load ML models', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMLData();
  }, []);

  const handleRetrain = async () => {
    setTraining(true);
    try {
      await api.post('/ml/retrain-models');
      alert('All Machine Learning pipelines successfully retrained on latest database transactions!');
      loadMLData();
    } catch (err) {
      alert('Retraining failed');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold backdrop-blur-xs mb-2">
            <Cpu className="w-3.5 h-3.5" /> Scikit-learn & Python ML Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Machine Learning & Intelligence Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Automated K-Means RFM clustering, Autoregressive Sales Forecasting, Safety-Stock demand optimization, and Churn Risk radar.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={training}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${training ? 'animate-spin' : ''}`} />
          {training ? 'Retraining Models...' : 'Retrain All Pipelines'}
        </button>
      </div>

      {/* 1. Sales Forecasting Module */}
      {forecast && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-600" />
                Sales Forecasting Engine ({forecast.model})
              </h3>
              <p className="text-xs text-slate-400">
                Evaluation Metrics: MAE ₹{forecast.metrics?.mae?.toLocaleString('en-IN')} | RMSE ₹{forecast.metrics?.rmse?.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex gap-2">
              <div className="px-3 py-1.5 bg-brand-50 dark:bg-brand-950 rounded-lg text-center">
                <span className="text-[10px] text-brand-600 font-bold uppercase block">Next 7 Days</span>
                <span className="text-xs font-black text-brand-700 dark:text-brand-300">
                  {currency}{forecast.forecast_7d?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 rounded-lg text-center">
                <span className="text-[10px] text-indigo-600 font-bold uppercase block">Next 30 Days</span>
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                  {currency}{forecast.forecast_30d?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
                <span className="text-[10px] text-purple-600 font-bold uppercase block">Next 90 Days</span>
                <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                  {currency}{forecast.forecast_90d?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast.daily_forecast}>
                <defs>
                  <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`${currency}${v.toLocaleString('en-IN')}`, 'Predicted']} />
                <Area type="monotone" dataKey="predicted_revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#foreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 2. Customer Segmentation Clusters (RFM + K-Means) */}
      {segments && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                Customer RFM Clusters (K-Means Segmentation)
              </h3>
              <p className="text-xs text-slate-400">
                Segmented {segments.total_segmented} customers based on Recency, Frequency & Monetary attributes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(segments.segment_distribution || {}).map(([seg, count]) => (
              <div key={seg} className="p-3.5 bg-slate-50 dark:bg-surface-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{seg}</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-900 dark:text-white">{count}</span>
                  <Badge variant={seg.includes('VIP') ? 'vip' : seg.includes('At-Risk') ? 'warning' : 'primary'} size="sm">
                    {((count / segments.total_segmented) * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Churn Risk Radar */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          Customer Churn Risk Radar (High Inactivity Alert)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2 px-3 font-bold">Customer</th>
                <th className="py-2 px-3 font-bold">Days Inactive</th>
                <th className="py-2 px-3 font-bold text-center">Orders</th>
                <th className="py-2 px-3 font-bold text-right">Lifetime Spent</th>
                <th className="py-2 px-3 font-bold text-center">Risk Level</th>
                <th className="py-2 px-3 font-bold">Explainable AI Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {churnRadar.slice(0, 5).map((c) => (
                <tr key={c.customer_id}>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{c.customer_name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{c.days_since_last_purchase} days ago</td>
                  <td className="py-2.5 px-3 text-center">{c.total_orders}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {currency}{c.total_spent?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge variant={c.churn_risk === 'HIGH' ? 'danger' : c.churn_risk === 'MEDIUM' ? 'warning' : 'success'} size="sm">
                      {c.churn_risk}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-xs text-[11px] truncate">{c.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
