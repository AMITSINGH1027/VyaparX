import React, { useState, useEffect } from 'react';
import { Shield, Store, Users, ShoppingBag, DollarSign, Activity, CheckCircle } from 'lucide-react';
import api from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, bizRes, usersRes] = await Promise.all([
          api.get('/admin/platform-stats'),
          api.get('/admin/businesses'),
          api.get('/admin/users'),
        ]);
        setStats(statsRes.data);
        setBusinesses(bizRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Failed to load admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Super Admin Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" /> Platform Super Administrator
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">VyaparX Platform Administration</h1>
          <p className="text-xs text-slate-400 mt-0.5">Full multi-tenant system overview, platform health, and tenant directories.</p>
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Businesses" value={(stats?.total_businesses || 0).toString()} icon={Store} color="brand" />
        <StatCard title="Registered Users" value={(stats?.total_users || 0).toString()} icon={Users} color="indigo" />
        <StatCard title="Platform Sales Orders" value={(stats?.total_sales || 0).toString()} icon={ShoppingBag} color="emerald" />
        <StatCard title="Catalog Products" value={(stats?.total_products || 0).toString()} icon={Activity} color="rose" />
      </div>

      {/* Registered Businesses Table */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registered Tenant Businesses ({businesses.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Business Name</th>
                <th className="py-3 px-4 font-bold">Type</th>
                <th className="py-3 px-4 font-bold">GSTIN</th>
                <th className="py-3 px-4 font-bold">City</th>
                <th className="py-3 px-4 font-bold">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{b.name}</td>
                  <td className="py-3 px-4 text-slate-500">{b.business_type || 'Retail'}</td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{b.tax_id_gst || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{b.city || '—'}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
