import React, { useState } from 'react';
import {
  Bot,
  Send,
  User,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  Brain,
  BarChart3,
} from 'lucide-react';

import api from '../../api/client';

export const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text:
        'Hello! I am your VyaparX Business Copilot. I can analyze sales, products, inventory, customers, expenses, demand, churn risk and revenue forecasts.',
      data: null,
      type: 'text',
      meta: null,
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    {
      label: 'Business Overview',
      icon: BarChart3,
      query: 'Give me a business overview',
    },
    {
      label: 'Top Product',
      icon: TrendingUp,
      query: 'Which product sold the most?',
    },
    {
      label: 'Restock',
      icon: Package,
      query: 'Which products should I restock?',
    },
    {
      label: 'Best Customers',
      icon: Users,
      query: 'Who is my best customer?',
    },
    {
      label: 'Churn Risk',
      icon: AlertTriangle,
      query: 'Which customers are at churn risk?',
    },
    {
      label: 'Sales Forecast',
      icon: Brain,
      query: 'What is our sales forecast for the next 30 days?',
    },
  ];

  const formatValue = (value, key = '') => {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'number') {
      const lowerKey = key.toLowerCase();

      if (
        lowerKey.includes('revenue') ||
        lowerKey.includes('profit') ||
        lowerKey.includes('spent') ||
        lowerKey.includes('amount') ||
        lowerKey.includes('price') ||
        lowerKey.includes('cost')
      ) {
        return `₹${value.toLocaleString('en-IN', {
          maximumFractionDigits: 2,
        })}`;
      }

      return value.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
      });
    }

    return String(value);
  };

  const getRiskClass = (value) => {
    const risk = String(value || '').toUpperCase();

    if (risk === 'CRITICAL' || risk === 'HIGH') {
      return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300';
    }

    if (risk === 'WARNING' || risk === 'MEDIUM') {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
    }

    if (risk === 'HEALTHY' || risk === 'LOW') {
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-surface-700 dark:text-slate-300';
  };

  const renderTable = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const columns = Object.keys(data[0]);

    return (
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-100 dark:bg-surface-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                >
                  {column
                    .replaceAll('_', ' ')
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-surface-900">
            {data.slice(0, 10).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-slate-50 dark:hover:bg-surface-800 transition-colors"
              >
                {columns.map((column) => {
                  const value = row[column];

                  const isRisk =
                    column.toLowerCase().includes('risk') ||
                    column.toLowerCase().includes('status');

                  return (
                    <td
                      key={column}
                      className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      {isRisk ? (
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-[9px] font-bold ${getRiskClass(
                            value
                          )}`}
                        >
                          {String(value)}
                        </span>
                      ) : (
                        formatValue(value, column)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {data.length > 10 && (
          <div className="px-3 py-2 text-[10px] text-slate-400 bg-slate-50 dark:bg-surface-800">
            Showing first 10 results.
          </div>
        )}
      </div>
    );
  };

  const renderMeta = (message) => {
    if (!message.meta) return null;

    const meta = message.meta;

    if (message.type === 'forecast') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
          <div className="rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 p-3">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Next 7 Days
            </p>
            <p className="text-sm font-bold text-brand-700 dark:text-brand-300">
              ₹
              {Number(meta.forecast_7d || 0).toLocaleString('en-IN', {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>

          <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 p-3">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Next 30 Days
            </p>
            <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
              ₹
              {Number(meta.forecast_30d || 0).toLocaleString('en-IN', {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 p-3">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Next 90 Days
            </p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              ₹
              {Number(meta.forecast_90d || 0).toLocaleString('en-IN', {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>
      );
    }

    if (message.type === 'demand') {
      return (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900 p-3">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Products Analyzed
            </p>
            <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
              {meta.total_products || 0}
            </p>
          </div>

          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 p-3">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Need Attention
            </p>
            <p className="text-sm font-bold text-red-700 dark:text-red-300">
              {meta.attention_required || 0}
            </p>
          </div>
        </div>
      );
    }

    if (message.type === 'churn') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 p-3">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              High Risk
            </p>
            <p className="text-sm font-bold text-red-700 dark:text-red-300">
              {meta.high_risk || 0}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 p-3">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Medium Risk
            </p>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
              {meta.medium_risk || 0}
            </p>
          </div>

          <div className="rounded-xl bg-slate-100 dark:bg-surface-700 p-3">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Customers
            </p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {meta.total_customers || 0}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;

    if (!textToSend.trim() || loading) {
      return;
    }

    const userMsg = {
      sender: 'user',
      text: textToSend,
      data: null,
      type: 'text',
    };

    setMessages((prev) => [...prev, userMsg]);

    if (!queryText) {
      setInput('');
    }

    setLoading(true);

    try {
      const res = await api.post('/ai/assistant', {
        query: textToSend,
      });

      const assistantMsg = {
        sender: 'assistant',
        text:
          res.data?.answer ||
          'I could not generate an answer for that query.',
        data: res.data?.data || null,
        type: res.data?.type || 'text',
        meta: res.data?.meta || null,
        intent: res.data?.intent || null,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI Assistant error:', err);

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text:
            'Sorry, I encountered an issue while analyzing your business data. Please try again.',
          data: null,
          type: 'error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              VyaparX Business Copilot
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            </h2>

            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Safe Analytics Layer • No Raw SQL Execution
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400">
          <Brain className="w-3.5 h-3.5" />
          Business Intelligence
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white dark:bg-surface-900 rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-y-auto space-y-5">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.sender === 'user'
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            {message.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[90%] sm:max-w-3xl rounded-2xl p-4 text-xs ${
                message.sender === 'user'
                  ? 'bg-brand-600 text-white font-medium'
                  : 'bg-slate-50 dark:bg-surface-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">
                {message.text}
              </p>

              {message.sender === 'assistant' &&
                renderMeta(message)}

              {message.data &&
                Array.isArray(message.data) &&
                renderTable(message.data)}
            </div>

            {message.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-surface-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-400 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>

            <div>
              <p className="font-medium">
                Analyzing your business data...
              </p>
              <p className="text-[10px] mt-0.5">
                Checking safe analytics and generating insights
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {quickPrompts.map((prompt) => {
          const Icon = prompt.icon;

          return (
            <button
              key={prompt.label}
              onClick={() => handleSend(prompt.query)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-surface-900 hover:bg-brand-50 dark:hover:bg-brand-950/40 disabled:opacity-50 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-800 whitespace-nowrap shadow-2xs text-[11px] font-medium transition-colors"
            >
              <Icon className="w-3.5 h-3.5 text-brand-600" />
              {prompt.label}
            </button>
          );
        })}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-white dark:bg-surface-900 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask anything about your business..."
          className="flex-1 px-3 py-2.5 text-xs bg-transparent border-none text-slate-900 dark:text-white focus:outline-hidden disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};