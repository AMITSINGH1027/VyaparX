import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, DollarSign, Users, Tag } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';

export const AIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get('/ai/insights');
        setInsights(res.data);
      } catch (err) {
        console.error('Failed to load insights', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'GROWTH':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'INVENTORY':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'PROFIT':
        return <DollarSign className="w-5 h-5 text-indigo-500" />;
      case 'CUSTOMER':
        return <Users className="w-5 h-5 text-purple-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-brand-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Proactive AI Business Insights
        </h1>
        <p className="text-xs text-slate-400">
          Automated heuristic and statistical discoveries derived continuously from your live operations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-surface-800">
                  {getIcon(insight.type)}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {insight.tag}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {insight.title}
                  </h3>
                </div>
              </div>
              <Badge variant={insight.impact === 'CRITICAL' ? 'danger' : insight.impact === 'HIGH' ? 'warning' : 'primary'} size="sm">
                {insight.impact} IMPACT
              </Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {insight.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
