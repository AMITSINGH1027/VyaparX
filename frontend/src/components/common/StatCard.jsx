import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ title, value, change, isPositive, icon: Icon, prefix = '', suffix = '', subtext }) => {
  return (
    <div className="bg-white dark:bg-surface-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
        </h3>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 font-semibold ${
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{change > 0 ? `+${change}%` : `${change}%`}</span>
            <span className="text-slate-400 font-normal ml-0.5">vs last month</span>
          </div>
        )}
        {subtext && <span className="text-slate-400 dark:text-slate-500 ml-auto">{subtext}</span>}
      </div>
    </div>
  );
};
