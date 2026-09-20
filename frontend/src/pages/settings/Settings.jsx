import React, { useState, useEffect } from 'react';

import {
  Settings as SettingsIcon,
  Store,
  ShieldCheck,
  Check,
  History,
  User,
  Copy,
} from 'lucide-react';

import api from '../../api/client';

import { useAuth } from '../../context/AuthContext';

export const Settings = () => {
  const { business, setBusiness, isOwner } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'audit'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    tax_id_gst: '',
    currency_symbol: '₹',
    allow_negative_stock: 'false',
  });

  const [auditLogs, setAuditLogs] = useState([]);

  const [saved, setSaved] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        email: business.email || '',
        phone: business.phone || '',
        address: business.address || '',
        city: business.city || '',
        tax_id_gst: business.tax_id_gst || '',
        currency_symbol: business.currency_symbol || '₹',
        allow_negative_stock: business.allow_negative_stock || 'false',
      });
    }
  }, [business]);

  const handleCopyBusinessCode = async () => {
    if (!business?.unique_code) return;

    try {
      await navigator.clipboard.writeText(business.unique_code);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy business code', err);

      // Fallback for browsers where clipboard API is unavailable
      try {
        const textArea = document.createElement('textarea');
        textArea.value = business.unique_code;

        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        document.execCommand('copy');

        document.body.removeChild(textArea);

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed', fallbackError);
      }
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.get('/audit/?limit=50');
      setAuditLogs(res.data.items);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.put('/business/current', formData);

      setBusiness(res.data);

      localStorage.setItem(
        'vyaparx_business',
        JSON.stringify(res.data)
      );

      setSaved(true);

      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to update business profile', err);

      alert('Failed to update business profile');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          System Settings & Audit Trail
        </h1>

        <p className="text-xs text-slate-400">
          Configure business details, GSTIN, currency, and view secure audit activity logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-bold">

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400'
          }`}
        >
          <Store className="w-4 h-4" />

          Business Profile & Policies
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />

          Activity Audit Trail
        </button>

      </div>

      {/* Business Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">

          {/* Business Unique Code */}
          {isOwner && business?.unique_code && (
            <div className="mb-6 rounded-xl border border-brand-500/20 bg-brand-50 dark:bg-brand-950/20 p-4">

              <div className="flex items-start gap-3">

                <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>

                <div className="flex-1 min-w-0">

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Business Unique Code
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Share this code with your workers so they can join your business.
                  </p>

                  {/* Code + Copy */}
                  <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">

                    <div className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 px-3 py-2.5">

                      <code className="block text-xs font-bold tracking-wide text-brand-600 dark:text-brand-400 break-all">
                        {business.unique_code}
                      </code>

                    </div>

                    <button
                      type="button"
                      onClick={handleCopyBusinessCode}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Code
                        </>
                      )}
                    </button>

                  </div>

                  {/* Copy success message */}
                  {copied && (
                    <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ Business code copied successfully
                    </p>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* Save Success Message */}
          {saved && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" />

              Settings updated successfully!
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Business Name + GST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Business / Store Name
                </label>

                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  GSTIN / Tax ID
                </label>

                <input
                  type="text"
                  value={formData.tax_id_gst}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tax_id_gst: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
                />
              </div>

            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Official Email
                </label>

                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Phone Number
                </label>

                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
                />
              </div>

            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold mb-1">
                Full Business Address
              </label>

              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
              />
            </div>

            {/* City + Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-semibold mb-1">
                  City
                </label>

                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      city: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Currency Symbol
                </label>

                <input
                  type="text"
                  value={formData.currency_symbol}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currency_symbol: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 focus:outline-hidden"
                />
              </div>

            </div>

            {/* Save Button */}
            <div className="pt-3">

              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                Save Business Profile
              </button>

            </div>

          </form>

        </div>
      )}

      {/* Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">

          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">

                  <th className="py-3 px-4 font-bold">
                    Timestamp
                  </th>

                  <th className="py-3 px-4 font-bold">
                    User
                  </th>

                  <th className="py-3 px-4 font-bold">
                    Action
                  </th>

                  <th className="py-3 px-4 font-bold">
                    Entity
                  </th>

                  <th className="py-3 px-4 font-bold">
                    Details
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">

                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 dark:hover:bg-surface-800/50"
                  >

                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {log.user_name || 'System'}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-brand-600 font-bold">
                      {log.action}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {log.resource_type}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-sm truncate">
                      {log.details || '—'}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  );
};